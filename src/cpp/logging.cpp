// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

#include "logging.h"
#include <spdlog/pattern_formatter.h>
#include <regex>
#include <filesystem>

namespace zipminator {

Logger& Logger::instance() {
    static Logger instance;
    return instance;
}

std::string Logger::mask_sensitive_data(const std::string& message) {
    static const std::vector<std::regex> sensitive_patterns = {
        std::regex(R"(\b[A-Fa-f0-9]{64}\b)"),                    // Hex keys (256-bit)
        std::regex(R"(\b[A-Za-z0-9+/]{43}=\b)"),                 // Base64 keys
        std::regex(R"(secret[_-]?key[:\s]*[A-Za-z0-9+/=]+)", std::regex::icase),
        std::regex(R"(private[_-]?key[:\s]*[A-Za-z0-9+/=]+)", std::regex::icase),
        std::regex(R"(password[:\s]*\S+)", std::regex::icase),
        std::regex(R"(token[:\s]*[A-Za-z0-9+/=]+)", std::regex::icase),
    };

    std::string masked = message;

    for (const auto& pattern : sensitive_patterns) {
        masked = std::regex_replace(masked, pattern, "[REDACTED]");
    }

    return masked;
}

void Logger::initialize(const LogConfig& config) {
    config_ = config;

    try {
        std::vector<spdlog::sink_ptr> sinks;

        // Console sink
        if (config_.log_to_console) {
            auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
            if (config_.use_json_format) {
                console_sink->set_pattern(R"({"timestamp":"%Y-%m-%dT%H:%M:%S.%eZ","level":"%^%l%$","thread":%t,"message":"%v"})");
            } else {
                console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");
            }
            sinks.push_back(console_sink);
        }

        // File sink with rotation
        if (config_.log_to_file) {
            // Ensure log directory exists
            std::filesystem::path log_path(config_.log_file_path);
            std::filesystem::create_directories(log_path.parent_path());

            auto file_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(
                config_.log_file_path,
                config_.max_file_size,
                config_.max_files
            );

            if (config_.use_json_format) {
                file_sink->set_pattern(R"({"timestamp":"%Y-%m-%dT%H:%M:%S.%eZ","level":"%l","thread":%t,"pid":%P,"source":"%s:%#","message":"%v"})");
            } else {
                file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [%P:%t] [%s:%#] %v");
            }
            sinks.push_back(file_sink);
        }

        // Syslog sink (Unix systems only)
#ifndef _WIN32
        if (config_.log_to_syslog) {
            auto syslog_sink = std::make_shared<spdlog::sinks::syslog_sink_mt>(
                "zipminator",
                LOG_PID,
                LOG_USER,
                false
            );
            sinks.push_back(syslog_sink);
        }
#endif

        // Create logger with multiple sinks
        logger_ = std::make_shared<spdlog::logger>("zipminator", sinks.begin(), sinks.end());

        // Set log level
        spdlog::level::level_enum spdlog_level;
        switch (config_.level) {
            case LogLevel::TRACE: spdlog_level = spdlog::level::trace; break;
            case LogLevel::DEBUG: spdlog_level = spdlog::level::debug; break;
            case LogLevel::INFO: spdlog_level = spdlog::level::info; break;
            case LogLevel::WARN: spdlog_level = spdlog::level::warn; break;
            case LogLevel::ERROR: spdlog_level = spdlog::level::err; break;
            case LogLevel::CRITICAL: spdlog_level = spdlog::level::critical; break;
            case LogLevel::OFF: spdlog_level = spdlog::level::off; break;
        }
        logger_->set_level(spdlog_level);

        // Flush policy
        logger_->flush_on(spdlog::level::err);
        spdlog::flush_every(std::chrono::seconds(5));

        // Register as default logger
        spdlog::set_default_logger(logger_);

        initialized_ = true;

        LOG_INFO("Zipminator logger initialized");
        LOG_INFO("Log level: {}", static_cast<int>(config_.level));
        LOG_INFO("JSON format: {}", config_.use_json_format);
        LOG_INFO("Log file: {}", config_.log_file_path);

    } catch (const spdlog::spdlog_ex& ex) {
        std::cerr << "Logger initialization failed: " << ex.what() << std::endl;
        initialized_ = false;
    }
}

void Logger::set_level(LogLevel level) {
    config_.level = level;

    if (logger_) {
        spdlog::level::level_enum spdlog_level;
        switch (level) {
            case LogLevel::TRACE: spdlog_level = spdlog::level::trace; break;
            case LogLevel::DEBUG: spdlog_level = spdlog::level::debug; break;
            case LogLevel::INFO: spdlog_level = spdlog::level::info; break;
            case LogLevel::WARN: spdlog_level = spdlog::level::warn; break;
            case LogLevel::ERROR: spdlog_level = spdlog::level::err; break;
            case LogLevel::CRITICAL: spdlog_level = spdlog::level::critical; break;
            case LogLevel::OFF: spdlog_level = spdlog::level::off; break;
        }
        logger_->set_level(spdlog_level);
    }
}

LogLevel Logger::get_level() const {
    return config_.level;
}

void Logger::flush() {
    if (logger_) {
        logger_->flush();
    }
}

void Logger::shutdown() {
    if (logger_) {
        LOG_INFO("Shutting down logger");
        flush();
        spdlog::shutdown();
        initialized_ = false;
    }
}

void Logger::log_json(LogLevel level, const std::string& json_data) {
    if (!logger_) return;

    spdlog::level::level_enum spdlog_level;
    switch (level) {
        case LogLevel::TRACE: spdlog_level = spdlog::level::trace; break;
        case LogLevel::DEBUG: spdlog_level = spdlog::level::debug; break;
        case LogLevel::INFO: spdlog_level = spdlog::level::info; break;
        case LogLevel::WARN: spdlog_level = spdlog::level::warn; break;
        case LogLevel::ERROR: spdlog_level = spdlog::level::err; break;
        case LogLevel::CRITICAL: spdlog_level = spdlog::level::critical; break;
        default: return;
    }

    std::string masked_json = json_data;
    if (config_.sensitive_data_masking) {
        masked_json = mask_sensitive_data(json_data);
    }

    logger_->log(spdlog_level, masked_json);
}

} // namespace zipminator
