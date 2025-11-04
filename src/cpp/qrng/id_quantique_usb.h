/**
 * ID Quantique Quantis USB QRNG Driver
 *
 * Implements QRNG interface for ID Quantique Quantis USB devices.
 * Supports PCI and PCIe versions with USB interface.
 *
 * Hardware: ID Quantique Quantis Random Number Generator
 * Interface: USB 2.0/3.0 (vendor ID: 0x0ABA, product ID: 0x0101)
 * Throughput: 4 Mbps typical (500 KB/s)
 * Entropy source: Quantum shot noise from LED photon emission
 *
 * Requirements:
 * - libusb-1.0 for USB device access
 * - Root/admin privileges may be required for device access
 *
 * Security: Quantum entropy source provides true randomness
 * Thread-safety: Mutex-protected for concurrent access
 */

#ifndef ID_QUANTIQUE_USB_H
#define ID_QUANTIQUE_USB_H

#include "qrng_interface.h"
#include <mutex>
#include <atomic>
#include <thread>
#include <condition_variable>

// Forward declare libusb structures to avoid header dependency
struct libusb_context;
struct libusb_device_handle;

namespace qrng {

/**
 * ID Quantique Quantis USB Device Configuration
 */
struct QuantisConfig {
    uint16_t vendor_id = 0x0ABA;      // ID Quantique vendor ID
    uint16_t product_id = 0x0101;     // Quantis USB product ID
    uint8_t endpoint_in = 0x81;       // Bulk IN endpoint
    size_t transfer_size = 4096;      // USB transfer size (bytes)
    size_t buffer_size = 65536;       // Internal buffer size (64 KB)
    uint32_t timeout_ms = 1000;       // USB timeout (milliseconds)
    size_t min_buffer_level = 4096;   // Minimum buffer before refill (bytes)
    uint32_t health_check_interval = 100000; // Health check every N bytes
};

/**
 * ID Quantique Quantis USB QRNG Implementation
 */
class IDQuantiqueUSB : public QRNGInterface {
public:
    /**
     * Constructor with optional configuration
     *
     * @param config Device configuration parameters
     */
    explicit IDQuantiqueUSB(const QuantisConfig& config = QuantisConfig());

    /**
     * Destructor - ensures proper cleanup
     */
    ~IDQuantiqueUSB() override;

    // QRNGInterface implementation
    QRNGStatus initialize() override;
    bool is_connected() const override;
    QRNGStatus get_random_bytes(uint8_t* buffer, size_t length) override;
    QRNGStatus health_check() override;
    HealthStats get_health_stats() const override;
    size_t available_bytes() const override;
    std::string get_device_info() const override;
    void disconnect() override;

private:
    // Configuration
    QuantisConfig config_;

    // USB device handles
    libusb_context* usb_context_;
    libusb_device_handle* device_handle_;

    // Thread synchronization
    mutable std::mutex mutex_;
    std::condition_variable buffer_cv_;

    // Entropy buffer
    std::unique_ptr<uint8_t[]> entropy_buffer_;
    size_t buffer_head_;  // Write position
    size_t buffer_tail_;  // Read position
    size_t buffer_count_; // Number of bytes in buffer

    // Background refill thread
    std::thread refill_thread_;
    std::atomic<bool> stop_refill_;

    // Health statistics
    HealthStats stats_;
    std::atomic<uint64_t> bytes_since_health_check_;

    // Device information
    std::string device_serial_;
    std::string firmware_version_;

    // Internal methods

    /**
     * Find and open Quantis USB device
     *
     * @return QRNGStatus::OK on success, error code otherwise
     */
    QRNGStatus open_device();

    /**
     * Close USB device and cleanup
     */
    void close_device();

    /**
     * Read raw bytes from USB device
     *
     * @param buffer Output buffer
     * @param length Number of bytes to read
     * @return Number of bytes actually read, 0 on error
     */
    size_t read_from_device(uint8_t* buffer, size_t length);

    /**
     * Background thread for entropy buffer refill
     * Continuously reads from device and maintains buffer level
     */
    void refill_loop();

    /**
     * Perform statistical health checks on entropy
     * Implements NIST SP 800-90B repetition count test
     *
     * @param data Entropy data to test
     * @param length Number of bytes to test
     * @return true if tests pass, false otherwise
     */
    bool run_statistical_tests(const uint8_t* data, size_t length);

    /**
     * Read device serial number and firmware version
     */
    void read_device_info();

    /**
     * Calculate entropy rate based on recent operations
     *
     * @return Bytes per second
     */
    double calculate_entropy_rate();
};

} // namespace qrng

#endif // ID_QUANTIQUE_USB_H
