import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

/// Service connecting the Flutter VoIP screen to the real backend (Unit 12).
///
/// Handles SDP offer/answer exchange with PQ extensions via REST API.
class VoipService {
  final String apiBaseUrl;
  final String token;

  VoipService({required this.apiBaseUrl, required this.token});

  /// Create an SDP offer with a fresh ML-KEM-768 public key.
  Future<VoipOffer?> createOffer(int calleeId) async {
    final resp = await http.post(
      Uri.parse('$apiBaseUrl/v1/voip/offer'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'callee_id': calleeId}),
    );

    if (resp.statusCode == 200) {
      return VoipOffer.fromJson(jsonDecode(resp.body));
    }
    return null;
  }

  /// Answer an offer with KEM ciphertext.
  Future<VoipAnswer?> answerOffer({
    required String sessionId,
    required Uint8List ciphertext,
  }) async {
    final resp = await http.post(
      Uri.parse('$apiBaseUrl/v1/voip/answer'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'session_id': sessionId,
        'ct_b64': base64Encode(ciphertext),
      }),
    );

    if (resp.statusCode == 200) {
      return VoipAnswer.fromJson(jsonDecode(resp.body));
    }
    return null;
  }

  /// End a VoIP session.
  Future<bool> hangup(String sessionId) async {
    final resp = await http.post(
      Uri.parse('$apiBaseUrl/v1/voip/hangup'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'session_id': sessionId}),
    );

    return resp.statusCode == 204;
  }
}

/// VoIP offer data from the API.
class VoipOffer {
  final String sessionId;
  final int callerId;
  final int calleeId;
  final String pkB64;
  final String kemLine;
  final String fingerprint;

  VoipOffer({
    required this.sessionId,
    required this.callerId,
    required this.calleeId,
    required this.pkB64,
    required this.kemLine,
    required this.fingerprint,
  });

  factory VoipOffer.fromJson(Map<String, dynamic> json) {
    return VoipOffer(
      sessionId: json['session_id'] as String,
      callerId: json['caller_id'] as int,
      calleeId: json['callee_id'] as int,
      pkB64: json['pk_b64'] as String,
      kemLine: json['kem_line'] as String,
      fingerprint: json['fingerprint'] as String,
    );
  }
}

/// VoIP answer data from the API.
class VoipAnswer {
  final String sessionId;
  final int answererId;
  final String ctLine;
  final String fingerprint;
  final String srtpKeyB64;

  VoipAnswer({
    required this.sessionId,
    required this.answererId,
    required this.ctLine,
    required this.fingerprint,
    required this.srtpKeyB64,
  });

  factory VoipAnswer.fromJson(Map<String, dynamic> json) {
    return VoipAnswer(
      sessionId: json['session_id'] as String,
      answererId: json['answerer_id'] as int,
      ctLine: json['ct_line'] as String,
      fingerprint: json['fingerprint'] as String,
      srtpKeyB64: json['srtp_key_b64'] as String,
    );
  }
}
