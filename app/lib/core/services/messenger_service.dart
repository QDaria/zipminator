import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

/// Connection state for the signaling server.
enum SignalingConnectionState {
  disconnected,
  connecting,
  connected,
  error,
}

/// Service connecting the Flutter messenger to the live signaling server.
///
/// Protocol (matches signaling_server.py):
///   Connect: ws://host/ws/USERNAME
///   Send message: {"action": "message", "target": "bob", "ciphertext": "...", "nonce": "..."}
///   Receive:      {"type": "message", "from": "alice", "ciphertext": "...", "nonce": "..."}
///   Signal:       {"action": "signal", "target": "bob", "type": "offer", ...}
///   Create room:  {"action": "create_room", "room_id": "room-name"}
///   Join room:    {"action": "join", "room_id": "room-name"}
class MessengerService {
  final String signalingUrl;
  final String username;

  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  Timer? _reconnectTimer;
  Timer? _keepAliveTimer;
  int _reconnectAttempts = 0;
  static const _maxReconnectAttempts = 10;
  static const _reconnectBaseDelay = Duration(seconds: 1);

  final _messageController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _connectionStateController =
      StreamController<SignalingConnectionState>.broadcast();

  SignalingConnectionState _state = SignalingConnectionState.disconnected;
  bool _disposed = false;

  /// Stream of incoming messages from signaling server.
  Stream<Map<String, dynamic>> get messages => _messageController.stream;

  /// Stream of connection state changes.
  Stream<SignalingConnectionState> get connectionState =>
      _connectionStateController.stream;

  /// Current connection state.
  SignalingConnectionState get currentState => _state;

  bool get isConnected => _state == SignalingConnectionState.connected;

  MessengerService({
    required this.signalingUrl,
    required this.username,
  });

  void _setState(SignalingConnectionState newState) {
    if (_disposed) return;
    _state = newState;
    _connectionStateController.add(newState);
  }

  /// Connect to the WebSocket signaling server.
  Future<void> connect() async {
    if (_state == SignalingConnectionState.connecting ||
        _state == SignalingConnectionState.connected) {
      return;
    }

    _setState(SignalingConnectionState.connecting);

    try {
      final uri = Uri.parse('$signalingUrl/ws/$username');
      _channel = IOWebSocketChannel.connect(
        uri,
        pingInterval: const Duration(seconds: 10),
      );

      // Wait for the connection to be ready.
      await _channel!.ready;

      _setState(SignalingConnectionState.connected);
      _reconnectAttempts = 0;

      // Keep-alive: send ping every 15 seconds to prevent idle disconnect.
      _keepAliveTimer?.cancel();
      _keepAliveTimer = Timer.periodic(const Duration(seconds: 15), (_) {
        if (_channel != null && _state == SignalingConnectionState.connected) {
          _channel!.sink.add('ping');
        }
      });

      _subscription = _channel!.stream.listen(
        (data) {
          if (_disposed) return;
          try {
            final msg = jsonDecode(data as String) as Map<String, dynamic>;
            _messageController.add(msg);
          } catch (_) {
            // Ignore malformed messages.
          }
        },
        onError: (error) {
          _setState(SignalingConnectionState.error);
          _scheduleReconnect();
        },
        onDone: () {
          _setState(SignalingConnectionState.disconnected);
          _scheduleReconnect();
        },
      );
    } catch (e) {
      _setState(SignalingConnectionState.error);
      _scheduleReconnect();
    }
  }

  /// Send a direct message to a specific peer through the signaling server.
  void sendMessageToPeer({
    required String target,
    required String plaintext,
  }) {
    _send({
      'action': 'message',
      'target': target,
      'ciphertext': plaintext,
    });
  }

  /// Send a signaling message (offer, answer, ICE candidates).
  void sendSignal({
    required String target,
    required String type,
    Map<String, dynamic>? payload,
  }) {
    _send({
      'action': 'signal',
      'target': target,
      'type': type,
      ...?payload,
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

  /// List available rooms.
  void listRooms() {
    _send({'action': 'list_rooms'});
  }

  void _send(Map<String, dynamic> message) {
    if (_channel != null && _state == SignalingConnectionState.connected) {
      _channel!.sink.add(jsonEncode(message));
    }
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _setState(SignalingConnectionState.error);
      return;
    }

    final delay = _reconnectBaseDelay * (1 << _reconnectAttempts);
    _reconnectAttempts++;
    _reconnectTimer = Timer(delay, () => connect());
  }

  /// Disconnect from the signaling server.
  void disconnect() {
    _reconnectTimer?.cancel();
    _keepAliveTimer?.cancel();
    _subscription?.cancel();
    _subscription = null;
    _channel?.sink.close();
    _channel = null;
    _setState(SignalingConnectionState.disconnected);
  }

  /// Clean up all resources.
  void dispose() {
    _disposed = true;
    disconnect();
    _messageController.close();
    _connectionStateController.close();
  }
}
