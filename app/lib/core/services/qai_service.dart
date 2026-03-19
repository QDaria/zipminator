import 'dart:convert';
import 'package:http/http.dart' as http;

/// HTTP client for calling the Anthropic Messages API.
class QaiService {
  static const _baseUrl = 'https://api.anthropic.com/v1/messages';
  static const _apiVersion = '2023-06-01';

  final String apiKey;
  final http.Client _client;

  QaiService({required this.apiKey, http.Client? client})
      : _client = client ?? http.Client();

  /// Resolve model ID from user-facing name.
  static String resolveModel(String model) => switch (model) {
        'opus' => 'claude-opus-4-6',
        'sonnet' => 'claude-sonnet-4-6',
        'haiku' => 'claude-haiku-4-5-20251001',
        'auto' || _ => 'claude-sonnet-4-6',
      };

  /// Send a message and return the assistant's text response.
  Future<String> sendMessage({
    required String model,
    required List<Map<String, String>> messages,
    int maxTokens = 1024,
  }) async {
    final response = await _client.post(
      Uri.parse(_baseUrl),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': _apiVersion,
      },
      body: jsonEncode({
        'model': resolveModel(model),
        'max_tokens': maxTokens,
        'messages': messages,
      }),
    );

    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      final msg = body['error']?['message'] ?? 'HTTP ${response.statusCode}';
      throw QaiException(msg);
    }

    final body = jsonDecode(response.body);
    final content = body['content'] as List<dynamic>;
    return content
        .where((c) => c['type'] == 'text')
        .map((c) => c['text'] as String)
        .join();
  }

  void dispose() => _client.close();
}

class QaiException implements Exception {
  final String message;
  QaiException(this.message);

  @override
  String toString() => 'QaiException: $message';
}
