import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// Connection state for the signaling server.
enum SignalingConnectionState {
  disconnected,
  connecting,
  connected,
  error,
}

/// Service connecting the Flutter messenger to the live signaling server.
///
/// Uses raw dart:io WebSocket for reliable ping/pong and reconnection.
class MessengerService {
  final String signalingUrl;
  final String username;

  WebSocket? _ws;
  Timer? _reconnectTimer;
  Timer? _keepAliveTimer;
  int _reconnectAttempts = 0;
  static const _maxReconnectAttempts = 50;
  static const _reconnectDelay = Duration(seconds: 2);

  final _messageController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _connectionStateController =
      StreamController<SignalingConnectionState>.broadcast();

  SignalingConnectionState _state = SignalingConnectionState.disconnected;
  bool _disposed = false;

  Stream<Map<String, dynamic>> get messages => _messageController.stream;
  Stream<SignalingConnectionState> get connectionState =>
      _connectionStateController.stream;
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
    if (_disposed) return;
    // Synchronous guard against double-connect race condition.
    if (_state == SignalingConnectionState.connecting ||
        _state == SignalingConnectionState.connected) {
      return;
    }
    _state = SignalingConnectionState.connecting;
    _connectionStateController.add(_state);

    try {
      // Close any stale WebSocket before creating a new one.
      _ws?.close();
      _ws = null;

      final uri = '$signalingUrl/ws/$username';
      _ws = await WebSocket.connect(uri);
      _ws!.pingInterval = const Duration(seconds: 5);

      _setState(SignalingConnectionState.connected);
      _reconnectAttempts = 0;

      // Application-level keep-alive every 10 seconds.
      _keepAliveTimer?.cancel();
      _keepAliveTimer = Timer.periodic(const Duration(seconds: 10), (_) {
        if (_ws != null && _ws!.readyState == WebSocket.open) {
          _ws!.add('ping');
        }
      });

      _ws!.listen(
        (data) {
          if (_disposed) return;
          if (data is! String) return;
          // Skip pong responses.
          if (data == 'pong') return;
          try {
            final msg = jsonDecode(data) as Map<String, dynamic>;
            if (msg['type'] == 'pong') return;
            _messageController.add(msg);
          } catch (_) {}
        },
        onError: (_) {
          _setState(SignalingConnectionState.error);
          _scheduleReconnect();
        },
        onDone: () {
          _setState(SignalingConnectionState.disconnected);
          _scheduleReconnect();
        },
        cancelOnError: false,
      );
    } catch (e) {
      _setState(SignalingConnectionState.error);
      _scheduleReconnect();
    }
  }

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

  void createRoom(String roomId) {
    _send({'action': 'create_room', 'room_id': roomId});
  }

  void joinRoom(String roomId) {
    _send({'action': 'join', 'room_id': roomId});
  }

  void leaveRoom() {
    _send({'action': 'leave'});
  }

  void listRooms() {
    _send({'action': 'list_rooms'});
  }

  void _send(Map<String, dynamic> message) {
    if (_ws != null && _ws!.readyState == WebSocket.open) {
      _ws!.add(jsonEncode(message));
    }
  }

  void _scheduleReconnect() {
    if (_disposed) return;
    _reconnectTimer?.cancel();
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _setState(SignalingConnectionState.error);
      return;
    }

    _reconnectAttempts++;
    _reconnectTimer = Timer(_reconnectDelay, () {
      _state = SignalingConnectionState.disconnected;
      connect();
    });
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _keepAliveTimer?.cancel();
    _ws?.close();
    _ws = null;
    _setState(SignalingConnectionState.disconnected);
  }

  void dispose() {
    _disposed = true;
    disconnect();
    _messageController.close();
    _connectionStateController.close();
  }
}
