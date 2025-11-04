/**
 * QRNG Interface - Abstract Base Class for Quantum Random Number Generators
 *
 * Provides a standard interface for integrating hardware QRNG devices into
 * cryptographic applications. Supports health monitoring, entropy pooling,
 * and thread-safe operation.
 *
 * Security: All implementations MUST provide cryptographically secure random bytes
 * Performance: Buffering recommended for high-throughput applications
 */

#ifndef QRNG_INTERFACE_H
#define QRNG_INTERFACE_H

#include <cstdint>
#include <cstddef>
#include <string>
#include <memory>

namespace qrng {

/**
 * QRNG Device Status
 */
enum class QRNGStatus {
    OK = 0,                    // Device operational
    NOT_CONNECTED = 1,         // Device not found/connected
    HEALTH_CHECK_FAILED = 2,   // Device self-test failed
    BUFFER_UNDERRUN = 3,       // Insufficient entropy available
    IO_ERROR = 4,              // Communication error
    DEVICE_ERROR = 5           // Hardware malfunction
};

/**
 * Health statistics for monitoring QRNG quality
 */
struct HealthStats {
    uint64_t bytes_generated;       // Total bytes generated
    uint64_t health_checks_passed;  // Successful health checks
    uint64_t health_checks_failed;  // Failed health checks
    double entropy_rate_bps;        // Current entropy generation rate (bytes/sec)
    uint32_t buffer_fill_percent;   // Buffer fill level (0-100)
    uint64_t last_health_check_us;  // Timestamp of last health check (microseconds)

    HealthStats() : bytes_generated(0), health_checks_passed(0),
                    health_checks_failed(0), entropy_rate_bps(0.0),
                    buffer_fill_percent(0), last_health_check_us(0) {}
};

/**
 * Abstract QRNG Interface
 *
 * All QRNG implementations must inherit from this class and implement
 * the pure virtual methods.
 */
class QRNGInterface {
public:
    virtual ~QRNGInterface() = default;

    /**
     * Initialize and connect to QRNG device
     *
     * @return QRNGStatus::OK on success, error code otherwise
     */
    virtual QRNGStatus initialize() = 0;

    /**
     * Check if QRNG device is connected and operational
     *
     * @return true if device is ready, false otherwise
     */
    virtual bool is_connected() const = 0;

    /**
     * Generate random bytes from QRNG
     *
     * This is a blocking call that will wait for sufficient entropy.
     * For non-blocking operation, check available_bytes() first.
     *
     * @param buffer Output buffer for random bytes
     * @param length Number of bytes to generate
     * @return QRNGStatus::OK on success, error code otherwise
     *
     * Thread-safety: Implementation MUST be thread-safe
     * Constant-time: No timing side-channels based on output
     */
    virtual QRNGStatus get_random_bytes(uint8_t* buffer, size_t length) = 0;

    /**
     * Perform device health check
     *
     * Runs device self-test and statistical checks on entropy quality.
     * Should be called periodically (e.g., every 1000 bytes generated).
     *
     * @return QRNGStatus::OK if health check passes, error code otherwise
     */
    virtual QRNGStatus health_check() = 0;

    /**
     * Get current health statistics
     *
     * @return Health statistics structure
     */
    virtual HealthStats get_health_stats() const = 0;

    /**
     * Get number of random bytes currently available in buffer
     *
     * Useful for non-blocking operation.
     *
     * @return Number of bytes available for immediate consumption
     */
    virtual size_t available_bytes() const = 0;

    /**
     * Get device information string
     *
     * @return Human-readable device description (e.g., "ID Quantique Quantis USB")
     */
    virtual std::string get_device_info() const = 0;

    /**
     * Disconnect and cleanup QRNG device
     */
    virtual void disconnect() = 0;

protected:
    QRNGInterface() = default;

    // Prevent copying (use shared_ptr for sharing)
    QRNGInterface(const QRNGInterface&) = delete;
    QRNGInterface& operator=(const QRNGInterface&) = delete;
};

/**
 * Factory function to create QRNG instance
 *
 * In production, this would detect available hardware and return
 * the appropriate implementation. For testing, returns mock.
 *
 * @param force_mock If true, return mock QRNG even if hardware available
 * @return Smart pointer to QRNG instance, nullptr on failure
 */
std::unique_ptr<QRNGInterface> create_qrng(bool force_mock = false);

/**
 * RAII wrapper for QRNG operations
 * Ensures proper initialization and cleanup
 */
class QRNGGuard {
public:
    explicit QRNGGuard(std::unique_ptr<QRNGInterface> qrng);
    ~QRNGGuard();

    QRNGInterface* get() const { return qrng_.get(); }
    QRNGInterface* operator->() const { return qrng_.get(); }
    bool is_valid() const { return qrng_ && qrng_->is_connected(); }

private:
    std::unique_ptr<QRNGInterface> qrng_;
};

} // namespace qrng

#endif // QRNG_INTERFACE_H
