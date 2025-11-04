#ifndef QUANTUM_ENTROPY_POOL_H
#define QUANTUM_ENTROPY_POOL_H

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include <functional>
#include <cstdint>
#include <chrono>

namespace qdaria {
namespace quantum {

// Forward declarations
class EntropyPoolImpl;

/**
 * @brief Quantum Entropy Pool - Secure storage for quantum random bytes
 *
 * Provides AES-256-GCM encrypted storage with HMAC-SHA256 integrity verification
 * for quantum random bytes harvested from IBM Quantum hardware.
 *
 * Thread-safe: All public methods are internally synchronized.
 *
 * Security Features:
 * - Encryption at rest (AES-256-GCM)
 * - Integrity verification (HMAC-SHA256)
 * - Secure deletion (3-pass overwrite)
 * - Access control (file permissions 0600)
 * - Audit logging
 * - Rate limiting
 *
 * @example
 * ```cpp
 * // Create new entropy pool
 * auto pool = QuantumEntropyPool::create(
 *     "entropy.qep",
 *     quantum_bytes,
 *     "ibm_sherbrooke",
 *     "c1234567-89ab-cdef-0123-456789abcdef",
 *     10000, // shots
 *     5      // qubits
 * );
 *
 * // Retrieve random bytes for Kyber-768 seed
 * std::vector<uint8_t> seed = pool->get_bytes(32);
 *
 * // Check if refill needed
 * if (pool->available_bytes() < 1024) {
 *     pool->set_refill_callback([](size_t remaining) {
 *         std::cout << "Low entropy: " << remaining << " bytes\n";
 *         // Trigger quantum harvesting...
 *     });
 * }
 * ```
 */
class QuantumEntropyPool {
public:
    /**
     * @brief Entropy pool metadata
     */
    struct Metadata {
        std::string entropy_source;     // "IBM Quantum"
        std::string backend_name;       // e.g., "ibm_sherbrooke"
        std::string job_id;             // IBM Quantum job UUID
        uint32_t num_shots;             // Number of quantum shots
        uint8_t num_qubits;             // Qubits per shot
        uint8_t bits_per_shot;          // Bits per shot (usually == num_qubits)
        uint32_t total_bytes;           // Total entropy bytes
        uint32_t consumed_bytes;        // Bytes already consumed
        std::chrono::system_clock::time_point timestamp; // Creation time
    };

    /**
     * @brief Statistical health metrics
     */
    struct HealthMetrics {
        double chi_square_p_value;      // Chi-square test p-value (>0.01 is good)
        double autocorrelation;         // Lag-1 autocorrelation (<0.05 is good)
        double min_entropy_estimate;    // Bits per byte (>7.9 is excellent)
        size_t longest_run_zeros;       // Longest sequence of 0 bits
        size_t longest_run_ones;        // Longest sequence of 1 bits
        bool passes_nist_tests;         // Overall NIST SP 800-90B pass/fail
    };

    /**
     * @brief Refill callback function signature
     *
     * Called when available entropy drops below threshold.
     *
     * @param available_bytes Number of bytes remaining in pool
     */
    using RefillCallback = std::function<void(size_t available_bytes)>;

    /**
     * @brief Create new entropy pool from quantum data
     *
     * @param file_path Path to entropy pool file (will be created with 0600 permissions)
     * @param entropy_bytes Raw quantum entropy bytes
     * @param backend_name IBM Quantum backend name (e.g., "ibm_sherbrooke")
     * @param job_id IBM Quantum job UUID
     * @param num_shots Number of quantum shots used
     * @param num_qubits Number of qubits measured per shot
     * @param validate_entropy If true, run statistical tests before storing
     * @return Unique pointer to entropy pool, or nullptr on error
     * @throws std::runtime_error if encryption fails or validation fails
     */
    static std::unique_ptr<QuantumEntropyPool> create(
        const std::string& file_path,
        const std::vector<uint8_t>& entropy_bytes,
        const std::string& backend_name,
        const std::string& job_id,
        uint32_t num_shots,
        uint8_t num_qubits,
        bool validate_entropy = true
    );

    /**
     * @brief Open existing entropy pool
     *
     * @param file_path Path to entropy pool file
     * @return Unique pointer to entropy pool, or nullptr on error
     * @throws std::runtime_error if decryption or integrity check fails
     */
    static std::unique_ptr<QuantumEntropyPool> open(const std::string& file_path);

    /**
     * @brief Destructor - securely wipes keys from memory
     */
    ~QuantumEntropyPool();

    // Prevent copying (contains cryptographic keys)
    QuantumEntropyPool(const QuantumEntropyPool&) = delete;
    QuantumEntropyPool& operator=(const QuantumEntropyPool&) = delete;

    // Allow moving
    QuantumEntropyPool(QuantumEntropyPool&&) noexcept;
    QuantumEntropyPool& operator=(QuantumEntropyPool&&) noexcept;

    /**
     * @brief Get random bytes from pool (thread-safe)
     *
     * Atomically retrieves and securely deletes consumed entropy.
     *
     * @param num_bytes Number of random bytes to retrieve
     * @return Vector of random bytes
     * @throws std::runtime_error if insufficient entropy available
     */
    std::vector<uint8_t> get_bytes(size_t num_bytes);

    /**
     * @brief Get random bytes into pre-allocated buffer (zero-copy)
     *
     * @param buffer Destination buffer
     * @param num_bytes Number of bytes to retrieve
     * @return True on success, false if insufficient entropy
     */
    bool get_bytes_into(uint8_t* buffer, size_t num_bytes);

    /**
     * @brief Get number of bytes available (thread-safe)
     *
     * @return Number of unconsumed bytes remaining
     */
    size_t available_bytes() const;

    /**
     * @brief Get total pool capacity
     *
     * @return Total number of entropy bytes in pool
     */
    size_t total_bytes() const;

    /**
     * @brief Get number of consumed bytes
     *
     * @return Number of bytes already retrieved
     */
    size_t consumed_bytes() const;

    /**
     * @brief Check if pool is nearly exhausted
     *
     * @param threshold_bytes Threshold for "low entropy" warning
     * @return True if available bytes < threshold
     */
    bool is_low(size_t threshold_bytes = 10240) const;

    /**
     * @brief Get pool metadata
     *
     * @return Metadata structure with entropy source info
     */
    Metadata get_metadata() const;

    /**
     * @brief Compute statistical health metrics
     *
     * Runs NIST SP 800-90B tests on unconsumed entropy.
     *
     * @return Health metrics structure
     */
    HealthMetrics compute_health_metrics() const;

    /**
     * @brief Set callback for low-entropy notification
     *
     * Callback is invoked when available bytes drops below threshold.
     *
     * @param callback Function to call on low entropy
     * @param threshold_bytes Threshold for triggering callback (default: 10 KB)
     */
    void set_refill_callback(RefillCallback callback, size_t threshold_bytes = 10240);

    /**
     * @brief Enable/disable audit logging
     *
     * @param enabled If true, log all entropy access to audit trail
     * @param log_path Path to log file (default: /var/log/qdaria/entropy_pool.log)
     */
    void set_audit_logging(bool enabled, const std::string& log_path = "");

    /**
     * @brief Securely close and delete pool file
     *
     * Performs 3-pass secure deletion before removing file.
     */
    void secure_delete();

    /**
     * @brief Get file path of entropy pool
     *
     * @return Absolute path to pool file
     */
    std::string get_file_path() const;

    /**
     * @brief Validate encryption key from environment
     *
     * Checks if QUANTUM_ENTROPY_KEY environment variable is set
     * and contains a valid base64-encoded 256-bit key.
     *
     * @return True if key is valid
     */
    static bool validate_encryption_key();

    /**
     * @brief Generate and store new encryption key
     *
     * Generates a cryptographically secure 256-bit key and stores
     * it in the specified location.
     *
     * @param key_path Path to key file (will be created with 0400 permissions)
     * @return True on success
     */
    static bool generate_encryption_key(const std::string& key_path);

private:
    /**
     * @brief Private constructor (use factory methods)
     */
    QuantumEntropyPool();

    // PIMPL idiom to hide OpenSSL implementation details
    std::unique_ptr<EntropyPoolImpl> impl_;
    mutable std::mutex mutex_;  // Protects all operations
};

/**
 * @brief Exception thrown when entropy pool operations fail
 */
class EntropyPoolException : public std::runtime_error {
public:
    explicit EntropyPoolException(const std::string& message)
        : std::runtime_error(message) {}
};

/**
 * @brief Utility functions for entropy validation
 */
namespace entropy_validation {

/**
 * @brief Run NIST SP 800-90B min-entropy estimation
 *
 * @param data Entropy bytes to test
 * @return Estimated min-entropy in bits per byte (8.0 is maximum)
 */
double estimate_min_entropy(const std::vector<uint8_t>& data);

/**
 * @brief Run chi-square goodness-of-fit test
 *
 * @param data Entropy bytes to test
 * @return p-value (>0.01 indicates good randomness)
 */
double chi_square_test(const std::vector<uint8_t>& data);

/**
 * @brief Compute lag-1 autocorrelation
 *
 * @param data Entropy bytes to test
 * @return Autocorrelation coefficient (<0.05 indicates good randomness)
 */
double autocorrelation_test(const std::vector<uint8_t>& data);

/**
 * @brief Run NIST SP 800-22 runs test
 *
 * @param data Entropy bytes to test
 * @return p-value (>0.01 indicates good randomness)
 */
double runs_test(const std::vector<uint8_t>& data);

/**
 * @brief Run full NIST SP 800-90B test suite
 *
 * @param data Entropy bytes to test
 * @return True if all tests pass
 */
bool validate_entropy_quality(const std::vector<uint8_t>& data);

} // namespace entropy_validation

} // namespace quantum
} // namespace qdaria

#endif // QUANTUM_ENTROPY_POOL_H
