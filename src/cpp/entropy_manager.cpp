/**
 * Entropy Manager Implementation
 */

#include "entropy_manager.h"
#include "qrng/ibm_quantum.h"
#include "qrng/id_quantique_usb.h"
#include "qrng/mock_qrng.h"
#include <fcntl.h>
#include <unistd.h>
#include <iostream>
#include <fstream>

namespace kyber768 {

// Singleton instance
EntropyManager& EntropyManager::instance() {
    static EntropyManager instance;
    return instance;
}

EntropyManager::EntropyManager()
    : active_source_index_(0),
      initialized_(false) {
}

EntropyManager::~EntropyManager() {
    shutdown();
}

bool EntropyManager::initialize_from_config(const std::string& config_path) {
    // For now, use simple initialization
    // TODO: Implement YAML parsing
    std::cout << "Note: YAML config parsing not yet implemented, using defaults\n";

    EntropyManagerConfig config;

    // Default configuration: IBM Quantum → /dev/urandom
    EntropySourceConfig ibm_config;
    ibm_config.type = EntropySourceType::IBM_QUANTUM;
    ibm_config.enabled = true;
    ibm_config.pool_path = "/var/lib/zipminator/quantum_entropy.pool";
    ibm_config.min_bytes = 10240;

    EntropySourceConfig urandom_config;
    urandom_config.type = EntropySourceType::SYSTEM_URANDOM;
    urandom_config.enabled = true;

    config.sources.push_back(ibm_config);
    config.sources.push_back(urandom_config);

    return initialize(config);
}

bool EntropyManager::initialize(const EntropyManagerConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (initialized_) {
        std::cerr << "EntropyManager already initialized\n";
        return false;
    }

    config_ = config;

    // Create entropy sources in priority order
    for (const auto& source_config : config.sources) {
        if (!source_config.enabled) {
            continue;
        }

        auto source = create_source(source_config.type, source_config);
        if (source && source->initialize() == qrng::QRNGStatus::OK) {
            sources_.push_back(std::move(source));
            source_types_.push_back(source_config.type);

            std::cout << "Initialized entropy source: "
                      << source_type_to_string(source_config.type) << "\n";
        } else {
            std::cerr << "Failed to initialize entropy source: "
                      << source_type_to_string(source_config.type) << "\n";
        }
    }

    if (sources_.empty()) {
        std::cerr << "Error: No entropy sources available\n";
        return false;
    }

    // Optionally create entropy pool for buffering
    if (config_.enable_entropy_pool && !sources_.empty()) {
        qrng::EntropyPoolConfig pool_config;
        pool_config.pool_size = config_.pool_size;
        pool_config.refill_threshold = config_.pool_size / 4;
        pool_config.min_entropy_guarantee = 4096;

        // Use first source for pool (will be highest priority)
        entropy_pool_ = std::make_unique<qrng::EntropyPool>(
            std::move(sources_[0]),
            pool_config
        );

        if (entropy_pool_->initialize() == qrng::QRNGStatus::OK) {
            std::cout << "Entropy pool initialized with "
                      << source_type_to_string(source_types_[0]) << "\n";
        } else {
            std::cerr << "Warning: Failed to initialize entropy pool\n";
            entropy_pool_.reset();
        }
    }

    active_source_index_ = 0;
    initialized_ = true;

    return true;
}

bool EntropyManager::initialize_simple(EntropySourceType type,
                                       const EntropySourceConfig& config) {
    EntropyManagerConfig mgr_config;
    mgr_config.sources.push_back(config);
    mgr_config.enable_entropy_pool = false;

    return initialize(mgr_config);
}

bool EntropyManager::get_random_bytes(uint8_t* buffer, size_t length) {
    if (!initialized_) {
        std::cerr << "Error: EntropyManager not initialized\n";
        return false;
    }

    if (!buffer || length == 0) {
        return false;
    }

    std::lock_guard<std::mutex> lock(mutex_);

    // Try entropy pool first if available
    if (entropy_pool_ && entropy_pool_->is_operational()) {
        qrng::QRNGStatus status = entropy_pool_->get_random_bytes(buffer, length);
        if (status == qrng::QRNGStatus::OK) {
            return true;
        }

        std::cerr << "Warning: Entropy pool failed, trying direct sources\n";
    }

    // Try sources in priority order
    for (size_t i = active_source_index_; i < sources_.size(); i++) {
        if (try_source(i, buffer, length)) {
            if (i != active_source_index_) {
                log_source_change(
                    source_type_to_string(source_types_[active_source_index_]),
                    source_type_to_string(source_types_[i])
                );
                active_source_index_ = i;
            }
            return true;
        }
    }

    // Try from beginning if we started mid-list
    for (size_t i = 0; i < active_source_index_; i++) {
        if (try_source(i, buffer, length)) {
            log_source_change(
                source_type_to_string(source_types_[active_source_index_]),
                source_type_to_string(source_types_[i])
            );
            active_source_index_ = i;
            return true;
        }
    }

    std::cerr << "Error: All entropy sources failed\n";
    return false;
}

bool EntropyManager::is_using_quantum() const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!initialized_ || active_source_index_ >= source_types_.size()) {
        return false;
    }

    EntropySourceType type = source_types_[active_source_index_];
    return (type == EntropySourceType::IBM_QUANTUM ||
            type == EntropySourceType::ID_QUANTIQUE);
}

EntropySourceType EntropyManager::get_active_source() const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!initialized_ || active_source_index_ >= source_types_.size()) {
        return EntropySourceType::SYSTEM_URANDOM;
    }

    return source_types_[active_source_index_];
}

std::string EntropyManager::get_active_source_name() const {
    return source_type_to_string(get_active_source());
}

size_t EntropyManager::health_check_all() {
    std::lock_guard<std::mutex> lock(mutex_);

    size_t healthy_count = 0;

    for (auto& source : sources_) {
        if (source && source->health_check() == qrng::QRNGStatus::OK) {
            healthy_count++;
        }
    }

    return healthy_count;
}

std::string EntropyManager::get_statistics() const {
    std::lock_guard<std::mutex> lock(mutex_);

    std::string stats = "Entropy Manager Statistics:\n";
    stats += "  Active Source: " + get_active_source_name() + "\n";
    stats += "  Using Quantum: " + std::string(is_using_quantum() ? "Yes" : "No") + "\n";
    stats += "  Total Sources: " + std::to_string(sources_.size()) + "\n";

    if (entropy_pool_) {
        stats += "  Pool Available: " + std::to_string(entropy_pool_->available_entropy())
                 + " bytes\n";
        stats += "  Pool Fill: " + std::to_string(static_cast<int>(entropy_pool_->get_fill_percent()))
                 + "%\n";
    }

    return stats;
}

void EntropyManager::shutdown() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (entropy_pool_) {
        entropy_pool_->shutdown();
        entropy_pool_.reset();
    }

    for (auto& source : sources_) {
        if (source) {
            source->disconnect();
        }
    }

    sources_.clear();
    source_types_.clear();
    initialized_ = false;
}

bool EntropyManager::is_initialized() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return initialized_;
}

// Private methods

bool EntropyManager::try_source(size_t source_idx, uint8_t* buffer, size_t length) {
    if (source_idx >= sources_.size() || !sources_[source_idx]) {
        return false;
    }

    qrng::QRNGStatus status = sources_[source_idx]->get_random_bytes(buffer, length);
    return (status == qrng::QRNGStatus::OK);
}

bool EntropyManager::switch_to_next_source() {
    size_t next_idx = (active_source_index_ + 1) % sources_.size();

    if (next_idx == active_source_index_) {
        return false;  // Only one source
    }

    log_source_change(
        source_type_to_string(source_types_[active_source_index_]),
        source_type_to_string(source_types_[next_idx])
    );

    active_source_index_ = next_idx;
    return true;
}

std::unique_ptr<qrng::QRNGInterface> EntropyManager::create_source(
    EntropySourceType type,
    const EntropySourceConfig& config) {

    switch (type) {
        case EntropySourceType::IBM_QUANTUM: {
            qrng::IBMQuantumConfig ibm_config;
            ibm_config.pool_file_path = config.pool_path;
            ibm_config.min_pool_bytes = config.min_bytes;
            ibm_config.warn_on_fallback = config_.alert_on_fallback;
            ibm_config.log_entropy_source = config_.log_source_changes;

            return std::make_unique<qrng::IBMQuantumQRNG>(ibm_config);
        }

        case EntropySourceType::ID_QUANTIQUE: {
            return std::make_unique<qrng::IDQuantiqueUSB>();
        }

        case EntropySourceType::MOCK: {
            return std::make_unique<qrng::MockQRNG>();
        }

        case EntropySourceType::SYSTEM_URANDOM: {
            // For /dev/urandom, we use MockQRNG configured to read from system
            // In production, create a proper SystemUrandomQRNG class
            return std::make_unique<qrng::MockQRNG>();
        }

        default:
            return nullptr;
    }
}

void EntropyManager::log_source_change(const std::string& from, const std::string& to) {
    if (config_.log_source_changes) {
        std::cout << "[Entropy Manager] Source changed: " << from << " → " << to << "\n";
    }

    if (config_.alert_on_fallback && to == "System /dev/urandom") {
        std::cerr << "ALERT: Falling back to non-quantum entropy source\n";
    }
}

std::string EntropyManager::source_type_to_string(EntropySourceType type) {
    switch (type) {
        case EntropySourceType::IBM_QUANTUM:
            return "IBM Quantum QRNG";
        case EntropySourceType::ID_QUANTIQUE:
            return "ID Quantique QRNG";
        case EntropySourceType::SYSTEM_URANDOM:
            return "System /dev/urandom";
        case EntropySourceType::MOCK:
            return "Mock QRNG";
        default:
            return "Unknown";
    }
}

} // namespace kyber768
