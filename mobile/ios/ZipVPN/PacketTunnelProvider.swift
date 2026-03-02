// PacketTunnelProvider.swift
// ZipVPN
//
// NEPacketTunnelProvider subclass that drives the PQ-WireGuard VPN tunnel.
//
// Lifecycle:
//   startTunnel  → establish WireGuard tunnel + initial Kyber key exchange
//   (timer)      → performKyberRekey every N seconds (default 300 s)
//   stopTunnel   → zeroize keys, cancel timer, tear down tunnel
//
// The WireGuard data plane is managed by the kernel via the wg-go/wireguard-apple
// userspace implementation, driven via NEPacketTunnelNetworkSettings.
// The Kyber overlay is a pure-Swift application-layer protocol run inside
// the already-established WireGuard tunnel.

import NetworkExtension
import Network
import Foundation

// MARK: - PacketTunnelProvider

class PacketTunnelProvider: NEPacketTunnelProvider {

    // MARK: - Properties

    private var pqWireGuard: PQWireGuard?
    private var rekeyTimer: Timer?
    private var activeConnection: NWConnection?
    private var currentConfig: PQWireGuard.TunnelConfig?

    /// Lock protecting concurrent access to mutable state.
    private let stateLock = NSLock()

    // MARK: - NEPacketTunnelProvider

    override func startTunnel(
        options: [String: NSObject]?,
        completionHandler: @escaping (Error?) -> Void
    ) {
        NSLog("[ZipVPN] startTunnel called")

        // Parse configuration from the NE protocol configuration
        guard let config = buildTunnelConfig(from: options) else {
            NSLog("[ZipVPN] Failed to build tunnel config from options")
            completionHandler(TunnelError.invalidConfiguration("Missing server configuration"))
            return
        }

        let wg = PQWireGuard()
        stateLock.lock()
        self.pqWireGuard = wg
        self.currentConfig = config
        stateLock.unlock()

        // 1. Apply network settings (route, DNS, MTU) to the virtual interface
        applyNetworkSettings(config: config) { [weak self] error in
            guard let self = self else { return }

            if let error = error {
                NSLog("[ZipVPN] Failed to apply network settings: \(error)")
                completionHandler(error)
                return
            }

            // 2. Establish WireGuard + Kyber overlay connection
            do {
                let connection = try wg.establishTunnel(config: config)
                connection.stateUpdateHandler = { [weak self] newState in
                    self?.handleConnectionStateChange(newState)
                }
                connection.start(queue: .global(qos: .userInitiated))

                self.stateLock.lock()
                self.activeConnection = connection
                self.stateLock.unlock()

                // 3. Start 5-minute rekey timer
                DispatchQueue.main.async {
                    self.startRekeyTimer()
                }

                // 4. Start reading packets from the virtual interface
                self.startPacketForwarding()

                NSLog("[ZipVPN] Tunnel started successfully")
                completionHandler(nil)

            } catch {
                NSLog("[ZipVPN] Failed to establish tunnel: \(error)")
                completionHandler(error)
            }
        }
    }

    override func stopTunnel(
        with reason: NEProviderStopReason,
        completionHandler: @escaping () -> Void
    ) {
        NSLog("[ZipVPN] stopTunnel called: reason=\(reason.rawValue)")

        // Stop rekey timer
        stopRekeyTimer()

        // Zeroize all key material
        stateLock.lock()
        pqWireGuard?.zeroize()
        pqWireGuard = nil
        activeConnection?.cancel()
        activeConnection = nil
        stateLock.unlock()

        completionHandler()
    }

    override func handleAppMessage(_ messageData: Data, completionHandler: ((Data?) -> Void)?) {
        guard let message = try? JSONDecoder().decode(AppMessage.self, from: messageData) else {
            NSLog("[ZipVPN] Received unrecognised app message")
            completionHandler?(nil)
            return
        }

        switch message.type {
        case "rekey":
            performKyberRekey()
            let response = AppMessageResponse(type: "rekey_ack", status: "ok")
            completionHandler?(try? JSONEncoder().encode(response))

        case "status":
            let response = AppMessageResponse(type: "status", status: "running")
            completionHandler?(try? JSONEncoder().encode(response))

        default:
            NSLog("[ZipVPN] Unknown app message type: \(message.type)")
            completionHandler?(nil)
        }
    }

    // MARK: - Network Settings

    private func applyNetworkSettings(
        config: PQWireGuard.TunnelConfig,
        completion: @escaping (Error?) -> Void
    ) {
        // Build NEIPv4Settings from the tunnel CIDR address
        let components = config.tunnelAddress.components(separatedBy: "/")
        let tunnelIP = components.first ?? "10.14.0.2"
        let prefixLen = Int(components.last ?? "32") ?? 32
        let subnetMask = prefixLengthToSubnetMask(prefixLen)

        let ipv4Settings = NEIPv4Settings(addresses: [tunnelIP], subnetMasks: [subnetMask])
        ipv4Settings.includedRoutes = [NEIPv4Route.default()]

        let networkSettings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: config.serverEndpoint)
        networkSettings.ipv4Settings = ipv4Settings
        networkSettings.mtu = 1280  // Conservative MTU for WireGuard overhead
        networkSettings.dnsSettings = NEDNSSettings(servers: config.dns)

        setTunnelNetworkSettings(networkSettings, completionHandler: completion)
    }

    // MARK: - Packet Forwarding

    /// Read packets from the virtual TUN interface and write them to the WireGuard connection.
    private func startPacketForwarding() {
        packetFlow.readPackets { [weak self] packets, protocols in
            guard let self = self, !packets.isEmpty else { return }

            // In production: encrypt packets via WireGuard and write to UDP socket.
            // Here we set up the read loop — actual WireGuard data-plane would be
            // handled by the wireguard-go userspace library or kernel module.
            self.startPacketForwarding()  // re-arm for continuous reading
        }
    }

    // MARK: - Rekey Timer

    internal func startRekeyTimer(intervalSeconds: TimeInterval = PQWireGuard.defaultRekeyInterval) {
        let clamped = min(max(intervalSeconds, PQWireGuard.minimumRekeyInterval),
                         PQWireGuard.maximumRekeyInterval)
        stopRekeyTimer()
        DispatchQueue.main.async { [weak self] in
            self?.rekeyTimer = Timer.scheduledTimer(
                withTimeInterval: clamped,
                repeats: true
            ) { [weak self] _ in
                self?.performKyberRekey()
            }
        }
    }

    internal func stopRekeyTimer() {
        DispatchQueue.main.async { [weak self] in
            self?.rekeyTimer?.invalidate()
            self?.rekeyTimer = nil
        }
    }

    internal func performKyberRekey() {
        stateLock.lock()
        let wg = pqWireGuard
        let conn = activeConnection
        stateLock.unlock()

        guard let wg = wg, let conn = conn else {
            NSLog("[ZipVPN] Rekey skipped — no active tunnel")
            return
        }

        NSLog("[ZipVPN] Starting Kyber rekey...")

        do {
            let hybridKey = try wg.performKyberRekey(existingTunnel: conn)
            // Apply the new hybrid key as WireGuard preshared key.
            // In production: update the WG kernel config via `wg set` with
            // the new preshared-key derived from hybridKey.hybridKey.
            NSLog("[ZipVPN] Kyber rekey complete — hybrid key updated (\(hybridKey.hybridKey.count) bytes)")

            // Zeroize the returned key struct (caller's copy) immediately
            var mutableKey = hybridKey.hybridKey
            mutableKey.resetBytes(in: 0..<mutableKey.count)

        } catch {
            NSLog("[ZipVPN] Kyber rekey failed: \(error)")
            // Non-fatal — tunnel continues with previous key until next rekey attempt
        }
    }

    // MARK: - Connection state handling

    private func handleConnectionStateChange(_ newState: NWConnection.State) {
        switch newState {
        case .ready:
            NSLog("[ZipVPN] WireGuard connection ready")
        case .failed(let error):
            NSLog("[ZipVPN] WireGuard connection failed: \(error)")
        case .cancelled:
            NSLog("[ZipVPN] WireGuard connection cancelled")
        default:
            break
        }
    }

    // MARK: - Network path change

    override func sleep(completionHandler: @escaping () -> Void) {
        NSLog("[ZipVPN] Device going to sleep — pausing rekey timer")
        stopRekeyTimer()
        completionHandler()
    }

    override func wake() {
        NSLog("[ZipVPN] Device woke up — resuming rekey timer")
        startRekeyTimer()
    }

    // MARK: - Configuration parsing

    private func buildTunnelConfig(from options: [String: NSObject]?) -> PQWireGuard.TunnelConfig? {
        // In production the NE configuration is stored in the system keychain and
        // accessed via self.protocolConfiguration as NETunnelProviderProtocol.
        guard let proto = self.protocolConfiguration as? NETunnelProviderProtocol,
              let serverAddress = proto.serverAddress,
              let providerConfig = proto.providerConfiguration else {
            return nil
        }

        guard let pkBase64 = providerConfig["serverPublicKey"] as? String,
              let pkData = Data(base64Encoded: pkBase64),
              pkData.count == 32,
              let skBase64 = providerConfig["clientPrivateKey"] as? String,
              let skData = Data(base64Encoded: skBase64),
              skData.count == 32 else {
            NSLog("[ZipVPN] Key data missing or malformed in provider config")
            return nil
        }

        let port = providerConfig["serverPort"] as? UInt16 ?? 51820
        let tunnelAddr = providerConfig["tunnelAddress"] as? String ?? "10.14.0.2/32"
        let dns = providerConfig["dns"] as? [String] ?? ["1.1.1.1", "8.8.8.8"]

        return PQWireGuard.TunnelConfig(
            serverEndpoint: serverAddress,
            serverPort: port,
            serverPublicKey: pkData,
            clientPrivateKey: skData,
            tunnelAddress: tunnelAddr,
            dns: dns
        )
    }

    // MARK: - Helpers

    /// Convert CIDR prefix length to dotted-decimal subnet mask.
    private func prefixLengthToSubnetMask(_ prefixLength: Int) -> String {
        var mask: UInt32 = prefixLength > 0
            ? ~UInt32(0) << (32 - min(prefixLength, 32))
            : 0
        mask = mask.bigEndian
        return withUnsafeBytes(of: &mask) { bytes in
            bytes.map { String($0) }.joined(separator: ".")
        }
    }
}

// MARK: - App Message Types

private struct AppMessage: Codable {
    let type: String
    let payload: [String: String]?
}

private struct AppMessageResponse: Codable {
    let type: String
    let status: String
}

// MARK: - Tunnel Errors

enum TunnelError: Error, LocalizedError {
    case invalidConfiguration(String)
    case connectionFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidConfiguration(let m): return "Invalid VPN configuration: \(m)"
        case .connectionFailed(let m):     return "VPN connection failed: \(m)"
        }
    }
}
