import Flutter
import UIKit
import NetworkExtension

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Set up VPN MethodChannel
    if let controller = window?.rootViewController as? FlutterViewController {
      let vpnChannel = FlutterMethodChannel(
        name: "com.qdaria.zipminator/vpn",
        binaryMessenger: controller.binaryMessenger
      )
      vpnChannel.setMethodCallHandler(handleVpnMethodCall)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }

  // MARK: - VPN Method Channel

  private func handleVpnMethodCall(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "connect":
      guard let args = call.arguments as? [String: Any],
            let server = args["server"] as? String,
            let location = args["location"] as? String else {
        result(FlutterError(code: "INVALID_ARGS", message: "server and location required", details: nil))
        return
      }
      connectVPN(server: server, location: location, result: result)

    case "disconnect":
      disconnectVPN(result: result)

    case "getStatus":
      getVPNStatus(result: result)

    default:
      result(FlutterMethodNotImplemented)
    }
  }

  private func connectVPN(server: String, location: String, result: @escaping FlutterResult) {
    NEVPNManager.shared().loadFromPreferences { error in
      if let error = error {
        result(FlutterError(code: "LOAD_ERROR", message: error.localizedDescription, details: nil))
        return
      }

      let vpnManager = NEVPNManager.shared()
      let proto = NEVPNProtocolIKEv2()
      proto.serverAddress = server
      proto.remoteIdentifier = server
      proto.localIdentifier = "zipminator-user"
      proto.useExtendedAuthentication = true
      proto.username = "zipminator"
      proto.passwordReference = nil // Would use Keychain in production
      proto.authenticationMethod = .sharedSecret
      proto.sharedSecretReference = nil // Would use Keychain in production
      proto.disconnectOnSleep = false

      // IKEv2 specific settings
      proto.ikeSecurityAssociationParameters.encryptionAlgorithm = .algorithmAES256GCM
      proto.ikeSecurityAssociationParameters.diffieHellmanGroup = .group20 // ECP384
      proto.ikeSecurityAssociationParameters.integrityAlgorithm = .SHA384
      proto.childSecurityAssociationParameters.encryptionAlgorithm = .algorithmAES256GCM
      proto.childSecurityAssociationParameters.diffieHellmanGroup = .group20
      proto.childSecurityAssociationParameters.integrityAlgorithm = .SHA384

      vpnManager.protocolConfiguration = proto
      vpnManager.localizedDescription = "Zipminator Q-VPN (\(location))"
      vpnManager.isEnabled = true

      vpnManager.saveToPreferences { saveError in
        if let saveError = saveError {
          result(FlutterError(code: "SAVE_ERROR", message: saveError.localizedDescription, details: nil))
          return
        }

        // Reload after saving to ensure latest config
        vpnManager.loadFromPreferences { reloadError in
          if let reloadError = reloadError {
            result(FlutterError(code: "RELOAD_ERROR", message: reloadError.localizedDescription, details: nil))
            return
          }

          do {
            try vpnManager.connection.startVPNTunnel()
            result("connecting")
          } catch {
            result(FlutterError(code: "START_ERROR", message: error.localizedDescription, details: nil))
          }
        }
      }
    }
  }

  private func disconnectVPN(result: @escaping FlutterResult) {
    NEVPNManager.shared().connection.stopVPNTunnel()
    result("disconnected")
  }

  private func getVPNStatus(result: @escaping FlutterResult) {
    NEVPNManager.shared().loadFromPreferences { _ in
      let status = NEVPNManager.shared().connection.status
      switch status {
      case .connected: result("connected")
      case .connecting: result("connecting")
      case .disconnecting: result("disconnecting")
      case .disconnected: result("disconnected")
      case .reasserting: result("connecting")
      case .invalid: result("disconnected")
      @unknown default: result("disconnected")
      }
    }
  }
}
