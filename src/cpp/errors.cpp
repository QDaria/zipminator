// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

#include "errors.h"
#include <sstream>
#include <iomanip>

namespace zipminator {

const char* error_code_to_string(ErrorCode code) noexcept {
    switch (code) {
        case ErrorCode::SUCCESS: return "SUCCESS";

        // QRNG Errors
        case ErrorCode::QRNG_INITIALIZATION_FAILED: return "QRNG_INITIALIZATION_FAILED";
        case ErrorCode::QRNG_HEALTH_CHECK_FAILED: return "QRNG_HEALTH_CHECK_FAILED";
        case ErrorCode::QRNG_DEVICE_NOT_FOUND: return "QRNG_DEVICE_NOT_FOUND";
        case ErrorCode::QRNG_DEVICE_DISCONNECTED: return "QRNG_DEVICE_DISCONNECTED";
        case ErrorCode::QRNG_INSUFFICIENT_ENTROPY: return "QRNG_INSUFFICIENT_ENTROPY";
        case ErrorCode::QRNG_ENTROPY_TEST_FAILED: return "QRNG_ENTROPY_TEST_FAILED";

        // Cryptographic Errors
        case ErrorCode::INVALID_PUBLIC_KEY: return "INVALID_PUBLIC_KEY";
        case ErrorCode::INVALID_SECRET_KEY: return "INVALID_SECRET_KEY";
        case ErrorCode::INVALID_CIPHERTEXT: return "INVALID_CIPHERTEXT";
        case ErrorCode::INVALID_SHARED_SECRET: return "INVALID_SHARED_SECRET";
        case ErrorCode::KEY_GENERATION_FAILED: return "KEY_GENERATION_FAILED";
        case ErrorCode::ENCAPSULATION_FAILED: return "ENCAPSULATION_FAILED";
        case ErrorCode::DECAPSULATION_FAILED: return "DECAPSULATION_FAILED";
        case ErrorCode::SIGNATURE_VERIFICATION_FAILED: return "SIGNATURE_VERIFICATION_FAILED";

        // Memory Errors
        case ErrorCode::MEMORY_ALLOCATION_FAILED: return "MEMORY_ALLOCATION_FAILED";
        case ErrorCode::BUFFER_OVERFLOW_DETECTED: return "BUFFER_OVERFLOW_DETECTED";
        case ErrorCode::INVALID_MEMORY_ACCESS: return "INVALID_MEMORY_ACCESS";
        case ErrorCode::OUT_OF_MEMORY: return "OUT_OF_MEMORY";

        // Configuration Errors
        case ErrorCode::INVALID_CONFIGURATION: return "INVALID_CONFIGURATION";
        case ErrorCode::MISSING_CONFIGURATION: return "MISSING_CONFIGURATION";
        case ErrorCode::CONFIG_FILE_NOT_FOUND: return "CONFIG_FILE_NOT_FOUND";
        case ErrorCode::CONFIG_PARSE_ERROR: return "CONFIG_PARSE_ERROR";

        // System Errors
        case ErrorCode::IO_ERROR: return "IO_ERROR";
        case ErrorCode::TIMEOUT: return "TIMEOUT";
        case ErrorCode::RESOURCE_EXHAUSTED: return "RESOURCE_EXHAUSTED";
        case ErrorCode::PERMISSION_DENIED: return "PERMISSION_DENIED";

        // Internal Errors
        case ErrorCode::INTERNAL_ERROR: return "INTERNAL_ERROR";
        case ErrorCode::NOT_IMPLEMENTED: return "NOT_IMPLEMENTED";
        case ErrorCode::ASSERTION_FAILED: return "ASSERTION_FAILED";
        case ErrorCode::INVARIANT_VIOLATION: return "INVARIANT_VIOLATION";

        default: return "UNKNOWN_ERROR";
    }
}

const char* error_severity_to_string(ErrorSeverity severity) noexcept {
    switch (severity) {
        case ErrorSeverity::INFO: return "INFO";
        case ErrorSeverity::WARNING: return "WARNING";
        case ErrorSeverity::ERROR: return "ERROR";
        case ErrorSeverity::CRITICAL: return "CRITICAL";
        case ErrorSeverity::FATAL: return "FATAL";
        default: return "UNKNOWN";
    }
}

template<typename T>
std::string Result<T>::format() const {
    std::ostringstream oss;

    oss << "[" << error_severity_to_string(severity_) << "] "
        << error_code_to_string(error_code_)
        << " (0x" << std::hex << std::setw(4) << std::setfill('0')
        << static_cast<uint32_t>(error_code_) << "): "
        << message_;

    if (!context_.operation.empty()) {
        oss << "\n  Operation: " << context_.operation;
    }

    if (!context_.details.empty()) {
        oss << "\n  Details: " << context_.details;
    }

    oss << "\n  Location: " << context_.location.file_name()
        << ":" << context_.location.line()
        << " in " << context_.location.function_name();

    return oss.str();
}

template<typename T>
std::string Result<T>::to_json() const {
    std::ostringstream oss;

    auto escape_json = [](const std::string& str) -> std::string {
        std::ostringstream escaped;
        for (char c : str) {
            switch (c) {
                case '"': escaped << "\\\""; break;
                case '\\': escaped << "\\\\"; break;
                case '\n': escaped << "\\n"; break;
                case '\r': escaped << "\\r"; break;
                case '\t': escaped << "\\t"; break;
                default: escaped << c; break;
            }
        }
        return escaped.str();
    };

    auto time_t_val = std::chrono::system_clock::to_time_t(context_.timestamp);

    oss << "{\n"
        << "  \"error_code\": \"" << error_code_to_string(error_code_) << "\",\n"
        << "  \"error_code_value\": " << static_cast<uint32_t>(error_code_) << ",\n"
        << "  \"severity\": \"" << error_severity_to_string(severity_) << "\",\n"
        << "  \"message\": \"" << escape_json(message_) << "\",\n"
        << "  \"timestamp\": \"" << std::put_time(std::gmtime(&time_t_val), "%Y-%m-%dT%H:%M:%SZ") << "\",\n"
        << "  \"location\": {\n"
        << "    \"file\": \"" << escape_json(context_.location.file_name()) << "\",\n"
        << "    \"line\": " << context_.location.line() << ",\n"
        << "    \"function\": \"" << escape_json(context_.location.function_name()) << "\"\n"
        << "  }";

    if (!context_.operation.empty()) {
        oss << ",\n  \"operation\": \"" << escape_json(context_.operation) << "\"";
    }

    if (!context_.details.empty()) {
        oss << ",\n  \"details\": \"" << escape_json(context_.details) << "\"";
    }

    if (context_.stack_trace.has_value()) {
        oss << ",\n  \"stack_trace\": \"" << escape_json(*context_.stack_trace) << "\"";
    }

    oss << "\n}";

    return oss.str();
}

// Explicit template instantiations
template class Result<int>;
template class Result<std::string>;
template class Result<std::vector<uint8_t>>;

std::string Result<void>::format() const {
    std::ostringstream oss;

    oss << "[" << error_severity_to_string(severity_) << "] "
        << error_code_to_string(error_code_)
        << " (0x" << std::hex << std::setw(4) << std::setfill('0')
        << static_cast<uint32_t>(error_code_) << "): "
        << message_;

    if (!context_.operation.empty()) {
        oss << "\n  Operation: " << context_.operation;
    }

    if (!context_.details.empty()) {
        oss << "\n  Details: " << context_.details;
    }

    oss << "\n  Location: " << context_.location.file_name()
        << ":" << context_.location.line()
        << " in " << context_.location.function_name();

    return oss.str();
}

std::string Result<void>::to_json() const {
    std::ostringstream oss;

    auto escape_json = [](const std::string& str) -> std::string {
        std::ostringstream escaped;
        for (char c : str) {
            switch (c) {
                case '"': escaped << "\\\""; break;
                case '\\': escaped << "\\\\"; break;
                case '\n': escaped << "\\n"; break;
                case '\r': escaped << "\\r"; break;
                case '\t': escaped << "\\t"; break;
                default: escaped << c; break;
            }
        }
        return escaped.str();
    };

    auto time_t_val = std::chrono::system_clock::to_time_t(context_.timestamp);

    oss << "{\n"
        << "  \"error_code\": \"" << error_code_to_string(error_code_) << "\",\n"
        << "  \"error_code_value\": " << static_cast<uint32_t>(error_code_) << ",\n"
        << "  \"severity\": \"" << error_severity_to_string(severity_) << "\",\n"
        << "  \"message\": \"" << escape_json(message_) << "\",\n"
        << "  \"timestamp\": \"" << std::put_time(std::gmtime(&time_t_val), "%Y-%m-%dT%H:%M:%SZ") << "\",\n"
        << "  \"location\": {\n"
        << "    \"file\": \"" << escape_json(context_.location.file_name()) << "\",\n"
        << "    \"line\": " << context_.location.line() << ",\n"
        << "    \"function\": \"" << escape_json(context_.location.function_name()) << "\"\n"
        << "  }";

    if (!context_.operation.empty()) {
        oss << ",\n  \"operation\": \"" << escape_json(context_.operation) << "\"";
    }

    if (!context_.details.empty()) {
        oss << ",\n  \"details\": \"" << escape_json(context_.details) << "\"";
    }

    if (context_.stack_trace.has_value()) {
        oss << ",\n  \"stack_trace\": \"" << escape_json(*context_.stack_trace) << "\"";
    }

    oss << "\n}";

    return oss.str();
}

} // namespace zipminator
