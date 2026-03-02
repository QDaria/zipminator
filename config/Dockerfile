# Multi-stage Docker build for Zipminator

# Stage 1: Builder
FROM rust:1.75-alpine as builder

LABEL maintainer="QDaria <hello@qdaria.com>"
LABEL description="Quantum-safe cryptography CLI with NIST Kyber768"

# Install build dependencies
RUN apk add --no-cache \
    musl-dev \
    pkg-config \
    openssl-dev \
    curl \
    ca-certificates

WORKDIR /build

# Copy project files
COPY . .

# Build the CLI binary
RUN cargo build --release \
    --manifest-path /build/Cargo.toml \
    --target x86_64-unknown-linux-musl

# Stage 2: Runtime
FROM alpine:latest

LABEL maintainer="QDaria <hello@qdaria.com>"
LABEL version="1.0.0"

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    libssl3 \
    openssl \
    curl

# Create non-root user
RUN addgroup -g 1000 zipminator && \
    adduser -D -u 1000 -G zipminator zipminator

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/target/x86_64-unknown-linux-musl/release/zipminator /usr/local/bin/zipminator

# Create volume for input/output
RUN mkdir -p /app/data && \
    chown -R zipminator:zipminator /app

USER zipminator

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD zipminator --version || exit 1

# Default entrypoint
ENTRYPOINT ["zipminator"]
CMD ["--help"]

# Build metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.version=$VERSION
