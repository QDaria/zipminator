# Makefile for Kyber-768 C++ Implementation
# Target: Gold standard performance with AVX2 optimization

CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O3 -march=native -mavx2 -mfma
CXXFLAGS += -fno-omit-frame-pointer -fPIC
LDFLAGS = -lpthread

# Constant-time build flags
CXXFLAGS += -DCONSTANT_TIME
# Disable optimizations that might break constant-time
CXXFLAGS += -fno-strict-aliasing -fwrapv

# Source files
SOURCES = kyber768.cpp ntt_avx2.cpp poly_avx2.cpp shake.cpp
OBJECTS = $(SOURCES:.cpp=.o)

# Test files
TEST_SOURCES = ../tests/cpp/test_kyber768.cpp
TEST_OBJECTS = $(TEST_SOURCES:.cpp=.o)

# Library
LIBRARY = libkyber768.a
SHARED_LIBRARY = libkyber768.so

# Targets
all: $(LIBRARY) $(SHARED_LIBRARY) test

# Static library
$(LIBRARY): $(OBJECTS)
	ar rcs $@ $^
	ranlib $@

# Shared library
$(SHARED_LIBRARY): $(OBJECTS)
	$(CXX) -shared -o $@ $^ $(LDFLAGS)

# Object files
%.o: %.cpp kyber768.h
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Test executable
test: $(TEST_OBJECTS) $(LIBRARY)
	$(CXX) $(CXXFLAGS) -o test_kyber768 $(TEST_OBJECTS) $(LIBRARY) $(LDFLAGS)

# Run tests
check: test
	./test_kyber768

# Benchmark
benchmark: test
	@echo "Running Kyber-768 benchmark..."
	./test_kyber768 | grep -A 10 "Performance Benchmark"

# Clean
clean:
	rm -f $(OBJECTS) $(TEST_OBJECTS) $(LIBRARY) $(SHARED_LIBRARY) test_kyber768

# Install
install: $(LIBRARY) $(SHARED_LIBRARY)
	install -d /usr/local/lib
	install -m 644 $(LIBRARY) /usr/local/lib/
	install -m 755 $(SHARED_LIBRARY) /usr/local/lib/
	install -d /usr/local/include/kyber768
	install -m 644 kyber768.h /usr/local/include/kyber768/
	ldconfig

# Uninstall
uninstall:
	rm -f /usr/local/lib/$(LIBRARY)
	rm -f /usr/local/lib/$(SHARED_LIBRARY)
	rm -rf /usr/local/include/kyber768
	ldconfig

# Dependencies
kyber768.o: kyber768.cpp kyber768.h
ntt_avx2.o: ntt_avx2.cpp kyber768.h
poly_avx2.o: poly_avx2.cpp kyber768.h
shake.o: shake.cpp

.PHONY: all clean test check benchmark install uninstall
