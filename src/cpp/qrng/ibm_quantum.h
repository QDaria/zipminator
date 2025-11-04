/**
 * IBM Quantum QRNG Device Interface
 *
 * Integrates IBM Quantum Experience QRNG service for true quantum entropy.
 * Supports both API-based access and pre-generated entropy pool file loading.
 *
 * Features:
 * - File-based entropy pool for offline operation
 * - Optional API access for real-time quantum data
 * - Automatic fallback to system RNG when pool exhausted
 * - Health monitoring and entropy quality metrics
 * - Thread-safe concurrent access
 *
 * Usage:
 *   auto ibm_qrng = std::make_unique<IBMQuantumQRNG>(
 *       "/var/lib/zipminator/quantum_entropy.pool"
 *   );
 *   ibm_qrng->initialize();
 *   uint8_t buffer[32];
 *   ibm_qrng->get_random_bytes(buffer, 32);
 */

#ifndef IBM_QUANTUM_H
#define IBM_QUANTUM_H

#include "qrng_interface.h"
#include <string>
#include <mutex>
#include <fstream>
#include <atomic>
#include <chrono>

namespace qrng {

/**
 * IBM Quantum Configuration
 */
struct IBMQuantumConfig {
    std::string pool_file_path;        // Path to pre-generated entropy pool file
    size_t min_pool_bytes = 10240;     // Minimum bytes before warning (10KB)
    size_t refill_threshold = 32768;   // Trigger refill notification at this level (32KB)
    bool enable_api = false;           // Enable API access (requires credentials)
    std::string api_token;             // IBM Quantum API token (optional)
    bool warn_on_fallback = true;      // Emit warnings when falling back to /dev/urandom
    bool log_entropy_source = true;    // Log which entropy source is used
};

/**
 * IBM Quantum QRNG Implementation
 *
 * Provides quantum entropy from IBM Quantum systems via:
 * 1. Pre-generated entropy pool file (primary, offline)
 * 2. IBM Quantum API (optional, requires authentication)
 * 3. System /dev/urandom (fallback)
 */
class IBMQuantumQRNG : public QRNGInterface {
public:
    /**
     * Constructor
     *
     * @param config Configuration for IBM Quantum access
     */
    explicit IBMQuantumQRNG(const IBMQuantumConfig& config);

    /**
     * Destructor - ensures cleanup
     */
    ~IBMQuantumQRNG() override;

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
     * Check if quantum entropy is currently being used
     * @return true if using quantum pool, false if fallback
     */
    bool is_using_quantum() const;

    /**
     * Get percentage of pool remaining
     * @return Fill percentage (0-100)
     */
    double get_pool_percent() const;

    /**
     * Force reload of entropy pool from file
     * @return QRNGStatus::OK on success
     */
    QRNGStatus reload_pool();

private:
    IBMQuantumConfig config_;

    // Pool file management
    std::ifstream pool_file_;
    mutable std::mutex file_mutex_;
    size_t pool_bytes_read_;
    size_t pool_total_size_;

    // State tracking
    std::atomic<bool> initialized_;
    std::atomic<bool> using_quantum_;
    std::atomic<bool> pool_exhausted_;

    // Statistics
    HealthStats stats_;
    mutable std::mutex stats_mutex_;
    std::chrono::steady_clock::time_point last_health_check_;

    // Fallback RNG (system urandom)
    int urandom_fd_;

    /**
     * Read from quantum entropy pool file
     * @return QRNGStatus::OK if successful
     */
    QRNGStatus read_from_pool(uint8_t* buffer, size_t length);

    /**
     * Fallback to system urandom
     * @return QRNGStatus::OK if successful
     */
    QRNGStatus read_from_urandom(uint8_t* buffer, size_t length);

    /**
     * Open and validate entropy pool file
     * @return QRNGStatus::OK if successful
     */
    QRNGStatus open_pool_file();

    /**
     * Log entropy source usage
     */
    void log_source(const std::string& source);

    /**
     * Update health statistics
     */
    void update_stats(size_t bytes_read, bool from_quantum);
};

} // namespace qrng

#endif // IBM_QUANTUM_H
