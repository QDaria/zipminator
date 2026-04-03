import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/services/llm_provider.dart';
import 'package:zipminator/core/services/on_device_service.dart';

/// State for on-device model management.
class OnDeviceState {
  final bool runtimeAvailable;
  final Set<String> downloadedModelIds;
  final String? activeModelId;
  final String? downloadingModelId;
  final double downloadProgress;
  final String? error;

  const OnDeviceState({
    this.runtimeAvailable = false,
    this.downloadedModelIds = const {},
    this.activeModelId,
    this.downloadingModelId,
    this.downloadProgress = 0,
    this.error,
  });

  bool get isDownloading => downloadingModelId != null;
  bool get hasActiveModel => activeModelId != null;

  bool isModelDownloaded(String modelId) =>
      downloadedModelIds.contains(modelId);

  OnDeviceState copyWith({
    bool? runtimeAvailable,
    Set<String>? downloadedModelIds,
    String? activeModelId,
    String? downloadingModelId,
    double? downloadProgress,
    String? error,
    bool clearActiveModel = false,
    bool clearDownloading = false,
    bool clearError = false,
  }) =>
      OnDeviceState(
        runtimeAvailable: runtimeAvailable ?? this.runtimeAvailable,
        downloadedModelIds: downloadedModelIds ?? this.downloadedModelIds,
        activeModelId:
            clearActiveModel ? null : (activeModelId ?? this.activeModelId),
        downloadingModelId: clearDownloading
            ? null
            : (downloadingModelId ?? this.downloadingModelId),
        downloadProgress: downloadProgress ?? this.downloadProgress,
        error: clearError ? null : (error ?? this.error),
      );
}

class OnDeviceNotifier extends Notifier<OnDeviceState> {
  StreamSubscription<OnDeviceDownloadProgress>? _downloadSub;

  @override
  OnDeviceState build() {
    ref.onDispose(() => _downloadSub?.cancel());
    _init();
    return const OnDeviceState();
  }

  Future<void> _init() async {
    final available = await OnDeviceService.isAvailable();
    final downloaded = await OnDeviceService.listDownloadedModels();
    state = state.copyWith(
      runtimeAvailable: available,
      downloadedModelIds: downloaded.toSet(),
    );
  }

  /// Download a model from HuggingFace. Progress updates are streamed.
  Future<void> downloadModel(LLMModel model) async {
    if (state.isDownloading) return;

    state = state.copyWith(
      downloadingModelId: model.id,
      downloadProgress: 0,
      clearError: true,
    );

    _downloadSub?.cancel();
    _downloadSub = OnDeviceService.downloadModel(model).listen(
      (progress) {
        state = state.copyWith(downloadProgress: progress.progress);
        if (progress.isComplete) {
          state = state.copyWith(
            downloadedModelIds: {...state.downloadedModelIds, model.id},
            clearDownloading: true,
          );
        }
      },
      onError: (e) {
        state = state.copyWith(
          error: e.toString(),
          clearDownloading: true,
        );
      },
    );
  }

  /// Load a downloaded model into the inference engine.
  Future<void> activateModel(String modelId) async {
    if (!state.isModelDownloaded(modelId)) {
      state = state.copyWith(error: 'Model not downloaded');
      return;
    }

    try {
      // The native side resolves modelId to the stored file path.
      final ok = await OnDeviceService.loadModel(modelId);
      if (ok) {
        state = state.copyWith(activeModelId: modelId, clearError: true);
      } else {
        state = state.copyWith(error: 'Failed to load model');
      }
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Unload the active model from memory.
  Future<void> deactivateModel() async {
    await OnDeviceService.unloadModel();
    state = state.copyWith(clearActiveModel: true);
  }

  /// Delete a downloaded model from disk.
  Future<void> deleteModel(String modelId) async {
    if (state.activeModelId == modelId) await deactivateModel();
    await OnDeviceService.deleteModel(modelId);
    final updated = Set<String>.from(state.downloadedModelIds)..remove(modelId);
    state = state.copyWith(downloadedModelIds: updated);
  }

  /// Refresh the list of downloaded models from native storage.
  Future<void> refresh() async => _init();
}

final onDeviceProvider =
    NotifierProvider<OnDeviceNotifier, OnDeviceState>(OnDeviceNotifier.new);
