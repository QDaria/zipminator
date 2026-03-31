import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

/// Platform-native TTS/STT wrapper.
///
/// Uses Apple Speech on iOS/macOS, Google Speech on Android.
/// No API key required; all processing runs on-device.
class VoiceService {
  final SpeechToText _stt = SpeechToText();
  final FlutterTts _tts = FlutterTts();

  bool _sttAvailable = false;
  bool _listening = false;
  bool _speaking = false;

  // ---------------------------------------------------------------------------
  // STT
  // ---------------------------------------------------------------------------

  /// Initialize speech recognition. Returns true if STT is available.
  Future<bool> initSTT() async {
    _sttAvailable = await _stt.initialize(
      onStatus: (status) {
        _listening = status == 'listening';
      },
      onError: (error) {
        _listening = false;
      },
    );
    return _sttAvailable;
  }

  /// Start listening for speech input.
  ///
  /// [onResult] receives partial and final transcripts.
  /// [onDone] fires when the recognizer stops (optional).
  Future<void> startListening(
    Function(String) onResult, {
    Function()? onDone,
  }) async {
    if (!_sttAvailable || _listening) return;

    _listening = true;
    await _stt.listen(
      onResult: (SpeechRecognitionResult result) {
        onResult(result.recognizedWords);
        if (result.finalResult) {
          _listening = false;
          onDone?.call();
        }
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
      listenOptions: SpeechListenOptions(
        cancelOnError: true,
        listenMode: ListenMode.confirmation,
      ),
    );
  }

  /// Stop listening.
  Future<void> stopListening() async {
    if (!_listening) return;
    await _stt.stop();
    _listening = false;
  }

  /// Whether STT is currently active.
  bool get isListening => _listening;

  /// Whether the platform supports STT.
  bool get sttAvailable => _sttAvailable;

  // ---------------------------------------------------------------------------
  // TTS
  // ---------------------------------------------------------------------------

  /// Speak the given [text] aloud.
  Future<void> speak(String text) async {
    if (text.isEmpty) return;
    _speaking = true;
    _tts.setCompletionHandler(() {
      _speaking = false;
    });
    await _tts.speak(text);
  }

  /// Stop any ongoing speech output.
  Future<void> stop() async {
    await _tts.stop();
    _speaking = false;
  }

  /// Set the speech rate. Range: 0.0 (slowest) to 1.0 (fastest).
  Future<void> setRate(double rate) async {
    await _tts.setSpeechRate(rate.clamp(0.0, 1.0));
  }

  /// Set the TTS language (e.g. "en-US", "nb-NO").
  Future<void> setLanguage(String lang) async {
    await _tts.setLanguage(lang);
  }

  /// Whether TTS is currently speaking.
  bool get isSpeaking => _speaking;

  /// Check if TTS engine is available.
  Future<bool> checkTtsAvailable() async {
    final engines = await _tts.getEngines;
    return engines != null && (engines as List).isNotEmpty;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /// Release all resources.
  Future<void> dispose() async {
    await _stt.stop();
    await _stt.cancel();
    await _tts.stop();
    _listening = false;
    _speaking = false;
  }
}
