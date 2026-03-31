import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/services/voice_service.dart';

/// Immutable state for the voice (TTS/STT) subsystem.
class VoiceState {
  final bool isListening;
  final bool isSpeaking;
  final String partialTranscript;
  final bool sttAvailable;
  final bool ttsAvailable;
  final bool autoReadResponses;

  const VoiceState({
    this.isListening = false,
    this.isSpeaking = false,
    this.partialTranscript = '',
    this.sttAvailable = false,
    this.ttsAvailable = false,
    this.autoReadResponses = false,
  });

  VoiceState copyWith({
    bool? isListening,
    bool? isSpeaking,
    String? partialTranscript,
    bool? sttAvailable,
    bool? ttsAvailable,
    bool? autoReadResponses,
  }) =>
      VoiceState(
        isListening: isListening ?? this.isListening,
        isSpeaking: isSpeaking ?? this.isSpeaking,
        partialTranscript: partialTranscript ?? this.partialTranscript,
        sttAvailable: sttAvailable ?? this.sttAvailable,
        ttsAvailable: ttsAvailable ?? this.ttsAvailable,
        autoReadResponses: autoReadResponses ?? this.autoReadResponses,
      );
}

/// Riverpod notifier wrapping [VoiceService] for TTS/STT state management.
class VoiceNotifier extends Notifier<VoiceState> {
  late final VoiceService _service;

  @override
  VoiceState build() {
    _service = VoiceService();
    ref.onDispose(() => _service.dispose());
    return const VoiceState();
  }

  /// Check platform availability for STT and TTS.
  Future<void> init() async {
    final stt = await _service.initSTT();
    final tts = await _service.checkTtsAvailable();
    state = state.copyWith(sttAvailable: stt, ttsAvailable: tts);
  }

  /// Toggle speech recognition on/off.
  ///
  /// While listening, partial transcripts stream into [controller].
  /// On final result the full transcript replaces the controller text.
  Future<void> toggleListening(TextEditingController controller) async {
    if (state.isListening) {
      await _service.stopListening();
      state = state.copyWith(isListening: false);
      return;
    }

    state = state.copyWith(isListening: true, partialTranscript: '');

    await _service.startListening(
      (transcript) {
        controller.text = transcript;
        controller.selection = TextSelection.fromPosition(
          TextPosition(offset: transcript.length),
        );
        state = state.copyWith(partialTranscript: transcript);
      },
      onDone: () {
        state = state.copyWith(isListening: false);
      },
    );
  }

  /// Speak the given [text] aloud via TTS.
  Future<void> speakText(String text) async {
    if (text.isEmpty) return;
    state = state.copyWith(isSpeaking: true);
    await _service.speak(text);
    // The service completion handler sets _speaking = false,
    // but we also need to update provider state.
    state = state.copyWith(isSpeaking: false);
  }

  /// Stop any active TTS playback.
  Future<void> stopSpeaking() async {
    await _service.stop();
    state = state.copyWith(isSpeaking: false);
  }

  /// Toggle the auto-read-responses preference.
  void toggleAutoRead() {
    state = state.copyWith(autoReadResponses: !state.autoReadResponses);
  }
}

final voiceProvider =
    NotifierProvider<VoiceNotifier, VoiceState>(VoiceNotifier.new);
