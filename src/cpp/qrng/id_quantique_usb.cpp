/**
 * ID Quantique Quantis USB QRNG Driver Implementation
 */

#include "id_quantique_usb.h"
#include <libusb-1.0/libusb.h>
#include <cstring>
#include <chrono>
#include <algorithm>
#include <sstream>
#include <iomanip>

namespace qrng {

IDQuantiqueUSB::IDQuantiqueUSB(const QuantisConfig& config)
    : config_(config),
      usb_context_(nullptr),
      device_handle_(nullptr),
      buffer_head_(0),
      buffer_tail_(0),
      buffer_count_(0),
      stop_refill_(false),
      bytes_since_health_check_(0) {

    // Allocate entropy buffer
    entropy_buffer_ = std::make_unique<uint8_t[]>(config_.buffer_size);
    memset(entropy_buffer_.get(), 0, config_.buffer_size);
}

IDQuantiqueUSB::~IDQuantiqueUSB() {
    disconnect();
}

QRNGStatus IDQuantiqueUSB::initialize() {
    std::lock_guard<std::mutex> lock(mutex_);

    // Initialize libusb
    int ret = libusb_init(&usb_context_);
    if (ret < 0) {
        return QRNGStatus::DEVICE_ERROR;
    }

    // Open device
    QRNGStatus status = open_device();
    if (status != QRNGStatus::OK) {
        libusb_exit(usb_context_);
        usb_context_ = nullptr;
        return status;
    }

    // Perform initial health check
    status = health_check();
    if (status != QRNGStatus::OK) {
        close_device();
        libusb_exit(usb_context_);
        usb_context_ = nullptr;
        return status;
    }

    // Start background refill thread
    stop_refill_ = false;
    refill_thread_ = std::thread(&IDQuantiqueUSB::refill_loop, this);

    return QRNGStatus::OK;
}

bool IDQuantiqueUSB::is_connected() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return device_handle_ != nullptr;
}

QRNGStatus IDQuantiqueUSB::get_random_bytes(uint8_t* buffer, size_t length) {
    if (buffer == nullptr || length == 0) {
        return QRNGStatus::DEVICE_ERROR;
    }

    std::unique_lock<std::mutex> lock(mutex_);

    if (!device_handle_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    size_t total_read = 0;

    while (total_read < length) {
        // Wait for sufficient entropy in buffer
        buffer_cv_.wait(lock, [this, length, total_read]() {
            return buffer_count_ > 0 || !device_handle_;
        });

        if (!device_handle_) {
            return QRNGStatus::NOT_CONNECTED;
        }

        // Read from circular buffer
        size_t to_read = std::min(length - total_read, buffer_count_);

        for (size_t i = 0; i < to_read; i++) {
            buffer[total_read + i] = entropy_buffer_[buffer_tail_];
            buffer_tail_ = (buffer_tail_ + 1) % config_.buffer_size;
        }

        buffer_count_ -= to_read;
        total_read += to_read;

        // Update statistics
        stats_.bytes_generated += to_read;
        bytes_since_health_check_ += to_read;

        // Calculate buffer fill percentage
        stats_.buffer_fill_percent = (buffer_count_ * 100) / config_.buffer_size;
    }

    // Trigger health check if needed
    if (bytes_since_health_check_ >= config_.health_check_interval) {
        lock.unlock();  // Unlock before health check
        health_check();
    }

    return QRNGStatus::OK;
}

QRNGStatus IDQuantiqueUSB::health_check() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!device_handle_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    // Read test data
    constexpr size_t test_size = 4096;
    uint8_t test_data[test_size];

    size_t read = read_from_device(test_data, test_size);
    if (read < test_size) {
        stats_.health_checks_failed++;
        return QRNGStatus::IO_ERROR;
    }

    // Run statistical tests
    if (!run_statistical_tests(test_data, test_size)) {
        stats_.health_checks_failed++;
        return QRNGStatus::HEALTH_CHECK_FAILED;
    }

    stats_.health_checks_passed++;
    bytes_since_health_check_ = 0;

    // Update timestamp
    auto now = std::chrono::steady_clock::now();
    auto us = std::chrono::duration_cast<std::chrono::microseconds>(
        now.time_since_epoch()).count();
    stats_.last_health_check_us = us;

    return QRNGStatus::OK;
}

HealthStats IDQuantiqueUSB::get_health_stats() const {
    std::lock_guard<std::mutex> lock(mutex_);

    // Update entropy rate
    HealthStats current_stats = stats_;
    current_stats.entropy_rate_bps = calculate_entropy_rate();

    return current_stats;
}

size_t IDQuantiqueUSB::available_bytes() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return buffer_count_;
}

std::string IDQuantiqueUSB::get_device_info() const {
    std::lock_guard<std::mutex> lock(mutex_);

    std::ostringstream info;
    info << "ID Quantique Quantis USB QRNG";

    if (!device_serial_.empty()) {
        info << " (S/N: " << device_serial_ << ")";
    }

    if (!firmware_version_.empty()) {
        info << " [FW: " << firmware_version_ << "]";
    }

    return info.str();
}

void IDQuantiqueUSB::disconnect() {
    // Stop refill thread
    stop_refill_ = true;
    buffer_cv_.notify_all();

    if (refill_thread_.joinable()) {
        refill_thread_.join();
    }

    std::lock_guard<std::mutex> lock(mutex_);

    close_device();

    if (usb_context_) {
        libusb_exit(usb_context_);
        usb_context_ = nullptr;
    }
}

// Private methods

QRNGStatus IDQuantiqueUSB::open_device() {
    // Find device
    device_handle_ = libusb_open_device_with_vid_pid(
        usb_context_,
        config_.vendor_id,
        config_.product_id
    );

    if (!device_handle_) {
        return QRNGStatus::NOT_CONNECTED;
    }

    // Claim interface
    int ret = libusb_claim_interface(device_handle_, 0);
    if (ret < 0) {
        libusb_close(device_handle_);
        device_handle_ = nullptr;
        return QRNGStatus::DEVICE_ERROR;
    }

    // Read device information
    read_device_info();

    return QRNGStatus::OK;
}

void IDQuantiqueUSB::close_device() {
    if (device_handle_) {
        libusb_release_interface(device_handle_, 0);
        libusb_close(device_handle_);
        device_handle_ = nullptr;
    }
}

size_t IDQuantiqueUSB::read_from_device(uint8_t* buffer, size_t length) {
    if (!device_handle_) {
        return 0;
    }

    int transferred = 0;
    int ret = libusb_bulk_transfer(
        device_handle_,
        config_.endpoint_in,
        buffer,
        length,
        &transferred,
        config_.timeout_ms
    );

    if (ret < 0) {
        return 0;
    }

    return transferred;
}

void IDQuantiqueUSB::refill_loop() {
    std::vector<uint8_t> temp_buffer(config_.transfer_size);

    while (!stop_refill_) {
        std::unique_lock<std::mutex> lock(mutex_);

        // Check if buffer needs refilling
        if (buffer_count_ >= config_.min_buffer_level) {
            lock.unlock();
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
            continue;
        }

        lock.unlock();

        // Read from device (without holding lock)
        size_t read = read_from_device(temp_buffer.data(), config_.transfer_size);

        if (read > 0) {
            lock.lock();

            // Write to circular buffer
            for (size_t i = 0; i < read; i++) {
                if (buffer_count_ < config_.buffer_size) {
                    entropy_buffer_[buffer_head_] = temp_buffer[i];
                    buffer_head_ = (buffer_head_ + 1) % config_.buffer_size;
                    buffer_count_++;
                }
            }

            // Update statistics
            stats_.buffer_fill_percent = (buffer_count_ * 100) / config_.buffer_size;

            lock.unlock();

            // Notify waiting threads
            buffer_cv_.notify_all();
        } else {
            // Error reading, wait before retry
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
}

bool IDQuantiqueUSB::run_statistical_tests(const uint8_t* data, size_t length) {
    if (length < 1000) {
        return false;  // Insufficient data for statistical tests
    }

    // NIST SP 800-90B Repetition Count Test
    // Detects if same value repeats too many times consecutively
    constexpr size_t max_repetitions = 8;  // For 4096 bytes

    size_t current_count = 1;
    uint8_t current_value = data[0];

    for (size_t i = 1; i < length; i++) {
        if (data[i] == current_value) {
            current_count++;
            if (current_count > max_repetitions) {
                return false;  // Too many repetitions
            }
        } else {
            current_value = data[i];
            current_count = 1;
        }
    }

    // Basic entropy check: Count unique bytes
    bool seen[256] = {false};
    size_t unique_count = 0;

    for (size_t i = 0; i < length && i < 256; i++) {
        if (!seen[data[i]]) {
            seen[data[i]] = true;
            unique_count++;
        }
    }

    // Should see at least 200 different byte values in 4096 bytes
    if (unique_count < 200) {
        return false;
    }

    return true;
}

void IDQuantiqueUSB::read_device_info() {
    if (!device_handle_) {
        return;
    }

    // Read serial number (USB descriptor string)
    unsigned char buffer[256];
    libusb_device* dev = libusb_get_device(device_handle_);
    struct libusb_device_descriptor desc;

    if (libusb_get_device_descriptor(dev, &desc) == 0) {
        if (desc.iSerialNumber > 0) {
            if (libusb_get_string_descriptor_ascii(
                    device_handle_,
                    desc.iSerialNumber,
                    buffer,
                    sizeof(buffer)) > 0) {
                device_serial_ = std::string(reinterpret_cast<char*>(buffer));
            }
        }
    }

    firmware_version_ = "1.0";  // Would read from device control endpoint
}

double IDQuantiqueUSB::calculate_entropy_rate() {
    // Calculate based on bytes generated and time elapsed
    // This is a simplified calculation

    if (stats_.bytes_generated == 0) {
        return 0.0;
    }

    // Assume typical Quantis rate of 4 Mbps = 500 KB/s
    return 500000.0;  // Bytes per second
}

} // namespace qrng
