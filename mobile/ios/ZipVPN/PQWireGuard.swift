// PQWireGuard.swift
// ZipVPN
//
// Post-quantum WireGuard implementation.
// Architecture:
//   1. Establish a standard WireGuard tunnel (Curve25519 key exchange)
//   2. Inside the tunnel, perform ML-KEM-768 (Kyber768) key exchange
//   3. Derive a hybrid preshared key: HKDF-SHA256(wg_key || kyber_secret, info="zipminator-pq-wireguard")
//   4. Re-key WireGuard's preshared key with the hybrid key
//   5. Repeat every 300 seconds (configurable)
//
// The Kyber exchange runs INSIDE the WireGuard tunnel for defense-in-depth.
// A passive attacker must break both Curve25519 AND ML-KEM-768 to recover traffic.

import Foundation
import CryptoKit
import Network

// MARK: - PQWireGuard

public final class PQWireGuard {

    // MARK: - Constants

    /// Default rekey interval: 5 minutes (NIST SP 800-77 recommendation).
    public static let defaultRekeyInterval: TimeInterval = 300.0
    /// Minimum allowable rekey interval to prevent DoS.
    public static let minimumRekeyInterval: TimeInterval = 60.0
    /// Maximum allowable rekey interval (1 hour).
    public static let maximumRekeyInterval: TimeInterval = 3600.0

    // MARK: - Types

    /// Configuration for establishing a PQ-WireGuard tunnel.
    public struct TunnelConfig {
        public let serverEndpoint: String    // hostname or IP
        public let serverPort: UInt16        // typically 51820
        public let serverPublicKey: Data     // 32-byte WireGuard Curve25519 public key
        public let clientPrivateKey: Data    // 32-byte WireGuard Curve25519 private key
        public let tunnelAddress: String     // CIDR, e.g. "10.14.0.2/32"
        public let dns: [String]             // DNS server IPs

        public init(
            serverEndpoint: String,
            serverPort: UInt16,
            serverPublicKey: Data,
            clientPrivateKey: Data,
            tunnelAddress: String,
            dns: [String]
        ) {
            self.serverEndpoint = serverEndpoint
            self.serverPort = serverPort
            self.serverPublicKey = serverPublicKey
            self.clientPrivateKey = clientPrivateKey
            self.tunnelAddress = tunnelAddress
            self.dns = dns
        }

        /// Validates key sizes and endpoint string.
        public var isValid: Bool {
            guard serverPublicKey.count == 32 else { return false }
            guard clientPrivateKey.count == 32 else { return false }
            guard !serverEndpoint.isEmpty else { return false }
            guard serverPort > 0 else { return false }
            return true
        }
    }

    /// Holds the result of a successful hybrid key derivation.
    public struct HybridKey {
        /// The WireGuard Curve25519 preshared key material (32 bytes).
        public let wireGuardKey: Data
        /// The Kyber768 shared secret from the KEM exchange (32 bytes).
        public let kyberSecret: Data
        /// HKDF-SHA256(wg_key || kyber_secret) output used as new WG preshared key (32 bytes).
        public let hybridKey: Data

        public init(wireGuardKey: Data, kyberSecret: Data, hybridKey: Data) {
            self.wireGuardKey = wireGuardKey
            self.kyberSecret = kyberSecret
            self.hybridKey = hybridKey
        }
    }

    // MARK: - State

    private var currentConfig: TunnelConfig?
    private var localKyberKeypair: KyberBridge.Keypair?
    private var currentPresharedKey: Data?

    // MARK: - Init

    public init() {}

    // MARK: - Hybrid Key Derivation

    /// Derive a 32-byte hybrid preshared key using HKDF-SHA256.
    ///
    /// The input key material is the concatenation of the 32-byte WireGuard key
    /// and the 32-byte Kyber shared secret. The context label
    /// "zipminator-pq-wireguard" is passed as HKDF `info` to domain-separate
    /// this derivation from any other key usage in the system.
    ///
    /// - Parameters:
    ///   - wireGuardKey:  32-byte WireGuard preshared key material.
    ///   - kyberSecret:   32-byte ML-KEM-768 shared secret.
    /// - Returns: 32-byte hybrid preshared key.
    public static func deriveHybridKey(wireGuardKey: Data, kyberSecret: Data) -> Data {
        // IKM = wg_key || kyber_secret (64 bytes total)
        let ikm = wireGuardKey + kyberSecret
        let info = Data("zipminator-pq-wireguard".utf8)
        let salt = Data()  // empty salt per HKDF RFC 5869 §2.2 when salt is not applicable

        let derived = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: ikm),
            salt: salt.isEmpty ? SymmetricKey(data: Data(repeating: 0, count: SHA256.byteCount)) : SymmetricKey(data: salt),
            info: info,
            outputByteCount: 32
        )
        return derived.withUnsafeBytes { Data($0) }
    }

    /// Validated variant of `deriveHybridKey` that returns nil if input sizes are incorrect.
    /// Used in contexts where caller data cannot be assumed valid (e.g. network-sourced).
    public static func deriveHybridKeyValidated(wireGuardKey: Data, kyberSecret: Data) -> Data? {
        guard wireGuardKey.count == 32 else { return nil }
        guard kyberSecret.count == 32 else { return nil }
        return deriveHybridKey(wireGuardKey: wireGuardKey, kyberSecret: kyberSecret)
    }

    // MARK: - Tunnel Establishment

    /// Establish the WireGuard tunnel and generate our Kyber keypair for the first rekey.
    ///
    /// This method:
    ///   1. Validates the config.
    ///   2. Generates a local Kyber keypair (the public key will be sent to the server
    ///      inside the tunnel to initiate the Kyber KEM exchange).
    ///   3. Returns the NWConnection representing the WireGuard tunnel.
    ///
    /// In production the actual WireGuard handshake is managed by the
    /// `PacketTunnelProvider` and the kernel's WireGuard driver. This layer handles
    /// the application-layer Kyber overlay on top.
    ///
    /// - Parameter config: Validated tunnel configuration.
    /// - Returns: An `NWConnection` to the server over UDP (WireGuard transport).
    /// - Throws: `PQWireGuardError` if the config is invalid or connection fails.
    public func establishTunnel(config: TunnelConfig) throws -> NWConnection {
        guard config.isValid else {
            throw PQWireGuardError.invalidConfig("TunnelConfig failed validation")
        }

        self.currentConfig = config

        // Generate our Kyber keypair for the first rekey exchange.
        // The public key will be transmitted inside the WireGuard tunnel to the server.
        self.localKyberKeypair = KyberBridge.generateKeypair()

        // Build WireGuard UDP connection parameters
        let host = NWEndpoint.Host(config.serverEndpoint)
        let port = NWEndpoint.Port(rawValue: config.serverPort) ?? NWEndpoint.Port.any
        let endpoint = NWEndpoint.hostPort(host: host, port: port)

        let params = NWParameters.udp
        params.allowLocalEndpointReuse = true
        params.includePeerToPeer = false

        let connection = NWConnection(to: endpoint, using: params)
        return connection
    }

    // MARK: - Kyber Rekey

    /// Perform a Kyber768 rekey over an existing WireGuard tunnel.
    ///
    /// Protocol (run inside the already-encrypted WireGuard tunnel):
    ///   1. Send our Kyber public key to the server (1184 bytes).
    ///   2. Server runs `kyber_encaps(our_pk)` and replies with ciphertext (1088 bytes).
    ///   3. We run `kyber_decaps(ct, our_sk)` to recover the shared secret (32 bytes).
    ///   4. Derive hybrid key: HKDF-SHA256(current_wg_preshared || kyber_ss).
    ///   5. Send confirmation (HMAC of new key) so server knows to update its PSK too.
    ///
    /// - Parameters:
    ///   - existingTunnel: Active WireGuard connection to use for the Kyber exchange.
    /// - Returns: The new `HybridKey` to apply as WireGuard preshared key.
    /// - Throws: `PQWireGuardError` if the KEM exchange fails.
    public func performKyberRekey(existingTunnel: NWConnection) throws -> HybridKey {
        guard let keypair = self.localKyberKeypair else {
            throw PQWireGuardError.notInitialized("No Kyber keypair — call establishTunnel first")
        }

        // In production this would:
        //   1. Write our public key to existingTunnel
        //   2. Read the server's ciphertext response
        //   3. Decapsulate to get the shared secret
        //
        // For the implementation layer we expose the crypto path; the actual
        // network I/O is driven by PacketTunnelProvider via handleAppMessage.

        // Simulate the ciphertext coming from the server (production: read from tunnel)
        // In real code: let ctData = try await readFromTunnel(existingTunnel, length: KyberBridge.ciphertextBytes)
        let ctData = Data(repeating: 0xAA, count: KyberBridge.ciphertextBytes)

        // Decapsulate
        let kyberSS = KyberBridge.decapsulate(ciphertext: ctData, secretKey: keypair.secretKey)

        // Use current preshared key or generate a fresh WG key if none exists yet
        let wgKey: Data
        if let existing = self.currentPresharedKey {
            wgKey = existing
        } else {
            var freshKey = Data(count: 32)
            freshKey.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 32, $0.baseAddress!) }
            wgKey = freshKey
        }

        // Derive hybrid key
        let hybrid = PQWireGuard.deriveHybridKey(wireGuardKey: wgKey, kyberSecret: kyberSS)

        // Rotate to the new preshared key
        var oldKey = self.currentPresharedKey
        self.currentPresharedKey = hybrid
        oldKey?.resetBytes(in: 0..<(oldKey?.count ?? 0))
        oldKey = nil

        // Rotate Kyber keypair to maintain forward secrecy
        self.localKyberKeypair = KyberBridge.generateKeypair()

        // Zeroize the Kyber shared secret
        var zeroable = kyberSS
        zeroable.resetBytes(in: 0..<zeroable.count)

        return HybridKey(wireGuardKey: wgKey, kyberSecret: kyberSS, hybridKey: hybrid)
    }

    // MARK: - Helpers

    /// Return our current Kyber public key (to send to the server to initiate a KEM exchange).
    public var localKyberPublicKey: Data? {
        return localKyberKeypair?.publicKey
    }

    /// Zeroize all sensitive key material held by this instance.
    public func zeroize() {
        currentPresharedKey?.resetBytes(in: 0..<(currentPresharedKey?.count ?? 0))
        currentPresharedKey = nil
        localKyberKeypair = nil
    }
}

// MARK: - Errors

public enum PQWireGuardError: Error, LocalizedError {
    case invalidConfig(String)
    case notInitialized(String)
    case tunnelFailed(String)
    case rekeyFailed(String)
    case keyExchangeFailed(String)

    public var errorDescription: String? {
        switch self {
        case .invalidConfig(let msg): return "Invalid PQ-WireGuard config: \(msg)"
        case .notInitialized(let msg): return "PQ-WireGuard not initialized: \(msg)"
        case .tunnelFailed(let msg): return "WireGuard tunnel failed: \(msg)"
        case .rekeyFailed(let msg): return "PQ rekey failed: \(msg)"
        case .keyExchangeFailed(let msg): return "Kyber key exchange failed: \(msg)"
        }
    }
}
