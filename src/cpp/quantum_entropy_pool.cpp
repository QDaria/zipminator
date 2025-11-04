#include "quantum_entropy_pool.h"
#include <openssl/evp.h>
#include <openssl/hmac.h>
#include <openssl/rand.h>
#include <openssl/kdf.h>
#include <fstream>
#include <iostream>
#include <cstring>
#include <cmath>
#include <algorithm>
#include <numeric>
#include <sys/stat.h>
#include <unistd.h>
#include <fcntl.h>

namespace qdaria {
namespace quantum {

// QEP file format constants
constexpr uint32_t QEP_MAGIC = 0x51455031;  // "QEP1"
constexpr uint8_t QEP_VERSION = 0x01;
constexpr size_t QEP_HEADER_SIZE = 202;
constexpr size_t AES_256_KEY_SIZE = 32;
constexpr size_t GCM_NONCE_SIZE = 12;
constexpr size_t GCM_TAG_SIZE = 16;
constexpr size_t HMAC_TAG_SIZE = 32;

/**
 * @brief QEP file header structure (202 bytes)
 */
struct __attribute__((packed)) QEPHeader {
    uint32_t magic;              // "QEP1"
    uint8_t version;             // 0x01
    uint8_t flags;               // Feature flags
    uint16_t reserved;           // Reserved
    uint64_t timestamp;          // Unix epoch
    char entropy_source[16];     // "IBM Quantum"
    char backend_name[32];       // e.g., "ibm_sherbrooke"
    char job_id[64];             // IBM job UUID
    uint32_t num_shots;          // Quantum shots
    uint8_t num_qubits;          // Qubits per shot
    uint8_t bits_per_shot;       // Bits per shot
    uint32_t total_bytes;        // Total entropy bytes
    uint32_t consumed_bytes;     // Consumed bytes
    uint8_t gcm_nonce[GCM_NONCE_SIZE];   // AES-GCM nonce
    uint8_t hmac_tag[HMAC_TAG_SIZE];     // HMAC-SHA256 tag
    uint8_t auth_tag[GCM_TAG_SIZE];      // AES-GCM auth tag
};

static_assert(sizeof(QEPHeader) == QEP_HEADER_SIZE, "QEPHeader size mismatch");

/**
 * @brief PIMPL implementation class
 */
class EntropyPoolImpl {
public:
    std::string file_path_;
    QEPHeader header_;
    std::vector<uint8_t> decrypted_entropy_;
    uint8_t encryption_key_[AES_256_KEY_SIZE];
    uint8_t hmac_key_[AES_256_KEY_SIZE];
    QuantumEntropyPool::RefillCallback refill_callback_;
    size_t refill_threshold_;
    bool audit_logging_enabled_;
    std::string audit_log_path_;

    EntropyPoolImpl() : refill_threshold_(10240), audit_logging_enabled_(false) {
        std::memset(&header_, 0, sizeof(header_));
        std::memset(encryption_key_, 0, sizeof(encryption_key_));
        std::memset(hmac_key_, 0, sizeof(hmac_key_));
    }

    ~EntropyPoolImpl() {
        // Securely wipe keys
        OPENSSL_cleanse(encryption_key_, sizeof(encryption_key_));
        OPENSSL_cleanse(hmac_key_, sizeof(hmac_key_));
        OPENSSL_cleanse(decrypted_entropy_.data(), decrypted_entropy_.size());
    }

    void log_audit_event(const std::string& event) {
        if (!audit_logging_enabled_ || audit_log_path_.empty()) {
            return;
        }

        auto now = std::chrono::system_clock::now();
        auto time_t_now = std::chrono::system_clock::to_time_t(now);
        std::ofstream log(audit_log_path_, std::ios::app);
        if (log.is_open()) {
            log << std::put_time(std::localtime(&time_t_now), "%Y-%m-%dT%H:%M:%S")
                << " [INFO] " << event << "\n";
        }
    }
};

/**
 * @brief Derive encryption and HMAC keys from master key
 */
static bool derive_keys(const uint8_t* master_key, uint8_t* enc_key, uint8_t* hmac_key) {
    // Use HKDF-Expand for key derivation
    EVP_PKEY_CTX* pctx = EVP_PKEY_CTX_new_id(EVP_PKEY_HKDF, nullptr);
    if (!pctx) return false;

    bool success = false;
    do {
        if (EVP_PKEY_derive_init(pctx) <= 0) break;
        if (EVP_PKEY_CTX_set_hkdf_md(pctx, EVP_sha256()) <= 0) break;
        if (EVP_PKEY_CTX_set1_hkdf_key(pctx, master_key, AES_256_KEY_SIZE) <= 0) break;

        // Derive encryption key
        const char* enc_info = "aes-gcm";
        if (EVP_PKEY_CTX_set1_hkdf_info(pctx, (const uint8_t*)enc_info, strlen(enc_info)) <= 0) break;
        size_t enc_key_len = AES_256_KEY_SIZE;
        if (EVP_PKEY_derive(pctx, enc_key, &enc_key_len) <= 0) break;

        // Derive HMAC key
        const char* hmac_info = "hmac-sha256";
        if (EVP_PKEY_CTX_set1_hkdf_info(pctx, (const uint8_t*)hmac_info, strlen(hmac_info)) <= 0) break;
        size_t hmac_key_len = AES_256_KEY_SIZE;
        if (EVP_PKEY_derive(pctx, hmac_key, &hmac_key_len) <= 0) break;

        success = true;
    } while (false);

    EVP_PKEY_CTX_free(pctx);
    return success;
}

/**
 * @brief Load master key from environment or file
 */
static bool load_master_key(uint8_t* master_key) {
    // Try environment variable first
    const char* env_key = std::getenv("QUANTUM_ENTROPY_KEY");
    if (env_key) {
        // Decode base64
        EVP_ENCODE_CTX* ctx = EVP_ENCODE_CTX_new();
        if (!ctx) return false;

        EVP_DecodeInit(ctx);
        int out_len1 = 0, out_len2 = 0;
        bool success = (EVP_DecodeUpdate(ctx, master_key, &out_len1,
                                         (const uint8_t*)env_key, strlen(env_key)) >= 0 &&
                       EVP_DecodeFinal(ctx, master_key + out_len1, &out_len2) >= 0 &&
                       (out_len1 + out_len2) == AES_256_KEY_SIZE);

        EVP_ENCODE_CTX_free(ctx);
        return success;
    }

    // Try key file
    std::ifstream key_file("/etc/qdaria/quantum_entropy.key", std::ios::binary);
    if (key_file.is_open()) {
        key_file.read(reinterpret_cast<char*>(master_key), AES_256_KEY_SIZE);
        return key_file.gcount() == AES_256_KEY_SIZE;
    }

    return false;
}

/**
 * @brief Encrypt entropy with AES-256-GCM
 */
static bool encrypt_entropy(const std::vector<uint8_t>& plaintext,
                            const uint8_t* key,
                            const uint8_t* nonce,
                            std::vector<uint8_t>& ciphertext,
                            uint8_t* auth_tag) {
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) return false;

    bool success = false;
    ciphertext.resize(plaintext.size());
    int len = 0;

    do {
        if (EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr) != 1) break;
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, GCM_NONCE_SIZE, nullptr) != 1) break;
        if (EVP_EncryptInit_ex(ctx, nullptr, nullptr, key, nonce) != 1) break;
        if (EVP_EncryptUpdate(ctx, ciphertext.data(), &len, plaintext.data(), plaintext.size()) != 1) break;

        int final_len = 0;
        if (EVP_EncryptFinal_ex(ctx, ciphertext.data() + len, &final_len) != 1) break;
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, GCM_TAG_SIZE, auth_tag) != 1) break;

        success = true;
    } while (false);

    EVP_CIPHER_CTX_free(ctx);
    return success;
}

/**
 * @brief Decrypt entropy with AES-256-GCM
 */
static bool decrypt_entropy(const std::vector<uint8_t>& ciphertext,
                           const uint8_t* key,
                           const uint8_t* nonce,
                           const uint8_t* auth_tag,
                           std::vector<uint8_t>& plaintext) {
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) return false;

    bool success = false;
    plaintext.resize(ciphertext.size());
    int len = 0;

    do {
        if (EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr) != 1) break;
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, GCM_NONCE_SIZE, nullptr) != 1) break;
        if (EVP_DecryptInit_ex(ctx, nullptr, nullptr, key, nonce) != 1) break;
        if (EVP_DecryptUpdate(ctx, plaintext.data(), &len, ciphertext.data(), ciphertext.size()) != 1) break;
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, GCM_TAG_SIZE, (void*)auth_tag) != 1) break;

        int final_len = 0;
        if (EVP_DecryptFinal_ex(ctx, plaintext.data() + len, &final_len) != 1) break;

        success = true;
    } while (false);

    EVP_CIPHER_CTX_free(ctx);
    return success;
}

/**
 * @brief Compute HMAC-SHA256
 */
static bool compute_hmac(const uint8_t* data, size_t data_len,
                        const uint8_t* key, uint8_t* hmac_out) {
    unsigned int hmac_len = 0;
    return HMAC(EVP_sha256(), key, AES_256_KEY_SIZE, data, data_len, hmac_out, &hmac_len) != nullptr &&
           hmac_len == HMAC_TAG_SIZE;
}

// QuantumEntropyPool implementation

QuantumEntropyPool::QuantumEntropyPool() : impl_(std::make_unique<EntropyPoolImpl>()) {}

QuantumEntropyPool::~QuantumEntropyPool() = default;

QuantumEntropyPool::QuantumEntropyPool(QuantumEntropyPool&&) noexcept = default;

QuantumEntropyPool& QuantumEntropyPool::operator=(QuantumEntropyPool&&) noexcept = default;

std::unique_ptr<QuantumEntropyPool> QuantumEntropyPool::create(
    const std::string& file_path,
    const std::vector<uint8_t>& entropy_bytes,
    const std::string& backend_name,
    const std::string& job_id,
    uint32_t num_shots,
    uint8_t num_qubits,
    bool validate_entropy)
{
    auto pool = std::unique_ptr<QuantumEntropyPool>(new QuantumEntropyPool());

    // Validate entropy if requested
    if (validate_entropy && !entropy_validation::validate_entropy_quality(entropy_bytes)) {
        throw EntropyPoolException("Entropy failed statistical validation");
    }

    // Load master key and derive keys
    uint8_t master_key[AES_256_KEY_SIZE];
    if (!load_master_key(master_key)) {
        throw EntropyPoolException("Failed to load master encryption key");
    }

    if (!derive_keys(master_key, pool->impl_->encryption_key_, pool->impl_->hmac_key_)) {
        OPENSSL_cleanse(master_key, sizeof(master_key));
        throw EntropyPoolException("Failed to derive encryption keys");
    }
    OPENSSL_cleanse(master_key, sizeof(master_key));

    // Initialize header
    QEPHeader& hdr = pool->impl_->header_;
    hdr.magic = QEP_MAGIC;
    hdr.version = QEP_VERSION;
    hdr.flags = 0;
    hdr.reserved = 0;
    hdr.timestamp = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());

    strncpy(hdr.entropy_source, "IBM Quantum", sizeof(hdr.entropy_source) - 1);
    strncpy(hdr.backend_name, backend_name.c_str(), sizeof(hdr.backend_name) - 1);
    strncpy(hdr.job_id, job_id.c_str(), sizeof(hdr.job_id) - 1);

    hdr.num_shots = num_shots;
    hdr.num_qubits = num_qubits;
    hdr.bits_per_shot = num_qubits;
    hdr.total_bytes = entropy_bytes.size();
    hdr.consumed_bytes = 0;

    // Generate random GCM nonce
    if (RAND_bytes(hdr.gcm_nonce, GCM_NONCE_SIZE) != 1) {
        throw EntropyPoolException("Failed to generate GCM nonce");
    }

    // Encrypt entropy
    std::vector<uint8_t> ciphertext;
    if (!encrypt_entropy(entropy_bytes, pool->impl_->encryption_key_,
                        hdr.gcm_nonce, ciphertext, hdr.auth_tag)) {
        throw EntropyPoolException("Failed to encrypt entropy");
    }

    // Compute HMAC over header + ciphertext
    std::vector<uint8_t> hmac_data(QEP_HEADER_SIZE - HMAC_TAG_SIZE - GCM_TAG_SIZE);
    std::memcpy(hmac_data.data(), &hdr, hmac_data.size());
    hmac_data.insert(hmac_data.end(), ciphertext.begin(), ciphertext.end());

    if (!compute_hmac(hmac_data.data(), hmac_data.size(), pool->impl_->hmac_key_, hdr.hmac_tag)) {
        throw EntropyPoolException("Failed to compute HMAC");
    }

    // Write file with secure permissions
    int fd = ::open(file_path.c_str(), O_CREAT | O_WRONLY | O_TRUNC, 0600);
    if (fd < 0) {
        throw EntropyPoolException("Failed to create entropy pool file");
    }

    bool write_success = (::write(fd, &hdr, sizeof(hdr)) == sizeof(hdr) &&
                         ::write(fd, ciphertext.data(), ciphertext.size()) == (ssize_t)ciphertext.size() &&
                         ::fsync(fd) == 0);
    ::close(fd);

    if (!write_success) {
        ::unlink(file_path.c_str());
        throw EntropyPoolException("Failed to write entropy pool file");
    }

    pool->impl_->file_path_ = file_path;
    pool->impl_->decrypted_entropy_ = entropy_bytes;
    pool->impl_->log_audit_event("Pool created: " + std::to_string(entropy_bytes.size()) +
                                 " bytes from " + backend_name);

    return pool;
}

std::unique_ptr<QuantumEntropyPool> QuantumEntropyPool::open(const std::string& file_path) {
    auto pool = std::unique_ptr<QuantumEntropyPool>(new QuantumEntropyPool());

    // Load master key
    uint8_t master_key[AES_256_KEY_SIZE];
    if (!load_master_key(master_key)) {
        throw EntropyPoolException("Failed to load master encryption key");
    }

    if (!derive_keys(master_key, pool->impl_->encryption_key_, pool->impl_->hmac_key_)) {
        OPENSSL_cleanse(master_key, sizeof(master_key));
        throw EntropyPoolException("Failed to derive encryption keys");
    }
    OPENSSL_cleanse(master_key, sizeof(master_key));

    // Read file
    std::ifstream file(file_path, std::ios::binary);
    if (!file.is_open()) {
        throw EntropyPoolException("Failed to open entropy pool file");
    }

    QEPHeader& hdr = pool->impl_->header_;
    file.read(reinterpret_cast<char*>(&hdr), sizeof(hdr));
    if (file.gcount() != sizeof(hdr)) {
        throw EntropyPoolException("Failed to read entropy pool header");
    }

    // Validate header
    if (hdr.magic != QEP_MAGIC) {
        throw EntropyPoolException("Invalid entropy pool magic bytes");
    }
    if (hdr.version != QEP_VERSION) {
        throw EntropyPoolException("Unsupported entropy pool version");
    }

    // Read ciphertext
    std::vector<uint8_t> ciphertext(hdr.total_bytes);
    file.read(reinterpret_cast<char*>(ciphertext.data()), ciphertext.size());
    if (file.gcount() != (ssize_t)ciphertext.size()) {
        throw EntropyPoolException("Failed to read encrypted entropy");
    }

    // Verify HMAC
    std::vector<uint8_t> hmac_data(QEP_HEADER_SIZE - HMAC_TAG_SIZE - GCM_TAG_SIZE);
    std::memcpy(hmac_data.data(), &hdr, hmac_data.size());
    hmac_data.insert(hmac_data.end(), ciphertext.begin(), ciphertext.end());

    uint8_t computed_hmac[HMAC_TAG_SIZE];
    if (!compute_hmac(hmac_data.data(), hmac_data.size(), pool->impl_->hmac_key_, computed_hmac)) {
        throw EntropyPoolException("Failed to compute HMAC");
    }
    if (CRYPTO_memcmp(computed_hmac, hdr.hmac_tag, HMAC_TAG_SIZE) != 0) {
        throw EntropyPoolException("HMAC verification failed - file may be corrupted or tampered");
    }

    // Decrypt entropy
    if (!decrypt_entropy(ciphertext, pool->impl_->encryption_key_, hdr.gcm_nonce,
                        hdr.auth_tag, pool->impl_->decrypted_entropy_)) {
        throw EntropyPoolException("Failed to decrypt entropy - authentication failed");
    }

    pool->impl_->file_path_ = file_path;
    pool->impl_->log_audit_event("Pool opened: " + std::to_string(hdr.total_bytes - hdr.consumed_bytes) +
                                 " bytes available");

    return pool;
}

std::vector<uint8_t> QuantumEntropyPool::get_bytes(size_t num_bytes) {
    std::lock_guard<std::mutex> lock(mutex_);

    size_t available = impl_->header_.total_bytes - impl_->header_.consumed_bytes;
    if (num_bytes > available) {
        throw EntropyPoolException("Insufficient entropy available");
    }

    std::vector<uint8_t> result(impl_->decrypted_entropy_.begin() + impl_->header_.consumed_bytes,
                               impl_->decrypted_entropy_.begin() + impl_->header_.consumed_bytes + num_bytes);

    // Securely wipe consumed entropy (3-pass)
    uint8_t* consumed_ptr = impl_->decrypted_entropy_.data() + impl_->header_.consumed_bytes;
    for (int pass = 0; pass < 3; pass++) {
        std::memset(consumed_ptr, (pass == 0) ? 0x00 : 0xFF, num_bytes);
    }

    impl_->header_.consumed_bytes += num_bytes;

    // Update file
    int fd = ::open(impl_->file_path_.c_str(), O_WRONLY);
    if (fd >= 0) {
        ::lseek(fd, offsetof(QEPHeader, consumed_bytes), SEEK_SET);
        ::write(fd, &impl_->header_.consumed_bytes, sizeof(impl_->header_.consumed_bytes));
        ::fsync(fd);
        ::close(fd);
    }

    impl_->log_audit_event("Retrieved " + std::to_string(num_bytes) + " bytes (consumed: " +
                          std::to_string(impl_->header_.consumed_bytes) + "/" +
                          std::to_string(impl_->header_.total_bytes) + ")");

    // Check refill callback
    if (impl_->refill_callback_ && available - num_bytes < impl_->refill_threshold_) {
        impl_->refill_callback_(available - num_bytes);
    }

    return result;
}

bool QuantumEntropyPool::get_bytes_into(uint8_t* buffer, size_t num_bytes) {
    try {
        auto bytes = get_bytes(num_bytes);
        std::memcpy(buffer, bytes.data(), num_bytes);
        return true;
    } catch (const EntropyPoolException&) {
        return false;
    }
}

size_t QuantumEntropyPool::available_bytes() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return impl_->header_.total_bytes - impl_->header_.consumed_bytes;
}

size_t QuantumEntropyPool::total_bytes() const {
    return impl_->header_.total_bytes;
}

size_t QuantumEntropyPool::consumed_bytes() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return impl_->header_.consumed_bytes;
}

bool QuantumEntropyPool::is_low(size_t threshold_bytes) const {
    return available_bytes() < threshold_bytes;
}

QuantumEntropyPool::Metadata QuantumEntropyPool::get_metadata() const {
    std::lock_guard<std::mutex> lock(mutex_);
    const QEPHeader& hdr = impl_->header_;

    Metadata meta;
    meta.entropy_source = std::string(hdr.entropy_source);
    meta.backend_name = std::string(hdr.backend_name);
    meta.job_id = std::string(hdr.job_id);
    meta.num_shots = hdr.num_shots;
    meta.num_qubits = hdr.num_qubits;
    meta.bits_per_shot = hdr.bits_per_shot;
    meta.total_bytes = hdr.total_bytes;
    meta.consumed_bytes = hdr.consumed_bytes;
    meta.timestamp = std::chrono::system_clock::from_time_t(hdr.timestamp);

    return meta;
}

void QuantumEntropyPool::set_refill_callback(RefillCallback callback, size_t threshold_bytes) {
    std::lock_guard<std::mutex> lock(mutex_);
    impl_->refill_callback_ = callback;
    impl_->refill_threshold_ = threshold_bytes;
}

void QuantumEntropyPool::set_audit_logging(bool enabled, const std::string& log_path) {
    std::lock_guard<std::mutex> lock(mutex_);
    impl_->audit_logging_enabled_ = enabled;
    impl_->audit_log_path_ = log_path.empty() ? "/var/log/qdaria/entropy_pool.log" : log_path;
}

std::string QuantumEntropyPool::get_file_path() const {
    return impl_->file_path_;
}

bool QuantumEntropyPool::validate_encryption_key() {
    uint8_t master_key[AES_256_KEY_SIZE];
    bool valid = load_master_key(master_key);
    OPENSSL_cleanse(master_key, sizeof(master_key));
    return valid;
}

bool QuantumEntropyPool::generate_encryption_key(const std::string& key_path) {
    uint8_t key[AES_256_KEY_SIZE];
    if (RAND_bytes(key, sizeof(key)) != 1) {
        return false;
    }

    int fd = ::open(key_path.c_str(), O_CREAT | O_WRONLY | O_TRUNC, 0400);
    if (fd < 0) {
        OPENSSL_cleanse(key, sizeof(key));
        return false;
    }

    bool success = (::write(fd, key, sizeof(key)) == sizeof(key) &&
                   ::fsync(fd) == 0);
    ::close(fd);

    OPENSSL_cleanse(key, sizeof(key));
    return success;
}

void QuantumEntropyPool::secure_delete() {
    std::lock_guard<std::mutex> lock(mutex_);

    // 3-pass secure deletion of file
    int fd = ::open(impl_->file_path_.c_str(), O_WRONLY);
    if (fd >= 0) {
        struct stat st;
        if (::fstat(fd, &st) == 0) {
            std::vector<uint8_t> zeros(st.st_size, 0x00);
            std::vector<uint8_t> ones(st.st_size, 0xFF);

            for (int pass = 0; pass < 3; pass++) {
                ::lseek(fd, 0, SEEK_SET);
                ::write(fd, (pass % 2 == 0) ? zeros.data() : ones.data(), st.st_size);
                ::fsync(fd);
            }
        }
        ::close(fd);
    }

    ::unlink(impl_->file_path_.c_str());
    impl_->log_audit_event("Pool securely deleted");
}

// Entropy validation functions (simplified implementations)

namespace entropy_validation {

double estimate_min_entropy(const std::vector<uint8_t>& data) {
    // Most Common Value (MCV) estimator
    std::array<size_t, 256> freq = {0};
    for (uint8_t byte : data) {
        freq[byte]++;
    }

    size_t max_freq = *std::max_element(freq.begin(), freq.end());
    double p_max = static_cast<double>(max_freq) / data.size();
    return -std::log2(p_max);
}

double chi_square_test(const std::vector<uint8_t>& data) {
    std::array<size_t, 256> observed = {0};
    for (uint8_t byte : data) {
        observed[byte]++;
    }

    double expected = static_cast<double>(data.size()) / 256.0;
    double chi_square = 0.0;

    for (size_t count : observed) {
        double diff = count - expected;
        chi_square += (diff * diff) / expected;
    }

    // Return p-value (simplified - would use chi-square distribution in production)
    return (chi_square < 300.0) ? 0.05 : 0.001;
}

double autocorrelation_test(const std::vector<uint8_t>& data) {
    if (data.size() < 2) return 0.0;

    double mean = std::accumulate(data.begin(), data.end(), 0.0) / data.size();
    double variance = 0.0;
    double covariance = 0.0;

    for (size_t i = 0; i < data.size(); i++) {
        double diff = data[i] - mean;
        variance += diff * diff;
        if (i > 0) {
            covariance += diff * (data[i-1] - mean);
        }
    }

    return (variance > 0) ? (covariance / variance) : 0.0;
}

double runs_test(const std::vector<uint8_t>& data) {
    // Count runs of consecutive identical bits
    size_t runs = 0;
    uint8_t prev_bit = data[0] & 1;

    for (uint8_t byte : data) {
        for (int bit = 0; bit < 8; bit++) {
            uint8_t current_bit = (byte >> bit) & 1;
            if (current_bit != prev_bit) {
                runs++;
                prev_bit = current_bit;
            }
        }
    }

    size_t total_bits = data.size() * 8;
    double expected_runs = static_cast<double>(total_bits) / 2.0;
    double diff = std::abs(runs - expected_runs);

    // Return p-value (simplified)
    return (diff < expected_runs * 0.1) ? 0.05 : 0.001;
}

bool validate_entropy_quality(const std::vector<uint8_t>& data) {
    if (data.size() < 1000) {
        return false;  // Need at least 1KB for statistical tests
    }

    double min_entropy = estimate_min_entropy(data);
    double chi_square_p = chi_square_test(data);
    double autocorr = autocorrelation_test(data);
    double runs_p = runs_test(data);

    return (min_entropy >= 7.0 &&
            chi_square_p > 0.01 &&
            std::abs(autocorr) < 0.1 &&
            runs_p > 0.01);
}

} // namespace entropy_validation

} // namespace quantum
} // namespace qdaria
