// VPNManager.swift
// ZipVPN
//
// React Native bridge module for controlling the PQ-WireGuard VPN.
// Exposes connect, disconnect, getStatus, and getStatistics to JavaScript
// via the React Native NativeModules API.

import Foundation

// MARK: - Types

/// VPN state machine states.
@objc public enum VPNState: Int, CustomStringConvertible {
    case disconnected = 0
    case connecting   = 1
    case connected    = 2
    case rekeying     = 3
    case error        = 4

    public var description: String {
        switch self {
        case .disconnected: return "disconnected"
        case .connecting:   return "connecting"
        case .connected:    return "connected"
        case .rekeying:     return "rekeying"
        case .error:        return "error"
        }
    }
}

/// Configuration passed from JavaScript via NativeModules.
public struct VPNConfig {
    public var serverEndpoint: String
    public var serverPort: UInt16
    public var serverPublicKey: Data      // 32 bytes (WireGuard Curve25519)
    public var clientPrivateKey: Data     // 32 bytes
    public var tunnelAddress: String      // CIDR, e.g. "10.14.0.2/32"
    public var dns: [String]
    public var rekeyIntervalSeconds: TimeInterval

    public init(
        serverEndpoint: String,
        serverPort: UInt16,
        serverPublicKey: Data,
        clientPrivateKey: Data,
        tunnelAddress: String,
        dns: [String],
        rekeyIntervalSeconds: TimeInterval = 300
    ) {
        self.serverEndpoint = serverEndpoint
        self.serverPort = serverPort
        self.serverPublicKey = serverPublicKey
        self.clientPrivateKey = clientPrivateKey
        self.tunnelAddress = tunnelAddress
        self.dns = dns
        self.rekeyIntervalSeconds = rekeyIntervalSeconds
    }

    /// Convert from an NSDictionary received from JavaScript.
    public static func from(_ dict: NSDictionary) throws -> VPNConfig {
        guard let endpoint = dict["serverEndpoint"] as? String, !endpoint.isEmpty else {
            throw VPNError.invalidConfig("Missing or empty serverEndpoint")
        }
        guard let portNum = dict["serverPort"] as? Int, portNum > 0, portNum < 65536 else {
            throw VPNError.invalidConfig("Invalid serverPort")
        }
        guard let pkBase64 = dict["serverPublicKey"] as? String,
              let pkData = Data(base64Encoded: pkBase64),
              pkData.count == 32 else {
            throw VPNError.invalidConfig("serverPublicKey must be 32-byte base64")
        }
        guard let skBase64 = dict["clientPrivateKey"] as? String,
              let skData = Data(base64Encoded: skBase64),
              skData.count == 32 else {
            throw VPNError.invalidConfig("clientPrivateKey must be 32-byte base64")
        }
        let tunnelAddr = dict["tunnelAddress"] as? String ?? "10.14.0.2/32"
        let dns = dict["dns"] as? [String] ?? ["1.1.1.1"]
        let rekey = dict["rekeyIntervalSeconds"] as? TimeInterval ?? 300

        return VPNConfig(
            serverEndpoint: endpoint,
            serverPort: UInt16(portNum),
            serverPublicKey: pkData,
            clientPrivateKey: skData,
            tunnelAddress: tunnelAddr,
            dns: dns,
            rekeyIntervalSeconds: rekey
        )
    }
}

/// Mutable statistics snapshot.
public struct VPNStatistics {
    public var bytesReceived: UInt64 = 0
    public var bytesSent: UInt64 = 0
    public var latencyMs: Double = 0
    public var connectedSince: Date? = nil
    public var lastRekeyAt: Date? = nil
}

/// VPN error types.
public enum VPNError: Error, LocalizedError {
    case invalidConfig(String)
    case tunnelFailed(String)
    case rekeyFailed(String)
    case alreadyConnected
    case notConnected

    public var errorDescription: String? {
        switch self {
        case .invalidConfig(let m): return "Invalid config: \(m)"
        case .tunnelFailed(let m):  return "Tunnel failed: \(m)"
        case .rekeyFailed(let m):   return "Rekey failed: \(m)"
        case .alreadyConnected:     return "VPN is already connected"
        case .notConnected:         return "VPN is not connected"
        }
    }
}

// MARK: - StatisticsStore

/// Internal mutable store for live statistics.
/// Exposed with `internal` access so the testable subclass can inject values.
class StatisticsStore {
    var bytesReceived: UInt64 = 0
    var bytesSent: UInt64 = 0
    var latencyMs: Double = 0
    var connectedSince: Date? = nil
    var lastRekeyAt: Date? = nil

    func snapshot() -> VPNStatistics {
        return VPNStatistics(
            bytesReceived: bytesReceived,
            bytesSent: bytesSent,
            latencyMs: latencyMs,
            connectedSince: connectedSince,
            lastRekeyAt: lastRekeyAt
        )
    }

    func reset() {
        bytesReceived = 0
        bytesSent = 0
        latencyMs = 0
        connectedSince = nil
        lastRekeyAt = nil
    }
}

// MARK: - VPNManager

/// React Native bridge module for PQ-WireGuard VPN control.
///
/// JavaScript usage:
/// ```typescript
/// import { NativeModules } from 'react-native';
/// const { ZipVPNManager } = NativeModules;
/// await ZipVPNManager.connect({ serverEndpoint: '...', serverPort: 51820, ... });
/// ```
@objc(ZipVPNManager)
open class VPNManager: NSObject {

    // MARK: - State

    private(set) public var state: VPNState = .disconnected {
        didSet {
            guard oldValue != state else { return }
            notifyStateChange(state)
        }
    }

    internal var statisticsStore = StatisticsStore()

    private var pqWireGuard: PQWireGuard?
    private var rekeyTimer: Timer?
    private var currentConfig: VPNConfig?
    private var stateObservers: [(VPNState) -> Void] = []

    // MARK: - Init

    @objc public override init() {
        super.init()
    }

    // MARK: - React Native exports

    /// Connect to the PQ-WireGuard VPN.
    /// - Parameters:
    ///   - config: Dictionary with keys: serverEndpoint, serverPort, serverPublicKey (base64),
    ///             clientPrivateKey (base64), tunnelAddress, dns, rekeyIntervalSeconds.
    @objc public func connect(
        _ config: NSDictionary,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // Validate config
            let vpnConfig: VPNConfig
            do {
                vpnConfig = try VPNConfig.from(config)
            } catch {
                self.setState(.error)
                rejecter("INVALID_CONFIG", error.localizedDescription, error)
                return
            }

            // Guard: already connected
            if self.state == .connected || self.state == .connecting {
                resolver(["status": self.state.description])
                return
            }

            // Validate server public key size
            guard vpnConfig.serverPublicKey.count == 32 else {
                self.setState(.error)
                rejecter("INVALID_CONFIG", "serverPublicKey must be 32 bytes", VPNError.invalidConfig("key size"))
                return
            }

            self.currentConfig = vpnConfig
            self.startConnect(config: vpnConfig)

            resolver(["status": self.state.description])
        }
    }

    /// Disconnect the VPN.
    @objc public func disconnect(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            self?.disconnect()
            resolver(["status": "disconnected"])
        }
    }

    /// Return the current VPN state.
    @objc public func getStatus(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        resolver(["state": state.description])
    }

    /// Return live traffic statistics.
    @objc public func getStatistics(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let stats = statisticsStore.snapshot()
        var result: [String: Any] = [
            "bytesReceived": stats.bytesReceived,
            "bytesSent": stats.bytesSent,
            "latencyMs": stats.latencyMs,
        ]
        if let since = stats.connectedSince {
            result["connectedSince"] = since.timeIntervalSince1970 * 1000
        }
        if let rekey = stats.lastRekeyAt {
            result["lastRekeyAt"] = rekey.timeIntervalSince1970 * 1000
        }
        resolver(result)
    }

    // MARK: - Internal connection lifecycle (overridable for testing)

    /// Start the VPN connection process. Overridable by test subclasses.
    public func startConnect(config: VPNConfig) {
        // Validate: empty endpoint is an immediate error
        guard !config.serverEndpoint.isEmpty else {
            setState(.error)
            return
        }
        // Validate: 32-byte WireGuard public key required
        guard config.serverPublicKey.count == 32 else {
            setState(.error)
            return
        }

        setState(.connecting)

        // In production: instantiate PacketTunnelProvider and start the tunnel.
        // The actual NE session is managed by the iOS system; we communicate
        // with it via NEVPNManager and our PacketTunnelProvider extension.
        let wg = PQWireGuard()
        self.pqWireGuard = wg

        let tunnelConfig = PQWireGuard.TunnelConfig(
            serverEndpoint: config.serverEndpoint,
            serverPort: config.serverPort,
            serverPublicKey: config.serverPublicKey,
            clientPrivateKey: config.clientPrivateKey,
            tunnelAddress: config.tunnelAddress,
            dns: config.dns
        )

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            do {
                let conn = try wg.establishTunnel(config: tunnelConfig)
                conn.start(queue: .global(qos: .userInitiated))
                DispatchQueue.main.async {
                    self.statisticsStore.connectedSince = Date()
                    self.setState(.connected)
                    self.startRekeyTimer(intervalSeconds: config.rekeyIntervalSeconds)
                }
            } catch {
                DispatchQueue.main.async {
                    self.setState(.error)
                }
            }
        }
    }

    /// Disconnect the VPN. Safe to call from any state.
    public func disconnect() {
        stopRekeyTimer()
        pqWireGuard?.zeroize()
        pqWireGuard = nil
        statisticsStore.reset()
        setState(.disconnected)
    }

    // MARK: - Rekey timer

    public func startRekeyTimer(intervalSeconds: TimeInterval = PQWireGuard.defaultRekeyInterval) {
        let clamped = min(max(intervalSeconds, PQWireGuard.minimumRekeyInterval),
                         PQWireGuard.maximumRekeyInterval)
        stopRekeyTimer()
        rekeyTimer = Timer.scheduledTimer(
            withTimeInterval: clamped,
            repeats: true
        ) { [weak self] _ in
            self?.performKyberRekey()
        }
    }

    private func stopRekeyTimer() {
        rekeyTimer?.invalidate()
        rekeyTimer = nil
    }

    private func performKyberRekey() {
        guard state == .connected else { return }
        setState(.rekeying)
        // In production: send app message to PacketTunnelProvider to execute rekey
        // For now update statistics and return to connected
        statisticsStore.lastRekeyAt = Date()
        setState(.connected)
    }

    // MARK: - Network path change handling

    /// Called when the device switches between Wi-Fi and cellular.
    /// Initiates a reconnect to re-establish the tunnel over the new path.
    public func handleNetworkPathChange() {
        guard state == .connected || state == .rekeying else { return }
        guard let config = currentConfig else { return }
        stopRekeyTimer()
        // Restart connection on the new network path
        setState(.connecting)
        startConnect(config: config)
    }

    // MARK: - Statistics

    /// Returns a snapshot of the current statistics.
    public func getStatistics() -> VPNStatistics {
        return statisticsStore.snapshot()
    }

    // MARK: - State observers

    /// Register a closure to be called whenever the VPN state changes.
    public func addStateObserver(_ observer: @escaping (VPNState) -> Void) {
        stateObservers.append(observer)
    }

    private func notifyStateChange(_ newState: VPNState) {
        stateObservers.forEach { $0(newState) }
    }

    // MARK: - Open state setter (overridable by test subclass)

    /// Set the VPN state. Override in tests to observe transitions.
    open func setState(_ newState: VPNState) {
        state = newState
    }

    // MARK: - React Native module name

    @objc public static func moduleName() -> String! {
        return "ZipVPNManager"
    }
}

// MARK: - RCT type aliases (stub when not running under React Native)
// These allow the file to compile in a plain XCTest environment.

#if canImport(React)
import React
#else
public typealias RCTPromiseResolveBlock = (Any?) -> Void
public typealias RCTPromiseRejectBlock = (String?, String?, Error?) -> Void
#endif
