import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/services/llm_provider.dart';

/// State for multi-provider comparison mode.
class ComparisonState {
  final bool isActive;
  final Set<String> selectedModelIds;
  final Map<String, String> responses;
  final Map<String, bool> loadingStates;
  final Map<String, String?> errors;
  final String? query;

  const ComparisonState({
    this.isActive = false,
    this.selectedModelIds = const {},
    this.responses = const {},
    this.loadingStates = const {},
    this.errors = const {},
    this.query,
  });

  ComparisonState copyWith({
    bool? isActive,
    Set<String>? selectedModelIds,
    Map<String, String>? responses,
    Map<String, bool>? loadingStates,
    Map<String, String?>? errors,
    String? query,
  }) =>
      ComparisonState(
        isActive: isActive ?? this.isActive,
        selectedModelIds: selectedModelIds ?? this.selectedModelIds,
        responses: responses ?? this.responses,
        loadingStates: loadingStates ?? this.loadingStates,
        errors: errors ?? this.errors,
        query: query ?? this.query,
      );
}

/// Manages multi-provider comparison: fire the same query at up to 4 models
/// in parallel and collect their responses independently.
class ComparisonNotifier extends Notifier<ComparisonState> {
  static const int _maxModels = 4;

  @override
  ComparisonState build() => const ComparisonState();

  /// Toggle comparison mode on/off.
  void toggleActive() {
    state = state.copyWith(isActive: !state.isActive);
  }

  /// Add or remove a model from the comparison set (max [_maxModels]).
  void toggleModel(String modelId) {
    final current = Set<String>.from(state.selectedModelIds);
    if (current.contains(modelId)) {
      current.remove(modelId);
    } else {
      if (current.length >= _maxModels) return;
      current.add(modelId);
    }
    state = state.copyWith(selectedModelIds: current);
  }

  /// Send [query] to every selected model in parallel.
  ///
  /// Each model resolves its provider from [kAvailableModels], creates the
  /// matching [LLMService], and stores its response (or error) independently.
  Future<void> sendToAll(
    String query,
    Map<LLMProvider, String> apiKeys,
  ) async {
    if (state.selectedModelIds.isEmpty) return;

    // Mark all selected models as loading.
    final loading = <String, bool>{};
    final errors = <String, String?>{};
    for (final id in state.selectedModelIds) {
      loading[id] = true;
      errors[id] = null;
    }
    state = state.copyWith(
      query: query,
      loadingStates: loading,
      responses: {},
      errors: errors,
    );

    // Fire all requests in parallel.
    final futures = <Future<void>>[];
    for (final modelId in state.selectedModelIds) {
      futures.add(_sendSingle(modelId, query, apiKeys));
    }
    await Future.wait(futures);
  }

  Future<void> _sendSingle(
    String modelId,
    String query,
    Map<LLMProvider, String> apiKeys,
  ) async {
    // Resolve model metadata.
    final model = kAvailableModels
        .where((m) => m.id == modelId)
        .firstOrNull;
    if (model == null) {
      _setError(modelId, 'Unknown model: $modelId');
      return;
    }

    final apiKey = model.provider.isOnDevice ? '' : (apiKeys[model.provider] ?? '');
    if (!model.provider.isOnDevice && apiKey.isEmpty) {
      _setError(
        modelId,
        'No API key for ${model.provider.displayName}',
      );
      return;
    }

    LLMService? service;
    try {
      service = createLLMService(model.provider, apiKey);
      final response = await service.sendMessage(
        model: modelId,
        messages: [
          {'role': 'user', 'content': query},
        ],
        systemPrompt: qaiSystemPrompt(model.displayName),
      );

      // Store response and clear loading flag.
      final responses = Map<String, String>.from(state.responses);
      responses[modelId] = response;
      final loading = Map<String, bool>.from(state.loadingStates);
      loading[modelId] = false;
      state = state.copyWith(responses: responses, loadingStates: loading);
    } on LLMException catch (e) {
      _setError(modelId, e.message);
    } catch (e) {
      _setError(modelId, e.toString());
    } finally {
      service?.dispose();
    }
  }

  void _setError(String modelId, String message) {
    final errors = Map<String, String?>.from(state.errors);
    errors[modelId] = message;
    final loading = Map<String, bool>.from(state.loadingStates);
    loading[modelId] = false;
    state = state.copyWith(errors: errors, loadingStates: loading);
  }

  /// Reset all responses, errors, and the current query.
  void clear() {
    state = state.copyWith(
      responses: {},
      loadingStates: {},
      errors: {},
      query: null,
    );
  }
}

final comparisonProvider =
    NotifierProvider<ComparisonNotifier, ComparisonState>(
        ComparisonNotifier.new);
