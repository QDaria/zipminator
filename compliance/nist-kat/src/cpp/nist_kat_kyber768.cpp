/**
 * NIST Known Answer Test (KAT) Suite for CRYSTALS-Kyber-768
 *
 * Validates implementation against official NIST FIPS 203 test vectors
 * Required for certification and production deployment
 */

#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <vector>
#include <string>
#include <cassert>
#include "deterministic_rng.h"
#include "../../src/cpp/kyber768.h"

using namespace kyber768;

namespace kat {

/**
 * NIST KAT test vector structure
 */
struct KATVector {
    std::string test_name;
    std::vector<uint8_t> seed;           // 48 bytes for DRBG
    std::vector<uint8_t> expected_pk;    // Public key
    std::vector<uint8_t> expected_sk;    // Secret key
    std::vector<uint8_t> expected_ct;    // Ciphertext
    std::vector<uint8_t> expected_ss;    // Shared secret
};

/**
 * Convert hex string to bytes
 */
std::vector<uint8_t> hex_to_bytes(const std::string& hex) {
    std::vector<uint8_t> bytes;
    for (size_t i = 0; i < hex.length(); i += 2) {
        std::string byte_str = hex.substr(i, 2);
        uint8_t byte = static_cast<uint8_t>(strtol(byte_str.c_str(), nullptr, 16));
        bytes.push_back(byte);
    }
    return bytes;
}

/**
 * Convert bytes to hex string
 */
std::string bytes_to_hex(const uint8_t* data, size_t len) {
    std::ostringstream oss;
    oss << std::hex << std::setfill('0');
    for (size_t i = 0; i < len; i++) {
        oss << std::setw(2) << static_cast<int>(data[i]);
    }
    return oss.str();
}

/**
 * Compare byte arrays with detailed error reporting
 */
bool compare_bytes(const std::string& name,
                   const uint8_t* actual,
                   const std::vector<uint8_t>& expected,
                   size_t len) {
    if (expected.size() != len) {
        std::cerr << "ERROR: " << name << " length mismatch. Expected "
                  << expected.size() << " bytes, got " << len << std::endl;
        return false;
    }

    for (size_t i = 0; i < len; i++) {
        if (actual[i] != expected[i]) {
            std::cerr << "ERROR: " << name << " mismatch at byte " << i
                      << ". Expected " << std::hex << std::setw(2)
                      << static_cast<int>(expected[i])
                      << ", got " << static_cast<int>(actual[i]) << std::endl;

            // Show context around error
            size_t start = (i > 8) ? i - 8 : 0;
            size_t end = std::min(i + 8, len);

            std::cerr << "Context (bytes " << start << " to " << end << "):" << std::endl;
            std::cerr << "Expected: " << bytes_to_hex(&expected[start], end - start) << std::endl;
            std::cerr << "Actual:   " << bytes_to_hex(&actual[start], end - start) << std::endl;

            return false;
        }
    }
    return true;
}

/**
 * Run a single KAT test vector
 */
bool run_kat_test(const KATVector& test) {
    std::cout << "Testing: " << test.test_name << std::endl;

    // Initialize deterministic RNG with seed
    DeterministicRNG rng;
    rng.seed(test.seed.data());

    // Set global RNG for Kyber operations
    ScopedKATRNG scoped_rng(test.seed.data());

    // Test 1: KeyGen
    std::cout << "  Testing KeyGen..." << std::endl;
    uint8_t pk[KYBER_PUBLICKEYBYTES];
    uint8_t sk[KYBER_SECRETKEYBYTES];

    int result = crypto_kem_keypair(pk, sk);
    if (result != 0) {
        std::cerr << "ERROR: KeyGen failed with code " << result << std::endl;
        return false;
    }

    // Verify public key
    if (!compare_bytes("Public Key", pk, test.expected_pk, KYBER_PUBLICKEYBYTES)) {
        return false;
    }
    std::cout << "  ✓ Public key matches" << std::endl;

    // Verify secret key
    if (!compare_bytes("Secret Key", sk, test.expected_sk, KYBER_SECRETKEYBYTES)) {
        return false;
    }
    std::cout << "  ✓ Secret key matches" << std::endl;

    // Test 2: Encapsulation
    std::cout << "  Testing Encapsulation..." << std::endl;
    uint8_t ct[KYBER_CIPHERTEXTBYTES];
    uint8_t ss1[KYBER_SHAREDSECRETBYTES];

    result = crypto_kem_enc(ct, ss1, pk);
    if (result != 0) {
        std::cerr << "ERROR: Encapsulation failed with code " << result << std::endl;
        return false;
    }

    // Verify ciphertext
    if (!compare_bytes("Ciphertext", ct, test.expected_ct, KYBER_CIPHERTEXTBYTES)) {
        return false;
    }
    std::cout << "  ✓ Ciphertext matches" << std::endl;

    // Verify shared secret
    if (!compare_bytes("Shared Secret (Encaps)", ss1, test.expected_ss, KYBER_SHAREDSECRETBYTES)) {
        return false;
    }
    std::cout << "  ✓ Shared secret matches" << std::endl;

    // Test 3: Decapsulation
    std::cout << "  Testing Decapsulation..." << std::endl;
    uint8_t ss2[KYBER_SHAREDSECRETBYTES];

    result = crypto_kem_dec(ss2, ct, sk);
    if (result != 0) {
        std::cerr << "ERROR: Decapsulation failed with code " << result << std::endl;
        return false;
    }

    // Verify decapsulated shared secret matches
    if (!compare_bytes("Shared Secret (Decaps)", ss2, test.expected_ss, KYBER_SHAREDSECRETBYTES)) {
        return false;
    }
    std::cout << "  ✓ Decapsulation matches" << std::endl;

    // Test 4: Round-trip verification
    if (memcmp(ss1, ss2, KYBER_SHAREDSECRETBYTES) != 0) {
        std::cerr << "ERROR: Round-trip verification failed. Encaps and Decaps produced different secrets" << std::endl;
        return false;
    }
    std::cout << "  ✓ Round-trip verified" << std::endl;

    std::cout << "✓ Test PASSED: " << test.test_name << std::endl << std::endl;
    return true;
}

/**
 * Load KAT vectors from NIST format file
 */
std::vector<KATVector> load_kat_vectors(const std::string& filename) {
    std::vector<KATVector> vectors;
    std::ifstream file(filename);

    if (!file.is_open()) {
        std::cerr << "WARNING: Could not open " << filename << std::endl;
        std::cerr << "Please download NIST test vectors from:" << std::endl;
        std::cerr << "  https://github.com/post-quantum-cryptography/KAT" << std::endl;
        return vectors;
    }

    KATVector current;
    std::string line;
    int count = 0;

    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') continue;

        size_t eq_pos = line.find('=');
        if (eq_pos == std::string::npos) continue;

        std::string key = line.substr(0, eq_pos);
        std::string value = line.substr(eq_pos + 2);

        // Trim whitespace
        key.erase(0, key.find_first_not_of(" \t"));
        key.erase(key.find_last_not_of(" \t") + 1);
        value.erase(0, value.find_first_not_of(" \t"));
        value.erase(value.find_last_not_of(" \t") + 1);

        if (key == "count") {
            if (!current.seed.empty()) {
                vectors.push_back(current);
            }
            current = KATVector();
            current.test_name = "KAT_Vector_" + value;
            count = std::stoi(value);
        } else if (key == "seed") {
            current.seed = hex_to_bytes(value);
        } else if (key == "pk") {
            current.expected_pk = hex_to_bytes(value);
        } else if (key == "sk") {
            current.expected_sk = hex_to_bytes(value);
        } else if (key == "ct") {
            current.expected_ct = hex_to_bytes(value);
        } else if (key == "ss") {
            current.expected_ss = hex_to_bytes(value);
        }
    }

    // Add last vector
    if (!current.seed.empty()) {
        vectors.push_back(current);
    }

    file.close();
    return vectors;
}

/**
 * Generate sample KAT vectors for testing
 */
std::vector<KATVector> generate_sample_vectors() {
    std::vector<KATVector> vectors;

    // Create a simple test vector with known seed
    KATVector test1;
    test1.test_name = "Sample_Test_1";

    // Initialize with deterministic seed
    test1.seed.resize(48);
    for (size_t i = 0; i < 48; i++) {
        test1.seed[i] = static_cast<uint8_t>(i);
    }

    // Generate expected values using our implementation
    DeterministicRNG rng;
    rng.seed(test1.seed.data());
    ScopedKATRNG scoped_rng(test1.seed.data());

    test1.expected_pk.resize(KYBER_PUBLICKEYBYTES);
    test1.expected_sk.resize(KYBER_SECRETKEYBYTES);
    crypto_kem_keypair(test1.expected_pk.data(), test1.expected_sk.data());

    test1.expected_ct.resize(KYBER_CIPHERTEXTBYTES);
    test1.expected_ss.resize(KYBER_SHAREDSECRETBYTES);
    crypto_kem_enc(test1.expected_ct.data(), test1.expected_ss.data(), test1.expected_pk.data());

    vectors.push_back(test1);

    return vectors;
}

} // namespace kat

/**
 * Main KAT test runner
 */
int main(int argc, char** argv) {
    using namespace kat;

    std::cout << "==================================================" << std::endl;
    std::cout << "NIST Known Answer Test (KAT) for Kyber-768" << std::endl;
    std::cout << "FIPS 203 (ML-KEM) Compliance Validation" << std::endl;
    std::cout << "==================================================" << std::endl;
    std::cout << std::endl;

    // Load test vectors
    std::vector<KATVector> vectors;
    bool using_official = false;

    if (argc > 1) {
        // Load from file
        std::cout << "Loading test vectors from: " << argv[1] << std::endl;
        vectors = load_kat_vectors(argv[1]);
        if (!vectors.empty()) {
            using_official = true;
            std::cout << "✓ Successfully loaded OFFICIAL NIST test vectors" << std::endl;
        }
    }

    if (vectors.empty()) {
        std::cout << "WARNING: No official vectors found. Using sample test vectors." << std::endl;
        std::cout << "For full NIST compliance, download official vectors:" << std::endl;
        std::cout << "  https://gist.github.com/itzmeanjan/c8f5bc9640d0f0bdd2437dfe364d7710" << std::endl;
        std::cout << "  File: ml_kem_768.kat" << std::endl;
        std::cout << "  Checksum: dcbe58987a95fdbb4823755c4ae42098a94d9d6cdc78829d5424dbbbcb7ce440" << std::endl;
        std::cout << std::endl;
        vectors = generate_sample_vectors();
        std::cout << "⚠️  Using SAMPLE vectors (NOT suitable for certification)" << std::endl;
    }

    std::cout << "Running " << vectors.size() << " test vectors..." << std::endl;
    std::cout << std::endl;

    // Run all tests
    int passed = 0;
    int failed = 0;

    for (const auto& test : vectors) {
        if (run_kat_test(test)) {
            passed++;
        } else {
            failed++;
            std::cerr << "✗ Test FAILED: " << test.test_name << std::endl << std::endl;
        }
    }

    // Summary
    std::cout << "==================================================" << std::endl;
    std::cout << "NIST KAT Test Results" << std::endl;
    std::cout << "==================================================" << std::endl;
    std::cout << "Test Vector Source: " << (using_official ? "OFFICIAL NIST" : "Sample Only") << std::endl;
    std::cout << "Total Tests:  " << (passed + failed) << std::endl;
    std::cout << "Passed:       " << passed << " ✓" << std::endl;
    std::cout << "Failed:       " << failed << (failed > 0 ? " ✗" : "") << std::endl;
    std::cout << "Success Rate: " << std::fixed << std::setprecision(1)
              << (100.0 * passed / (passed + failed)) << "%" << std::endl;
    std::cout << "==================================================" << std::endl;

    if (using_official && failed == 0) {
        std::cout << std::endl;
        std::cout << "✓✓✓ CERTIFICATION READY ✓✓✓" << std::endl;
        std::cout << "All official NIST test vectors passed successfully." << std::endl;
        std::cout << "Implementation meets FIPS 203 KAT requirements." << std::endl;
    } else if (!using_official) {
        std::cout << std::endl;
        std::cout << "⚠️  NOT CERTIFICATION READY" << std::endl;
        std::cout << "Official NIST test vectors required for certification." << std::endl;
    }

    return (failed == 0) ? 0 : 1;
}
