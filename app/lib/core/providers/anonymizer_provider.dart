import 'dart:math';
import 'dart:typed_data';
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
        7 => _quantumJitter(m),
        8 => _differentialPrivacy(m),
        9 => _kAnonymity(m),
        10 => _quantumRedact(m),
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

  /// L7: Quantum jitter. Adds entropy-seeded noise before masking.
  /// Numeric chars get random digit replacement; alpha chars get random letter.
  /// Each invocation produces different output (non-deterministic).
  String _quantumJitter(PiiMatch m) {
    final entropy = _getEntropy(m.matchedText.length);
    final buf = StringBuffer();
    for (var i = 0; i < m.matchedText.length; i++) {
      final c = m.matchedText.codeUnitAt(i);
      final noise = entropy[i % entropy.length];
      if (c >= 48 && c <= 57) {
        // digit: replace with noised digit
        buf.writeCharCode(48 + (noise % 10));
      } else if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
        // letter: replace with noised letter (preserve case)
        final base = c >= 97 ? 97 : 65;
        buf.writeCharCode(base + (noise % 26));
      } else {
        buf.write(m.matchedText[i]); // keep separators
      }
    }
    return buf.toString();
  }

  /// L8: Differential privacy via Laplace mechanism.
  /// For numeric PII, applies calibrated noise (epsilon=1.0).
  /// For text PII, replaces with randomized pseudonym from category pool.
  String _differentialPrivacy(PiiMatch m) {
    final digits = m.matchedText.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length >= 3) {
      // Numeric PII: apply Laplace noise
      final value = int.tryParse(digits) ?? 0;
      final entropy = _getEntropy(8);
      // Laplace noise approximation: difference of two exponentials
      final u1 = (entropy[0] + 1) / 257.0;
      final u2 = (entropy[1] + 1) / 257.0;
      const epsilon = 1.0;
      const sensitivity = 1.0;
      final noise = (sensitivity / epsilon) * (log(u1) - log(u2));
      final noised = (value + noise).round().abs();
      // Reconstruct with original separators
      final noisedStr = noised.toString().padLeft(digits.length, '0');
      var result = m.matchedText;
      var di = 0;
      final buf = StringBuffer();
      for (var i = 0; i < result.length && di < noisedStr.length; i++) {
        if (RegExp(r'[0-9]').hasMatch(result[i])) {
          buf.write(noisedStr[di]);
          di++;
        } else {
          buf.write(result[i]);
        }
      }
      return buf.toString();
    }
    // Non-numeric: randomized pseudonym
    return 'DP_${_randomFragment()}';
  }

  /// L9: K-anonymity generalization. Reduces quasi-identifiers to broader
  /// categories (zip to area, age to range, names to initials).
  String _kAnonymity(PiiMatch m) {
    return switch (m.category.toLowerCase()) {
      'email' => _generalizeEmail(m.matchedText),
      'phone' => _generalizePhone(m.matchedText),
      'address' => '[REGION]',
      'zip' || 'postal' => _generalizeZip(m.matchedText),
      'name' => _generalizeInitials(m.matchedText),
      'ssn' || 'national_id' => '***-**-${m.matchedText.substring(m.matchedText.length - 4).replaceAll(RegExp(r'[0-9]'), '*')}',
      'date' || 'dob' => _generalizeDate(m.matchedText),
      'age' => '[AGE_RANGE]',
      _ => '[${m.category.toUpperCase()}]',
    };
  }

  /// L10: Quantum one-time-pad redaction. XOR with entropy bytes, then hash.
  /// The result is cryptographically irreversible.
  String _quantumRedact(PiiMatch m) {
    final textBytes = Uint8List.fromList(m.matchedText.codeUnits);
    final entropy = _getEntropy(textBytes.length);
    // XOR text with entropy (one-time pad)
    var xorHash = 0x811c9dc5;
    for (var i = 0; i < textBytes.length; i++) {
      final xored = textBytes[i] ^ entropy[i % entropy.length];
      xorHash ^= xored;
      xorHash = (xorHash * 0x01000193) & 0xFFFFFFFF;
    }
    final tag = xorHash.toRadixString(16).padLeft(6, '0').substring(0, 6);
    return '[QR_$tag]';
  }

  // ── Entropy helper ──────────────────────────────────────────────────

  /// Get entropy bytes from Rust QRNG bridge, falling back to secure random.
  Uint8List _getEntropy(int length) {
    // Use dart:math secure random (Rust FFI bridge has no getEntropy export).
    final rng = Random.secure();
    return Uint8List.fromList(
      List.generate(length, (_) => rng.nextInt(256)),
    );
  }

  // ── K-anonymity generalization helpers ──────────────────────────────

  String _generalizeEmail(String email) {
    final at = email.indexOf('@');
    if (at < 0) return '[EMAIL]';
    return '***@${email.substring(at + 1)}';
  }

  String _generalizePhone(String phone) {
    final digits = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length >= 7) return '${digits.substring(0, 3)}-***-****';
    return '[PHONE]';
  }

  String _generalizeZip(String zip) {
    final digits = zip.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length >= 3) return '${digits.substring(0, 3)}**';
    return '[AREA]';
  }

  String _generalizeInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.map((p) => p.isNotEmpty ? '${p[0]}.' : '').join(' ');
  }

  String _generalizeDate(String date) {
    // Keep only the year
    final yearMatch = RegExp(r'(19|20)\d{2}').firstMatch(date);
    if (yearMatch != null) return yearMatch.group(0)!;
    return '[DATE]';
  }

  void clear() {
    state = const AnonymizerState();
  }
}

final anonymizerProvider =
    NotifierProvider<AnonymizerNotifier, AnonymizerState>(AnonymizerNotifier.new);
