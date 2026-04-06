import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// A single PII detection result.
class PiiMatch {
  final String patternId;
  final String patternName;
  final String category;
  final String matchedText;
  final int start;
  final int end;
  final int sensitivity;
  final String countryCode;

  PiiMatch({
    required this.patternId,
    required this.patternName,
    required this.category,
    required this.matchedText,
    required this.start,
    required this.end,
    required this.sensitivity,
    required this.countryCode,
  });

  factory PiiMatch.fromJson(Map<String, dynamic> json) => PiiMatch(
        patternId: json['pattern_id'] ?? '',
        patternName: json['pattern_name'] ?? '',
        category: json['category'] ?? '',
        matchedText: json['matched_text'] ?? '',
        start: json['start'] ?? 0,
        end: json['end'] ?? 0,
        sensitivity: json['sensitivity'] ?? 0,
        countryCode: json['country_code'] ?? '',
      );
}

/// State for PII scanning.
class PiiScanState {
  final String inputText;
  final List<PiiMatch> matches;
  final bool isScanning;
  final int selectedLevel;
  final String? redactedText;

  const PiiScanState({
    this.inputText = '',
    this.matches = const [],
    this.isScanning = false,
    this.selectedLevel = 5,
    this.redactedText,
  });

  PiiScanState copyWith({
    String? inputText,
    List<PiiMatch>? matches,
    bool? isScanning,
    int? selectedLevel,
    String? redactedText,
  }) =>
      PiiScanState(
        inputText: inputText ?? this.inputText,
        matches: matches ?? this.matches,
        isScanning: isScanning ?? this.isScanning,
        selectedLevel: selectedLevel ?? this.selectedLevel,
        redactedText: redactedText,
      );

  int get highSensitivityCount =>
      matches.where((m) => m.sensitivity >= 4).length;
}

/// Manages PII scanning via Rust bridge.
class PiiNotifier extends Notifier<PiiScanState> {
  @override
  PiiScanState build() => const PiiScanState();

  void scan(String text, {String countryCodes = ''}) {
    state = state.copyWith(inputText: text, isScanning: true);
    final jsonStr = rust.piiScan(text: text, countryCodes: countryCodes);
    final List<dynamic> parsed = jsonDecode(jsonStr);
    final matches = parsed.map((m) => PiiMatch.fromJson(m)).toList();
    state = state.copyWith(matches: matches, isScanning: false);
  }

  void setLevel(int level) {
    state = state.copyWith(selectedLevel: level);
  }

  /// Redact PII at or below the selected sensitivity level.
  void redact(String text) {
    scan(text);
    final filtered = state.matches
        .where((m) => m.sensitivity <= state.selectedLevel)
        .toList()
      ..sort((a, b) => b.start.compareTo(a.start));

    var result = text;
    for (final m in filtered) {
      final replacement = '[${m.category.toUpperCase()}]';
      result = result.replaceRange(m.start, m.end, replacement);
    }
    state = PiiScanState(
      inputText: state.inputText,
      matches: state.matches,
      selectedLevel: state.selectedLevel,
      redactedText: result,
    );
  }

  void clear() {
    state = const PiiScanState();
  }
}

final piiProvider =
    NotifierProvider<PiiNotifier, PiiScanState>(PiiNotifier.new);
