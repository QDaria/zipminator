import 'package:zipminator/core/services/llm_provider.dart';

/// Heuristic-based model recommendation for Q-AI queries.
///
/// Inspects the query text for domain keywords and returns the best-fit
/// model from [kAvailableModels]. Prefers on-device models when available
/// for maximum privacy.
class ModelRouter {
  ModelRouter._();

  static const _codeKeywords = [
    'code',
    'function',
    'implement',
    'debug',
    'regex',
    'sql',
    'api',
    'refactor',
    'compile',
    'syntax',
  ];

  static const _reasoningKeywords = [
    'prove',
    'calculate',
    'reason',
    'analyze',
    'step by step',
    'theorem',
    'derive',
    'equation',
    'logic',
    'math',
  ];

  static const _privacyKeywords = [
    'private',
    'secret',
    'password',
    'credential',
    'key',
    'token',
    'ssn',
    'social security',
    'medical',
    'health',
    'bank',
    'account',
    'pii',
    'personal',
    'confidential',
    'encrypt',
  ];

  /// Return the recommended [LLMModel] for a given [query].
  ///
  /// Routing rules (evaluated in order):
  /// 1. Privacy-sensitive queries -> on-device Gemma (if downloaded)
  /// 2. Code-related queries -> DeepSeek V3 (cloud) or on-device DeepSeek R1
  /// 3. Math/reasoning queries -> DeepSeek R1
  /// 4. Speed preference -> Groq Llama 3.3 70B
  /// 5. Default -> on-device Gemma 3 1B (if downloaded), else Gemini 2.5 Flash
  static LLMModel recommendModel(
    String query, {
    bool preferSpeed = false,
    Set<String> downloadedOnDeviceModels = const {},
  }) {
    final lower = query.toLowerCase();

    // Privacy-sensitive queries always prefer on-device.
    if (_privacyKeywords.any((kw) => lower.contains(kw))) {
      final onDevice = _bestOnDeviceModel(downloadedOnDeviceModels);
      if (onDevice != null) return onDevice;
    }

    if (preferSpeed) {
      return _modelById('llama-3.3-70b-versatile');
    }

    if (_codeKeywords.any((kw) => lower.contains(kw))) {
      // Prefer on-device DeepSeek R1 if downloaded.
      if (downloadedOnDeviceModels.contains('deepseek-r1-distill-qwen-1.5b')) {
        return _modelById('deepseek-r1-distill-qwen-1.5b');
      }
      return _modelById('deepseek-chat');
    }

    if (_reasoningKeywords.any((kw) => lower.contains(kw))) {
      if (downloadedOnDeviceModels.contains('deepseek-r1-distill-qwen-1.5b')) {
        return _modelById('deepseek-r1-distill-qwen-1.5b');
      }
      return _modelById('deepseek-reasoner');
    }

    // Default: prefer on-device if available.
    final onDevice = _bestOnDeviceModel(downloadedOnDeviceModels);
    if (onDevice != null) return onDevice;
    return _modelById('gemini-2.5-flash');
  }

  /// Return models that are free-tier AND either on-device or have an API key.
  static List<LLMModel> availableFreeModels(
    Map<LLMProvider, String> apiKeys, {
    Set<String> downloadedOnDeviceModels = const {},
  }) {
    return kAvailableModels.where((m) {
      if (!m.freeTier) return false;
      if (m.isOnDevice) return downloadedOnDeviceModels.contains(m.id);
      final key = apiKeys[m.provider];
      return key != null && key.isNotEmpty;
    }).toList();
  }

  /// Best on-device model that is downloaded. Prefers Gemma 4 > 3n > 3 1B.
  static LLMModel? _bestOnDeviceModel(Set<String> downloaded) {
    const preference = [
      'gemma-4-e4b-it',
      'gemma-4-e2b-it',
      'gemma-3n-e2b-it',
      'deepseek-r1-distill-qwen-1.5b',
      'gemma-3-1b-it-q4',
    ];
    for (final id in preference) {
      if (downloaded.contains(id)) return _modelById(id);
    }
    return null;
  }

  /// Look up a model by [id], falling back to the first model in catalog.
  static LLMModel _modelById(String id) {
    return kAvailableModels.firstWhere(
      (m) => m.id == id,
      orElse: () => kAvailableModels.first,
    );
  }
}
