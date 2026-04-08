import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zipminator/core/services/llm_provider.dart';

class QaiMessage {
  final String text;
  final bool isUser;
  final String model;

  const QaiMessage({
    required this.text,
    required this.isUser,
    required this.model,
  });
}

class QaiState {
  final List<QaiMessage> messages;
  final String selectedModel;
  final LLMProvider selectedProvider;
  final bool isLoading;
  final Map<LLMProvider, String> apiKeys;
  final String? error;

  const QaiState({
    this.messages = const [],
    this.selectedModel = 'gemma-4-e4b',
    this.selectedProvider = LLMProvider.onDevice,
    this.isLoading = false,
    this.apiKeys = const {},
    this.error,
  });

  bool get hasApiKey {
    if (selectedProvider.isLocal) return true;
    final key = apiKeys[selectedProvider];
    return key != null && key.isNotEmpty;
  }

  String? get currentApiKey => apiKeys[selectedProvider];

  /// Models available for the currently selected provider.
  List<LLMModel> get availableModels =>
      kAvailableModels.where((m) => m.provider == selectedProvider).toList();

  QaiState copyWith({
    List<QaiMessage>? messages,
    String? selectedModel,
    LLMProvider? selectedProvider,
    bool? isLoading,
    Map<LLMProvider, String>? apiKeys,
    String? error,
  }) =>
      QaiState(
        messages: messages ?? this.messages,
        selectedModel: selectedModel ?? this.selectedModel,
        selectedProvider: selectedProvider ?? this.selectedProvider,
        isLoading: isLoading ?? this.isLoading,
        apiKeys: apiKeys ?? this.apiKeys,
        error: error,
      );
}

class QaiNotifier extends Notifier<QaiState> {
  static const _keyPrefix = 'qai_api_key_';

  @override
  QaiState build() {
    _loadApiKeys();
    return const QaiState();
  }

  Future<void> _loadApiKeys() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = <LLMProvider, String>{};
    for (final provider in LLMProvider.values) {
      final key = prefs.getString('$_keyPrefix${provider.name}');
      if (key != null && key.isNotEmpty) {
        keys[provider] = key;
      }
    }
    if (keys.isNotEmpty) {
      state = state.copyWith(apiKeys: keys);
    }
  }

  Future<void> setApiKey(LLMProvider provider, String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_keyPrefix${provider.name}', key);
    state = state.copyWith(apiKeys: {...state.apiKeys, provider: key});
  }

  void selectProvider(LLMProvider provider) {
    final models =
        kAvailableModels.where((m) => m.provider == provider).toList();
    state = state.copyWith(
      selectedProvider: provider,
      selectedModel:
          models.isNotEmpty ? models.first.id : state.selectedModel,
    );
  }

  void selectModel(String model) {
    state = state.copyWith(selectedModel: model);
  }

  Future<void> sendMessage(String text) async {
    if (!state.hasApiKey) {
      state = state.copyWith(
        error:
            'Set your ${state.selectedProvider.displayName} API key in Settings first',
      );
      return;
    }

    final userMsg = QaiMessage(
      text: text,
      isUser: true,
      model: state.selectedModel,
    );
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
    );

    try {
      final service =
          createLLMService(state.selectedProvider, state.currentApiKey ?? '');
      final apiMessages = state.messages
          .map((m) => {
                'role': m.isUser ? 'user' : 'assistant',
                'content': m.text,
              })
          .toList();

      // Resolve display name for the system prompt
      final modelInfo = kAvailableModels
          .where((m) => m.id == state.selectedModel)
          .firstOrNull;
      final modelName = modelInfo?.displayName ?? state.selectedModel;

      final response = await service.sendMessage(
        model: state.selectedModel,
        messages: apiMessages,
        systemPrompt: qaiSystemPrompt(modelName),
      );
      service.dispose();

      final assistantMsg = QaiMessage(
        text: response,
        isUser: false,
        model: state.selectedModel,
      );
      state = state.copyWith(
        messages: [...state.messages, assistantMsg],
        isLoading: false,
      );
    } on LLMException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void clearConversation() {
    state = state.copyWith(messages: [], error: null);
  }
}

final qaiProvider =
    NotifierProvider<QaiNotifier, QaiState>(QaiNotifier.new);
