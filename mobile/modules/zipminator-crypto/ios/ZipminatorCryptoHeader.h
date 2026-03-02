/**
 * ZipminatorCryptoHeader.h — Objective-C bridging header for Swift.
 *
 * Xcode picks this up when 'SWIFT_OBJC_BRIDGING_HEADER' is set in the
 * Podspec / target build settings, or when it is listed as the module's
 * umbrella header.
 *
 * It exposes the Rust FFI symbols (zipminator_ratchet_*) to Swift without
 * requiring the Swift files to import a C module directly.
 */

#ifndef ZipminatorCryptoHeader_h
#define ZipminatorCryptoHeader_h

#include "../cpp/RustFFI.h"

#endif /* ZipminatorCryptoHeader_h */
