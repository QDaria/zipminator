// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

#pragma once

#include "logging.h"
#include <chrono>
#include <map>
#include <optional>
#include <string>
#include <variant>
#include <vector>

namespace zipminator {

/**
 * @brief QRNG device configuration
 */
struct QrngConfig {
    std::string device_type = "id_quantique_usb";
    std::string device_path;
    bool fallback_enabled = true;
    std::chrono::seconds health_check_interval{60};
    uint32_t entropy_pool_size = 1048576; // 1 MB
    bool continuous_testing = true;

    // Statistical testing thresholds
    double min_entropy_rate = 7.8; // bits per byte
    uint32_t startup_tests_samples = 100000;
};

/**
 * @brief Performance configuration
 */
struct PerformanceConfig {
    uint32_t entropy_pool_size = 1048576;
    uint32_t worker_threads = 4;
    bool enable_prefetch = true;
    bool enable_batch_operations = true;
    uint32_t batch_size = 100;

    // Cache configuration
    bool enable_caching = false;
    uint32_t cache_size = 0;
    std::chrono::seconds cache_ttl{300};
};

/**
 * @brief Security configuration
 */
struct SecurityConfig {
    bool constant_time_validation = true;
    bool side_channel_protections = true;
    bool secure_memory = true;
    bool memory_locking = true;

    // Key lifecycle
    std::chrono::seconds key_rotation_interval{86400}; // 24 hours
    bool auto_key_rotation = false;

    // Audit
    bool audit_logging = true;
    bool audit_crypto_operations = true;
};

/**
 * @brief Network configuration (for future features)
 */
struct NetworkConfig {
    std::string bind_address = "127.0.0.1";
    uint16_t port = 8443;
    bool enable_tls = true;
    std::string cert_file;
    std::string key_file;
    std::string ca_file;
};

/**
 * @brief Monitoring configuration
 */
struct MonitoringConfig {
    bool enabled = true;
    bool enable_metrics = true;
    bool enable_health_checks = true;
    bool enable_profiling = false;

    std::string metrics_endpoint = "/metrics";
    std::string health_endpoint = "/health";

    std::chrono::seconds metrics_update_interval{10};
    std::chrono::seconds health_check_interval{60};
};

/**
 * @brief Main Zipminator configuration
 */
struct Config {
    QrngConfig qrng;
    PerformanceConfig performance;
    SecurityConfig security;
    NetworkConfig network;
    MonitoringConfig monitoring;
    LogConfig logging;

    std::string version = "0.1.0";
    std::string environment = "production";

    /**
     * @brief Load configuration from YAML file
     */
    static std::optional<Config> load_from_file(const std::string& path);

    /**
     * @brief Load configuration from environment variables
     */
    static Config load_from_env();

    /**
     * @brief Save configuration to YAML file
     */
    bool save_to_file(const std::string& path) const;

    /**
     * @brief Validate configuration
     */
    bool validate() const;

    /**
     * @brief Get configuration as JSON
     */
    std::string to_json() const;

    /**
     * @brief Create default configuration
     */
    static Config create_default();

    /**
     * @brief Merge with another configuration (other takes precedence)
     */
    void merge(const Config& other);
};

/**
 * @brief Configuration manager singleton
 */
class ConfigManager {
private:
    Config config_;
    mutable std::mutex mutex_;
    bool initialized_ = false;

    ConfigManager() = default;

public:
    // Singleton access
    static ConfigManager& instance();

    // Delete copy/move constructors
    ConfigManager(const ConfigManager&) = delete;
    ConfigManager& operator=(const ConfigManager&) = delete;

    /**
     * @brief Initialize with configuration
     */
    void initialize(const Config& config);

    /**
     * @brief Load and initialize from file
     */
    bool initialize_from_file(const std::string& path);

    /**
     * @brief Check if initialized
     */
    bool is_initialized() const { return initialized_; }

    /**
     * @brief Get current configuration (thread-safe copy)
     */
    Config get() const;

    /**
     * @brief Update configuration (thread-safe)
     */
    void update(const Config& config);

    /**
     * @brief Get specific configuration section
     */
    QrngConfig get_qrng_config() const;
    PerformanceConfig get_performance_config() const;
    SecurityConfig get_security_config() const;
    LogConfig get_log_config() const;
    MonitoringConfig get_monitoring_config() const;
};

} // namespace zipminator
