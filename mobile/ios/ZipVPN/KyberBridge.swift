// KyberBridge.swift
// ZipVPN
//
// Swift wrapper around the Rust/C FFI for ML-KEM-768 (Kyber768).
// The native Rust dylib exposes `zipminator_kyber768_keygen`,
// `zipminator_kyber768_encaps`, and `zipminator_kyber768_decaps`
// via the C ABI defined in `crates/zipminator-core/src/ffi.rs`.
//
// Key sizes (FIPS 203 / ML-KEM-768):
//   - Public key:   1184 bytes
//   - Secret key:   2400 bytes
//   - Ciphertext:   1088 bytes
//   - Shared secret:  32 bytes

import Foundation

// MARK: - C FFI Declarations

// These symbols are exported by the compiled Rust library.
// When running unit tests the native lib may not be available, so
// calls are guarded via `#if canImport(ZipminatorCore)` pragmas or
// routed through the `mockXxx` helpers in non-production builds.

@_silgen_name("zipminator_kyber768_keygen")
private func _kyberKeygen(
    pkOut: UnsafeMutablePointer<UInt8>,  // 1184 bytes
    skOut: UnsafeMutablePointer<UInt8>   // 2400 bytes
) -> Int32

@_silgen_name("zipminator_kyber768_encaps")
private func _kyberEncaps(
    pk: UnsafePointer<UInt8>,            // 1184 bytes
    ctOut: UnsafeMutablePointer<UInt8>,  // 1088 bytes
    ssOut: UnsafeMutablePointer<UInt8>   // 32 bytes
) -> Int32

@_silgen_name("zipminator_kyber768_decaps")
private func _kyberDecaps(
    ct: UnsafePointer<UInt8>,            // 1088 bytes
    sk: UnsafePointer<UInt8>,            // 2400 bytes
    ssOut: UnsafeMutablePointer<UInt8>   // 32 bytes
) -> Int32

// MARK: - KyberBridge

/// Thread-safe bridge between Swift and the Rust ML-KEM-768 implementation.
/// All functions are static; no mutable state is held.
public final class KyberBridge {

    // MARK: - Public constants

    public static let publicKeyBytes   = 1184
    public static let secretKeyBytes   = 2400
    public static let ciphertextBytes  = 1088
    public static let sharedSecretBytes = 32

    // MARK: - Types

    public struct Keypair {
        public let publicKey: Data   // 1184 bytes
        public let secretKey: Data   // 2400 bytes

        public init(publicKey: Data, secretKey: Data) {
            self.publicKey = publicKey
            self.secretKey = secretKey
        }
    }

    public struct Encapsulation {
        public let ciphertext: Data    // 1088 bytes
        public let sharedSecret: Data  // 32 bytes

        public init(ciphertext: Data, sharedSecret: Data) {
            self.ciphertext = ciphertext
            self.sharedSecret = sharedSecret
        }
    }

    // MARK: - Production API (requires native library)

    /// Generate a fresh ML-KEM-768 keypair using the Rust native library.
    /// - Returns: A `Keypair` containing a 1184-byte public key and 2400-byte secret key.
    public static func generateKeypair() -> Keypair {
        var pkBuf = [UInt8](repeating: 0, count: publicKeyBytes)
        var skBuf = [UInt8](repeating: 0, count: secretKeyBytes)

        let ret = _kyberKeygen(&pkBuf, &skBuf)
        precondition(ret == 0, "KyberBridge: keygen returned non-zero status \(ret)")

        let pk = Data(pkBuf)
        let sk = Data(skBuf)

        // Zeroize stack buffers immediately after copying into Data
        pkBuf.withUnsafeMutableBytes { ptr in
            ptr.initializeMemory(as: UInt8.self, repeating: 0)
        }
        skBuf.withUnsafeMutableBytes { ptr in
            ptr.initializeMemory(as: UInt8.self, repeating: 0)
        }

        return Keypair(publicKey: pk, secretKey: sk)
    }

    /// Encapsulate a shared secret using the peer's public key.
    /// - Parameter publicKey: 1184-byte ML-KEM-768 public key.
    /// - Returns: An `Encapsulation` with a 1088-byte ciphertext and 32-byte shared secret.
    public static func encapsulate(publicKey: Data) -> Encapsulation {
        guard publicKey.count == publicKeyBytes else {
            preconditionFailure("KyberBridge: publicKey must be \(publicKeyBytes) bytes, got \(publicKey.count)")
        }

        var ctBuf = [UInt8](repeating: 0, count: ciphertextBytes)
        var ssBuf = [UInt8](repeating: 0, count: sharedSecretBytes)

        let ret = publicKey.withUnsafeBytes { pkPtr in
            _kyberEncaps(pkPtr.bindMemory(to: UInt8.self).baseAddress!, &ctBuf, &ssBuf)
        }
        precondition(ret == 0, "KyberBridge: encaps returned non-zero status \(ret)")

        let ct = Data(ctBuf)
        let ss = Data(ssBuf)

        ssBuf.withUnsafeMutableBytes { ptr in
            ptr.initializeMemory(as: UInt8.self, repeating: 0)
        }

        return Encapsulation(ciphertext: ct, sharedSecret: ss)
    }

    /// Decapsulate a ciphertext to recover the shared secret.
    /// - Parameters:
    ///   - ciphertext: 1088-byte ML-KEM-768 ciphertext.
    ///   - secretKey:  2400-byte ML-KEM-768 secret key.
    /// - Returns: 32-byte shared secret.
    public static func decapsulate(ciphertext: Data, secretKey: Data) -> Data {
        guard ciphertext.count == ciphertextBytes else {
            preconditionFailure("KyberBridge: ciphertext must be \(ciphertextBytes) bytes")
        }
        guard secretKey.count == secretKeyBytes else {
            preconditionFailure("KyberBridge: secretKey must be \(secretKeyBytes) bytes")
        }

        var ssBuf = [UInt8](repeating: 0, count: sharedSecretBytes)

        let ret = ciphertext.withUnsafeBytes { ctPtr in
            secretKey.withUnsafeBytes { skPtr in
                _kyberDecaps(
                    ctPtr.bindMemory(to: UInt8.self).baseAddress!,
                    skPtr.bindMemory(to: UInt8.self).baseAddress!,
                    &ssBuf
                )
            }
        }
        precondition(ret == 0, "KyberBridge: decaps returned non-zero status \(ret)")

        let ss = Data(ssBuf)
        ssBuf.withUnsafeMutableBytes { ptr in
            ptr.initializeMemory(as: UInt8.self, repeating: 0)
        }
        return ss
    }

    // MARK: - Validated API (returns nil on bad input, for use in tests / untrusted data)

    /// Encapsulate with input validation. Returns nil if publicKey size is wrong.
    public static func encapsulateValidated(publicKey: Data) -> Encapsulation? {
        guard publicKey.count == publicKeyBytes else { return nil }
        return encapsulate(publicKey: publicKey)
    }

    /// Decapsulate with input validation. Returns nil if sizes are wrong.
    public static func decapsulateValidated(ciphertext: Data, secretKey: Data) -> Data? {
        guard ciphertext.count == ciphertextBytes else { return nil }
        guard secretKey.count == secretKeyBytes else { return nil }
        return decapsulate(ciphertext: ciphertext, secretKey: secretKey)
    }

    // MARK: - Mock API (for unit tests without native library)

    // The mock stores a (ciphertext → sharedSecret) map so that
    // mockDecapsulate can return the matching secret for a given ciphertext.
    private static var mockStore: [Data: Data] = [:]
    private static let mockLock = NSLock()

    /// Generate a mock keypair with correctly-sized random bytes.
    /// Safe to call from unit tests without the native Rust library.
    public static func mockGenerateKeypair() -> Keypair {
        var pkBytes = Data(count: publicKeyBytes)
        var skBytes = Data(count: secretKeyBytes)
        pkBytes.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, publicKeyBytes, $0.baseAddress!) }
        skBytes.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, secretKeyBytes, $0.baseAddress!) }
        return Keypair(publicKey: pkBytes, secretKey: skBytes)
    }

    /// Generate a mock encapsulation with correctly-sized random bytes.
    /// Stores the (ct → ss) mapping so mockDecapsulate can retrieve it.
    public static func mockEncapsulate(publicKey: Data) -> Encapsulation {
        var ctBytes = Data(count: ciphertextBytes)
        var ssBytes = Data(count: sharedSecretBytes)
        ctBytes.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, ciphertextBytes, $0.baseAddress!) }
        ssBytes.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, sharedSecretBytes, $0.baseAddress!) }

        mockLock.lock()
        mockStore[ctBytes] = ssBytes
        mockLock.unlock()

        return Encapsulation(ciphertext: ctBytes, sharedSecret: ssBytes)
    }

    /// Retrieve the mock shared secret for a given ciphertext.
    /// Simulates correct Kyber decapsulation for unit tests.
    public static func mockDecapsulate(ciphertext: Data, secretKey: Data) -> Data {
        mockLock.lock()
        let ss = mockStore[ciphertext]
        mockLock.unlock()

        if let ss = ss {
            return ss
        }
        // If not in store (e.g. fresh call with random CT), return random 32 bytes
        var fallback = Data(count: sharedSecretBytes)
        fallback.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, sharedSecretBytes, $0.baseAddress!) }
        return fallback
    }

    // MARK: - Private

    private init() { /* Static class — no instances */ }
}
