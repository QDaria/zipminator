/**
 * Entropy Pool Implementation
 */

#include "entropy_pool.h"
#include <algorithm>
#include <chrono>
#include <cstring>

namespace qrng {

EntropyPool::EntropyPool(
    std::unique_ptr<QRNGInterface> qrng,
    const EntropyPoolConfig& config)
    : config_(config),
      qrng_(std::move(qrng)),
      pool_head_(0),
      pool_tail_(0),
      pool_count_(0),
      shutdown_requested_(false),
      operational_(false),
      recovering_(false),
      recovery_attempts_(0),
      bytes_consumed_recent_(0) {

    // Allocate entropy pool
    pool_ = std::make_unique<uint8_t[]>(config_.pool_size);
    memset(pool_.get(), 0, config_.pool_size);

    last_consumption_time_ = std::chrono::steady_clock::now();
}

EntropyPool::~EntropyPool() {
    shutdown();
}

QRNGStatus EntropyPool::initialize() {
    if (!qrng_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    // Initialize QRNG device
    QRNGStatus status = qrng_->initialize();
    if (status != QRNGStatus::OK) {
        return status;
    }

    operational_ = true;

    // Start background threads
    shutdown_requested_ = false;
    refill_thread_ = std::thread(&EntropyPool::refill_loop, this);
    health_monitor_thread_ = std::thread(&EntropyPool::health_monitor_loop, this);

    // Perform initial fill
    std::unique_lock<std::mutex> lock(pool_mutex_);
    refill_needed_.notify_one();

    // Wait for minimum entropy
    entropy_available_.wait(lock, [this]() {
        return pool_count_ >= config_.min_entropy_guarantee || !operational_;
    });

    if (!operational_) {
        return QRNGStatus::DEVICE_ERROR;
    }

    return QRNGStatus::OK;
}

QRNGStatus EntropyPool::get_random_bytes(uint8_t* buffer, size_t length) {
    if (!buffer || length == 0) {
        return QRNGStatus::DEVICE_ERROR;
    }

    if (!operational_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    std::unique_lock<std::mutex> lock(pool_mutex_);

    size_t total_read = 0;

    while (total_read < length && operational_) {
        // Wait for entropy
        if (pool_count_ == 0) {
            stats_mutex_.lock();
            stats_.underrun_events++;
            stats_mutex_.unlock();

            // Trigger immediate refill
            refill_needed_.notify_one();

            entropy_available_.wait(lock, [this]() {
                return pool_count_ > 0 || !operational_;
            });

            if (!operational_) {
                return QRNGStatus::NOT_CONNECTED;
            }
        }

        // Read from circular buffer
        size_t to_read = std::min(length - total_read, pool_count_);

        for (size_t i = 0; i < to_read; i++) {
            buffer[total_read + i] = pool_[pool_tail_];
            pool_tail_ = (pool_tail_ + 1) % config_.pool_size;
        }

        pool_count_ -= to_read;
        total_read += to_read;

        // Trigger refill if below threshold
        if (pool_count_ < config_.refill_threshold) {
            refill_needed_.notify_one();
        }
    }

    // Update statistics
    update_consumption_stats(total_read);

    std::lock_guard<std::mutex> stats_lock(stats_mutex_);
    stats_.total_bytes_served += total_read;

    return QRNGStatus::OK;
}

size_t EntropyPool::get_random_bytes_nonblocking(uint8_t* buffer, size_t length) {
    if (!buffer || length == 0 || !operational_) {
        return 0;
    }

    std::lock_guard<std::mutex> lock(pool_mutex_);

    size_t to_read = std::min(length, pool_count_);

    for (size_t i = 0; i < to_read; i++) {
        buffer[i] = pool_[pool_tail_];
        pool_tail_ = (pool_tail_ + 1) % config_.pool_size;
    }

    pool_count_ -= to_read;

    // Trigger refill if needed
    if (pool_count_ < config_.refill_threshold) {
        refill_needed_.notify_one();
    }

    // Update statistics
    update_consumption_stats(to_read);

    std::lock_guard<std::mutex> stats_lock(stats_mutex_);
    stats_.total_bytes_served += to_read;

    return to_read;
}

bool EntropyPool::has_entropy(size_t required_bytes) const {
    std::lock_guard<std::mutex> lock(pool_mutex_);
    return pool_count_ >= required_bytes;
}

size_t EntropyPool::available_entropy() const {
    std::lock_guard<std::mutex> lock(pool_mutex_);
    return pool_count_;
}

double EntropyPool::get_fill_percent() const {
    std::lock_guard<std::mutex> lock(pool_mutex_);
    return calculate_fill_percent();
}

QRNGStatus EntropyPool::force_health_check() {
    if (!qrng_ || !operational_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    QRNGStatus status = qrng_->health_check();

    std::lock_guard<std::mutex> lock(stats_mutex_);
    stats_.health_checks++;

    if (status != QRNGStatus::OK && config_.auto_recovery) {
        // Attempt recovery in background
        std::thread([this]() { attempt_recovery(); }).detach();
    }

    return status;
}

EntropyPoolStats EntropyPool::get_stats() const {
    std::lock_guard<std::mutex> lock(stats_mutex_);
    EntropyPoolStats current_stats = stats_;
    current_stats.average_fill_percent = calculate_fill_percent();
    return current_stats;
}

std::string EntropyPool::get_device_info() const {
    if (!qrng_) {
        return "No QRNG device";
    }
    return qrng_->get_device_info();
}

bool EntropyPool::is_operational() const {
    return operational_ && qrng_ && qrng_->is_connected();
}

void EntropyPool::shutdown() {
    shutdown_requested_ = true;
    operational_ = false;

    // Wake up all waiting threads
    entropy_available_.notify_all();
    refill_needed_.notify_all();

    // Join threads
    if (refill_thread_.joinable()) {
        refill_thread_.join();
    }

    if (health_monitor_thread_.joinable()) {
        health_monitor_thread_.join();
    }

    // Disconnect QRNG
    if (qrng_) {
        qrng_->disconnect();
    }
}

// Private methods

void EntropyPool::refill_loop() {
    std::vector<uint8_t> temp_buffer(4096);

    while (!shutdown_requested_) {
        std::unique_lock<std::mutex> lock(pool_mutex_);

        // Wait for refill signal or regular interval
        refill_needed_.wait_for(lock, std::chrono::milliseconds(100), [this]() {
            return pool_count_ < config_.refill_threshold || shutdown_requested_;
        });

        if (shutdown_requested_) {
            break;
        }

        // Calculate space available
        size_t space_available = config_.pool_size - pool_count_;
        if (space_available < 1024) {
            continue;  // Not enough space to refill
        }

        lock.unlock();

        // Read from QRNG (without holding lock)
        size_t to_read = std::min(temp_buffer.size(), space_available);
        QRNGStatus status = qrng_->get_random_bytes(temp_buffer.data(), to_read);

        if (status != QRNGStatus::OK) {
            // Error occurred, attempt recovery
            if (config_.auto_recovery && !recovering_) {
                attempt_recovery();
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
            continue;
        }

        // Write to pool
        lock.lock();

        for (size_t i = 0; i < to_read; i++) {
            if (pool_count_ < config_.pool_size) {
                pool_[pool_head_] = temp_buffer[i];
                pool_head_ = (pool_head_ + 1) % config_.pool_size;
                pool_count_++;
            }
        }

        lock.unlock();

        // Update statistics
        std::lock_guard<std::mutex> stats_lock(stats_mutex_);
        stats_.total_refills++;

        // Notify waiting consumers
        entropy_available_.notify_all();
    }
}

void EntropyPool::health_monitor_loop() {
    while (!shutdown_requested_) {
        std::this_thread::sleep_for(
            std::chrono::milliseconds(config_.health_check_interval_ms)
        );

        if (shutdown_requested_) {
            break;
        }

        force_health_check();
    }
}

bool EntropyPool::attempt_recovery() {
    recovering_ = true;

    std::lock_guard<std::mutex> stats_lock(stats_mutex_);
    stats_.recovery_attempts++;
    recovery_attempts_++;

    if (recovery_attempts_ > config_.max_recovery_attempts) {
        operational_ = false;
        recovering_ = false;
        return false;
    }

    // Try to reconnect
    if (qrng_) {
        qrng_->disconnect();
        std::this_thread::sleep_for(std::chrono::seconds(1));

        QRNGStatus status = qrng_->initialize();
        if (status == QRNGStatus::OK) {
            recovery_attempts_ = 0;
            operational_ = true;
            recovering_ = false;
            return true;
        }
    }

    recovering_ = false;
    return false;
}

void EntropyPool::update_consumption_stats(size_t bytes_consumed) {
    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
        now - last_consumption_time_
    ).count();

    if (elapsed > 0) {
        double rate = (bytes_consumed * 1000000.0) / elapsed;  // bytes/sec

        std::lock_guard<std::mutex> lock(stats_mutex_);
        if (rate > stats_.peak_consumption_rate_bps) {
            stats_.peak_consumption_rate_bps = rate;
        }
    }

    last_consumption_time_ = now;
    bytes_consumed_recent_ = bytes_consumed;
}

double EntropyPool::calculate_fill_percent() const {
    return (pool_count_ * 100.0) / config_.pool_size;
}

// Global singleton implementation

std::unique_ptr<EntropyPool> GlobalEntropyPool::global_pool_;
std::mutex GlobalEntropyPool::init_mutex_;

QRNGStatus GlobalEntropyPool::initialize(
    std::unique_ptr<QRNGInterface> qrng,
    const EntropyPoolConfig& config) {

    std::lock_guard<std::mutex> lock(init_mutex_);

    if (global_pool_) {
        return QRNGStatus::DEVICE_ERROR;  // Already initialized
    }

    global_pool_ = std::make_unique<EntropyPool>(std::move(qrng), config);
    return global_pool_->initialize();
}

EntropyPool* GlobalEntropyPool::instance() {
    std::lock_guard<std::mutex> lock(init_mutex_);
    return global_pool_.get();
}

void GlobalEntropyPool::shutdown() {
    std::lock_guard<std::mutex> lock(init_mutex_);

    if (global_pool_) {
        global_pool_->shutdown();
        global_pool_.reset();
    }
}

} // namespace qrng
