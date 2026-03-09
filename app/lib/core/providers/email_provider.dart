import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// State for email encryption operations.
class EmailCryptoState {
  final Uint8List? encryptedEnvelope;
  final Uint8List? decryptedBody;
  final bool isProcessing;
  final String? error;

  const EmailCryptoState({
    this.encryptedEnvelope,
    this.decryptedBody,
    this.isProcessing = false,
    this.error,
  });

  EmailCryptoState copyWith({
    Uint8List? encryptedEnvelope,
    Uint8List? decryptedBody,
    bool? isProcessing,
    String? error,
  }) =>
      EmailCryptoState(
        encryptedEnvelope: encryptedEnvelope ?? this.encryptedEnvelope,
        decryptedBody: decryptedBody ?? this.decryptedBody,
        isProcessing: isProcessing ?? this.isProcessing,
        error: error,
      );
}

/// Manages PQC email encryption/decryption.
class EmailCryptoNotifier extends Notifier<EmailCryptoState> {
  @override
  EmailCryptoState build() => const EmailCryptoState();

  Future<Uint8List?> encryptEmail({
    required Uint8List recipientPk,
    required String body,
    required String headers,
  }) async {
    state = state.copyWith(isProcessing: true, error: null);
    try {
      final envelope = await rust.emailEncrypt(
        recipientPk: recipientPk,
        plaintext: Uint8List.fromList(body.codeUnits),
        aad: Uint8List.fromList(headers.codeUnits),
      );
      state = EmailCryptoState(encryptedEnvelope: envelope);
      return envelope;
    } catch (e) {
      state = state.copyWith(isProcessing: false, error: e.toString());
      return null;
    }
  }

  Future<String?> decryptEmail({
    required Uint8List secretKey,
    required Uint8List envelope,
    required String headers,
  }) async {
    state = state.copyWith(isProcessing: true, error: null);
    try {
      final plaintext = await rust.emailDecrypt(
        secretKey: secretKey,
        envelope: envelope,
        aad: Uint8List.fromList(headers.codeUnits),
      );
      final body = String.fromCharCodes(plaintext);
      state = EmailCryptoState(decryptedBody: plaintext);
      return body;
    } catch (e) {
      state = state.copyWith(isProcessing: false, error: e.toString());
      return null;
    }
  }

  void clear() {
    state = const EmailCryptoState();
  }
}

final emailCryptoProvider =
    NotifierProvider<EmailCryptoNotifier, EmailCryptoState>(
        EmailCryptoNotifier.new);
