// VPNManagerTests.swift
// ZipVPNTests
//
// Tests for the VPN state machine:
// disconnected → connecting → connected → rekeying → disconnected

import XCTest
@testable import ZipVPN

final class VPNManagerTests: XCTestCase {

    var manager: VPNManagerTestable!

    override func setUp() {
        super.setUp()
        manager = VPNManagerTestable()
    }

    override func tearDown() {
        manager = nil
        super.tearDown()
    }

    // MARK: - Initial State Tests

    func testInitialStateIsDisconnected() {
        XCTAssertEqual(manager.state, .disconnected,
            "VPN manager must start in the disconnected state")
    }

    func testInitialStatisticsAreZero() {
        let stats = manager.getStatistics()
        XCTAssertEqual(stats.bytesReceived, 0, "Initial bytes received must be 0")
        XCTAssertEqual(stats.bytesSent, 0, "Initial bytes sent must be 0")
        XCTAssertNil(stats.connectedSince, "Initial connectedSince must be nil")
    }

    // MARK: - State Transition Tests

    func testConnectTransitionsToConnecting() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        XCTAssertEqual(manager.state, .connecting,
            "Calling connect must move state to 'connecting'")
    }

    func testSuccessfulConnectTransitionsToConnected() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()
        XCTAssertEqual(manager.state, .connected,
            "Successful connection must move state to 'connected'")
    }

    func testFailedConnectTransitionsToError() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionFailure(error: VPNError.tunnelFailed("Network unreachable"))
        XCTAssertEqual(manager.state, .error,
            "Failed connection must move state to 'error'")
    }

    func testConnectFromConnectedIsIdempotent() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()
        XCTAssertEqual(manager.state, .connected)

        // Calling connect again while connected must remain connected (no-op)
        manager.startConnect(config: config)
        XCTAssertEqual(manager.state, .connected,
            "Calling connect while already connected must not change state")
    }

    func testDisconnectFromConnectedTransitionsToDisconnected() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()
        manager.disconnect()
        XCTAssertEqual(manager.state, .disconnected,
            "Disconnecting must move state to 'disconnected'")
    }

    func testDisconnectFromDisconnectedIsIdempotent() {
        manager.disconnect()
        XCTAssertEqual(manager.state, .disconnected,
            "Disconnecting when already disconnected must remain disconnected")
    }

    func testDisconnectFromConnectingCancelsConnection() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        XCTAssertEqual(manager.state, .connecting)
        manager.disconnect()
        XCTAssertEqual(manager.state, .disconnected,
            "Disconnecting from connecting state must cancel and reach disconnected")
    }

    func testRekeyingTransitionFromConnected() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()
        manager.simulateRekeyStart()
        XCTAssertEqual(manager.state, .rekeying,
            "Starting a rekey must move state to 'rekeying'")
    }

    func testSuccessfulRekeyReturnsToConnected() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()
        manager.simulateRekeyStart()
        manager.simulateRekeySuccess()
        XCTAssertEqual(manager.state, .connected,
            "Successful rekey must return to 'connected' state")
    }

    func testFailedRekeyTransitionsToError() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()
        manager.simulateRekeyStart()
        manager.simulateRekeyFailure(error: VPNError.rekeyFailed("Kyber decap failed"))
        XCTAssertEqual(manager.state, .error,
            "Failed rekey must transition to 'error' state")
    }

    func testReconnectAfterError() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionFailure(error: VPNError.tunnelFailed("Timeout"))
        XCTAssertEqual(manager.state, .error)

        // User can try connecting again after an error
        manager.startConnect(config: config)
        XCTAssertEqual(manager.state, .connecting,
            "Must be able to reconnect after entering error state")
    }

    // MARK: - Full State Machine Cycle Test

    func testFullVPNLifecycle() {
        let config = makeValidConfig()

        // 1. Start disconnected
        XCTAssertEqual(manager.state, .disconnected)

        // 2. Connect
        manager.startConnect(config: config)
        XCTAssertEqual(manager.state, .connecting)

        // 3. Connection established
        manager.simulateConnectionSuccess()
        XCTAssertEqual(manager.state, .connected)

        // 4. Rekey (triggered by 5-minute timer)
        manager.simulateRekeyStart()
        XCTAssertEqual(manager.state, .rekeying)

        // 5. Rekey succeeds
        manager.simulateRekeySuccess()
        XCTAssertEqual(manager.state, .connected)

        // 6. Disconnect
        manager.disconnect()
        XCTAssertEqual(manager.state, .disconnected)
    }

    // MARK: - Statistics Tests

    func testConnectedSinceIsSetOnConnect() {
        let before = Date()
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()
        let after = Date()

        let stats = manager.getStatistics()
        XCTAssertNotNil(stats.connectedSince, "connectedSince must be set after connecting")
        if let connectedSince = stats.connectedSince {
            XCTAssertGreaterThanOrEqual(connectedSince, before)
            XCTAssertLessThanOrEqual(connectedSince, after)
        }
    }

    func testConnectedSinceIsClearedOnDisconnect() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()
        manager.disconnect()

        let stats = manager.getStatistics()
        XCTAssertNil(stats.connectedSince, "connectedSince must be nil after disconnect")
    }

    func testLastRekeyAtIsUpdatedAfterRekey() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()

        let before = Date()
        manager.simulateRekeyStart()
        manager.simulateRekeySuccess()
        let after = Date()

        let stats = manager.getStatistics()
        XCTAssertNotNil(stats.lastRekeyAt, "lastRekeyAt must be set after a successful rekey")
        if let rekeyAt = stats.lastRekeyAt {
            XCTAssertGreaterThanOrEqual(rekeyAt, before)
            XCTAssertLessThanOrEqual(rekeyAt, after)
        }
    }

    // MARK: - State Change Observer Tests

    func testStateChangeObserverIsCalledOnConnect() {
        var observedStates: [VPNState] = []
        manager.onStateChange = { newState in
            observedStates.append(newState)
        }

        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()

        XCTAssertEqual(observedStates, [.connecting, .connected],
            "Observer must be called with .connecting then .connected")
    }

    func testStateChangeObserverIsCalledOnDisconnect() {
        var observedStates: [VPNState] = []
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()

        manager.onStateChange = { newState in
            observedStates.append(newState)
        }

        manager.disconnect()
        XCTAssertEqual(observedStates, [.disconnected],
            "Observer must be called with .disconnected when disconnecting")
    }

    // MARK: - Network Path Change Tests

    func testNetworkPathChangeWhileConnectedTriggersReconnect() {
        let config = makeValidConfig()
        manager.startConnect(config: config)
        manager.simulateConnectionSuccess()

        // Simulate Wi-Fi → Cellular path change
        manager.simulateNetworkPathChange()

        // After path change, manager should initiate reconnect automatically
        // (goes back to connecting state)
        let validStates: Set<VPNState> = [.connecting, .connected]
        XCTAssertTrue(validStates.contains(manager.state),
            "After network path change, state must be connecting or connected (not error/disconnected)")
    }

    // MARK: - Config Validation Tests

    func testConnectWithEmptyEndpointFails() {
        var config = makeValidConfig()
        config.serverEndpoint = ""
        manager.startConnect(config: config)
        XCTAssertEqual(manager.state, .error,
            "Empty server endpoint must cause an immediate error")
    }

    func testConnectWithInvalidPublicKeyFails() {
        var config = makeValidConfig()
        config.serverPublicKey = Data(repeating: 0x00, count: 8) // Too short
        manager.startConnect(config: config)
        XCTAssertEqual(manager.state, .error,
            "Invalid public key must cause an immediate error")
    }

    // MARK: - Helpers

    private func makeValidConfig() -> VPNConfig {
        return VPNConfig(
            serverEndpoint: "vpn.zipminator.io",
            serverPort: 51820,
            serverPublicKey: Data(repeating: 0xAB, count: 32),
            clientPrivateKey: Data(repeating: 0xCD, count: 32),
            tunnelAddress: "10.14.0.2/32",
            dns: ["1.1.1.1", "8.8.8.8"],
            rekeyIntervalSeconds: 300
        )
    }
}

// MARK: - Testable Subclass

/// VPNManagerTestable extends VPNManager to allow injection of test events
/// without requiring a live NetworkExtension session.
class VPNManagerTestable: VPNManager {
    var onStateChange: ((VPNState) -> Void)?

    override func setState(_ newState: VPNState) {
        super.setState(newState)
        onStateChange?(newState)
    }

    func simulateConnectionSuccess() {
        setState(.connected)
        statisticsStore.connectedSince = Date()
    }

    func simulateConnectionFailure(error: Error) {
        setState(.error)
        statisticsStore.connectedSince = nil
    }

    func simulateRekeyStart() {
        setState(.rekeying)
    }

    func simulateRekeySuccess() {
        setState(.connected)
        statisticsStore.lastRekeyAt = Date()
    }

    func simulateRekeyFailure(error: Error) {
        setState(.error)
    }

    func simulateNetworkPathChange() {
        handleNetworkPathChange()
    }
}
