import 'dart:convert';

import 'package:http/http.dart' as http;

/// Service connecting the Flutter email screen to the real backend (Unit 11).
class EmailService {
  final String apiBaseUrl;
  final String token;

  EmailService({required this.apiBaseUrl, required this.token});

  /// Send a PQC-encrypted email via the API.
  ///
  /// The SMTP transport handles ML-KEM-768 envelope encryption transparently.
  Future<bool> sendEmail({
    required String to,
    required String subject,
    required String body,
    int? selfDestructMinutes,
  }) async {
    final resp = await http.post(
      Uri.parse('$apiBaseUrl/v1/email/send'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'to': to,
        'subject': subject,
        'body': body,
        if (selfDestructMinutes case final v?) 'self_destruct_minutes': v,
      }),
    );

    return resp.statusCode == 200;
  }

  /// Fetch the inbox for the current user.
  Future<List<EmailMeta>> getInbox() async {
    final resp = await http.get(
      Uri.parse('$apiBaseUrl/v1/email/inbox'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (resp.statusCode == 200) {
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final emails = data['emails'] as List<dynamic>;
      return emails.map((e) => EmailMeta.fromJson(e)).toList();
    }
    return [];
  }

  /// Fetch a single email by ID.
  Future<EmailDetail?> getEmail(String emailId) async {
    final resp = await http.get(
      Uri.parse('$apiBaseUrl/v1/email/$emailId'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (resp.statusCode == 200) {
      return EmailDetail.fromJson(jsonDecode(resp.body));
    }
    return null;
  }
}

/// Email metadata (inbox listing).
class EmailMeta {
  final String id;
  final String sender;
  final String subject;
  final DateTime receivedAt;
  final bool read;

  EmailMeta({
    required this.id,
    required this.sender,
    required this.subject,
    required this.receivedAt,
    required this.read,
  });

  factory EmailMeta.fromJson(Map<String, dynamic> json) {
    return EmailMeta(
      id: json['id'] as String,
      sender: json['sender'] as String,
      subject: json['subject'] as String? ?? '',
      receivedAt: DateTime.parse(json['received_at'] as String),
      read: json['read'] as bool? ?? false,
    );
  }
}

/// Full email detail.
class EmailDetail {
  final String id;
  final String sender;
  final String subject;
  final String body;
  final DateTime receivedAt;
  final bool read;

  EmailDetail({
    required this.id,
    required this.sender,
    required this.subject,
    required this.body,
    required this.receivedAt,
    required this.read,
  });

  factory EmailDetail.fromJson(Map<String, dynamic> json) {
    return EmailDetail(
      id: json['id'] as String,
      sender: json['sender'] as String,
      subject: json['subject'] as String? ?? '',
      body: json['body'] as String? ?? '',
      receivedAt: DateTime.parse(json['received_at'] as String),
      read: json['read'] as bool? ?? false,
    );
  }
}
