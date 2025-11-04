/**
 * @file qrng_interface.h
 * @brief Quantum Random Number Generator (QRNG) Hardware Interface
 *
 * Provides abstract interface for QRNG hardware integration into Zipminator
 * PQC platform. Supports multiple vendor implementations with unified API.
 *
 * NIST SP 800-90B compliant entropy source interface for ML-KEM (FIPS 203)
 * and ML-DSA (FIPS 204) implementations.
 *
 * @copyright QDaria Corporation 2025
 * @license Proprietary - All Rights Reserved
 */

#ifndef QDARIA_QRNG_INTERFACE_H
#define QDARIA_QRNG_INTERFACE_H

#include <cstdint>
#include <cstddef>
#include <string>
#include <memory>
#include <chrono>

namespace qdaria {
namespace qrng {

/**
 * @brief QRNG error codes
 */
enum class QRNGError {
    SUCCESS = 0,
    DEVICE_NOT_FOUND = 1,
    DEVICE_NOT_INITIALIZED = 2,
    DEVICE_FAILURE = 3,
    HEALTH_CHECK_FAILURE = 4,
    INSUFFICIENT_ENTROPY = 5,
    TIMEOUT = 6,
    INVALID_PARAMETER = 7,
    NOT_IMPLEMENTED = 8,
    PERMISSION_DENIED = 9,
    HARDWARE_TAMPERING = 10
};

/**
 * @brief QRNG device information
 */
struct DeviceInfo {
    std::string vendor;           ///< Vendor name (e.g., "ID Quantique")
    std::string model;            ///< Model name (e.g., "Quantis USB")
    std::string serial_number;    ///< Device serial number
    std::string firmware_version; ///< Firmware version
    uint32_t max_throughput_bps;  ///< Maximum throughput in bits/sec
    bool nist_sp_800_90b;        ///< NIST SP 800-90B certified
    bool bsi_ais_31;             ///< BSI AIS 31 certified
    bool fips_140_3_approved;    ///< FIPS 140-3 approved
    std::string certifications;   ///< Additional certification info
};

/**
 * @brief QRNG health status
 */
struct HealthStatus {
    bool is_healthy;              ///< Overall health status
    uint32_t error_count;         ///< Cumulative error count
    uint64_t bytes_generated;     ///< Total bytes generated
    std::chrono::system_clock::time_point last_check; ///< Last health check
    double min_entropy_estimate;  ///< Minimum entropy per bit
    bool entropy_source_ok;       ///< Entropy source functioning
    bool statistical_tests_pass;  ///< Real-time statistical tests passing
    std::string diagnostic_info;  ///< Human-readable diagnostic information
};

/**
 * @brief QRNG device configuration
 */
struct DeviceConfig {
    uint32_t read_timeout_ms;     ///< Read timeout in milliseconds
    bool enable_health_checks;    ///< Enable continuous health monitoring
    uint32_t health_check_interval_ms; ///< Health check interval
    bool fail_on_health_failure;  ///< Fail operations on health check failure
    uint32_t buffer_size_bytes;   ///< Internal buffer size
};

/**
 * @brief Abstract interface for QRNG devices
 *
 * This interface must be implemented by all QRNG hardware backends.
 * Implementations must be thread-safe for concurrent access.
 */
class QRNGInterface {
public:
    virtual ~QRNGInterface() = default;

    /**
     * @brief Initialize the QRNG device
     *
     * Opens device connection, verifies functionality, and prepares
     * for random number generation. Must be called before any other
     * operations.
     *
     * @return QRNGError::SUCCESS on success, error code otherwise
     */
    virtual QRNGError initialize() = 0;

    /**
     * @brief Shutdown the QRNG device
     *
     * Cleanly closes device connection and releases resources.
     *
     * @return QRNGError::SUCCESS on success, error code otherwise
     */
    virtual QRNGError shutdown() = 0;

    /**
     * @brief Get random bytes from the QRNG
     *
     * Blocks until requested number of bytes are available or timeout
     * occurs. Bytes are generated from certified quantum entropy source.
     *
     * @param buffer Output buffer for random bytes
     * @param length Number of bytes to generate
     * @return Number of bytes successfully generated (0 on error)
     */
    virtual size_t get_random_bytes(uint8_t* buffer, size_t length) = 0;

    /**
     * @brief Perform health check on QRNG device
     *
     * Executes real-time health monitoring including:
     * - Entropy source verification
     * - Statistical testing (NIST SP 800-90B)
     * - Tampering detection
     *
     * @return true if device is healthy, false otherwise
     */
    virtual bool health_check() = 0;

    /**
     * @brief Get detailed health status
     *
     * @param status Output parameter for health status
     * @return QRNGError::SUCCESS on success, error code otherwise
     */
    virtual QRNGError get_health_status(HealthStatus* status) = 0;

    /**
     * @brief Get device information
     *
     * @param info Output parameter for device info
     * @return QRNGError::SUCCESS on success, error code otherwise
     */
    virtual QRNGError get_device_info(DeviceInfo* info) = 0;

    /**
     * @brief Configure device parameters
     *
     * @param config Device configuration
     * @return QRNGError::SUCCESS on success, error code otherwise
     */
    virtual QRNGError configure(const DeviceConfig& config) = 0;

    /**
     * @brief Check if device is initialized
     *
     * @return true if initialized, false otherwise
     */
    virtual bool is_initialized() const = 0;

    /**
     * @brief Get last error message
     *
     * @return Human-readable error description
     */
    virtual std::string get_last_error() const = 0;
};

/**
 * @brief ID Quantique Quantis USB implementation
 */
class IDQuantiqueUSB : public QRNGInterface {
public:
    IDQuantiqueUSB();
    ~IDQuantiqueUSB() override;

    QRNGError initialize() override;
    QRNGError shutdown() override;
    size_t get_random_bytes(uint8_t* buffer, size_t length) override;
    bool health_check() override;
    QRNGError get_health_status(HealthStatus* status) override;
    QRNGError get_device_info(DeviceInfo* info) override;
    QRNGError configure(const DeviceConfig& config) override;
    bool is_initialized() const override;
    std::string get_last_error() const override;

private:
    class Impl;
    std::unique_ptr<Impl> pimpl_;
};

/**
 * @brief ID Quantique Quantis PCIe implementation
 */
class IDQuantiquePCIe : public QRNGInterface {
public:
    IDQuantiquePCIe();
    ~IDQuantiquePCIe() override;

    QRNGError initialize() override;
    QRNGError shutdown() override;
    size_t get_random_bytes(uint8_t* buffer, size_t length) override;
    bool health_check() override;
    QRNGError get_health_status(HealthStatus* status) override;
    QRNGError get_device_info(DeviceInfo* info) override;
    QRNGError configure(const DeviceConfig& config) override;
    bool is_initialized() const override;
    std::string get_last_error() const override;

private:
    class Impl;
    std::unique_ptr<Impl> pimpl_;
};

/**
 * @brief Factory for creating QRNG instances
 */
class QRNGFactory {
public:
    /**
     * @brief Device type enumeration
     */
    enum class DeviceType {
        ID_QUANTIQUE_USB,
        ID_QUANTIQUE_PCIE,
        AUTO_DETECT
    };

    /**
     * @brief Create QRNG instance
     *
     * @param type Device type to create
     * @return Unique pointer to QRNG interface (nullptr on failure)
     */
    static std::unique_ptr<QRNGInterface> create(DeviceType type);

    /**
     * @brief Auto-detect and create best available QRNG
     *
     * Priority order: PCIe > USB
     *
     * @return Unique pointer to QRNG interface (nullptr if none found)
     */
    static std::unique_ptr<QRNGInterface> create_auto();

    /**
     * @brief Enumerate available QRNG devices
     *
     * @return Vector of device info for available devices
     */
    static std::vector<DeviceInfo> enumerate_devices();
};

/**
 * @brief RAII wrapper for QRNG resource management
 */
class QRNGGuard {
public:
    explicit QRNGGuard(QRNGInterface* device);
    ~QRNGGuard();

    QRNGGuard(const QRNGGuard&) = delete;
    QRNGGuard& operator=(const QRNGGuard&) = delete;

    QRNGInterface* get() { return device_; }
    QRNGInterface* operator->() { return device_; }

private:
    QRNGInterface* device_;
};

} // namespace qrng
} // namespace qdaria

#endif // QDARIA_QRNG_INTERFACE_H
