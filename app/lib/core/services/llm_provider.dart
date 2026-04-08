import 'dart:convert';
import 'package:http/http.dart' as http;
import 'on_device_service.dart';
import 'openai_compatible_service.dart';

/// Supported LLM providers.
enum LLMProvider {
  onDevice('On-Device (Gemma 4)', 'Google AI Edge'),
  gemini('Gemini', 'Google'),
  groq('Groq', 'Groq'),
  deepSeek('DeepSeek', 'DeepSeek'),
  mistral('Mistral', 'Mistral AI'),
  claude('Claude', 'Anthropic'),
  openRouter('OpenRouter', 'OpenRouter'),
  ollama('Ollama (Local)', 'Local');

  final String displayName;
  final String company;
  const LLMProvider(this.displayName, this.company);

  /// Whether this provider runs locally and needs no API key.
  bool get isLocal => this == LLMProvider.ollama || this == LLMProvider.onDevice;

  /// URL where users can obtain an API key for this provider.
  String? get apiKeyUrl => switch (this) {
        LLMProvider.gemini => 'https://aistudio.google.com/apikey',
        LLMProvider.groq => 'https://console.groq.com/keys',
        LLMProvider.deepSeek => 'https://platform.deepseek.com/api_keys',
        LLMProvider.mistral => 'https://console.mistral.ai/api-keys',
        LLMProvider.claude => 'https://console.anthropic.com/settings/keys',
        LLMProvider.openRouter => 'https://openrouter.ai/settings/keys',
        _ => null,
      };

  /// Short help text explaining how to get the API key.
  String? get apiKeyHelp => switch (this) {
        LLMProvider.gemini =>
          'Sign in to Google AI Studio, click "Get API key", and copy it.',
        LLMProvider.groq =>
          'Create a free Groq Cloud account, go to API Keys, and generate one.',
        LLMProvider.deepSeek =>
          'Sign up at DeepSeek Platform, navigate to API Keys, and create one.',
        LLMProvider.mistral =>
          'Register at Mistral Console, go to API Keys section.',
        LLMProvider.claude =>
          'Sign in to Anthropic Console, go to Settings > API Keys.',
        LLMProvider.openRouter =>
          'Create an OpenRouter account, go to Settings > Keys.',
        _ => null,
      };
}

/// Model metadata for UI display.
class LLMModel {
  final String id;
  final String displayName;
  final LLMProvider provider;
  final bool freeTier;

  const LLMModel({
    required this.id,
    required this.displayName,
    required this.provider,
    this.freeTier = false,
  });
}

/// All available models grouped by provider. On-device first, then free-tier.
const kAvailableModels = <LLMModel>[
  // On-Device (Gemma 4 via Google AI Edge — no API key, fully private)
  LLMModel(
      id: 'gemma-4-e4b',
      displayName: 'Gemma 4 E4B',
      provider: LLMProvider.onDevice,
      freeTier: true),
  LLMModel(
      id: 'gemma-4-e2b',
      displayName: 'Gemma 4 E2B',
      provider: LLMProvider.onDevice,
      freeTier: true),
  // Gemini (free tier, very capable — includes cloud Gemma 4 31B)
  LLMModel(
      id: 'gemma-4-31b-it',
      displayName: 'Gemma 4 31B IT',
      provider: LLMProvider.gemini,
      freeTier: true),
  LLMModel(
      id: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      provider: LLMProvider.gemini,
      freeTier: true),
  LLMModel(
      id: 'gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      provider: LLMProvider.gemini,
      freeTier: true),
  // Groq (free tier, fastest inference)
  LLMModel(
      id: 'llama-3.3-70b-versatile',
      displayName: 'Llama 3.3 70B',
      provider: LLMProvider.groq,
      freeTier: true),
  LLMModel(
      id: 'llama-3.1-8b-instant',
      displayName: 'Llama 3.1 8B',
      provider: LLMProvider.groq,
      freeTier: true),
  LLMModel(
      id: 'mixtral-8x7b-32768',
      displayName: 'Mixtral 8x7B',
      provider: LLMProvider.groq,
      freeTier: true),
  // DeepSeek (free tier, strong reasoning + code)
  LLMModel(
      id: 'deepseek-chat',
      displayName: 'DeepSeek V3',
      provider: LLMProvider.deepSeek,
      freeTier: true),
  LLMModel(
      id: 'deepseek-reasoner',
      displayName: 'DeepSeek R1',
      provider: LLMProvider.deepSeek,
      freeTier: true),
  // Mistral (free tier, multilingual)
  LLMModel(
      id: 'mistral-small-latest',
      displayName: 'Mistral Small',
      provider: LLMProvider.mistral,
      freeTier: true),
  LLMModel(
      id: 'pixtral-12b-2409',
      displayName: 'Pixtral 12B',
      provider: LLMProvider.mistral,
      freeTier: true),
  // Claude (paid)
  LLMModel(
      id: 'claude-opus-4-6',
      displayName: 'Claude Opus 4.6',
      provider: LLMProvider.claude),
  LLMModel(
      id: 'claude-sonnet-4-6',
      displayName: 'Claude Sonnet 4.6',
      provider: LLMProvider.claude),
  LLMModel(
      id: 'claude-haiku-4-5-20251001',
      displayName: 'Claude Haiku 4.5',
      provider: LLMProvider.claude),
  // OpenRouter (routes to any model, paid)
  LLMModel(
      id: 'openai/gpt-4o',
      displayName: 'GPT-4o',
      provider: LLMProvider.openRouter),
  LLMModel(
      id: 'meta-llama/llama-4-maverick',
      displayName: 'Llama 4 Maverick',
      provider: LLMProvider.openRouter),
  // Ollama (local, no API key needed)
  LLMModel(
      id: 'llama3.2',
      displayName: 'Llama 3.2',
      provider: LLMProvider.ollama,
      freeTier: true),
  LLMModel(
      id: 'mistral',
      displayName: 'Mistral',
      provider: LLMProvider.ollama,
      freeTier: true),
  LLMModel(
      id: 'phi3',
      displayName: 'Phi-3',
      provider: LLMProvider.ollama,
      freeTier: true),
  LLMModel(
      id: 'gemma2',
      displayName: 'Gemma 2',
      provider: LLMProvider.ollama,
      freeTier: true),
];

/// System prompt so Q-AI identifies correctly regardless of backend model.
String qaiSystemPrompt(String modelName) =>
    'You are QDaria Q-AI Personal Assistant, the AI built into Zipminator, '
    'the world\'s first post-quantum cyber security super-app. '
    'You are powered by $modelName. '
    'Help users with privacy, encryption, security, and general questions. '
    'Be concise, helpful, and privacy-conscious. '
    'Never store or transmit user data beyond this conversation.';

/// Abstract LLM service interface.
abstract class LLMService {
  Future<String> sendMessage({
    required String model,
    required List<Map<String, String>> messages,
    String? systemPrompt,
    int maxTokens,
  });
  void dispose();
}

/// Ollama local LLM service.
///
/// Connects to a locally running Ollama instance at `http://localhost:11434`.
/// No API key required; all inference runs on-device.
class OllamaService implements LLMService {
  static const _baseUrl = 'http://localhost:11434';
  final http.Client _client;

  OllamaService({http.Client? client}) : _client = client ?? http.Client();

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
      Uri.parse('$_baseUrl/api/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'model': model,
        'messages': allMessages,
        'stream': false,
        'options': {'num_predict': maxTokens},
      }),
    );

    if (response.statusCode != 200) {
      throw LLMException('Ollama error: HTTP ${response.statusCode}');
    }

    final parsed = jsonDecode(response.body);
    final content = parsed['message']?['content'] as String?;
    if (content == null || content.isEmpty) {
      throw LLMException('No response from Ollama');
    }
    return content;
  }

  /// Check if Ollama is running locally.
  static Future<bool> isAvailable() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/api/tags'))
          .timeout(const Duration(seconds: 2));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// List models currently pulled in the local Ollama instance.
  static Future<List<String>> availableModels() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/api/tags'))
          .timeout(const Duration(seconds: 2));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final models = (data['models'] as List?)
                ?.map((m) => m['name'] as String)
                .toList() ??
            [];
        return models;
      }
    } catch (_) {}
    return [];
  }

  @override
  void dispose() => _client.close();
}

/// Claude (Anthropic Messages API).
class ClaudeService implements LLMService {
  static const _baseUrl = 'https://api.anthropic.com/v1/messages';
  static const _apiVersion = '2023-06-01';
  final String apiKey;
  final http.Client _client;

  ClaudeService({required this.apiKey, http.Client? client})
      : _client = client ?? http.Client();

  @override
  Future<String> sendMessage({
    required String model,
    required List<Map<String, String>> messages,
    String? systemPrompt,
    int maxTokens = 1024,
  }) async {
    final body = <String, dynamic>{
      'model': model,
      'max_tokens': maxTokens,
      'messages': messages,
    };
    if (systemPrompt != null) {
      body['system'] = systemPrompt;
    }

    final response = await _client.post(
      Uri.parse(_baseUrl),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': _apiVersion,
      },
      body: jsonEncode(body),
    );

    if (response.statusCode != 200) {
      final parsed = jsonDecode(response.body);
      throw LLMException(
          parsed['error']?['message'] ?? 'HTTP ${response.statusCode}');
    }

    final parsed = jsonDecode(response.body);
    final content = parsed['content'] as List<dynamic>;
    return content
        .where((c) => c['type'] == 'text')
        .map((c) => c['text'] as String)
        .join();
  }

  @override
  void dispose() => _client.close();
}

/// Google Gemini (REST API, free tier for Flash).
class GeminiService implements LLMService {
  static const _baseUrl =
      'https://generativelanguage.googleapis.com/v1beta/models';
  final String apiKey;
  final http.Client _client;

  GeminiService({required this.apiKey, http.Client? client})
      : _client = client ?? http.Client();

  @override
  Future<String> sendMessage({
    required String model,
    required List<Map<String, String>> messages,
    String? systemPrompt,
    int maxTokens = 1024,
  }) async {
    final contents = <Map<String, dynamic>>[];
    for (final msg in messages) {
      contents.add({
        'role': msg['role'] == 'assistant' ? 'model' : 'user',
        'parts': [
          {'text': msg['content'] ?? ''}
        ],
      });
    }

    final body = <String, dynamic>{
      'contents': contents,
      'generationConfig': {'maxOutputTokens': maxTokens},
    };
    if (systemPrompt != null) {
      body['systemInstruction'] = {
        'parts': [
          {'text': systemPrompt}
        ],
      };
    }

    final response = await _client.post(
      Uri.parse('$_baseUrl/$model:generateContent?key=$apiKey'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (response.statusCode != 200) {
      final parsed = jsonDecode(response.body);
      throw LLMException(
          parsed['error']?['message'] ?? 'HTTP ${response.statusCode}');
    }

    final parsed = jsonDecode(response.body);
    final candidates = parsed['candidates'] as List<dynamic>?;
    if (candidates == null || candidates.isEmpty) {
      throw LLMException('No response from Gemini');
    }
    final parts = candidates[0]['content']?['parts'] as List<dynamic>?;
    return parts?.map((p) => p['text'] as String? ?? '').join() ?? '';
  }

  @override
  void dispose() => _client.close();
}

/// OpenRouter (OpenAI-compatible, routes to any model).
class OpenRouterService extends OpenAICompatibleService {
  OpenRouterService({required super.apiKey, super.client})
      : super(baseUrl: 'https://openrouter.ai/api/v1/chat/completions');
}

/// Factory to create the right service for a provider.
LLMService createLLMService(LLMProvider provider, String apiKey) =>
    switch (provider) {
      LLMProvider.onDevice => OnDeviceService(),
      LLMProvider.claude => ClaudeService(apiKey: apiKey),
      LLMProvider.gemini => GeminiService(apiKey: apiKey),
      LLMProvider.groq => GroqService(apiKey: apiKey),
      LLMProvider.deepSeek => DeepSeekService(apiKey: apiKey),
      LLMProvider.mistral => MistralService(apiKey: apiKey),
      LLMProvider.openRouter => OpenRouterService(apiKey: apiKey),
      LLMProvider.ollama => OllamaService(),
    };

class LLMException implements Exception {
  final String message;
  LLMException(this.message);

  @override
  String toString() => 'LLMException: $message';
}
