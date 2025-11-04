/**
 * Mock QRNG - Deterministic PRNG for Testing
 *
 * Provides a deterministic random number generator that implements
 * the QRNG interface for testing purposes. Uses ChaCha20 CSPRNG
 * for high-quality pseudorandom numbers.
 *
 * WARNING: This is NOT a quantum RNG and should ONLY be used for:
 * - Unit testing
 * - CI/CD pipelines without hardware access
 * - Development environments
 *
 * NEVER use MockQRNG in production cryptographic applications!
 *
 * Security: Cryptographically secure PRNG (ChaCha20-based)
 * Determinism: Seeded with fixed value for reproducible tests
 * Thread-safety: Mutex-protected for concurrent access
 */

#ifndef MOCK_QRNG_H
#define MOCK_QRNG_H

#include "qrng_interface.h"
#include <mutex>
#include <array>

namespace qrng {

/**
 * Mock QRNG Configuration
 */
struct MockQRNGConfig {
    uint64_t seed = 0x123456789ABCDEF0ULL;  // Default seed for determinism
    bool simulate_delays = false;            // Simulate USB transfer delays
    uint32_t delay_us = 100;                 // Simulated delay (microseconds)
    bool simulate_failures = false;          // Simulate device failures
    double failure_rate = 0.001;             // Failure probability (0.1%)
    size_t buffer_size = 32768;              // Internal buffer (32 KB)
};

/**
 * ChaCha20 State for CSPRNG
 */
struct ChaCha20State {
    std::array<uint32_t, 16> state;
    std::array<uint8_t, 64> keystream;
    size_t keystream_pos;

    ChaCha20State();
    void init(uint64_t seed);
    void generate_block();
    uint8_t next_byte();
};

/**
 * Mock QRNG Implementation
 *
 * Simulates quantum random number generator behavior using ChaCha20 CSPRNG.
 * Provides predictable, reproducible random sequences for testing.
 */
class MockQRNG : public QRNGInterface {
public:
    /**
     * Constructor with optional configuration
     *
     * @param config Mock QRNG configuration
     */
    explicit MockQRNG(const MockQRNGConfig& config = MockQRNGConfig());

    /**
     * Destructor
     */
    ~MockQRNG() override;

    // QRNGInterface implementation
    QRNGStatus initialize() override;
    bool is_connected() const override;
    QRNGStatus get_random_bytes(uint8_t* buffer, size_t length) override;
    QRNGStatus health_check() override;
    HealthStats get_health_stats() const override;
    size_t available_bytes() const override;
    std::string get_device_info() const override;
    void disconnect() override;

    /**
     * Reseed the PRNG with new seed value
     * Useful for testing different random sequences
     *
     * @param seed New seed value
     */
    void reseed(uint64_t seed);

    /**
     * Get current seed value
     *
     * @return Current seed
     */
    uint64_t get_seed() const;

    /**
     * Enable/disable failure simulation
     * Useful for testing error handling paths
     *
     * @param enable Enable failure simulation
     * @param rate Failure rate (0.0 to 1.0)
     */
    void set_failure_simulation(bool enable, double rate = 0.001);

private:
    // Configuration
    MockQRNGConfig config_;

    // ChaCha20 state
    ChaCha20State chacha_;

    // Thread synchronization
    mutable std::mutex mutex_;

    // State
    bool connected_;
    HealthStats stats_;

    // Failure simulation state
    uint64_t operation_counter_;

    // Internal methods

    /**
     * Check if we should simulate a failure
     *
     * @return true if failure should occur
     */
    bool should_fail();

    /**
     * Simulate USB transfer delay
     */
    void simulate_delay();
};

/**
 * Helper function to create mock QRNG with specific seed
 *
 * @param seed Seed value for deterministic generation
 * @return Unique pointer to mock QRNG
 */
std::unique_ptr<MockQRNG> create_mock_qrng(uint64_t seed = 0);

} // namespace qrng

#endif // MOCK_QRNG_H
