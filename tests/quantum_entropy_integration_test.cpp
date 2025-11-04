/**
 * Quantum Entropy Integration Tests for Kyber-768
 *
 * Tests the integration of IBM Quantum QRNG entropy into Kyber-768 operations
 */

#include "../src/cpp/kyber768.h"
#include "../src/cpp/entropy_manager.h"
#include "../src/cpp/qrng/ibm_quantum.h"
#include <gtest/gtest.h>
#include <cstring>
#include <fstream>

using namespace kyber768;
using namespace qrng;

class QuantumEntropyTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Create a small test entropy pool file
        create_test_pool();
    }

    void TearDown() override {
        // Cleanup test pool
        std::remove(test_pool_path.c_str());
    }

    void create_test_pool() {
        test_pool_path = "/tmp/test_quantum_entropy.pool";
        std::ofstream pool_file(test_pool_path, std::ios::binary);

        // Write 64KB of test entropy
        for (size_t i = 0; i < 65536; i++) {
            uint8_t byte = static_cast<uint8_t>(i ^ (i >> 8));
            pool_file.write(reinterpret_cast<const char*>(&byte), 1);
        }

        pool_file.close();
    }

    std::string test_pool_path;
};

TEST_F(QuantumEntropyTest, IBMQuantumDeviceInitialization) {
    IBMQuantumConfig config;
    config.pool_file_path = test_pool_path;
    config.min_pool_bytes = 1024;
    config.warn_on_fallback = false;
    config.log_entropy_source = false;

    IBMQuantumQRNG qrng(config);
    EXPECT_EQ(qrng.initialize(), QRNGStatus::OK);
    EXPECT_TRUE(qrng.is_connected());
    EXPECT_TRUE(qrng.is_using_quantum());
}

TEST_F(QuantumEntropyTest, IBMQuantumGetRandomBytes) {
    IBMQuantumConfig config;
    config.pool_file_path = test_pool_path;
    config.warn_on_fallback = false;
    config.log_entropy_source = false;

    IBMQuantumQRNG qrng(config);
    ASSERT_EQ(qrng.initialize(), QRNGStatus::OK);

    uint8_t buffer[32];
    EXPECT_EQ(qrng.get_random_bytes(buffer, 32), QRNGStatus::OK);

    // Verify we got non-zero data
    bool has_nonzero = false;
    for (size_t i = 0; i < 32; i++) {
        if (buffer[i] != 0) {
            has_nonzero = true;
            break;
        }
    }
    EXPECT_TRUE(has_nonzero);
}

TEST_F(QuantumEntropyTest, IBMQuantumPoolExhaustion) {
    // Create a very small pool
    std::string small_pool_path = "/tmp/test_small_pool.pool";
    std::ofstream pool_file(small_pool_path, std::ios::binary);

    // Write only 64 bytes
    for (size_t i = 0; i < 64; i++) {
        uint8_t byte = static_cast<uint8_t>(i);
        pool_file.write(reinterpret_cast<const char*>(&byte), 1);
    }
    pool_file.close();

    IBMQuantumConfig config;
    config.pool_file_path = small_pool_path;
    config.min_pool_bytes = 1024;
    config.warn_on_fallback = false;

    IBMQuantumQRNG qrng(config);
    ASSERT_EQ(qrng.initialize(), QRNGStatus::OK);

    // Request more bytes than pool has
    uint8_t buffer[128];
    EXPECT_EQ(qrng.get_random_bytes(buffer, 128), QRNGStatus::OK);

    // Should have fallen back to urandom
    EXPECT_FALSE(qrng.is_using_quantum());

    std::remove(small_pool_path.c_str());
}

TEST_F(QuantumEntropyTest, EntropyManagerInitialization) {
    EntropySourceConfig config;
    config.type = EntropySourceType::IBM_QUANTUM;
    config.enabled = true;
    config.pool_path = test_pool_path;
    config.min_bytes = 1024;

    EntropyManager& mgr = EntropyManager::instance();
    EXPECT_TRUE(mgr.initialize_simple(EntropySourceType::IBM_QUANTUM, config));
    EXPECT_TRUE(mgr.is_initialized());
}

TEST_F(QuantumEntropyTest, EntropyManagerGetRandomBytes) {
    EntropySourceConfig config;
    config.type = EntropySourceType::IBM_QUANTUM;
    config.pool_path = test_pool_path;

    EntropyManager& mgr = EntropyManager::instance();
    mgr.initialize_simple(EntropySourceType::IBM_QUANTUM, config);

    uint8_t buffer[32];
    EXPECT_TRUE(mgr.get_random_bytes(buffer, 32));
}

TEST_F(QuantumEntropyTest, EntropyManagerQuantumDetection) {
    EntropySourceConfig config;
    config.type = EntropySourceType::IBM_QUANTUM;
    config.pool_path = test_pool_path;

    EntropyManager& mgr = EntropyManager::instance();
    mgr.initialize_simple(EntropySourceType::IBM_QUANTUM, config);

    // Should be using quantum initially
    EXPECT_TRUE(mgr.is_using_quantum());
}

TEST_F(QuantumEntropyTest, HealthCheck) {
    IBMQuantumConfig config;
    config.pool_file_path = test_pool_path;
    config.warn_on_fallback = false;

    IBMQuantumQRNG qrng(config);
    ASSERT_EQ(qrng.initialize(), QRNGStatus::OK);

    EXPECT_EQ(qrng.health_check(), QRNGStatus::OK);

    HealthStats stats = qrng.get_health_stats();
    EXPECT_GT(stats.health_checks_passed, 0);
}

TEST_F(QuantumEntropyTest, PoolPercentCalculation) {
    IBMQuantumConfig config;
    config.pool_file_path = test_pool_path;
    config.warn_on_fallback = false;

    IBMQuantumQRNG qrng(config);
    ASSERT_EQ(qrng.initialize(), QRNGStatus::OK);

    // Initially should be at 100%
    EXPECT_NEAR(qrng.get_pool_percent(), 100.0, 0.1);

    // Read some bytes
    uint8_t buffer[1024];
    qrng.get_random_bytes(buffer, 1024);

    // Should be less than 100%
    EXPECT_LT(qrng.get_pool_percent(), 100.0);
    EXPECT_GT(qrng.get_pool_percent(), 95.0);  // 1KB from 64KB = ~98%
}

TEST_F(QuantumEntropyTest, AvailableBytes) {
    IBMQuantumConfig config;
    config.pool_file_path = test_pool_path;
    config.warn_on_fallback = false;

    IBMQuantumQRNG qrng(config);
    ASSERT_EQ(qrng.initialize(), QRNGStatus::OK);

    size_t available = qrng.available_bytes();
    EXPECT_EQ(available, 65536);  // Our test pool size

    // Read some bytes
    uint8_t buffer[1024];
    qrng.get_random_bytes(buffer, 1024);

    // Available should decrease
    EXPECT_EQ(qrng.available_bytes(), 65536 - 1024);
}

TEST_F(QuantumEntropyTest, MultipleSourcesFallback) {
    EntropyManagerConfig mgr_config;

    // Primary: IBM Quantum (will fail with non-existent path)
    EntropySourceConfig ibm_config;
    ibm_config.type = EntropySourceType::IBM_QUANTUM;
    ibm_config.enabled = true;
    ibm_config.pool_path = "/nonexistent/path.pool";

    // Fallback: Mock (will work)
    EntropySourceConfig mock_config;
    mock_config.type = EntropySourceType::MOCK;
    mock_config.enabled = true;

    mgr_config.sources.push_back(ibm_config);
    mgr_config.sources.push_back(mock_config);
    mgr_config.alert_on_fallback = false;

    EntropyManager& mgr = EntropyManager::instance();
    EXPECT_TRUE(mgr.initialize(mgr_config));

    uint8_t buffer[32];
    EXPECT_TRUE(mgr.get_random_bytes(buffer, 32));

    // Should not be using quantum (fell back to mock)
    EXPECT_FALSE(mgr.is_using_quantum());
}

// Integration test: Verify Kyber-768 can use quantum entropy
// (This would require modifying kyber768.cpp to use EntropyManager)
TEST_F(QuantumEntropyTest, DISABLED_Kyber768WithQuantumEntropy) {
    // This test demonstrates how Kyber would use quantum entropy
    // Enable after integrating EntropyManager into kyber768.cpp

    EntropySourceConfig config;
    config.type = EntropySourceType::IBM_QUANTUM;
    config.pool_path = test_pool_path;

    EntropyManager& mgr = EntropyManager::instance();
    mgr.initialize_simple(EntropySourceType::IBM_QUANTUM, config);

    uint8_t pk[kyber768::KYBER_PUBLICKEYBYTES];
    uint8_t sk[kyber768::KYBER_SECRETKEYBYTES];

    // This will use quantum entropy via EntropyManager
    EXPECT_EQ(kyber768::crypto_kem_keypair(pk, sk), 0);

    // Verify quantum was used
    EXPECT_TRUE(mgr.is_using_quantum());
}

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
