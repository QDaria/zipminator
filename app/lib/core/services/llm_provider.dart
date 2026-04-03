import 'dart:convert';
import 'package:http/http.dart' as http;
import 'on_device_service.dart';
import 'openai_compatible_service.dart';

/// Supported LLM providers.
enum LLMProvider {
  onDevice('On-Device', 'Google AI Edge'),
  gemini('Gemini', 'Google'),
  groq('Groq', 'Groq'),
  deepSeek('DeepSeek', 'DeepSeek'),
  mistral('Mistral', 'Mistral AI'),
  claude('Claude', 'Anthropic'),
  openRouter('OpenRouter', 'OpenRouter');

  final String displayName;
  final String company;
  const LLMProvider(this.displayName, this.company);

  /// Whether this provider runs entirely on-device (no network, no API key).
  bool get isOnDevice => this == LLMProvider.onDevice;
}

/// Model metadata for UI display.
class LLMModel {
  final String id;
  final String displayName;
  final LLMProvider provider;
  final bool freeTier;

  /// Size in bytes for on-device models (used for download UI).
  final int? sizeBytes;

  /// HuggingFace repo ID for on-device model downloads.
  final String? hfRepo;

  /// Filename within the HuggingFace repo.
  final String? hfFilename;

  /// Supported modalities (text, vision, audio, thinking).
  final List<String> modalities;

  const LLMModel({
    required this.id,
    required this.displayName,
    required this.provider,
    this.freeTier = false,
    this.sizeBytes,
    this.hfRepo,
    this.hfFilename,
    this.modalities = const ['text'],
  });

  /// Human-readable size string.
  String get sizeLabel {
    if (sizeBytes == null) return '';
    final mb = sizeBytes! / (1024 * 1024);
    if (mb >= 1024) return '${(mb / 1024).toStringAsFixed(1)} GB';
    return '${mb.toStringAsFixed(0)} MB';
  }

  bool get isOnDevice => provider == LLMProvider.onDevice;
}

/// All available models grouped by provider. On-device first, then cloud.
const kAvailableModels = <LLMModel>[
  // On-Device (Google AI Edge Gallery / LiteRT-LM — no API key, 100% private)
  LLMModel(
    id: 'gemma-3-1b-it-q4',
    displayName: 'Gemma 3 1B',
    provider: LLMProvider.onDevice,
    freeTier: true,
    sizeBytes: 612368384, // ~584 MB
    hfRepo: 'litert-community/Gemma3-1B-IT',
    hfFilename: 'gemma3-1b-it-q4_0.litertlm',
    modalities: ['text'],
  ),
  LLMModel(
    id: 'gemma-4-e2b-it',
    displayName: 'Gemma 4 E2B',
    provider: LLMProvider.onDevice,
    freeTier: true,
    sizeBytes: 2791728742, // ~2.6 GB
    hfRepo: 'litert-community/Gemma4-E2B-it',
    hfFilename: 'gemma4-e2b-it.litertlm',
    modalities: ['text', 'vision', 'audio', 'thinking'],
  ),
  LLMModel(
    id: 'gemma-4-e4b-it',
    displayName: 'Gemma 4 E4B',
    provider: LLMProvider.onDevice,
    freeTier: true,
    sizeBytes: 3971973120, // ~3.7 GB
    hfRepo: 'litert-community/Gemma4-E4B-it',
    hfFilename: 'gemma4-e4b-it.litertlm',
    modalities: ['text', 'vision', 'audio', 'thinking'],
  ),
  LLMModel(
    id: 'gemma-3n-e2b-it',
    displayName: 'Gemma 3n E2B',
    provider: LLMProvider.onDevice,
    freeTier: true,
    sizeBytes: 3971973120, // ~3.7 GB
    hfRepo: 'litert-community/Gemma3n-E2B-it',
    hfFilename: 'gemma3n-e2b-it.litertlm',
    modalities: ['text', 'vision', 'audio'],
  ),
  LLMModel(
    id: 'deepseek-r1-distill-qwen-1.5b',
    displayName: 'DeepSeek R1 1.5B',
    provider: LLMProvider.onDevice,
    freeTier: true,
    sizeBytes: 1610612736, // ~1.5 GB
    hfRepo: 'litert-community/DeepSeek-R1-Distill-Qwen-1.5B',
    hfFilename: 'deepseek-r1-distill-qwen-1.5b.litertlm',
    modalities: ['text'],
  ),
  // Gemini (free tier, very capable)
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
];

/// System prompt so Q-AI identifies correctly regardless of backend model.
String qaiSystemPrompt(String modelName) =>
    'You are Q-AI, Zipminator\'s quantum-safe AI assistant. '
    'You are powered by $modelName. '
    'Help users with privacy, encryption, and security questions.';

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
    };

class LLMException implements Exception {
  final String message;
  LLMException(this.message);

  @override
  String toString() => 'LLMException: $message';
}
