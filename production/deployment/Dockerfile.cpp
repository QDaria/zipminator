# Multi-stage build for Zipminator C++ implementation
# Stage 1: Builder
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    cmake \
    libusb-1.0-0-dev \
    git \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /build

# Copy source code
COPY src/cpp /build/src/cpp
COPY tests/cpp /build/tests/cpp
COPY benchmarks /build/benchmarks
COPY Makefile /build/

# Build release version
RUN cd /build && make release

# Run tests during build
RUN cd /build && make test

# Stage 2: Runtime
FROM ubuntu:22.04

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libusb-1.0-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 zipminator

# Copy compiled binaries and libraries
COPY --from=builder /build/build/libzipminator.so /usr/lib/
COPY --from=builder /build/build/zipminator-server /usr/bin/

# Copy configuration
COPY production/config /etc/zipminator/

# Set ownership
RUN chown -R zipminator:zipminator /etc/zipminator

# Switch to non-root user
USER zipminator

# Expose API port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start server
CMD ["/usr/bin/zipminator-server", "--config", "/etc/zipminator/config.yaml"]
