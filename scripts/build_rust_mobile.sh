#!/bin/bash
# scripts/build_rust_mobile.sh
# This script compiles the zipminator-core Rust crate into native libraries
# for iOS (.a) and Android (.so) so they can be consumed by Expo / React Native.

set -e

# ANSI escape codes for colors
GREEN='\03---0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Initializing Rust Mobile Cross-Compilation Pipeline...${NC}"

# Navigate to the core crate
CRATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../crates/zipminator-core" && pwd)"
cd "$CRATE_DIR"

# 1. Ensure Rust targets are installed
echo -e "${YELLOW}📥 Adding Rust targets for iOS and Android...${NC}"
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

# 2. Build for iOS (Requires Xcode)
echo -e "${GREEN}🍎 Building static libraries for iOS (No Default Features to skip USB)...${NC}"
# Build for physical devices (ARM64)
cargo build --target aarch64-apple-ios --release --no-default-features
# Build for simulator (ARM64 & x86_64)
cargo build --target aarch64-apple-ios-sim --release --no-default-features
cargo build --target x86_64-apple-ios --release --no-default-features

# 3. Create XCFramework for iOS (Using xcodebuild)
# Note: This is a placeholder for creating the universal XCFramework.
# In a full build, we'd use lipo to combine simulator architectures, then xcodebuild -create-xcframework
echo -e "${GREEN}📦 XCFramework step (Requires lipo & xcodebuild) - To be configured fully in CI/CD${NC}"

# 4. Build for Android (Requires NDK and cargo-ndk)
# If cargo-ndk is not installed, install it:
if ! command -v cargo-ndk &> /dev/null
then
    echo -e "${YELLOW}📦 Installing cargo-ndk...${NC}"
    cargo install cargo-ndk
fi

echo -e "${GREEN}🤖 Building dynamic libraries (.so) for Android...${NC}"
# Assuming ANDROID_NDK_HOME is set in the environment
if [ -z "$ANDROID_NDK_HOME" ]; then
    echo -e "${YELLOW}⚠️ ANDROID_NDK_HOME is not set. Android build will be skipped.${NC}"
    echo "To build for Android, please set ANDROID_NDK_HOME (e.g., export ANDROID_NDK_HOME=~/Library/Android/sdk/ndk/25.1.8937393)"
else
    cargo ndk -t arm64-v8a -t armeabi-v7a -t x86 -t x86_64 -o ../../mobile/modules/zipminator-crypto/android/src/main/jniLibs build --release --no-default-features
fi

echo -e "${GREEN}✅ Rust Mobile build pipeline completed! Libs are ready for JSI Integration.${NC}"
