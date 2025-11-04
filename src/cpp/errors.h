// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2025 Zipminator Project

#pragma once

#include <string>
#include <optional>
#include <chrono>
#include <source_location>

namespace zipminator {

/**
 * @brief Enumeration of all possible error codes in Zipminator
 *
 * These error codes are designed to be stable across versions
 * for API compatibility and operational monitoring.
 */
enum class ErrorCode : uint32_t {
    // Success (0x0000)
    SUCCESS = 0x0000,

    // QRNG Errors (0x1000-0x1FFF)
    QRNG_INITIALIZATION_FAILED = 0x1001,
    QRNG_HEALTH_CHECK_FAILED = 0x1002,
    QRNG_DEVICE_NOT_FOUND = 0x1003,
    QRNG_DEVICE_DISCONNECTED = 0x1004,
    QRNG_INSUFFICIENT_ENTROPY = 0x1005,
    QRNG_ENTROPY_TEST_FAILED = 0x1006,

    // Cryptographic Errors (0x2000-0x2FFF)
    INVALID_PUBLIC_KEY = 0x2001,
    INVALID_SECRET_KEY = 0x2002,
    INVALID_CIPHERTEXT = 0x2003,
    INVALID_SHARED_SECRET = 0x2004,
    KEY_GENERATION_FAILED = 0x2005,
    ENCAPSULATION_FAILED = 0x2006,
    DECAPSULATION_FAILED = 0x2007,
    SIGNATURE_VERIFICATION_FAILED = 0x2008,

    // Memory Errors (0x3000-0x3FFF)
    MEMORY_ALLOCATION_FAILED = 0x3001,
    BUFFER_OVERFLOW_DETECTED = 0x3002,
    INVALID_MEMORY_ACCESS = 0x3003,
    OUT_OF_MEMORY = 0x3004,

    // Configuration Errors (0x4000-0x4FFF)
    INVALID_CONFIGURATION = 0x4001,
    MISSING_CONFIGURATION = 0x4002,
    CONFIG_FILE_NOT_FOUND = 0x4003,
    CONFIG_PARSE_ERROR = 0x4004,

    // System Errors (0x5000-0x5FFF)
    IO_ERROR = 0x5001,
    TIMEOUT = 0x5002,
    RESOURCE_EXHAUSTED = 0x5003,
    PERMISSION_DENIED = 0x5004,

    // Internal Errors (0xF000-0xFFFF)
    INTERNAL_ERROR = 0xF001,
    NOT_IMPLEMENTED = 0xF002,
    ASSERTION_FAILED = 0xF003,
    INVARIANT_VIOLATION = 0xF004
};

/**
 * @brief Severity level for errors
 */
enum class ErrorSeverity : uint8_t {
    INFO = 0,      // Informational, operation can continue
    WARNING = 1,   // Warning, degraded operation
    ERROR = 2,     // Error, operation failed but recoverable
    CRITICAL = 3,  // Critical, immediate attention required
    FATAL = 4      // Fatal, system unusable
};

/**
 * @brief Error context information
 */
struct ErrorContext {
    std::source_location location;
    std::chrono::system_clock::time_point timestamp;
    std::string operation;
    std::string details;
    std::optional<std::string> stack_trace;

    ErrorContext(
        std::source_location loc = std::source_location::current(),
        std::string op = "",
        std::string det = ""
    ) : location(loc),
        timestamp(std::chrono::system_clock::now()),
        operation(std::move(op)),
        details(std::move(det)) {}
};

/**
 * @brief Result type for Zipminator operations
 *
 * This class provides a type-safe way to handle errors without exceptions.
 * It follows the Result<T, E> pattern common in modern error handling.
 */
template<typename T = void>
class Result {
private:
    ErrorCode error_code_;
    ErrorSeverity severity_;
    std::string message_;
    ErrorContext context_;
    std::optional<T> value_;

public:
    // Success constructor
    explicit Result(T value)
        : error_code_(ErrorCode::SUCCESS),
          severity_(ErrorSeverity::INFO),
          message_("Operation successful"),
          context_(),
          value_(std::move(value)) {}

    // Error constructor
    Result(
        ErrorCode code,
        std::string message,
        ErrorSeverity severity = ErrorSeverity::ERROR,
        ErrorContext context = ErrorContext()
    ) : error_code_(code),
        severity_(severity),
        message_(std::move(message)),
        context_(std::move(context)),
        value_(std::nullopt) {}

    // Query methods
    [[nodiscard]] bool is_ok() const noexcept { return error_code_ == ErrorCode::SUCCESS; }
    [[nodiscard]] bool is_err() const noexcept { return !is_ok(); }

    [[nodiscard]] ErrorCode error_code() const noexcept { return error_code_; }
    [[nodiscard]] ErrorSeverity severity() const noexcept { return severity_; }
    [[nodiscard]] const std::string& message() const noexcept { return message_; }
    [[nodiscard]] const ErrorContext& context() const noexcept { return context_; }

    // Value access (throws if error)
    [[nodiscard]] const T& value() const& {
        if (!value_.has_value()) {
            throw std::logic_error("Attempted to access value on error result");
        }
        return *value_;
    }

    [[nodiscard]] T& value() & {
        if (!value_.has_value()) {
            throw std::logic_error("Attempted to access value on error result");
        }
        return *value_;
    }

    [[nodiscard]] T&& value() && {
        if (!value_.has_value()) {
            throw std::logic_error("Attempted to access value on error result");
        }
        return std::move(*value_);
    }

    // Value access with default
    [[nodiscard]] T value_or(T default_value) const& {
        return value_.value_or(std::move(default_value));
    }

    [[nodiscard]] T value_or(T default_value) && {
        return std::move(value_).value_or(std::move(default_value));
    }

    // Format error message with context
    [[nodiscard]] std::string format() const;

    // Convert to JSON for logging
    [[nodiscard]] std::string to_json() const;
};

// Specialization for void
template<>
class Result<void> {
private:
    ErrorCode error_code_;
    ErrorSeverity severity_;
    std::string message_;
    ErrorContext context_;

public:
    // Success constructor
    Result()
        : error_code_(ErrorCode::SUCCESS),
          severity_(ErrorSeverity::INFO),
          message_("Operation successful"),
          context_() {}

    // Error constructor
    Result(
        ErrorCode code,
        std::string message,
        ErrorSeverity severity = ErrorSeverity::ERROR,
        ErrorContext context = ErrorContext()
    ) : error_code_(code),
        severity_(severity),
        message_(std::move(message)),
        context_(std::move(context)) {}

    [[nodiscard]] bool is_ok() const noexcept { return error_code_ == ErrorCode::SUCCESS; }
    [[nodiscard]] bool is_err() const noexcept { return !is_ok(); }

    [[nodiscard]] ErrorCode error_code() const noexcept { return error_code_; }
    [[nodiscard]] ErrorSeverity severity() const noexcept { return severity_; }
    [[nodiscard]] const std::string& message() const noexcept { return message_; }
    [[nodiscard]] const ErrorContext& context() const noexcept { return context_; }

    [[nodiscard]] std::string format() const;
    [[nodiscard]] std::string to_json() const;
};

/**
 * @brief Helper macros for error handling
 */
#define ZIPMINATOR_TRY(expr) \
    ({ \
        auto __result = (expr); \
        if (__result.is_err()) { \
            return __result; \
        } \
        std::move(__result).value(); \
    })

#define ZIPMINATOR_TRY_VOID(expr) \
    do { \
        auto __result = (expr); \
        if (__result.is_err()) { \
            return __result; \
        } \
    } while(0)

/**
 * @brief Get human-readable error code name
 */
const char* error_code_to_string(ErrorCode code) noexcept;

/**
 * @brief Get error severity name
 */
const char* error_severity_to_string(ErrorSeverity severity) noexcept;

/**
 * @brief Create error result with current location
 */
template<typename T = void>
Result<T> make_error(
    ErrorCode code,
    std::string message,
    ErrorSeverity severity = ErrorSeverity::ERROR,
    std::string operation = "",
    std::string details = ""
) {
    return Result<T>(
        code,
        std::move(message),
        severity,
        ErrorContext(std::source_location::current(), std::move(operation), std::move(details))
    );
}

/**
 * @brief Create success result
 */
template<typename T>
Result<T> make_ok(T value) {
    return Result<T>(std::move(value));
}

inline Result<void> make_ok() {
    return Result<void>();
}

} // namespace zipminator
