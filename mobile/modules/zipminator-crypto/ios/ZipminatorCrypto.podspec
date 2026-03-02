Pod::Spec.new do |s|
  s.name           = 'ZipminatorCrypto'
  s.version        = '1.0.0'
  s.summary        = 'Kyber768 PQ Double Ratchet — Expo native module for iOS'
  s.description    = 'Expo Modules native bridge exposing Rust Kyber768 FFI via zipminator-core'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios   => '15.1',
    :tvos  => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Source files: Swift module + C/C++ headers
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"

  # Expose the bridging header so Swift can import the Rust C symbols.
  # Set SWIFT_OBJC_BRIDGING_HEADER in the consuming app's Xcode target to
  #   Pods/ZipminatorCrypto/ZipminatorCryptoHeader.h
  # or add it to your app target's bridging header:
  #   #include "ZipminatorCryptoHeader.h"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE'              => 'YES',
    # Pre-compiled Rust dylib/static lib. Build with:
    #   cargo build --release --target aarch64-apple-ios
    # then copy the output to ios/libs/arm64/:
    #   zipminator/mobile/modules/zipminator-crypto/ios/libs/arm64/libzipminator_core.a
    'LIBRARY_SEARCH_PATHS'        => '"$(PODS_TARGET_SRCROOT)/libs/$(CURRENT_ARCH)"',
    'OTHER_LDFLAGS'               => '-lzipminator_core',
    'SWIFT_OBJC_BRIDGING_HEADER'  => '$(PODS_TARGET_SRCROOT)/ZipminatorCryptoHeader.h',
  }
end
