cmake_minimum_required(VERSION 3.22.1)
project(zipminator_crypto_jni)

# ── Source files ──────────────────────────────────────────────────────────
add_library(
    zipminator_crypto_jni
    SHARED
    src/main/cpp/zipminator_jni.cpp
)

# ── Include paths ─────────────────────────────────────────────────────────
target_include_directories(zipminator_crypto_jni PRIVATE
    # Shared C header (RustFFI.h)
    ${CMAKE_CURRENT_SOURCE_DIR}/../cpp
)

# ── Pre-built Rust library ────────────────────────────────────────────────
# Build the Rust core for each Android ABI before running Gradle:
#
#   cargo build --release --target aarch64-linux-android
#   cargo build --release --target armv7-linux-androideabi
#   cargo build --release --target x86_64-linux-android
#   cargo build --release --target i686-linux-android
#
# Then copy the outputs to:
#   android/jniLibs/arm64-v8a/libzipminator_core.so
#   android/jniLibs/armeabi-v7a/libzipminator_core.so
#   android/jniLibs/x86_64/libzipminator_core.so
#   android/jniLibs/x86/libzipminator_core.so
#
# ANDROID_ABI is set by the Gradle AGP to the current ABI being compiled.
set(RUST_LIBS_DIR ${CMAKE_CURRENT_SOURCE_DIR}/jniLibs/${ANDROID_ABI})

add_library(zipminator_core SHARED IMPORTED)
set_target_properties(zipminator_core PROPERTIES
    IMPORTED_LOCATION ${RUST_LIBS_DIR}/libzipminator_core.so
)

# ── Linking ───────────────────────────────────────────────────────────────
target_link_libraries(zipminator_crypto_jni
    zipminator_core
    android
    log
)
