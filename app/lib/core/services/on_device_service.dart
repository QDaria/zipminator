import 'dart:async';
import 'package:flutter/services.dart';
import 'llm_provider.dart';

/// On-device LLM inference via Google AI Edge LiteRT-LM runtime.
///
/// Uses a platform channel to the native LiteRT-LM engine (Android) or
/// CoreML/LiteRT (iOS). No network calls, no API keys. All data stays
/// on the device.
///
/// Reference: https://github.com/google-ai-edge/gallery
class OnDeviceService implements LLMService {
  static const _channel = MethodChannel('com.qdaria.zipminator/on_device');

  /// Check whether the native LiteRT-LM runtime is available on this device.
  static Future<bool> isAvailable() async {
    try {
      final result = await _channel.invokeMethod<bool>('isAvailable');
      return result ?? false;
    } on MissingPluginException {
      return false;
    }
  }

  /// Check whether a specific model is loaded and ready for inference.
  static Future<bool> isModelLoaded() async {
    try {
      final result = await _channel.invokeMethod<bool>('isModelLoaded');
      return result ?? false;
    } on MissingPluginException {
      return false;
    }
  }

  /// Load a model from local storage into the LiteRT-LM engine.
  ///
  /// [modelPath] is the absolute path to the `.litertlm` file on device.
  /// [accelerator] is 'cpu', 'gpu', or 'auto' (default).
  static Future<bool> loadModel(
    String modelPath, {
    String accelerator = 'auto',
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('loadModel', {
        'modelPath': modelPath,
        'accelerator': accelerator,
      });
      return result ?? false;
    } on PlatformException catch (e) {
      throw LLMException('Failed to load model: ${e.message}');
    }
  }

  /// Unload the current model from memory.
  static Future<void> unloadModel() async {
    try {
      await _channel.invokeMethod<void>('unloadModel');
    } on MissingPluginException {
      // No-op if plugin not registered.
    }
  }

  /// Get info about the currently loaded model.
  static Future<Map<String, dynamic>?> getModelInfo() async {
    try {
      final result = await _channel.invokeMethod<Map>('getModelInfo');
      return result?.cast<String, dynamic>();
    } on MissingPluginException {
      return null;
    }
  }

  /// Download a model from HuggingFace to local storage.
  ///
  /// Returns a stream of download progress (0.0 to 1.0).
  /// The final event contains the local file path.
  static Stream<OnDeviceDownloadProgress> downloadModel(LLMModel model) {
    if (model.hfRepo == null || model.hfFilename == null) {
      return Stream.error(LLMException('Model has no download info'));
    }

    const eventChannel =
        EventChannel('com.qdaria.zipminator/on_device_download');

    final controller = StreamController<OnDeviceDownloadProgress>();

    // Start the download via method channel, stream progress via event channel.
    _channel.invokeMethod<String>('downloadModel', {
      'hfRepo': model.hfRepo,
      'hfFilename': model.hfFilename,
      'modelId': model.id,
    }).then((_) {
      // Download started; progress comes via EventChannel.
    }).catchError((e) {
      controller.addError(LLMException('Download failed: $e'));
      controller.close();
    });

    eventChannel.receiveBroadcastStream().listen(
      (event) {
        if (event is Map) {
          final progress = (event['progress'] as num?)?.toDouble() ?? 0;
          final path = event['path'] as String?;
          final status = event['status'] as String? ?? 'downloading';
          controller.add(OnDeviceDownloadProgress(
            progress: progress,
            localPath: path,
            status: status,
          ));
          if (status == 'complete' || path != null) {
            controller.close();
          }
        }
      },
      onError: (e) {
        controller.addError(LLMException('Download error: $e'));
        controller.close();
      },
      onDone: () {
        if (!controller.isClosed) controller.close();
      },
    );

    return controller.stream;
  }

  /// List model IDs that are already downloaded to local storage.
  static Future<List<String>> listDownloadedModels() async {
    try {
      final result =
          await _channel.invokeMethod<List>('listDownloadedModels');
      return result?.cast<String>() ?? [];
    } on MissingPluginException {
      return [];
    }
  }

  /// Delete a downloaded model from local storage.
  static Future<void> deleteModel(String modelId) async {
    await _channel.invokeMethod<void>('deleteModel', {'modelId': modelId});
  }

  @override
  Future<String> sendMessage({
    required String model,
    required List<Map<String, String>> messages,
    String? systemPrompt,
    int maxTokens = 1024,
  }) async {
    // Build a single prompt from the conversation history.
    final prompt = _buildPrompt(messages, systemPrompt);

    try {
      final result = await _channel.invokeMethod<String>('generateText', {
        'prompt': prompt,
        'maxTokens': maxTokens,
      });
      return result ?? '';
    } on PlatformException catch (e) {
      if (e.code == 'MODEL_NOT_LOADED') {
        throw LLMException(
          'No on-device model loaded. Download a model first.',
        );
      }
      throw LLMException('On-device inference failed: ${e.message}');
    } on MissingPluginException {
      throw LLMException(
        'On-device inference not available on this platform.',
      );
    }
  }

  /// Convert chat messages to a Gemma-compatible prompt format.
  String _buildPrompt(
    List<Map<String, String>> messages,
    String? systemPrompt,
  ) {
    final buf = StringBuffer();

    // Gemma uses <start_of_turn> / <end_of_turn> format.
    if (systemPrompt != null) {
      buf.writeln('<start_of_turn>user');
      buf.writeln('System: $systemPrompt');
      buf.writeln('<end_of_turn>');
    }

    for (final msg in messages) {
      final role = msg['role'] == 'assistant' ? 'model' : 'user';
      buf.writeln('<start_of_turn>$role');
      buf.writeln(msg['content'] ?? '');
      buf.writeln('<end_of_turn>');
    }

    // Prompt the model to respond.
    buf.writeln('<start_of_turn>model');
    return buf.toString();
  }

  @override
  void dispose() {
    // No HTTP client to close; native engine lifecycle managed separately.
  }
}

/// Progress update during model download.
class OnDeviceDownloadProgress {
  final double progress;
  final String? localPath;
  final String status;

  const OnDeviceDownloadProgress({
    required this.progress,
    this.localPath,
    this.status = 'downloading',
  });

  bool get isComplete => status == 'complete';
  String get percentLabel => '${(progress * 100).toStringAsFixed(0)}%';
}
