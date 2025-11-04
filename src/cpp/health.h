// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

#pragma once

#include <atomic>
#include <chrono>
#include <functional>
#include <map>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

namespace zipminator {

/**
 * @brief Component health status
 */
enum class HealthState {
    HEALTHY,      // Component is fully operational
    DEGRADED,     // Component has reduced functionality
    UNHEALTHY,    // Component is not operational
    UNKNOWN       // Component status is unknown
};

const char* health_state_to_string(HealthState state) noexcept;

/**
 * @brief Health check result for a single component
 */
struct ComponentHealth {
    std::string component_name;
    HealthState state = HealthState::UNKNOWN;
    std::string message;
    std::chrono::system_clock::time_point last_check;
    std::map<std::string, std::string> details;

    bool is_healthy() const { return state == HealthState::HEALTHY; }
    bool is_degraded() const { return state == HealthState::DEGRADED; }
    bool is_unhealthy() const { return state == HealthState::UNHEALTHY; }
};

/**
 * @brief Overall system health status
 */
struct SystemHealth {
    bool overall_healthy = false;
    HealthState worst_state = HealthState::UNKNOWN;
    std::vector<ComponentHealth> components;
    uint64_t total_operations = 0;
    uint64_t total_errors = 0;
    double uptime_seconds = 0.0;
    std::chrono::system_clock::time_point check_time;

    ComponentHealth* find_component(const std::string& name);
    const ComponentHealth* find_component(const std::string& name) const;

    std::string to_json() const;
};

/**
 * @brief Health check function signature
 */
using HealthCheckFunc = std::function<ComponentHealth()>;

/**
 * @brief Health monitoring system
 *
 * Provides periodic health checks, component registration, and status reporting.
 * Thread-safe singleton pattern.
 */
class HealthMonitor {
private:
    mutable std::mutex mutex_;
    std::map<std::string, HealthCheckFunc> health_checks_;
    std::map<std::string, ComponentHealth> last_results_;

    std::atomic<bool> monitoring_enabled_{false};
    std::unique_ptr<std::thread> monitor_thread_;
    std::chrono::seconds check_interval_{60};

    std::chrono::system_clock::time_point startup_time_;

    // Private constructor for singleton
    HealthMonitor() : startup_time_(std::chrono::system_clock::now()) {}

    void monitoring_loop();

public:
    // Singleton access
    static HealthMonitor& instance();

    // Delete copy/move constructors
    HealthMonitor(const HealthMonitor&) = delete;
    HealthMonitor& operator=(const HealthMonitor&) = delete;

    /**
     * @brief Register a health check for a component
     */
    void register_health_check(
        const std::string& component_name,
        HealthCheckFunc check_func
    );

    /**
     * @brief Unregister a health check
     */
    void unregister_health_check(const std::string& component_name);

    /**
     * @brief Start periodic health monitoring
     */
    void start_monitoring(std::chrono::seconds interval = std::chrono::seconds(60));

    /**
     * @brief Stop periodic health monitoring
     */
    void stop_monitoring();

    /**
     * @brief Check if monitoring is active
     */
    bool is_monitoring() const { return monitoring_enabled_.load(); }

    /**
     * @brief Run all health checks immediately
     */
    SystemHealth check_health();

    /**
     * @brief Get last health check results
     */
    SystemHealth get_last_health() const;

    /**
     * @brief Get system uptime in seconds
     */
    double get_uptime() const;

    /**
     * @brief Create a simple health check from a lambda
     */
    static HealthCheckFunc make_simple_check(
        const std::string& component_name,
        std::function<bool()> check_func,
        const std::string& healthy_msg = "Component operational",
        const std::string& unhealthy_msg = "Component not operational"
    );
};

/**
 * @brief Built-in health checks
 */
namespace health_checks {

/**
 * @brief Check QRNG device health
 */
ComponentHealth check_qrng_health();

/**
 * @brief Check cryptographic functionality
 */
ComponentHealth check_crypto_health();

/**
 * @brief Check memory usage
 */
ComponentHealth check_memory_health();

/**
 * @brief Check system resources
 */
ComponentHealth check_system_resources();

} // namespace health_checks

/**
 * @brief Initialize standard health checks
 */
void initialize_standard_health_checks();

} // namespace zipminator
