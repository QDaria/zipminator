/**
 * Entropy Pool - High-Performance QRNG Buffering Layer
 *
 * Provides buffered access to QRNG with automatic refill management.
 * Ensures minimum entropy levels and handles device failures gracefully.
 *
 * Features:
 * - Background entropy collection
 * - Configurable buffer sizes and refill thresholds
 * - Health monitoring and automatic recovery
 * - Thread-safe concurrent access
 * - Minimum entropy level guarantees
 *
 * Performance: Sub-microsecond access when buffer is filled
 * Thread-safety: Full concurrent read support with mutex protection
 */

#ifndef ENTROPY_POOL_H
#define ENTROPY_POOL_H

#include "qrng_interface.h"
#include <memory>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <atomic>

namespace qrng {

/**
 * Entropy Pool Configuration
 */
struct EntropyPoolConfig {
    size_t pool_size = 131072;           // 128 KB pool size
    size_t refill_threshold = 32768;     // Refill when below 32 KB
    size_t min_entropy_guarantee = 4096; // Always maintain 4 KB minimum
    uint32_t health_check_interval_ms = 60000; // Health check every 60 seconds
    bool auto_recovery = true;           // Attempt automatic recovery on errors
    size_t max_recovery_attempts = 3;    // Maximum recovery attempts before giving up
};

/**
 * Entropy Pool Statistics
 */
struct EntropyPoolStats {
    uint64_t total_bytes_served;         // Total bytes provided to clients
    uint64_t total_refills;              // Number of refill operations
    uint64_t underrun_events;            // Times pool ran empty
    uint64_t health_checks;              // Number of health checks performed
    uint64_t recovery_attempts;          // Number of recovery attempts
    double average_fill_percent;         // Average fill level (0-100)
    double peak_consumption_rate_bps;    // Peak consumption rate (bytes/sec)

    EntropyPoolStats() : total_bytes_served(0), total_refills(0),
                         underrun_events(0), health_checks(0),
                         recovery_attempts(0), average_fill_percent(0.0),
                         peak_consumption_rate_bps(0.0) {}
};

/**
 * High-Performance Entropy Pool
 *
 * Wraps a QRNG device with buffering and background refill.
 * Guarantees minimum entropy availability for cryptographic operations.
 */
class EntropyPool {
public:
    /**
     * Constructor
     *
     * @param qrng QRNG device instance (takes ownership)
     * @param config Pool configuration parameters
     */
    explicit EntropyPool(
        std::unique_ptr<QRNGInterface> qrng,
        const EntropyPoolConfig& config = EntropyPoolConfig()
    );

    /**
     * Destructor - ensures clean shutdown
     */
    ~EntropyPool();

    /**
     * Initialize entropy pool and start background refill
     *
     * @return QRNGStatus::OK on success, error code otherwise
     */
    QRNGStatus initialize();

    /**
     * Get random bytes from entropy pool
     *
     * This is the primary interface for obtaining quantum entropy.
     * Blocks if insufficient entropy available until refill completes.
     *
     * @param buffer Output buffer for random bytes
     * @param length Number of bytes requested
     * @return QRNGStatus::OK on success, error code otherwise
     *
     * Thread-safety: Fully thread-safe, supports concurrent readers
     * Performance: O(1) when buffer has sufficient entropy
     */
    QRNGStatus get_random_bytes(uint8_t* buffer, size_t length);

    /**
     * Get random bytes (non-blocking)
     *
     * Returns immediately with available bytes, even if less than requested.
     * Useful for applications that can handle partial fills.
     *
     * @param buffer Output buffer for random bytes
     * @param length Maximum number of bytes to retrieve
     * @return Number of bytes actually written to buffer
     */
    size_t get_random_bytes_nonblocking(uint8_t* buffer, size_t length);

    /**
     * Check if pool has sufficient entropy available
     *
     * @param required_bytes Number of bytes needed
     * @return true if bytes are immediately available, false otherwise
     */
    bool has_entropy(size_t required_bytes) const;

    /**
     * Get current available entropy in pool
     *
     * @return Number of bytes currently available
     */
    size_t available_entropy() const;

    /**
     * Get pool fill percentage
     *
     * @return Fill level as percentage (0-100)
     */
    double get_fill_percent() const;

    /**
     * Force immediate health check
     *
     * @return QRNGStatus::OK if health check passes, error code otherwise
     */
    QRNGStatus force_health_check();

    /**
     * Get entropy pool statistics
     *
     * @return Statistics structure
     */
    EntropyPoolStats get_stats() const;

    /**
     * Get underlying QRNG device information
     *
     * @return Device info string
     */
    std::string get_device_info() const;

    /**
     * Check if pool is operational
     *
     * @return true if pool is ready to serve entropy
     */
    bool is_operational() const;

    /**
     * Gracefully shut down entropy pool
     */
    void shutdown();

private:
    // Configuration
    EntropyPoolConfig config_;

    // QRNG device
    std::unique_ptr<QRNGInterface> qrng_;

    // Entropy buffer (circular buffer)
    std::unique_ptr<uint8_t[]> pool_;
    size_t pool_head_;   // Write position
    size_t pool_tail_;   // Read position
    size_t pool_count_;  // Number of bytes in pool

    // Thread synchronization
    mutable std::mutex pool_mutex_;
    std::condition_variable entropy_available_;
    std::condition_variable refill_needed_;

    // Background threads
    std::thread refill_thread_;
    std::thread health_monitor_thread_;
    std::atomic<bool> shutdown_requested_;

    // Statistics
    EntropyPoolStats stats_;
    mutable std::mutex stats_mutex_;

    // State tracking
    std::atomic<bool> operational_;
    std::atomic<bool> recovering_;
    size_t recovery_attempts_;

    // Performance tracking
    std::chrono::steady_clock::time_point last_consumption_time_;
    size_t bytes_consumed_recent_;

    // Internal methods

    /**
     * Background thread for pool refill
     * Monitors pool level and refills when needed
     */
    void refill_loop();

    /**
     * Background thread for periodic health monitoring
     * Checks QRNG device health at regular intervals
     */
    void health_monitor_loop();

    /**
     * Attempt to recover from device error
     * Tries to reconnect and reinitialize QRNG
     *
     * @return true if recovery successful, false otherwise
     */
    bool attempt_recovery();

    /**
     * Update consumption rate statistics
     *
     * @param bytes_consumed Number of bytes just consumed
     */
    void update_consumption_stats(size_t bytes_consumed);

    /**
     * Calculate current fill percentage
     * Must be called with pool_mutex_ held
     *
     * @return Fill percentage (0-100)
     */
    double calculate_fill_percent() const;
};

/**
 * Global singleton entropy pool for application-wide use
 *
 * Provides convenient access to QRNG without managing multiple instances.
 * Must be initialized before use via initialize_global_entropy_pool().
 */
class GlobalEntropyPool {
public:
    /**
     * Initialize global entropy pool
     *
     * @param qrng QRNG device instance
     * @param config Pool configuration
     * @return QRNGStatus::OK on success, error code otherwise
     */
    static QRNGStatus initialize(
        std::unique_ptr<QRNGInterface> qrng,
        const EntropyPoolConfig& config = EntropyPoolConfig()
    );

    /**
     * Get instance of global entropy pool
     *
     * @return Pointer to global pool, nullptr if not initialized
     */
    static EntropyPool* instance();

    /**
     * Shutdown global entropy pool
     */
    static void shutdown();

private:
    static std::unique_ptr<EntropyPool> global_pool_;
    static std::mutex init_mutex_;
};

} // namespace qrng

#endif // ENTROPY_POOL_H
