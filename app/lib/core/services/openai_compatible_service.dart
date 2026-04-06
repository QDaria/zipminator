import 'dart:convert';
import 'package:http/http.dart' as http;
import 'llm_provider.dart';

/// Base service for OpenAI-compatible chat completion APIs.
///
/// DeepSeek, Groq, Mistral, and OpenRouter all use the same wire format.
/// Each provider subclass only needs to supply [baseUrl] and optional
/// [extraHeaders].
class OpenAICompatibleService implements LLMService {
  final String baseUrl;
  final String apiKey;
  final Map<String, String> extraHeaders;
  final http.Client _client;

  OpenAICompatibleService({
    required this.baseUrl,
    required this.apiKey,
    this.extraHeaders = const {},
    http.Client? client,
  }) : _client = client ?? http.Client();

  @override
  Future<String> sendMessage({
    required String model,
    required List<Map<String, String>> messages,
    String? systemPrompt,
    int maxTokens = 1024,
  }) async {
    final allMessages = <Map<String, String>>[];
    if (systemPrompt != null) {
      allMessages.add({'role': 'system', 'content': systemPrompt});
    }
    allMessages.addAll(messages);

    final response = await _client.post(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
        ...extraHeaders,
      },
      body: jsonEncode({
        'model': model,
        'max_tokens': maxTokens,
        'messages': allMessages,
      }),
    );

    if (response.statusCode == 429) {
      final retryAfter = response.headers['retry-after'] ?? '?';
      throw LLMException('Rate limited. Retry after $retryAfter seconds.');
    }

    if (response.statusCode != 200) {
      final parsed = jsonDecode(response.body);
      final error = parsed['error'];
      final msg = error is Map
          ? error['message'] ?? 'HTTP ${response.statusCode}'
          : error is String
              ? error
              : 'HTTP ${response.statusCode}';
      throw LLMException(msg);
    }

    final parsed = jsonDecode(response.body);
    final choices = parsed['choices'] as List<dynamic>?;
    if (choices == null || choices.isEmpty) {
      throw LLMException('No response from model');
    }
    return choices[0]['message']?['content'] ?? '';
  }

  @override
  void dispose() => _client.close();
}

/// Groq — blazing fast inference for Llama and Mixtral (free tier).
class GroqService extends OpenAICompatibleService {
  GroqService({required super.apiKey, super.client})
      : super(
            baseUrl:
                'https://api.groq.com/openai/v1/chat/completions');
}

/// DeepSeek — strong reasoning and code generation (free tier).
class DeepSeekService extends OpenAICompatibleService {
  DeepSeekService({required super.apiKey, super.client})
      : super(baseUrl: 'https://api.deepseek.com/chat/completions');
}

/// Mistral AI — multilingual and vision models (free tier).
class MistralService extends OpenAICompatibleService {
  MistralService({required super.apiKey, super.client})
      : super(
            baseUrl:
                'https://api.mistral.ai/v1/chat/completions');
}
