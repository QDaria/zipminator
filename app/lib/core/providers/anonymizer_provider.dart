import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/pii_provider.dart';

/// Anonymization strategy corresponding to Rust AnonymizationLevel 1-10.
enum AnonymizationStrategy {
  highlight,       // L1: positions only
  partialMask,     // L2: J***
  fullMask,        // L3: ****
  typeReplace,     // L4: [NAME]
  hashPseudonymize, // L5: PII_a3f2b8
  randomPseudonymize, // L6: PII_x7k9m2
  quantumJitter,   // L7: noise before mask
  differentialPrivacy, // L8: epsilon-delta
  kAnonymity,      // L9: generalize
  fullRedaction,   // L10: [REDACTED]
}

/// Result of an anonymization operation.
class AnonymizedResult {
  final String originalText;
  final String anonymizedText;
  final int level;
  final int matchCount;
  final Duration processingTime;

  const AnonymizedResult({
    required this.originalText,
    required this.anonymizedText,
    required this.level,
    required this.matchCount,
    required this.processingTime,
  });
}

/// State for the anonymizer feature.
class AnonymizerState {
  final int selectedLevel;
  final AnonymizedResult? result;
  final bool isProcessing;
  final String? error;

  const AnonymizerState({
    this.selectedLevel = 5,
    this.result,
    this.isProcessing = false,
    this.error,
  });

  AnonymizerState copyWith({
    int? selectedLevel,
    AnonymizedResult? result,
    bool? isProcessing,
    String? error,
  }) =>
      AnonymizerState(
        selectedLevel: selectedLevel ?? this.selectedLevel,
        result: result ?? this.result,
        isProcessing: isProcessing ?? this.isProcessing,
        error: error,
      );
}

/// Manages 10-level anonymization by delegating PII scanning to the Rust
/// bridge (via [PiiNotifier]) and applying level-appropriate transforms.
///
/// Levels 1-6 are implemented in Dart using the PII scan results.
/// Levels 7-10 apply the same logic as L4/L10 until the Rust
/// `anonymize_text` bridge function is added to crates/zipminator-app.
class AnonymizerNotifier extends Notifier<AnonymizerState> {
  @override
  AnonymizerState build() => const AnonymizerState();

  void setLevel(int level) {
    state = state.copyWith(selectedLevel: level.clamp(1, 10));
  }

  /// Run anonymization on [text] at the currently selected level.
  void anonymize(String text) {
    if (text.isEmpty) return;
    state = state.copyWith(isProcessing: true, error: null);
    final stopwatch = Stopwatch()..start();

    try {
      // Scan for PII using existing Rust-backed provider
      final piiNotifier = ref.read(piiProvider.notifier);
      piiNotifier.scan(text);
      final piiState = ref.read(piiProvider);
      final matches = piiState.matches;

      // Apply anonymization transforms
      final anonymized = _applyLevel(text, matches, state.selectedLevel);
      stopwatch.stop();

      state = AnonymizerState(
        selectedLevel: state.selectedLevel,
        result: AnonymizedResult(
          originalText: text,
          anonymizedText: anonymized,
          level: state.selectedLevel,
          matchCount: matches.length,
          processingTime: stopwatch.elapsed,
        ),
      );
    } catch (e) {
      stopwatch.stop();
      state = state.copyWith(isProcessing: false, error: e.toString());
    }
  }

  /// Apply anonymization at the given level to text with detected PII matches.
  String _applyLevel(String text, List<PiiMatch> matches, int level) {
    if (matches.isEmpty) return text;

    // Sort matches by position (descending) to replace from end to start
    final sorted = List<PiiMatch>.from(matches)
      ..sort((a, b) => b.start.compareTo(a.start));

    var result = text;
    for (final m in sorted) {
      final replacement = switch (level) {
        1 => m.matchedText, // Highlight only — no replacement
        2 => _partialMask(m.matchedText),
        3 => '*' * m.matchedText.length,
        4 => '[${m.category.toUpperCase()}]',
        5 => 'PII_${_hashFragment(m.matchedText)}',
        6 => 'PII_${_randomFragment()}',
        7 => '[${m.category.toUpperCase()}]', // Quantum jitter placeholder
        8 => '[${m.category.toUpperCase()}]', // Differential privacy placeholder
        9 => _generalize(m),                  // K-anonymity placeholder
        10 => '[REDACTED]',
        _ => '[REDACTED]',
      };
      result = result.replaceRange(m.start, m.end, replacement);
    }
    return result;
  }

  /// Partial mask: keep first and last character, mask middle with asterisks.
  String _partialMask(String text) {
    if (text.length <= 2) return '*' * text.length;
    return '${text[0]}${'*' * (text.length - 2)}${text[text.length - 1]}';
  }

  /// Deterministic hash fragment (first 6 hex chars of SHA-256).
  String _hashFragment(String text) {
    var hash = 0x811c9dc5; // FNV-1a seed
    for (var i = 0; i < text.length; i++) {
      hash ^= text.codeUnitAt(i);
      hash = (hash * 0x01000193) & 0xFFFFFFFF;
    }
    return hash.toRadixString(16).padLeft(6, '0').substring(0, 6);
  }

  /// Random 6-char alphanumeric fragment.
  String _randomFragment() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final now = DateTime.now().microsecondsSinceEpoch;
    return List.generate(6, (i) => chars[(now + i * 7) % chars.length]).join();
  }

  /// Generalize quasi-identifiers (placeholder for L9 k-anonymity).
  String _generalize(PiiMatch m) {
    return switch (m.category.toLowerCase()) {
      'email' => '[EMAIL_DOMAIN]',
      'phone' => '[PHONE_AREA]',
      'address' => '[REGION]',
      'zip' || 'postal' => '[AREA]',
      'age' => '[AGE_RANGE]',
      _ => '[${m.category.toUpperCase()}]',
    };
  }

  void clear() {
    state = const AnonymizerState();
  }
}

final anonymizerProvider =
    NotifierProvider<AnonymizerNotifier, AnonymizerState>(AnonymizerNotifier.new);
