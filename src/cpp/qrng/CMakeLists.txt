# QRNG Integration CMake Build Configuration
cmake_minimum_required(VERSION 3.15)

project(qrng_integration
    VERSION 1.0.0
    DESCRIPTION "Quantum Random Number Generator Integration for Kyber-768"
    LANGUAGES CXX
)

# C++ Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(
        -Wall -Wextra -Wpedantic
        -O3
        -march=native
        -fPIC
    )

    # Security flags
    add_compile_options(
        -fstack-protector-strong
        -D_FORTIFY_SOURCE=2
        -Wformat -Wformat-security
    )
endif()

# Find dependencies
find_package(Threads REQUIRED)

# libusb-1.0 (optional, for hardware QRNG)
find_package(PkgConfig)
if(PkgConfig_FOUND)
    pkg_check_modules(LIBUSB libusb-1.0)
    if(LIBUSB_FOUND)
        add_compile_definitions(HAVE_LIBUSB)
        message(STATUS "libusb-1.0 found - hardware QRNG support enabled")
    else()
        message(STATUS "libusb-1.0 not found - hardware QRNG support disabled")
    endif()
else()
    message(STATUS "PkgConfig not found - hardware QRNG support disabled")
endif()

# QRNG Library
set(QRNG_SOURCES
    qrng_interface.h
    mock_qrng.h
    mock_qrng.cpp
    entropy_pool.h
    entropy_pool.cpp
)

# Add ID Quantique driver if libusb is available
if(LIBUSB_FOUND)
    list(APPEND QRNG_SOURCES
        id_quantique_usb.h
        id_quantique_usb.cpp
    )
endif()

add_library(qrng STATIC ${QRNG_SOURCES})

target_include_directories(qrng
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/..
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(qrng
    PUBLIC
        Threads::Threads
)

# Link libusb if available
if(LIBUSB_FOUND)
    target_include_directories(qrng PRIVATE ${LIBUSB_INCLUDE_DIRS})
    target_link_libraries(qrng PUBLIC ${LIBUSB_LIBRARIES})
endif()

# Installation
install(TARGETS qrng
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
)

install(FILES
    qrng_interface.h
    mock_qrng.h
    entropy_pool.h
    DESTINATION include/qrng
)

if(LIBUSB_FOUND)
    install(FILES id_quantique_usb.h
        DESTINATION include/qrng
    )
endif()

# Export targets
export(TARGETS qrng
    FILE "${CMAKE_CURRENT_BINARY_DIR}/qrng-targets.cmake"
)
