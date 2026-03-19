import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

/// Service connecting the Flutter messenger to the real backend (Unit 10).
///
/// Uses dart:io WebSocket for real-time signaling and REST for message persistence.
class MessengerService {
  final String apiBaseUrl;
  final String wsBaseUrl;
  final String token;

  WebSocket? _socket;
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();

  /// Stream of incoming messages from signaling.
  Stream<Map<String, dynamic>> get messages => _messageController.stream;

  bool get isConnected => _socket != null;

  MessengerService({
    required this.apiBaseUrl,
    required this.wsBaseUrl,
    required this.token,
  });

  /// Connect to the WebSocket signaling server.
  Future<void> connect() async {
    final uri = '$wsBaseUrl/ws/signal?token=$token';
    _socket = await WebSocket.connect(uri);

    _socket!.listen(
      (data) {
        final msg = jsonDecode(data as String) as Map<String, dynamic>;
        _messageController.add(msg);
      },
      onError: (error) {
        _messageController.addError(error);
      },
      onDone: () {
        _socket = null;
      },
    );
  }

  /// Send a signaling message (offer, answer, ICE, or chat message).
  void sendSignal(Map<String, dynamic> message) {
    _socket?.add(jsonEncode(message));
  }

  /// Send an encrypted message via REST API.
  Future<Map<String, dynamic>?> sendMessage({
    required String conversationId,
    required int recipientId,
    required Uint8List ciphertext,
    required Uint8List nonce,
  }) async {
    final resp = await http.post(
      Uri.parse('$apiBaseUrl/v1/messages/send'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'conversation_id': conversationId,
        'recipient_id': recipientId,
        'ciphertext_b64': base64Encode(ciphertext),
        'nonce_b64': base64Encode(nonce),
      }),
    );

    if (resp.statusCode == 201) {
      return jsonDecode(resp.body) as Map<String, dynamic>;
    }
    return null;
  }

  /// Fetch messages in a conversation.
  Future<List<Map<String, dynamic>>> getConversation(
      String conversationId) async {
    final resp = await http.get(
      Uri.parse('$apiBaseUrl/v1/messages/$conversationId'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (resp.statusCode == 200) {
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      return List<Map<String, dynamic>>.from(data['messages'] ?? []);
    }
    return [];
  }

  /// Drain offline messages.
  Future<List<Map<String, dynamic>>> drainOffline() async {
    final resp = await http.get(
      Uri.parse('$apiBaseUrl/v1/messages/offline'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (resp.statusCode == 200) {
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      return List<Map<String, dynamic>>.from(data['messages'] ?? []);
    }
    return [];
  }

  /// Disconnect from WebSocket.
  void disconnect() {
    _socket?.close();
    _socket = null;
  }

  /// Clean up resources.
  void dispose() {
    disconnect();
    _messageController.close();
  }
}
