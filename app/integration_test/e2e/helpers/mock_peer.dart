import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// A mock peer that connects to the signaling server via WebSocket.
/// Acts as a scripted second device for E2E testing of messenger,
/// VoIP, and conference features without a second simulator.
class MockPeer {
  final String clientId;
  final String signalingUrl;
  WebSocket? _ws;
  final _messages = StreamController<Map<String, dynamic>>.broadcast();
  final _connected = Completer<void>();

  /// Stream of parsed JSON messages from the signaling server.
  Stream<Map<String, dynamic>> get messages => _messages.stream;

  /// Completes when the WebSocket connection is established.
  Future<void> get onConnected => _connected.future;

  MockPeer({required this.clientId, required this.signalingUrl});

  /// Connect to the signaling server at /ws/{clientId}.
  Future<void> connect() async {
    _ws = await WebSocket.connect('$signalingUrl/ws/$clientId');
    _connected.complete();
    _ws!.listen(
      (data) {
        if (data is! String || data == 'pong') return;
        try {
          final msg = jsonDecode(data) as Map<String, dynamic>;
          if (msg['type'] == 'pong') return;
          _messages.add(msg);
        } catch (_) {
          // Ignore non-JSON frames
        }
      },
      onDone: () => _messages.close(),
    );
  }

  /// Send a chat message to a specific peer.
  void sendMessage(String target, String text) {
    _send({'action': 'message', 'target': target, 'ciphertext': text});
  }

  /// Send a signaling message (offer/answer/ICE candidate).
  void sendSignal(
    String target,
    String type, [
    Map<String, dynamic>? payload,
  ]) {
    _send({
      'action': 'signal',
      'target': target,
      'type': type,
      if (payload != null) ...payload,
    });
  }

  /// Create a room on the signaling server.
  void createRoom(String roomId) {
    _send({'action': 'create_room', 'room_id': roomId});
  }

  /// Join a room on the signaling server.
  void joinRoom(String roomId) {
    _send({'action': 'join', 'room_id': roomId});
  }

  /// Leave the current room.
  void leaveRoom() {
    _send({'action': 'leave'});
  }

  /// Wait for a message matching [predicate], with [timeout].
  Future<Map<String, dynamic>> waitForMessage(
    bool Function(Map<String, dynamic>) predicate, {
    Duration timeout = const Duration(seconds: 10),
  }) {
    return messages.where(predicate).first.timeout(timeout);
  }

  /// Wait for a message with a specific [type] field.
  Future<Map<String, dynamic>> waitForType(
    String type, {
    Duration? timeout,
  }) {
    return waitForMessage(
      (m) => m['type'] == type,
      timeout: timeout ?? const Duration(seconds: 10),
    );
  }

  void _send(Map<String, dynamic> msg) {
    if (_ws != null && _ws!.readyState == WebSocket.open) {
      _ws!.add(jsonEncode(msg));
    }
  }

  /// Close the WebSocket connection.
  Future<void> disconnect() async {
    await _ws?.close();
    _ws = null;
  }

  /// Disconnect and close the message stream.
  Future<void> dispose() async {
    await disconnect();
    await _messages.close();
  }
}
