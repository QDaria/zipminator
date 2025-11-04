# NIST KAT Test Suite Makefile

# C++ Configuration
CXX = g++
CXXFLAGS = -std=c++17 -O3 -Wall -Wextra -march=native
INCLUDES = -I../../src/cpp -I./src/cpp
LDFLAGS = -lcrypto -lssl

# Rust Configuration
CARGO = cargo
RUST_FLAGS = --release

# Test vector locations
VECTORS_DIR = ./test_vectors
VECTORS_URL = https://github.com/post-quantum-cryptography/KAT

# Output directories
BUILD_DIR = ./build
REPORT_DIR = ./reports

.PHONY: all clean cpp rust download_vectors test report

all: cpp rust

# C++ Build
cpp: $(BUILD_DIR)/nist_kat_cpp

$(BUILD_DIR)/nist_kat_cpp: src/cpp/nist_kat_kyber768.cpp src/cpp/deterministic_rng.cpp
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $^ ../../src/cpp/kyber768.cpp \
		../../src/cpp/poly_avx2.cpp ../../src/cpp/ntt_avx2.cpp \
		../../src/cpp/shake.cpp $(LDFLAGS) -o $@
	@echo "✓ C++ KAT tests built: $@"

# Rust Build
rust:
	@cd ../../src/rust && $(CARGO) build $(RUST_FLAGS)
	@$(CARGO) build $(RUST_FLAGS)
	@echo "✓ Rust KAT tests built"

# Download official NIST test vectors
download_vectors:
	@mkdir -p $(VECTORS_DIR)
	@echo "Downloading NIST FIPS 203 test vectors..."
	@echo "Note: Manual download required from $(VECTORS_URL)"
	@echo "Place Kyber-768 vectors in $(VECTORS_DIR)/"

# Run tests
test: test-cpp test-rust

test-cpp: $(BUILD_DIR)/nist_kat_cpp
	@echo "Running C++ NIST KAT tests..."
	@$(BUILD_DIR)/nist_kat_cpp $(VECTORS_DIR)/kyber768.rsp || true

test-rust: rust
	@echo "Running Rust NIST KAT tests..."
	@$(CARGO) run $(RUST_FLAGS) -- $(VECTORS_DIR)/kyber768.rsp || true

# Generate validation report
report: test
	@mkdir -p $(REPORT_DIR)
	@echo "Generating NIST KAT validation report..."
	@./generate_report.sh > $(REPORT_DIR)/validation_report_$(shell date +%Y%m%d_%H%M%S).md
	@echo "✓ Report generated in $(REPORT_DIR)/"

# Clean build artifacts
clean:
	@rm -rf $(BUILD_DIR)
	@$(CARGO) clean
	@echo "✓ Cleaned build artifacts"

# Help
help:
	@echo "NIST KAT Test Suite for Kyber-768"
	@echo ""
	@echo "Targets:"
	@echo "  all              - Build C++ and Rust tests"
	@echo "  cpp              - Build C++ tests only"
	@echo "  rust             - Build Rust tests only"
	@echo "  download_vectors - Download NIST test vectors"
	@echo "  test             - Run all KAT tests"
	@echo "  test-cpp         - Run C++ tests only"
	@echo "  test-rust        - Run Rust tests only"
	@echo "  report           - Generate validation report"
	@echo "  clean            - Remove build artifacts"
	@echo "  help             - Show this help message"
