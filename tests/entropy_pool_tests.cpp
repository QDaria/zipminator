#include "../src/cpp/quantum_entropy_pool.h"
#include <gtest/gtest.h>
#include <fstream>
#include <cstdlib>

using namespace qdaria::quantum;

class EntropyPoolTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Generate test encryption key
        test_key_path_ = "/tmp/test_entropy_key.bin";
        ASSERT_TRUE(QuantumEntropyPool::generate_encryption_key(test_key_path_));
        setenv("QUANTUM_ENTROPY_KEY", "", 1);  // Use key file instead

        // Generate test entropy (pseudo-random for testing)
        test_entropy_.resize(1024);
        for (size_t i = 0; i < test_entropy_.size(); i++) {
            test_entropy_[i] = static_cast<uint8_t>(rand() % 256);
        }

        test_pool_path_ = "/tmp/test_entropy_pool.qep";
    }

    void TearDown() override {
        std::remove(test_pool_path_.c_str());
        std::remove(test_key_path_.c_str());
    }

    std::string test_pool_path_;
    std::string test_key_path_;
    std::vector<uint8_t> test_entropy_;
};

TEST_F(EntropyPoolTest, CreateAndOpen) {
    // Create pool
    auto pool = QuantumEntropyPool::create(
        test_pool_path_,
        test_entropy_,
        "ibm_test_backend",
        "test-job-id-1234",
        1000,  // num_shots
        5,     // num_qubits
        false  // skip validation for test data
    );

    ASSERT_NE(pool, nullptr);
    EXPECT_EQ(pool->total_bytes(), test_entropy_.size());
    EXPECT_EQ(pool->available_bytes(), test_entropy_.size());
    EXPECT_EQ(pool->consumed_bytes(), 0);

    // Verify file exists
    std::ifstream file(test_pool_path_);
    EXPECT_TRUE(file.good());
    file.close();

    // Reopen pool
    auto pool2 = QuantumEntropyPool::open(test_pool_path_);
    ASSERT_NE(pool2, nullptr);
    EXPECT_EQ(pool2->total_bytes(), test_entropy_.size());
}

TEST_F(EntropyPoolTest, GetBytes) {
    auto pool = QuantumEntropyPool::create(
        test_pool_path_,
        test_entropy_,
        "ibm_test",
        "job-123",
        1000,
        5,
        false
    );

    // Get 32 bytes
    auto bytes = pool->get_bytes(32);
    EXPECT_EQ(bytes.size(), 32);
    EXPECT_EQ(pool->consumed_bytes(), 32);
    EXPECT_EQ(pool->available_bytes(), test_entropy_.size() - 32);

    // Verify consumed bytes were wiped
    auto pool2 = QuantumEntropyPool::open(test_pool_path_);
    auto bytes2 = pool2->get_bytes(32);

    // Second read should give next 32 bytes, not same ones
    EXPECT_NE(bytes, bytes2);
}

TEST_F(EntropyPoolTest, InsufficientEntropy) {
    auto pool = QuantumEntropyPool::create(
        test_pool_path_,
        test_entropy_,
        "ibm_test",
        "job-123",
        1000,
        5,
        false
    );

    // Try to get more bytes than available
    EXPECT_THROW(pool->get_bytes(test_entropy_.size() + 1), EntropyPoolException);
}

TEST_F(EntropyPoolTest, Metadata) {
    auto pool = QuantumEntropyPool::create(
        test_pool_path_,
        test_entropy_,
        "ibm_sherbrooke",
        "c1234567-89ab-cdef-0123-456789abcdef",
        10000,
        5,
        false
    );

    auto meta = pool->get_metadata();
    EXPECT_EQ(meta.entropy_source, "IBM Quantum");
    EXPECT_EQ(meta.backend_name, "ibm_sherbrooke");
    EXPECT_EQ(meta.job_id, "c1234567-89ab-cdef-0123-456789abcdef");
    EXPECT_EQ(meta.num_shots, 10000);
    EXPECT_EQ(meta.num_qubits, 5);
    EXPECT_EQ(meta.bits_per_shot, 5);
    EXPECT_EQ(meta.total_bytes, test_entropy_.size());
    EXPECT_EQ(meta.consumed_bytes, 0);
}

TEST_F(EntropyPoolTest, RefillCallback) {
    auto pool = QuantumEntropyPool::create(
        test_pool_path_,
        test_entropy_,
        "ibm_test",
        "job-123",
        1000,
        5,
        false
    );

    bool callback_triggered = false;
    size_t remaining = 0;

    pool->set_refill_callback([&](size_t bytes_remaining) {
        callback_triggered = true;
        remaining = bytes_remaining;
    }, 512);  // Trigger when < 512 bytes remain

    // Consume enough to trigger callback
    pool->get_bytes(test_entropy_.size() - 400);

    EXPECT_TRUE(callback_triggered);
    EXPECT_EQ(remaining, 400);
}

TEST_F(EntropyPoolTest, SecureDelete) {
    auto pool = QuantumEntropyPool::create(
        test_pool_path_,
        test_entropy_,
        "ibm_test",
        "job-123",
        1000,
        5,
        false
    );

    std::string path = pool->get_file_path();

    // Verify file exists
    std::ifstream file1(path);
    EXPECT_TRUE(file1.good());
    file1.close();

    // Securely delete
    pool->secure_delete();

    // Verify file is gone
    std::ifstream file2(path);
    EXPECT_FALSE(file2.good());
}

TEST_F(EntropyPoolTest, IntegrityCheck) {
    auto pool = QuantumEntropyPool::create(
        test_pool_path_,
        test_entropy_,
        "ibm_test",
        "job-123",
        1000,
        5,
        false
    );
    pool.reset();  // Close file

    // Tamper with file
    std::fstream file(test_pool_path_, std::ios::binary | std::ios::in | std::ios::out);
    file.seekp(300);  // Seek to encrypted data region
    file.put(0xFF);   // Modify one byte
    file.close();

    // Try to open tampered file - should fail HMAC verification
    EXPECT_THROW(QuantumEntropyPool::open(test_pool_path_), EntropyPoolException);
}

TEST_F(EntropyPoolTest, ChiSquareTest) {
    // Create high-quality random data
    std::vector<uint8_t> good_entropy(10000);
    for (auto& byte : good_entropy) {
        byte = static_cast<uint8_t>(rand() % 256);
    }

    double p_value = entropy_validation::chi_square_test(good_entropy);
    EXPECT_GT(p_value, 0.01);  // Should pass with p > 0.01
}

TEST_F(EntropyPoolTest, AutocorrelationTest) {
    // Create high-quality random data
    std::vector<uint8_t> good_entropy(10000);
    for (auto& byte : good_entropy) {
        byte = static_cast<uint8_t>(rand() % 256);
    }

    double autocorr = entropy_validation::autocorrelation_test(good_entropy);
    EXPECT_LT(std::abs(autocorr), 0.1);  // Should have low autocorrelation
}

TEST_F(EntropyPoolTest, MinEntropyEstimation) {
    // Create uniform random data
    std::vector<uint8_t> good_entropy(10000);
    for (auto& byte : good_entropy) {
        byte = static_cast<uint8_t>(rand() % 256);
    }

    double min_entropy = entropy_validation::estimate_min_entropy(good_entropy);
    EXPECT_GT(min_entropy, 7.0);  // Should have high min-entropy
}

TEST_F(EntropyPoolTest, ThreadSafety) {
    auto pool = QuantumEntropyPool::create(
        test_pool_path_,
        test_entropy_,
        "ibm_test",
        "job-123",
        1000,
        5,
        false
    );

    // Launch multiple threads consuming entropy
    std::vector<std::thread> threads;
    std::atomic<size_t> total_consumed{0};

    for (int i = 0; i < 10; i++) {
        threads.emplace_back([&pool, &total_consumed]() {
            try {
                auto bytes = pool->get_bytes(10);
                total_consumed += bytes.size();
            } catch (const EntropyPoolException&) {
                // Expected when pool exhausted
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    EXPECT_LE(total_consumed, test_entropy_.size());
}

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
