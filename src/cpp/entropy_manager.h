/**
 * Entropy Manager - Unified Entropy Source Abstraction
 *
 * Provides a single interface for accessing entropy from multiple sources:
 * - IBM Quantum QRNG (primary)
 * - ID Quantique hardware QRNG
 * - Mock QRNG (testing)
 * - System /dev/urandom (fallback)
 *
 * Automatically handles fallback chain and source switching based on
 * availability and health status.
 *
 * Usage:
 *   EntropyManager& mgr = EntropyManager::instance();
 *   mgr.initialize_from_config("config/entropy_sources.yaml");
 *
 *   uint8_t buffer[32];
 *   mgr.get_random_bytes(buffer, 32);  // Automatically uses best source
 */

#ifndef ENTROPY_MANAGER_H
#define ENTROPY_MANAGER_H

#include "qrng/qrng_interface.h"
#include "qrng/entropy_pool.h"
#include <memory>
#include <vector>
#include <string>
#include <mutex>

namespace kyber768 {

/**
 * Entropy source type enumeration
 */
enum class EntropySourceType {
    IBM_QUANTUM,      // IBM Quantum QRNG
    ID_QUANTIQUE,     // ID Quantique hardware QRNG
    SYSTEM_URANDOM,   // System /dev/urandom
    MOCK              // Mock QRNG for testing
};

/**
 * Entropy source configuration
 */
struct EntropySourceConfig {
    EntropySourceType type;
    bool enabled;
    std::string pool_path;              // For file-based sources
    size_t min_bytes;                   // Minimum bytes before refill
    std::string device_path;            // For hardware devices

    EntropySourceConfig()
        : type(EntropySourceType::SYSTEM_URANDOM),
          enabled(true),
          min_bytes(10240) {}
};

/**
 * Entropy Manager Configuration
 */
struct EntropyManagerConfig {
    std::vector<EntropySourceConfig> sources;  // Priority-ordered sources
    bool enable_entropy_pool;                  // Use buffering
    size_t pool_size;                          // Pool buffer size
    bool log_source_changes;                   // Log when switching sources
    bool alert_on_fallback;                    // Alert when using fallback

    EntropyManagerConfig()
        : enable_entropy_pool(true),
          pool_size(131072),  // 128KB
          log_source_changes(true),
          alert_on_fallback(true) {}
};

/**
 * Unified Entropy Manager
 *
 * Singleton that manages multiple entropy sources and automatically
 * handles failover and health monitoring.
 */
class EntropyManager {
public:
    /**
     * Get singleton instance
     */
    static EntropyManager& instance();

    /**
     * Initialize from configuration file
     *
     * @param config_path Path to YAML configuration file
     * @return true on success, false on failure
     */
    bool initialize_from_config(const std::string& config_path);

    /**
     * Initialize from configuration struct
     *
     * @param config Configuration structure
     * @return true on success, false on failure
     */
    bool initialize(const EntropyManagerConfig& config);

    /**
     * Initialize with single entropy source (simple mode)
     *
     * @param type Entropy source type
     * @param config Source-specific configuration
     * @return true on success, false on failure
     */
    bool initialize_simple(EntropySourceType type,
                          const EntropySourceConfig& config);

    /**
     * Get random bytes from best available source
     *
     * Automatically tries sources in priority order and handles fallback.
     *
     * @param buffer Output buffer
     * @param length Number of bytes to generate
     * @return true on success, false on failure
     *
     * Thread-safe: Yes
     * Performance: <2% overhead vs direct QRNG access
     */
    bool get_random_bytes(uint8_t* buffer, size_t length);

    /**
     * Check if quantum entropy is currently being used
     *
     * @return true if using quantum source (IBM or ID Quantique)
     */
    bool is_using_quantum() const;

    /**
     * Get current active entropy source type
     *
     * @return Active source type
     */
    EntropySourceType get_active_source() const;

    /**
     * Get human-readable name of active source
     *
     * @return Source name string
     */
    std::string get_active_source_name() const;

    /**
     * Force health check on all sources
     *
     * @return Number of healthy sources
     */
    size_t health_check_all();

    /**
     * Get statistics for all entropy sources
     *
     * @return Multi-line statistics string
     */
    std::string get_statistics() const;

    /**
     * Shutdown all entropy sources
     */
    void shutdown();

    /**
     * Check if manager is initialized
     *
     * @return true if ready to provide entropy
     */
    bool is_initialized() const;

private:
    // Singleton - private constructor
    EntropyManager();
    ~EntropyManager();

    // Prevent copying
    EntropyManager(const EntropyManager&) = delete;
    EntropyManager& operator=(const EntropyManager&) = delete;

    // Configuration
    EntropyManagerConfig config_;

    // Entropy sources (priority-ordered)
    std::vector<std::unique_ptr<qrng::QRNGInterface>> sources_;
    std::vector<EntropySourceType> source_types_;
    size_t active_source_index_;

    // Optional entropy pool for buffering
    std::unique_ptr<qrng::EntropyPool> entropy_pool_;

    // State
    bool initialized_;
    mutable std::mutex mutex_;

    /**
     * Try to get random bytes from specific source index
     *
     * @param source_idx Index into sources_ vector
     * @param buffer Output buffer
     * @param length Number of bytes
     * @return true on success, false on failure
     */
    bool try_source(size_t source_idx, uint8_t* buffer, size_t length);

    /**
     * Switch to next available source
     *
     * @return true if switched to new source, false if no sources available
     */
    bool switch_to_next_source();

    /**
     * Create QRNG instance for given type
     *
     * @param type Source type
     * @param config Source configuration
     * @return QRNG instance or nullptr on failure
     */
    std::unique_ptr<qrng::QRNGInterface> create_source(
        EntropySourceType type,
        const EntropySourceConfig& config
    );

    /**
     * Log source change
     */
    void log_source_change(const std::string& from, const std::string& to);

    /**
     * Convert source type to string
     */
    static std::string source_type_to_string(EntropySourceType type);
};

/**
 * Helper function to get random bytes from global entropy manager
 * Convenience wrapper for EntropyManager::instance().get_random_bytes()
 *
 * @param buffer Output buffer
 * @param length Number of bytes
 * @return true on success, false on failure
 */
inline bool get_quantum_random_bytes(uint8_t* buffer, size_t length) {
    return EntropyManager::instance().get_random_bytes(buffer, length);
}

/**
 * Helper function to check if quantum entropy is available
 *
 * @return true if using quantum source
 */
inline bool is_quantum_available() {
    return EntropyManager::instance().is_using_quantum();
}

} // namespace kyber768

#endif // ENTROPY_MANAGER_H
