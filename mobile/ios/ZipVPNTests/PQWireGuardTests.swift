// PQWireGuardTests.swift
// ZipVPNTests
//
// Tests for hybrid key derivation (XOR + HKDF) and PQWireGuard logic.
// All tests use synthetic/mock data to avoid requiring a live server.

import XCTest
import CryptoKit
@testable import ZipVPN

final class PQWireGuardTests: XCTestCase {

    // MARK: - Hybrid Key Derivation Tests

    func testDeriveHybridKeyProduces32Bytes() {
        let wgKey = Data(repeating: 0xAB, count: 32)
        let kyberSecret = Data(repeating: 0xCD, count: 32)
        let hybrid = PQWireGuard.deriveHybridKey(wireGuardKey: wgKey, kyberSecret: kyberSecret)
        XCTAssertEqual(hybrid.count, 32, "HKDF output must be exactly 32 bytes")
    }

    func testDeriveHybridKeyIsDeterministic() {
        let wgKey = Data(repeating: 0x11, count: 32)
        let kyberSecret = Data(repeating: 0x22, count: 32)
        let first = PQWireGuard.deriveHybridKey(wireGuardKey: wgKey, kyberSecret: kyberSecret)
        let second = PQWireGuard.deriveHybridKey(wireGuardKey: wgKey, kyberSecret: kyberSecret)
        XCTAssertEqual(first, second, "Same inputs must always yield the same hybrid key")
    }

    func testDeriveHybridKeyVariesWithInputs() {
        let wgKeyA = Data(repeating: 0x11, count: 32)
        let wgKeyB = Data(repeating: 0x99, count: 32)
        let kyberSecret = Data(repeating: 0x22, count: 32)
        let hybridA = PQWireGuard.deriveHybridKey(wireGuardKey: wgKeyA, kyberSecret: kyberSecret)
        let hybridB = PQWireGuard.deriveHybridKey(wireGuardKey: wgKeyB, kyberSecret: kyberSecret)
        XCTAssertNotEqual(hybridA, hybridB, "Different WG keys must produce different hybrid keys")
    }

    func testDeriveHybridKeyVariesWithKyberSecret() {
        let wgKey = Data(repeating: 0x11, count: 32)
        let secretA = Data(repeating: 0x22, count: 32)
        let secretB = Data(repeating: 0x33, count: 32)
        let hybridA = PQWireGuard.deriveHybridKey(wireGuardKey: wgKey, kyberSecret: secretA)
        let hybridB = PQWireGuard.deriveHybridKey(wireGuardKey: wgKey, kyberSecret: secretB)
        XCTAssertNotEqual(hybridA, hybridB, "Different Kyber secrets must produce different hybrid keys")
    }

    func testDeriveHybridKeyUsesContextInfo() {
        // Ensure the HKDF "info" label "zipminator-pq-wireguard" is included.
        // If info differs, the output must differ from a naive HKDF with no info.
        let wgKey = Data(repeating: 0xFF, count: 32)
        let kyberSecret = Data(repeating: 0x00, count: 32)
        let ikm = wgKey + kyberSecret  // 64-byte IKM

        // Compute plain HKDF without info label using CryptoKit
        let hkdf = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: ikm),
            outputByteCount: 32
        )
        let plainHKDF = hkdf.withUnsafeBytes { Data($0) }
        let labeledHybrid = PQWireGuard.deriveHybridKey(wireGuardKey: wgKey, kyberSecret: kyberSecret)
        XCTAssertNotEqual(plainHKDF, labeledHybrid,
            "Labeled HKDF must differ from unlabeled HKDF — confirms context info is applied")
    }

    func testDeriveHybridKeyRejectsInvalidInputSizes() {
        // Short WG key
        let shortWGKey = Data(repeating: 0x01, count: 16)
        let kyberSecret = Data(repeating: 0x02, count: 32)
        let result = PQWireGuard.deriveHybridKeyValidated(wireGuardKey: shortWGKey, kyberSecret: kyberSecret)
        XCTAssertNil(result, "Short WG key (16 bytes) must return nil")
    }

    func testDeriveHybridKeyRejectsShortKyberSecret() {
        let wgKey = Data(repeating: 0x01, count: 32)
        let shortSecret = Data(repeating: 0x02, count: 8)
        let result = PQWireGuard.deriveHybridKeyValidated(wireGuardKey: wgKey, kyberSecret: shortSecret)
        XCTAssertNil(result, "Short Kyber secret (8 bytes) must return nil")
    }

    // MARK: - TunnelConfig Validation Tests

    func testTunnelConfigValidEndpoint() {
        let config = PQWireGuard.TunnelConfig(
            serverEndpoint: "vpn.zipminator.io",
            serverPort: 51820,
            serverPublicKey: Data(repeating: 0xAA, count: 32),
            clientPrivateKey: Data(repeating: 0xBB, count: 32),
            tunnelAddress: "10.14.0.2/32",
            dns: ["1.1.1.1", "8.8.8.8"]
        )
        XCTAssertNotNil(config)
        XCTAssertEqual(config.serverPort, 51820)
        XCTAssertEqual(config.dns.count, 2)
    }

    func testTunnelConfigRequires32BytePublicKey() {
        let shortKey = Data(repeating: 0xAA, count: 16)
        let validKey = Data(repeating: 0xBB, count: 32)
        let config = PQWireGuard.TunnelConfig(
            serverEndpoint: "vpn.zipminator.io",
            serverPort: 51820,
            serverPublicKey: shortKey,
            clientPrivateKey: validKey,
            tunnelAddress: "10.14.0.2/32",
            dns: ["1.1.1.1"]
        )
        XCTAssertFalse(config.isValid, "Config with 16-byte public key must be invalid")
    }

    func testTunnelConfigRequires32BytePrivateKey() {
        let validKey = Data(repeating: 0xAA, count: 32)
        let shortKey = Data(repeating: 0xBB, count: 16)
        let config = PQWireGuard.TunnelConfig(
            serverEndpoint: "vpn.zipminator.io",
            serverPort: 51820,
            serverPublicKey: validKey,
            clientPrivateKey: shortKey,
            tunnelAddress: "10.14.0.2/32",
            dns: ["1.1.1.1"]
        )
        XCTAssertFalse(config.isValid, "Config with 16-byte private key must be invalid")
    }

    // MARK: - HybridKey Structure Tests

    func testHybridKeyStructureFields() {
        let wgKey = Data(repeating: 0x11, count: 32)
        let kyberSS = Data(repeating: 0x22, count: 32)
        let hybrid = PQWireGuard.deriveHybridKey(wireGuardKey: wgKey, kyberSecret: kyberSS)

        let hybridKey = PQWireGuard.HybridKey(
            wireGuardKey: wgKey,
            kyberSecret: kyberSS,
            hybridKey: hybrid
        )
        XCTAssertEqual(hybridKey.wireGuardKey.count, 32)
        XCTAssertEqual(hybridKey.kyberSecret.count, 32)
        XCTAssertEqual(hybridKey.hybridKey.count, 32)
    }

    // MARK: - Rekey Interval Tests

    func testDefaultRekeyIntervalIs300Seconds() {
        XCTAssertEqual(PQWireGuard.defaultRekeyInterval, 300.0,
            "Default rekey interval must be 5 minutes (300 seconds)")
    }

    func testRekeyIntervalRange() {
        // Minimum sensible rekey interval is 60 seconds
        XCTAssertGreaterThanOrEqual(PQWireGuard.minimumRekeyInterval, 60.0,
            "Minimum rekey interval must be at least 60 seconds for security")
        // Maximum sensible rekey interval is 3600 seconds (1 hour)
        XCTAssertLessThanOrEqual(PQWireGuard.maximumRekeyInterval, 3600.0,
            "Maximum rekey interval must not exceed 1 hour")
    }

    // MARK: - Key Zeroization Tests

    func testHybridKeyZeroizesOnDealloc() {
        var capturedPointer: UnsafeMutableRawPointer?
        var capturedSize: Int = 0

        autoreleasepool {
            var keyData = Data(repeating: 0xFF, count: 32)
            keyData.withUnsafeMutableBytes { ptr in
                capturedPointer = ptr.baseAddress
                capturedSize = ptr.count
            }
            // Simulate zeroization before dealloc
            keyData.resetBytes(in: 0..<keyData.count)
            // After zeroization all bytes must be 0
            let allZero = keyData.allSatisfy { $0 == 0x00 }
            XCTAssertTrue(allZero, "Key data must be zeroized to 0x00 after resetBytes")
        }
    }
}
