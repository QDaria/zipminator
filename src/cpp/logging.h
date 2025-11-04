// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

#pragma once

#include <spdlog/spdlog.h>
#include <spdlog/sinks/rotating_file_sink.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/syslog_sink.h>
#include <spdlog/fmt/ostr.h>
#include <memory>
#include <string>

namespace zipminator {

/**
 * @brief Log level enumeration matching spdlog
 */
enum class LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    CRITICAL = 5,
    OFF = 6
};

/**
 * @brief Logging configuration
 */
struct LogConfig {
    LogLevel level = LogLevel::INFO;
    bool use_json_format = true;
    bool log_to_console = true;
    bool log_to_file = true;
    bool log_to_syslog = false;

    std::string log_file_path = "/var/log/zipminator/app.log";
    size_t max_file_size = 10 * 1024 * 1024; // 10 MB
    size_t max_files = 5;

    bool sensitive_data_masking = true;
    bool include_thread_id = true;
    bool include_process_id = true;
    bool include_source_location = true;
};

/**
 * @brief Main logging interface for Zipminator
 *
 * This class provides structured logging with automatic sensitive data masking,
 * rotation, and multiple output sinks. Thread-safe singleton pattern.
 */
class Logger {
private:
    std::shared_ptr<spdlog::logger> logger_;
    LogConfig config_;
    bool initialized_ = false;

    // Private constructor for singleton
    Logger() = default;

    // Mask sensitive data in log messages
    static std::string mask_sensitive_data(const std::string& message);

public:
    // Singleton access
    static Logger& instance();

    // Delete copy/move constructors
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;
    Logger(Logger&&) = delete;
    Logger& operator=(Logger&&) = delete;

    /**
     * @brief Initialize logger with configuration
     */
    void initialize(const LogConfig& config);

    /**
     * @brief Check if logger is initialized
     */
    bool is_initialized() const { return initialized_; }

    /**
     * @brief Set log level at runtime
     */
    void set_level(LogLevel level);

    /**
     * @brief Get current log level
     */
    LogLevel get_level() const;

    /**
     * @brief Flush all log buffers
     */
    void flush();

    /**
     * @brief Shutdown logger gracefully
     */
    void shutdown();

    // Logging methods with structured context
    template<typename... Args>
    void trace(const char* fmt, Args&&... args) {
        if (logger_ && logger_->should_log(spdlog::level::trace)) {
            std::string msg = fmt::format(fmt::runtime(fmt), std::forward<Args>(args)...);
            if (config_.sensitive_data_masking) {
                msg = mask_sensitive_data(msg);
            }
            logger_->trace(msg);
        }
    }

    template<typename... Args>
    void debug(const char* fmt, Args&&... args) {
        if (logger_ && logger_->should_log(spdlog::level::debug)) {
            std::string msg = fmt::format(fmt::runtime(fmt), std::forward<Args>(args)...);
            if (config_.sensitive_data_masking) {
                msg = mask_sensitive_data(msg);
            }
            logger_->debug(msg);
        }
    }

    template<typename... Args>
    void info(const char* fmt, Args&&... args) {
        if (logger_ && logger_->should_log(spdlog::level::info)) {
            std::string msg = fmt::format(fmt::runtime(fmt), std::forward<Args>(args)...);
            if (config_.sensitive_data_masking) {
                msg = mask_sensitive_data(msg);
            }
            logger_->info(msg);
        }
    }

    template<typename... Args>
    void warn(const char* fmt, Args&&... args) {
        if (logger_ && logger_->should_log(spdlog::level::warn)) {
            std::string msg = fmt::format(fmt::runtime(fmt), std::forward<Args>(args)...);
            if (config_.sensitive_data_masking) {
                msg = mask_sensitive_data(msg);
            }
            logger_->warn(msg);
        }
    }

    template<typename... Args>
    void error(const char* fmt, Args&&... args) {
        if (logger_ && logger_->should_log(spdlog::level::err)) {
            std::string msg = fmt::format(fmt::runtime(fmt), std::forward<Args>(args)...);
            if (config_.sensitive_data_masking) {
                msg = mask_sensitive_data(msg);
            }
            logger_->error(msg);
        }
    }

    template<typename... Args>
    void critical(const char* fmt, Args&&... args) {
        if (logger_ && logger_->should_log(spdlog::level::critical)) {
            std::string msg = fmt::format(fmt::runtime(fmt), std::forward<Args>(args)...);
            if (config_.sensitive_data_masking) {
                msg = mask_sensitive_data(msg);
            }
            logger_->critical(msg);
        }
    }

    /**
     * @brief Log structured data as JSON
     */
    void log_json(LogLevel level, const std::string& json_data);

    /**
     * @brief Get underlying spdlog logger for advanced usage
     */
    std::shared_ptr<spdlog::logger> get_logger() { return logger_; }
};

/**
 * @brief Convenient macros for logging
 */
#define LOG_TRACE(...) ::zipminator::Logger::instance().trace(__VA_ARGS__)
#define LOG_DEBUG(...) ::zipminator::Logger::instance().debug(__VA_ARGS__)
#define LOG_INFO(...) ::zipminator::Logger::instance().info(__VA_ARGS__)
#define LOG_WARN(...) ::zipminator::Logger::instance().warn(__VA_ARGS__)
#define LOG_ERROR(...) ::zipminator::Logger::instance().error(__VA_ARGS__)
#define LOG_CRITICAL(...) ::zipminator::Logger::instance().critical(__VA_ARGS__)

/**
 * @brief Log error result with full context
 */
template<typename T>
void log_error_result(const Result<T>& result) {
    if (result.is_err()) {
        LOG_ERROR("Operation failed: {}", result.format());
        Logger::instance().log_json(LogLevel::ERROR, result.to_json());
    }
}

/**
 * @brief RAII logger scope for automatic enter/exit logging
 */
class LogScope {
private:
    std::string scope_name_;
    std::chrono::steady_clock::time_point start_time_;

public:
    explicit LogScope(std::string scope_name)
        : scope_name_(std::move(scope_name)),
          start_time_(std::chrono::steady_clock::now()) {
        LOG_DEBUG("Entering scope: {}", scope_name_);
    }

    ~LogScope() {
        auto duration = std::chrono::steady_clock::now() - start_time_;
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();
        LOG_DEBUG("Exiting scope: {} (duration: {}ms)", scope_name_, ms);
    }

    LogScope(const LogScope&) = delete;
    LogScope& operator=(const LogScope&) = delete;
};

#define LOG_SCOPE(name) ::zipminator::LogScope __log_scope__(name)

} // namespace zipminator
