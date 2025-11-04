// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

#pragma once

#include <atomic>
#include <chrono>
#include <map>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

namespace zipminator {

/**
 * @brief Operation types for metrics tracking
 */
enum class OperationType {
    KEY_GENERATION,
    ENCAPSULATION,
    DECAPSULATION,
    QRNG_READ,
    HEALTH_CHECK
};

/**
 * @brief Counter metric for tracking operation counts
 */
class Counter {
private:
    std::atomic<uint64_t> value_{0};

public:
    void increment(uint64_t amount = 1) {
        value_.fetch_add(amount, std::memory_order_relaxed);
    }

    void reset() {
        value_.store(0, std::memory_order_relaxed);
    }

    uint64_t get() const {
        return value_.load(std::memory_order_relaxed);
    }
};

/**
 * @brief Histogram metric for tracking latency distributions
 */
class Histogram {
private:
    mutable std::mutex mutex_;
    std::vector<double> samples_;
    std::vector<double> buckets_;
    std::vector<uint64_t> bucket_counts_;
    uint64_t count_{0};
    double sum_{0.0};
    double min_{std::numeric_limits<double>::max()};
    double max_{std::numeric_limits<double>::min()};

public:
    explicit Histogram(const std::vector<double>& buckets = {
        0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0
    });

    void observe(double value);
    void reset();

    uint64_t count() const;
    double sum() const;
    double mean() const;
    double min() const;
    double max() const;
    double percentile(double p) const;

    std::map<double, uint64_t> bucket_counts() const;
};

/**
 * @brief Gauge metric for tracking current values
 */
class Gauge {
private:
    std::atomic<double> value_{0.0};

public:
    void set(double value) {
        value_.store(value, std::memory_order_relaxed);
    }

    void increment(double amount = 1.0) {
        double current = value_.load(std::memory_order_relaxed);
        while (!value_.compare_exchange_weak(
            current, current + amount,
            std::memory_order_relaxed
        )) {}
    }

    void decrement(double amount = 1.0) {
        increment(-amount);
    }

    double get() const {
        return value_.load(std::memory_order_relaxed);
    }
};

/**
 * @brief Main metrics registry for Zipminator
 *
 * Thread-safe singleton for collecting and exporting metrics.
 * Supports Prometheus export format.
 */
class MetricsRegistry {
private:
    mutable std::mutex mutex_;

    // Operation counters
    std::map<std::string, std::shared_ptr<Counter>> counters_;

    // Latency histograms
    std::map<std::string, std::shared_ptr<Histogram>> histograms_;

    // Current values
    std::map<std::string, std::shared_ptr<Gauge>> gauges_;

    // Startup time
    std::chrono::system_clock::time_point startup_time_;

    // Private constructor for singleton
    MetricsRegistry() : startup_time_(std::chrono::system_clock::now()) {
        initialize_default_metrics();
    }

    void initialize_default_metrics();

public:
    // Singleton access
    static MetricsRegistry& instance();

    // Delete copy/move constructors
    MetricsRegistry(const MetricsRegistry&) = delete;
    MetricsRegistry& operator=(const MetricsRegistry&) = delete;

    /**
     * @brief Get or create a counter
     */
    std::shared_ptr<Counter> get_counter(const std::string& name);

    /**
     * @brief Get or create a histogram
     */
    std::shared_ptr<Histogram> get_histogram(const std::string& name);

    /**
     * @brief Get or create a gauge
     */
    std::shared_ptr<Gauge> get_gauge(const std::string& name);

    /**
     * @brief Record operation timing
     */
    void record_operation(OperationType type, double latency_seconds);

    /**
     * @brief Record operation error
     */
    void record_error(OperationType type);

    /**
     * @brief Get uptime in seconds
     */
    double get_uptime() const;

    /**
     * @brief Reset all metrics
     */
    void reset();

    /**
     * @brief Export metrics in Prometheus format
     */
    std::string export_prometheus() const;

    /**
     * @brief Export metrics as JSON
     */
    std::string export_json() const;
};

/**
 * @brief RAII timer for automatic latency measurement
 */
class ScopedTimer {
private:
    OperationType type_;
    std::chrono::steady_clock::time_point start_;
    bool committed_ = false;

public:
    explicit ScopedTimer(OperationType type)
        : type_(type), start_(std::chrono::steady_clock::now()) {}

    ~ScopedTimer() {
        if (!committed_) {
            commit();
        }
    }

    void commit() {
        if (!committed_) {
            auto end = std::chrono::steady_clock::now();
            auto duration = std::chrono::duration<double>(end - start_).count();
            MetricsRegistry::instance().record_operation(type_, duration);
            committed_ = true;
        }
    }

    void cancel() {
        committed_ = true;
    }
};

/**
 * @brief Convenient macros for metrics
 */
#define METRICS_COUNTER(name) \
    ::zipminator::MetricsRegistry::instance().get_counter(name)

#define METRICS_HISTOGRAM(name) \
    ::zipminator::MetricsRegistry::instance().get_histogram(name)

#define METRICS_GAUGE(name) \
    ::zipminator::MetricsRegistry::instance().get_gauge(name)

#define METRICS_TIMER(type) \
    ::zipminator::ScopedTimer __metrics_timer__(type)

} // namespace zipminator
