/**
 * NIST Test Vector Integration for ML-KEM-768
 *
 * Parses and integrates official NIST test vectors for FIPS 203 (ML-KEM) validation
 * Supports both .kat format and ACVP JSON format
 *
 * CERTIFICATION CRITICAL: This code is used for FIPS 203 compliance validation
 */

#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <iomanip>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace nist_vectors {

/**
 * Test vector structure matching FIPS 203 ML-KEM-768 format
 */
struct TestVector {
    int count;                      // Test vector number
    std::vector<uint8_t> d;         // Seed d (32 bytes)
    std::vector<uint8_t> z;         // Seed z (32 bytes)
    std::vector<uint8_t> m;         // Message (32 bytes, for encapsulation)
    std::vector<uint8_t> pk;        // Public key (1184 bytes)
    std::vector<uint8_t> sk;        // Secret key (2400 bytes)
    std::vector<uint8_t> ct;        // Ciphertext (1088 bytes)
    std::vector<uint8_t> ss;        // Shared secret (32 bytes)
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
std::string bytes_to_hex(const std::vector<uint8_t>& bytes) {
    std::ostringstream oss;
    oss << std::hex << std::setfill('0');
    for (uint8_t byte : bytes) {
        oss << std::setw(2) << static_cast<int>(byte);
    }
    return oss.str();
}

/**
 * Parse .kat format (official NIST KAT format)
 *
 * Format:
 *   count = 0
 *   d = <hex>
 *   z = <hex>
 *   pk = <hex>
 *   sk = <hex>
 *   m = <hex>
 *   ct = <hex>
 *   ss = <hex>
 */
std::vector<TestVector> parse_kat_file(const std::string& filename) {
    std::vector<TestVector> vectors;
    std::ifstream file(filename);

    if (!file.is_open()) {
        std::cerr << "ERROR: Could not open " << filename << std::endl;
        return vectors;
    }

    TestVector current;
    std::string line;
    bool has_current = false;

    while (std::getline(file, line)) {
        // Skip comments and empty lines
        if (line.empty() || line[0] == '#') continue;

        size_t eq_pos = line.find('=');
        if (eq_pos == std::string::npos) continue;

        std::string key = line.substr(0, eq_pos);
        std::string value = line.substr(eq_pos + 2); // Skip "= "

        // Trim whitespace
        key.erase(0, key.find_first_not_of(" \t"));
        key.erase(key.find_last_not_of(" \t") + 1);
        value.erase(0, value.find_first_not_of(" \t"));
        value.erase(value.find_last_not_of(" \t") + 1);

        if (key == "count") {
            if (has_current) {
                vectors.push_back(current);
            }
            current = TestVector();
            current.count = std::stoi(value);
            has_current = true;
        } else if (key == "d") {
            current.d = hex_to_bytes(value);
        } else if (key == "z") {
            current.z = hex_to_bytes(value);
        } else if (key == "m") {
            current.m = hex_to_bytes(value);
        } else if (key == "pk") {
            current.pk = hex_to_bytes(value);
        } else if (key == "sk") {
            current.sk = hex_to_bytes(value);
        } else if (key == "ct") {
            current.ct = hex_to_bytes(value);
        } else if (key == "ss") {
            current.ss = hex_to_bytes(value);
        }
    }

    // Add last vector
    if (has_current) {
        vectors.push_back(current);
    }

    file.close();
    return vectors;
}

/**
 * Parse ACVP JSON format
 *
 * Format:
 * {
 *   "testGroups": [{
 *     "tests": [{
 *       "tcId": 1,
 *       "d": "<hex>",
 *       "z": "<hex>",
 *       "ek": "<hex>",  // encapsulation key (public key)
 *       "dk": "<hex>",  // decapsulation key (secret key)
 *       "m": "<hex>",   // message (optional)
 *       "c": "<hex>",   // ciphertext (optional)
 *       "ss": "<hex>"   // shared secret (optional)
 *     }]
 *   }]
 * }
 */
std::vector<TestVector> parse_acvp_json(const std::string& filename) {
    std::vector<TestVector> vectors;
    std::ifstream file(filename);

    if (!file.is_open()) {
        std::cerr << "ERROR: Could not open " << filename << std::endl;
        return vectors;
    }

    json j;
    file >> j;
    file.close();

    // Handle different JSON structures
    if (j.contains("testGroups")) {
        for (const auto& group : j["testGroups"]) {
            if (group.contains("tests")) {
                for (const auto& test : group["tests"]) {
                    TestVector vec;
                    vec.count = test.value("tcId", 0);

                    if (test.contains("d")) vec.d = hex_to_bytes(test["d"]);
                    if (test.contains("z")) vec.z = hex_to_bytes(test["z"]);
                    if (test.contains("m")) vec.m = hex_to_bytes(test["m"]);

                    // Handle different key names
                    if (test.contains("ek")) vec.pk = hex_to_bytes(test["ek"]);
                    else if (test.contains("pk")) vec.pk = hex_to_bytes(test["pk"]);

                    if (test.contains("dk")) vec.sk = hex_to_bytes(test["dk"]);
                    else if (test.contains("sk")) vec.sk = hex_to_bytes(test["sk"]);

                    if (test.contains("c")) vec.ct = hex_to_bytes(test["c"]);
                    else if (test.contains("ct")) vec.ct = hex_to_bytes(test["ct"]);

                    if (test.contains("ss")) vec.ss = hex_to_bytes(test["ss"]);
                    else if (test.contains("k")) vec.ss = hex_to_bytes(test["k"]);

                    vectors.push_back(vec);
                }
            }
        }
    }

    return vectors;
}

/**
 * Validate test vector structure
 */
bool validate_vector(const TestVector& vec) {
    bool valid = true;

    // Check seed sizes
    if (!vec.d.empty() && vec.d.size() != 32) {
        std::cerr << "WARNING: Vector " << vec.count << " has invalid d size: "
                  << vec.d.size() << " (expected 32)" << std::endl;
        valid = false;
    }

    if (!vec.z.empty() && vec.z.size() != 32) {
        std::cerr << "WARNING: Vector " << vec.count << " has invalid z size: "
                  << vec.z.size() << " (expected 32)" << std::endl;
        valid = false;
    }

    // Check key sizes (ML-KEM-768)
    if (!vec.pk.empty() && vec.pk.size() != 1184) {
        std::cerr << "WARNING: Vector " << vec.count << " has invalid pk size: "
                  << vec.pk.size() << " (expected 1184)" << std::endl;
        valid = false;
    }

    if (!vec.sk.empty() && vec.sk.size() != 2400) {
        std::cerr << "WARNING: Vector " << vec.count << " has invalid sk size: "
                  << vec.sk.size() << " (expected 2400)" << std::endl;
        valid = false;
    }

    // Check ciphertext and shared secret
    if (!vec.ct.empty() && vec.ct.size() != 1088) {
        std::cerr << "WARNING: Vector " << vec.count << " has invalid ct size: "
                  << vec.ct.size() << " (expected 1088)" << std::endl;
        valid = false;
    }

    if (!vec.ss.empty() && vec.ss.size() != 32) {
        std::cerr << "WARNING: Vector " << vec.count << " has invalid ss size: "
                  << vec.ss.size() << " (expected 32)" << std::endl;
        valid = false;
    }

    return valid;
}

/**
 * Print vector statistics
 */
void print_statistics(const std::vector<TestVector>& vectors) {
    std::cout << "Total vectors: " << vectors.size() << std::endl;

    int with_keys = 0, with_ct = 0, with_ss = 0;
    for (const auto& vec : vectors) {
        if (!vec.pk.empty() && !vec.sk.empty()) with_keys++;
        if (!vec.ct.empty()) with_ct++;
        if (!vec.ss.empty()) with_ss++;
    }

    std::cout << "Vectors with keys: " << with_keys << std::endl;
    std::cout << "Vectors with ciphertext: " << with_ct << std::endl;
    std::cout << "Vectors with shared secret: " << with_ss << std::endl;
}

} // namespace nist_vectors

/**
 * Example usage and testing
 */
int main(int argc, char** argv) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <test_vector_file>" << std::endl;
        std::cerr << "Supported formats: .kat (NIST KAT), .json (ACVP)" << std::endl;
        return 1;
    }

    std::string filename = argv[1];
    std::vector<nist_vectors::TestVector> vectors;

    // Determine format from extension
    if (filename.find(".kat") != std::string::npos) {
        std::cout << "Parsing NIST KAT format..." << std::endl;
        vectors = nist_vectors::parse_kat_file(filename);
    } else if (filename.find(".json") != std::string::npos) {
        std::cout << "Parsing ACVP JSON format..." << std::endl;
        vectors = nist_vectors::parse_acvp_json(filename);
    } else {
        std::cerr << "ERROR: Unknown file format" << std::endl;
        return 1;
    }

    if (vectors.empty()) {
        std::cerr << "ERROR: No vectors loaded" << std::endl;
        return 1;
    }

    std::cout << "Successfully loaded " << vectors.size() << " test vectors" << std::endl;
    std::cout << std::endl;

    // Validate all vectors
    int valid_count = 0;
    for (const auto& vec : vectors) {
        if (nist_vectors::validate_vector(vec)) {
            valid_count++;
        }
    }

    std::cout << "Valid vectors: " << valid_count << "/" << vectors.size() << std::endl;
    std::cout << std::endl;

    // Print statistics
    nist_vectors::print_statistics(vectors);

    return (valid_count == vectors.size()) ? 0 : 1;
}
