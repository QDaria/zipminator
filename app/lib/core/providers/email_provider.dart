import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// A sent or received email record.
class SentEmail {
  final String to;
  final String subject;
  final DateTime sentAt;
  final int envelopeSize;
  final bool encrypted;
  final String? selfDestructDuration;

  const SentEmail({
    required this.to,
    required this.subject,
    required this.sentAt,
    required this.envelopeSize,
    this.encrypted = true,
    this.selfDestructDuration,
  });
}

/// State for email encryption operations.
class EmailCryptoState {
  final Uint8List? encryptedEnvelope;
  final Uint8List? decryptedBody;
  final bool isProcessing;
  final String? error;
  final List<SentEmail> sentEmails;
  final List<SentEmail> receivedEmails;

  const EmailCryptoState({
    this.encryptedEnvelope,
    this.decryptedBody,
    this.isProcessing = false,
    this.error,
    this.sentEmails = const [],
    this.receivedEmails = const [],
  });

  EmailCryptoState copyWith({
    Uint8List? encryptedEnvelope,
    Uint8List? decryptedBody,
    bool? isProcessing,
    String? error,
    List<SentEmail>? sentEmails,
    List<SentEmail>? receivedEmails,
  }) =>
      EmailCryptoState(
        encryptedEnvelope: encryptedEnvelope ?? this.encryptedEnvelope,
        decryptedBody: decryptedBody ?? this.decryptedBody,
        isProcessing: isProcessing ?? this.isProcessing,
        error: error,
        sentEmails: sentEmails ?? this.sentEmails,
        receivedEmails: receivedEmails ?? this.receivedEmails,
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
      state = state.copyWith(
        encryptedEnvelope: envelope,
        isProcessing: false,
      );
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
      state = state.copyWith(
        decryptedBody: plaintext,
        isProcessing: false,
      );
      return body;
    } catch (e) {
      state = state.copyWith(isProcessing: false, error: e.toString());
      return null;
    }
  }

  /// Encrypts and records a sent email in local state.
  Future<bool> sendEncryptedEmail({
    required String to,
    required String subject,
    required String body,
    required Uint8List recipientPk,
    String? selfDestructDuration,
  }) async {
    final headers = 'From: me@qdaria.com\nTo: $to\nSubject: $subject';
    final envelope = await encryptEmail(
      recipientPk: recipientPk,
      body: body,
      headers: headers,
    );
    if (envelope == null) return false;

    final email = SentEmail(
      to: to,
      subject: subject,
      sentAt: DateTime.now(),
      envelopeSize: envelope.length,
      encrypted: true,
      selfDestructDuration: selfDestructDuration,
    );
    state = state.copyWith(
      sentEmails: [...state.sentEmails, email],
    );
    return true;
  }

  void clear() {
    state = const EmailCryptoState();
  }
}

final emailCryptoProvider =
    NotifierProvider<EmailCryptoNotifier, EmailCryptoState>(
        EmailCryptoNotifier.new);
