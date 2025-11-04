/**
 * Mock QRNG Implementation
 */

#include "mock_qrng.h"
#include <cstring>
#include <chrono>
#include <thread>
#include <random>

namespace qrng {

// ChaCha20 Implementation

ChaCha20State::ChaCha20State() : keystream_pos(64) {
    state.fill(0);
    keystream.fill(0);
}

void ChaCha20State::init(uint64_t seed) {
    // ChaCha20 constants "expand 32-byte k"
    state[0] = 0x61707865;
    state[1] = 0x3320646e;
    state[2] = 0x79622d32;
    state[3] = 0x6b206574;

    // Key (derived from seed)
    state[4] = seed & 0xFFFFFFFF;
    state[5] = (seed >> 32) & 0xFFFFFFFF;
    state[6] = seed & 0xFFFFFFFF;
    state[7] = (seed >> 32) & 0xFFFFFFFF;
    state[8] = ~seed & 0xFFFFFFFF;
    state[9] = ~(seed >> 32) & 0xFFFFFFFF;
    state[10] = seed & 0xFFFFFFFF;
    state[11] = (seed >> 32) & 0xFFFFFFFF;

    // Block counter and nonce
    state[12] = 0;
    state[13] = 0;
    state[14] = 0;
    state[15] = 0;

    keystream_pos = 64;  // Force generation on first call
}

void ChaCha20State::generate_block() {
    std::array<uint32_t, 16> working_state = state;

    // 20 rounds (10 double rounds)
    for (int i = 0; i < 10; i++) {
        // Column rounds
        #define QUARTERROUND(a, b, c, d) \
            a += b; d ^= a; d = (d << 16) | (d >> 16); \
            c += d; b ^= c; b = (b << 12) | (b >> 20); \
            a += b; d ^= a; d = (d << 8) | (d >> 24); \
            c += d; b ^= c; b = (b << 7) | (b >> 25);

        QUARTERROUND(working_state[0], working_state[4], working_state[8], working_state[12]);
        QUARTERROUND(working_state[1], working_state[5], working_state[9], working_state[13]);
        QUARTERROUND(working_state[2], working_state[6], working_state[10], working_state[14]);
        QUARTERROUND(working_state[3], working_state[7], working_state[11], working_state[15]);

        // Diagonal rounds
        QUARTERROUND(working_state[0], working_state[5], working_state[10], working_state[15]);
        QUARTERROUND(working_state[1], working_state[6], working_state[11], working_state[12]);
        QUARTERROUND(working_state[2], working_state[7], working_state[8], working_state[13]);
        QUARTERROUND(working_state[3], working_state[4], working_state[9], working_state[14]);

        #undef QUARTERROUND
    }

    // Add original state
    for (int i = 0; i < 16; i++) {
        working_state[i] += state[i];
    }

    // Convert to byte stream (little-endian)
    for (int i = 0; i < 16; i++) {
        keystream[i * 4 + 0] = working_state[i] & 0xFF;
        keystream[i * 4 + 1] = (working_state[i] >> 8) & 0xFF;
        keystream[i * 4 + 2] = (working_state[i] >> 16) & 0xFF;
        keystream[i * 4 + 3] = (working_state[i] >> 24) & 0xFF;
    }

    // Increment block counter
    state[12]++;
    if (state[12] == 0) {
        state[13]++;
    }

    keystream_pos = 0;
}

uint8_t ChaCha20State::next_byte() {
    if (keystream_pos >= 64) {
        generate_block();
    }
    return keystream[keystream_pos++];
}

// MockQRNG Implementation

MockQRNG::MockQRNG(const MockQRNGConfig& config)
    : config_(config),
      connected_(false),
      operation_counter_(0) {
    chacha_.init(config_.seed);
}

MockQRNG::~MockQRNG() {
    disconnect();
}

QRNGStatus MockQRNG::initialize() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (connected_) {
        return QRNGStatus::OK;
    }

    // Simulate initialization delay
    if (config_.simulate_delays) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    // Check for simulated failure
    if (should_fail()) {
        return QRNGStatus::DEVICE_ERROR;
    }

    connected_ = true;
    stats_ = HealthStats();

    return QRNGStatus::OK;
}

bool MockQRNG::is_connected() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return connected_;
}

QRNGStatus MockQRNG::get_random_bytes(uint8_t* buffer, size_t length) {
    if (!buffer || length == 0) {
        return QRNGStatus::DEVICE_ERROR;
    }

    std::lock_guard<std::mutex> lock(mutex_);

    if (!connected_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    // Simulate USB transfer delay
    if (config_.simulate_delays) {
        simulate_delay();
    }

    // Check for simulated failure
    if (should_fail()) {
        return QRNGStatus::IO_ERROR;
    }

    // Generate random bytes using ChaCha20
    for (size_t i = 0; i < length; i++) {
        buffer[i] = chacha_.next_byte();
    }

    // Update statistics
    stats_.bytes_generated += length;

    return QRNGStatus::OK;
}

QRNGStatus MockQRNG::health_check() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!connected_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    // Simulate health check delay
    if (config_.simulate_delays) {
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }

    // Check for simulated failure
    if (should_fail()) {
        stats_.health_checks_failed++;
        return QRNGStatus::HEALTH_CHECK_FAILED;
    }

    stats_.health_checks_passed++;

    // Update timestamp
    auto now = std::chrono::steady_clock::now();
    auto us = std::chrono::duration_cast<std::chrono::microseconds>(
        now.time_since_epoch()).count();
    stats_.last_health_check_us = us;

    return QRNGStatus::OK;
}

HealthStats MockQRNG::get_health_stats() const {
    std::lock_guard<std::mutex> lock(mutex_);

    HealthStats current_stats = stats_;
    current_stats.entropy_rate_bps = 1000000.0;  // Simulated 1 MB/s
    current_stats.buffer_fill_percent = 100;     // Always "full"

    return current_stats;
}

size_t MockQRNG::available_bytes() const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!connected_) {
        return 0;
    }

    // Mock always has bytes available
    return config_.buffer_size;
}

std::string MockQRNG::get_device_info() const {
    std::lock_guard<std::mutex> lock(mutex_);

    return "Mock QRNG (ChaCha20 CSPRNG) - FOR TESTING ONLY";
}

void MockQRNG::disconnect() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (config_.simulate_delays) {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    connected_ = false;
}

void MockQRNG::reseed(uint64_t seed) {
    std::lock_guard<std::mutex> lock(mutex_);

    config_.seed = seed;
    chacha_.init(seed);
    stats_ = HealthStats();
}

uint64_t MockQRNG::get_seed() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return config_.seed;
}

void MockQRNG::set_failure_simulation(bool enable, double rate) {
    std::lock_guard<std::mutex> lock(mutex_);

    config_.simulate_failures = enable;
    config_.failure_rate = rate;
    operation_counter_ = 0;
}

// Private methods

bool MockQRNG::should_fail() {
    if (!config_.simulate_failures) {
        return false;
    }

    operation_counter_++;

    // Use deterministic failure based on operation count
    // This makes tests reproducible
    if (operation_counter_ % 1000 == 0) {
        // Every 1000th operation fails (for failure_rate = 0.001)
        return true;
    }

    return false;
}

void MockQRNG::simulate_delay() {
    if (config_.delay_us > 0) {
        std::this_thread::sleep_for(std::chrono::microseconds(config_.delay_us));
    }
}

// Factory functions

std::unique_ptr<MockQRNG> create_mock_qrng(uint64_t seed) {
    MockQRNGConfig config;
    config.seed = seed;
    return std::make_unique<MockQRNG>(config);
}

// Implementation of factory in qrng_interface.cpp
std::unique_ptr<QRNGInterface> create_qrng(bool force_mock) {
    if (force_mock) {
        return std::make_unique<MockQRNG>();
    }

    // In production, attempt to detect and connect to hardware QRNG
    // For now, fall back to mock
    // TODO: Add ID Quantique device detection

    return std::make_unique<MockQRNG>();
}

// RAII Guard Implementation

QRNGGuard::QRNGGuard(std::unique_ptr<QRNGInterface> qrng)
    : qrng_(std::move(qrng)) {

    if (qrng_) {
        qrng_->initialize();
    }
}

QRNGGuard::~QRNGGuard() {
    if (qrng_) {
        qrng_->disconnect();
    }
}

} // namespace qrng
