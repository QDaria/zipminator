# Makefile for Dudect Constant-Time Validation Tests
# Compiles test harnesses and links with C++ and Rust implementations

CC = gcc
CXX = g++
# Detect architecture: ARM64 uses NEON, x86_64 uses AVX2
ARCH := $(shell uname -m)
ifeq ($(ARCH),arm64)
    SIMD_FLAGS = -march=armv8-a+simd+crypto
else
    SIMD_FLAGS = -march=native -mavx2
endif

CFLAGS = -O3 $(SIMD_FLAGS) -I/tmp/dudect/src -I../../src/cpp -Wall -Wextra
CXXFLAGS = -std=c++17 -O3 $(SIMD_FLAGS) -I/tmp/dudect/src -I../../src/cpp -Wall -Wextra
LDFLAGS = -lpthread -lm
DUDECT_HEADER = /tmp/dudect/src/dudect.h

# C++ source files
CPP_SRC = ../../src/cpp/kyber768.cpp ../../src/cpp/ntt_avx2.cpp ../../src/cpp/poly_avx2.cpp ../../src/cpp/shake.cpp ../../src/cpp/dudect_exports.cpp
CPP_OBJS = $(CPP_SRC:.cpp=.o)

# Output binaries
DUDECT_CPP = dudect_cpp_test
DUDECT_RUST = dudect_rust_test

# Default target
all: $(DUDECT_CPP)

# C++ dudect test
$(DUDECT_CPP): dudect_cpp.c $(CPP_OBJS) $(DUDECT_HEADER)
	$(CXX) $(CXXFLAGS) -DDUDECT_IMPLEMENTATION -o $@ dudect_cpp.c $(CPP_OBJS) $(LDFLAGS)

# C++ object files
../../src/cpp/%.o: ../../src/cpp/%.cpp
	$(CXX) $(CXXFLAGS) -DCONSTANT_TIME -c $< -o $@

# Rust dudect test (requires Rust FFI setup)
rust_ffi:
	@echo "Building Rust FFI for dudect tests..."
	cd ../../src/rust && cargo build --release --lib

$(DUDECT_RUST): dudect_rust.c rust_ffi
	$(CC) $(CFLAGS) -DDUDECT_IMPLEMENTATION -o $@ dudect_rust.c \
		-L../../src/rust/target/release -lkyber768 -ldl $(LDFLAGS)

# Test targets
test_cpp_ntt: $(DUDECT_CPP)
	@echo "=== Testing C++ NTT (10M samples, ~20-30 minutes) ==="
	./$(DUDECT_CPP) ntt | tee results/cpp_ntt_$(shell date +%Y%m%d_%H%M%S).txt

test_cpp_decaps: $(DUDECT_CPP)
	@echo "=== Testing C++ Decapsulation (10M samples, ~20-30 minutes) ==="
	./$(DUDECT_CPP) decaps | tee results/cpp_decaps_$(shell date +%Y%m%d_%H%M%S).txt

test_cpp_montgomery: $(DUDECT_CPP)
	@echo "=== Testing C++ Montgomery Reduction (10M samples, ~15-20 minutes) ==="
	./$(DUDECT_CPP) montgomery | tee results/cpp_montgomery_$(shell date +%Y%m%d_%H%M%S).txt

test_cpp_all: $(DUDECT_CPP)
	@mkdir -p results
	@echo "=== Running ALL C++ constant-time tests (total: ~60-90 minutes) ==="
	./$(DUDECT_CPP) all | tee results/cpp_all_$(shell date +%Y%m%d_%H%M%S).txt

# Rust tests
test_rust_all: $(DUDECT_RUST)
	@mkdir -p results
	@echo "=== Running ALL Rust constant-time tests (total: ~60-90 minutes) ==="
	./$(DUDECT_RUST) all | tee results/rust_all_$(shell date +%Y%m%d_%H%M%S).txt

# Run all tests
test_all: test_cpp_all test_rust_all
	@echo "=== Generating comprehensive report ==="
	python3 generate_report.py results/

# Quick smoke test (100k samples)
smoke_test: $(DUDECT_CPP)
	@echo "=== Quick smoke test (100k samples, ~30 seconds) ==="
	./$(DUDECT_CPP) ntt 2>&1 | head -50

# Clean
clean:
	rm -f $(DUDECT_CPP) $(DUDECT_RUST) $(CPP_OBJS)
	rm -rf results/*.txt results/*.json

clean_all: clean
	rm -rf results/

# Create results directory
setup:
	mkdir -p results

.PHONY: all test_cpp_ntt test_cpp_decaps test_cpp_montgomery test_cpp_all test_rust_all test_all smoke_test clean clean_all setup rust_ffi
