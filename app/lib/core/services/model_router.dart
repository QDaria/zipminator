import 'package:zipminator/core/services/llm_provider.dart';

/// Heuristic-based model recommendation for Q-AI queries.
///
/// Inspects the query text for domain keywords and returns the best-fit
/// model from [kAvailableModels].
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

  /// Return the recommended [LLMModel] for a given [query].
  ///
  /// Routing rules (evaluated in order):
  /// 1. Code-related queries -> DeepSeek V3 (`deepseek-chat`)
  /// 2. Math/reasoning queries -> DeepSeek R1 (`deepseek-reasoner`)
  /// 3. Speed preference -> Groq Llama 3.3 70B (`llama-3.3-70b-versatile`)
  /// 4. Default -> Gemini 2.5 Flash (`gemini-2.5-flash`)
  static LLMModel recommendModel(
    String query, {
    bool preferSpeed = false,
  }) {
    if (preferSpeed) {
      return _modelById('llama-3.3-70b-versatile');
    }

    final lower = query.toLowerCase();

    if (_codeKeywords.any((kw) => lower.contains(kw))) {
      return _modelById('deepseek-chat');
    }

    if (_reasoningKeywords.any((kw) => lower.contains(kw))) {
      return _modelById('deepseek-reasoner');
    }

    return _modelById('gemini-2.5-flash');
  }

  /// Return models that are free-tier AND whose provider has an API key set.
  static List<LLMModel> availableFreeModels(
    Map<LLMProvider, String> apiKeys,
  ) {
    return kAvailableModels.where((m) {
      if (!m.freeTier) return false;
      final key = apiKeys[m.provider];
      return key != null && key.isNotEmpty;
    }).toList();
  }

  /// Look up a model by [id], falling back to Gemini 2.5 Flash.
  static LLMModel _modelById(String id) {
    return kAvailableModels.firstWhere(
      (m) => m.id == id,
      orElse: () => kAvailableModels.first,
    );
  }
}
