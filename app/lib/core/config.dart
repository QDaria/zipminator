/// Zipminator backend configuration.
///
/// Signaling server provides WebSocket relay for PQC Messenger and VoIP.
/// Deployed on Fly.io with auto-stop when idle.
class AppConfig {
  /// WebSocket signaling server for Messenger and VoIP.
  static const signalingUrl = 'wss://zipminator-signaling.fly.dev';

  /// REST API base (signaling server also serves REST).
  static const signalingApiUrl = 'https://zipminator-signaling.fly.dev';

  /// Health check endpoint.
  static const healthUrl = '$signalingApiUrl/health';
}
