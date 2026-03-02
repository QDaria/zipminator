// KyberBridgeTests.swift
// ZipVPNTests
//
// Tests for the KyberBridge FFI wrapper using mock data to validate
// byte-length contracts and encoding round-trips without requiring
// the native .a library to be linked during unit testing.

import XCTest
@testable import ZipVPN

final class KyberBridgeTests: XCTestCase {

    // MARK: - Constants (matches Kyber768 spec)

    static let publicKeyBytes  = 1184
    static let secretKeyBytes  = 2400
    static let ciphertextBytes = 1088
    static let sharedSecretBytes = 32

    // MARK: - Keypair Generation Tests

    func testGenerateKeypairProducesCorrectSizes() {
        // Uses mock implementation — validates contract without native lib
        let kp = KyberBridge.mockGenerateKeypair()
        XCTAssertEqual(kp.publicKey.count, Self.publicKeyBytes,
            "Kyber768 public key must be \(Self.publicKeyBytes) bytes")
        XCTAssertEqual(kp.secretKey.count, Self.secretKeyBytes,
            "Kyber768 secret key must be \(Self.secretKeyBytes) bytes")
    }

    func testGenerateKeypairProducesUniqueKeys() {
        let kp1 = KyberBridge.mockGenerateKeypair()
        let kp2 = KyberBridge.mockGenerateKeypair()
        XCTAssertNotEqual(kp1.publicKey, kp2.publicKey,
            "Two successive keypairs must have distinct public keys")
        XCTAssertNotEqual(kp1.secretKey, kp2.secretKey,
            "Two successive keypairs must have distinct secret keys")
    }

    func testKeypairPublicKeyIsNotSecretKey() {
        let kp = KyberBridge.mockGenerateKeypair()
        XCTAssertNotEqual(kp.publicKey, kp.secretKey,
            "Public key and secret key must be distinct byte arrays")
    }

    // MARK: - Encapsulation Tests

    func testEncapsulateProducesCorrectCiphertextSize() {
        let kp = KyberBridge.mockGenerateKeypair()
        let encaps = KyberBridge.mockEncapsulate(publicKey: kp.publicKey)
        XCTAssertEqual(encaps.ciphertext.count, Self.ciphertextBytes,
            "Kyber768 ciphertext must be \(Self.ciphertextBytes) bytes")
    }

    func testEncapsulateProducesCorrectSharedSecretSize() {
        let kp = KyberBridge.mockGenerateKeypair()
        let encaps = KyberBridge.mockEncapsulate(publicKey: kp.publicKey)
        XCTAssertEqual(encaps.sharedSecret.count, Self.sharedSecretBytes,
            "Kyber768 shared secret must be \(Self.sharedSecretBytes) bytes")
    }

    func testEncapsulateUniquePerCall() {
        let kp = KyberBridge.mockGenerateKeypair()
        let e1 = KyberBridge.mockEncapsulate(publicKey: kp.publicKey)
        let e2 = KyberBridge.mockEncapsulate(publicKey: kp.publicKey)
        // Each encapsulation must use a fresh random seed → different ciphertext
        XCTAssertNotEqual(e1.ciphertext, e2.ciphertext,
            "Repeated encapsulation must produce distinct ciphertexts (IND-CCA)")
        XCTAssertNotEqual(e1.sharedSecret, e2.sharedSecret,
            "Repeated encapsulation must produce distinct shared secrets")
    }

    func testEncapsulateWithInvalidPublicKeyFails() {
        let shortKey = Data(repeating: 0x00, count: 16)   // Only 16 bytes, not 1184
        let result = KyberBridge.encapsulateValidated(publicKey: shortKey)
        XCTAssertNil(result, "Encapsulation with a short public key must return nil")
    }

    // MARK: - Decapsulation Tests

    func testDecapsulateProducesCorrectSharedSecretSize() {
        let kp = KyberBridge.mockGenerateKeypair()
        let encaps = KyberBridge.mockEncapsulate(publicKey: kp.publicKey)
        let ss = KyberBridge.mockDecapsulate(ciphertext: encaps.ciphertext, secretKey: kp.secretKey)
        XCTAssertEqual(ss.count, Self.sharedSecretBytes,
            "Decapsulated shared secret must be \(Self.sharedSecretBytes) bytes")
    }

    func testDecapsulateMatchesEncapsulatedSecret() {
        // In a real round-trip with native lib: decaps(ct, sk) == encaps.sharedSecret
        // With mock: test that the mock contract is internally consistent
        let kp = KyberBridge.mockGenerateKeypair()
        let encaps = KyberBridge.mockEncapsulate(publicKey: kp.publicKey)
        let decapSS = KyberBridge.mockDecapsulate(ciphertext: encaps.ciphertext, secretKey: kp.secretKey)
        // The mock stores (ct → ss) mapping, so decaps must return the correct secret
        XCTAssertEqual(encaps.sharedSecret, decapSS,
            "Decapsulated secret must match encapsulated secret for consistent mock")
    }

    func testDecapsulateWithInvalidCiphertextFails() {
        let kp = KyberBridge.mockGenerateKeypair()
        let shortCT = Data(repeating: 0x00, count: 32)  // Only 32 bytes, not 1088
        let result = KyberBridge.decapsulateValidated(ciphertext: shortCT, secretKey: kp.secretKey)
        XCTAssertNil(result, "Decapsulation with short ciphertext must return nil")
    }

    func testDecapsulateWithInvalidSecretKeyFails() {
        let kp = KyberBridge.mockGenerateKeypair()
        let encaps = KyberBridge.mockEncapsulate(publicKey: kp.publicKey)
        let shortSK = Data(repeating: 0x00, count: 32)  // Only 32 bytes, not 2400
        let result = KyberBridge.decapsulateValidated(ciphertext: encaps.ciphertext, secretKey: shortSK)
        XCTAssertNil(result, "Decapsulation with short secret key must return nil")
    }

    // MARK: - Byte-size Constant Tests

    func testByteConstantsMatchSpec() {
        XCTAssertEqual(KyberBridge.publicKeyBytes, 1184,
            "ML-KEM-768 public key must be 1184 bytes per FIPS 203")
        XCTAssertEqual(KyberBridge.secretKeyBytes, 2400,
            "ML-KEM-768 secret key must be 2400 bytes per FIPS 203")
        XCTAssertEqual(KyberBridge.ciphertextBytes, 1088,
            "ML-KEM-768 ciphertext must be 1088 bytes per FIPS 203")
        XCTAssertEqual(KyberBridge.sharedSecretBytes, 32,
            "ML-KEM-768 shared secret must be 32 bytes per FIPS 203")
    }

    // MARK: - Encoding Tests (base64 round-trip)

    func testPublicKeyBase64RoundTrip() {
        let kp = KyberBridge.mockGenerateKeypair()
        let b64 = kp.publicKey.base64EncodedString()
        let decoded = Data(base64Encoded: b64)
        XCTAssertEqual(kp.publicKey, decoded,
            "Public key must survive base64 encode → decode round-trip")
    }

    func testSecretKeyBase64RoundTrip() {
        let kp = KyberBridge.mockGenerateKeypair()
        let b64 = kp.secretKey.base64EncodedString()
        let decoded = Data(base64Encoded: b64)
        XCTAssertEqual(kp.secretKey, decoded,
            "Secret key must survive base64 encode → decode round-trip")
    }

    // MARK: - Zeroization Tests

    func testSharedSecretCanBeZeroized() {
        let kp = KyberBridge.mockGenerateKeypair()
        let encaps = KyberBridge.mockEncapsulate(publicKey: kp.publicKey)
        var ss = KyberBridge.mockDecapsulate(ciphertext: encaps.ciphertext, secretKey: kp.secretKey)
        ss.resetBytes(in: 0..<ss.count)
        let allZero = ss.allSatisfy { $0 == 0x00 }
        XCTAssertTrue(allZero, "Shared secret must be fully zeroizable after use")
    }
}
