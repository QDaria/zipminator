/**
 * IBM Quantum QRNG Implementation
 */

#include "ibm_quantum.h"
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>
#include <cstring>
#include <iostream>
#include <sstream>

namespace qrng {

IBMQuantumQRNG::IBMQuantumQRNG(const IBMQuantumConfig& config)
    : config_(config),
      pool_bytes_read_(0),
      pool_total_size_(0),
      initialized_(false),
      using_quantum_(false),
      pool_exhausted_(false),
      urandom_fd_(-1) {

    last_health_check_ = std::chrono::steady_clock::now();
}

IBMQuantumQRNG::~IBMQuantumQRNG() {
    disconnect();
}

QRNGStatus IBMQuantumQRNG::initialize() {
    if (initialized_) {
        return QRNGStatus::OK;
    }

    // Open entropy pool file
    QRNGStatus status = open_pool_file();
    if (status != QRNGStatus::OK) {
        std::cerr << "Warning: Failed to open IBM Quantum entropy pool, using fallback\n";
        using_quantum_ = false;
    } else {
        using_quantum_ = true;
        log_source("IBM Quantum Pool");
    }

    // Open /dev/urandom for fallback
    urandom_fd_ = open("/dev/urandom", O_RDONLY);
    if (urandom_fd_ < 0) {
        std::cerr << "Error: Failed to open /dev/urandom\n";
        return QRNGStatus::DEVICE_ERROR;
    }

    initialized_ = true;
    return QRNGStatus::OK;
}

bool IBMQuantumQRNG::is_connected() const {
    return initialized_;
}

QRNGStatus IBMQuantumQRNG::get_random_bytes(uint8_t* buffer, size_t length) {
    if (!initialized_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    if (!buffer || length == 0) {
        return QRNGStatus::DEVICE_ERROR;
    }

    QRNGStatus status;

    // Try quantum pool first if available
    if (using_quantum_ && !pool_exhausted_) {
        status = read_from_pool(buffer, length);

        if (status == QRNGStatus::OK) {
            update_stats(length, true);

            // Check if pool is running low
            size_t available = available_bytes();
            if (available < config_.min_pool_bytes && config_.warn_on_fallback) {
                std::cerr << "Warning: Quantum entropy pool low (" << available
                         << " bytes remaining). Consider refilling.\n";
            }

            return QRNGStatus::OK;
        }

        // Pool exhausted, switch to fallback
        if (config_.warn_on_fallback) {
            std::cerr << "Warning: Quantum entropy pool exhausted, falling back to /dev/urandom\n";
        }
        pool_exhausted_ = true;
        using_quantum_ = false;
        log_source("System /dev/urandom (fallback)");
    }

    // Use fallback
    status = read_from_urandom(buffer, length);
    update_stats(length, false);

    return status;
}

QRNGStatus IBMQuantumQRNG::health_check() {
    std::lock_guard<std::mutex> lock(stats_mutex_);

    auto now = std::chrono::steady_clock::now();
    last_health_check_ = now;

    // Check if we have quantum entropy available
    if (!using_quantum_ && !pool_exhausted_) {
        stats_.health_checks_failed++;
        return QRNGStatus::HEALTH_CHECK_FAILED;
    }

    // Check pool file validity if using quantum
    if (using_quantum_ && pool_file_.is_open()) {
        if (!pool_file_.good()) {
            stats_.health_checks_failed++;
            return QRNGStatus::IO_ERROR;
        }
    }

    // Check fallback availability
    if (urandom_fd_ < 0) {
        stats_.health_checks_failed++;
        return QRNGStatus::DEVICE_ERROR;
    }

    stats_.health_checks_passed++;
    return QRNGStatus::OK;
}

HealthStats IBMQuantumQRNG::get_health_stats() const {
    std::lock_guard<std::mutex> lock(stats_mutex_);
    HealthStats current_stats = stats_;

    // Update buffer fill percent
    current_stats.buffer_fill_percent = static_cast<uint32_t>(get_pool_percent());

    // Update last health check timestamp
    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
        now - last_health_check_
    ).count();
    current_stats.last_health_check_us = elapsed;

    return current_stats;
}

size_t IBMQuantumQRNG::available_bytes() const {
    std::lock_guard<std::mutex> lock(file_mutex_);

    if (!pool_file_.is_open() || pool_exhausted_) {
        return 0;
    }

    return pool_total_size_ - pool_bytes_read_;
}

std::string IBMQuantumQRNG::get_device_info() const {
    std::stringstream ss;
    ss << "IBM Quantum QRNG";

    if (using_quantum_) {
        ss << " (Quantum Active: " << (pool_total_size_ - pool_bytes_read_)
           << "/" << pool_total_size_ << " bytes)";
    } else {
        ss << " (Fallback: /dev/urandom)";
    }

    return ss.str();
}

void IBMQuantumQRNG::disconnect() {
    if (pool_file_.is_open()) {
        pool_file_.close();
    }

    if (urandom_fd_ >= 0) {
        close(urandom_fd_);
        urandom_fd_ = -1;
    }

    initialized_ = false;
}

bool IBMQuantumQRNG::is_using_quantum() const {
    return using_quantum_ && !pool_exhausted_;
}

double IBMQuantumQRNG::get_pool_percent() const {
    if (pool_total_size_ == 0) {
        return 0.0;
    }

    size_t remaining = pool_total_size_ - pool_bytes_read_;
    return (remaining * 100.0) / pool_total_size_;
}

QRNGStatus IBMQuantumQRNG::reload_pool() {
    std::lock_guard<std::mutex> lock(file_mutex_);

    if (pool_file_.is_open()) {
        pool_file_.close();
    }

    pool_bytes_read_ = 0;
    pool_exhausted_ = false;

    QRNGStatus status = open_pool_file();
    if (status == QRNGStatus::OK) {
        using_quantum_ = true;
        log_source("IBM Quantum Pool (reloaded)");
    }

    return status;
}

// Private methods

QRNGStatus IBMQuantumQRNG::read_from_pool(uint8_t* buffer, size_t length) {
    std::lock_guard<std::mutex> lock(file_mutex_);

    if (!pool_file_.is_open() || pool_file_.eof()) {
        return QRNGStatus::BUFFER_UNDERRUN;
    }

    pool_file_.read(reinterpret_cast<char*>(buffer), length);
    size_t bytes_read = pool_file_.gcount();

    if (bytes_read < length) {
        // Pool exhausted mid-read, fill remainder with fallback
        size_t remaining = length - bytes_read;
        QRNGStatus status = read_from_urandom(buffer + bytes_read, remaining);
        if (status != QRNGStatus::OK) {
            return status;
        }

        pool_exhausted_ = true;
    }

    pool_bytes_read_ += bytes_read;

    return QRNGStatus::OK;
}

QRNGStatus IBMQuantumQRNG::read_from_urandom(uint8_t* buffer, size_t length) {
    if (urandom_fd_ < 0) {
        return QRNGStatus::NOT_CONNECTED;
    }

    ssize_t result = read(urandom_fd_, buffer, length);
    if (result < 0 || static_cast<size_t>(result) != length) {
        return QRNGStatus::IO_ERROR;
    }

    return QRNGStatus::OK;
}

QRNGStatus IBMQuantumQRNG::open_pool_file() {
    // Open pool file
    pool_file_.open(config_.pool_file_path, std::ios::binary | std::ios::in);

    if (!pool_file_.is_open()) {
        std::cerr << "Error: Could not open entropy pool file: "
                  << config_.pool_file_path << "\n";
        return QRNGStatus::NOT_CONNECTED;
    }

    // Get file size
    pool_file_.seekg(0, std::ios::end);
    pool_total_size_ = pool_file_.tellg();
    pool_file_.seekg(0, std::ios::beg);

    if (pool_total_size_ == 0) {
        std::cerr << "Error: Entropy pool file is empty\n";
        pool_file_.close();
        return QRNGStatus::BUFFER_UNDERRUN;
    }

    pool_bytes_read_ = 0;
    pool_exhausted_ = false;

    std::cout << "Loaded IBM Quantum entropy pool: "
              << pool_total_size_ << " bytes available\n";

    return QRNGStatus::OK;
}

void IBMQuantumQRNG::log_source(const std::string& source) {
    if (config_.log_entropy_source) {
        std::cout << "[Entropy Source] " << source << "\n";
    }
}

void IBMQuantumQRNG::update_stats(size_t bytes_read, bool from_quantum) {
    std::lock_guard<std::mutex> lock(stats_mutex_);

    stats_.bytes_generated += bytes_read;

    // Calculate entropy rate (simplified)
    static auto last_time = std::chrono::steady_clock::now();
    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
        now - last_time
    ).count();

    if (elapsed > 0) {
        stats_.entropy_rate_bps = (bytes_read * 1000000.0) / elapsed;
    }

    last_time = now;
}

} // namespace qrng
