import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// State for a ratchet messaging session.
class RatchetState {
  final BigInt? sessionId;
  final bool isConnected;
  final List<ChatMessage> messages;
  final String? error;

  const RatchetState({
    this.sessionId,
    this.isConnected = false,
    this.messages = const [],
    this.error,
  });

  RatchetState copyWith({
    BigInt? sessionId,
    bool? isConnected,
    List<ChatMessage>? messages,
    String? error,
  }) =>
      RatchetState(
        sessionId: sessionId ?? this.sessionId,
        isConnected: isConnected ?? this.isConnected,
        messages: messages ?? this.messages,
        error: error,
      );
}

class ChatMessage {
  final String text;
  final bool isMine;
  final DateTime timestamp;

  ChatMessage({required this.text, required this.isMine, DateTime? timestamp})
      : timestamp = timestamp ?? DateTime.now();
}

/// Manages PQ Double Ratchet messaging sessions.
class RatchetNotifier extends Notifier<RatchetState> {
  @override
  RatchetState build() => const RatchetState();

  /// Start a new session as Alice (initiator).
  Future<Uint8List> initAlice() async {
    final result = await rust.ratchetInitAlice();
    state = state.copyWith(sessionId: result.sessionId);
    return Uint8List.fromList(result.publicKey);
  }

  /// Complete Alice's handshake with Bob's response.
  Future<void> aliceFinish(Uint8List kemCt, Uint8List bobPk) async {
    if (state.sessionId == null) return;
    await rust.ratchetAliceFinish(
      sessionId: state.sessionId!,
      kemCiphertext: kemCt,
      bobPublicKey: bobPk,
    );
    state = state.copyWith(isConnected: true);
  }

  /// Send an encrypted message.
  Future<rust.RatchetMessage?> sendMessage(String text) async {
    if (state.sessionId == null || !state.isConnected) return null;
    try {
      final enc = await rust.ratchetEncrypt(
        sessionId: state.sessionId!,
        plaintext: Uint8List.fromList(text.codeUnits),
      );
      state = state.copyWith(
        messages: [
          ...state.messages,
          ChatMessage(text: text, isMine: true),
        ],
      );
      return enc;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  /// Decrypt a received message.
  Future<void> receiveMessage(Uint8List header, Uint8List ciphertext) async {
    if (state.sessionId == null) return;
    try {
      final plaintext = await rust.ratchetDecrypt(
        sessionId: state.sessionId!,
        header: header,
        ciphertext: ciphertext,
      );
      state = state.copyWith(
        messages: [
          ...state.messages,
          ChatMessage(text: String.fromCharCodes(plaintext), isMine: false),
        ],
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void destroy() {
    if (state.sessionId != null) {
      rust.ratchetDestroy(sessionId: state.sessionId!);
    }
    state = const RatchetState();
  }
}

final ratchetProvider =
    NotifierProvider<RatchetNotifier, RatchetState>(RatchetNotifier.new);
