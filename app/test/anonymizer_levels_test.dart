import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/providers/pii_provider.dart';

void main() {
  group('PiiScanState', () {
    test('initial level is 5', () {
      const state = PiiScanState();
      expect(state.selectedLevel, 5);
      expect(state.redactedText, null);
    });

    test('copyWith updates selectedLevel', () {
      const state = PiiScanState();
      final updated = state.copyWith(selectedLevel: 8);
      expect(updated.selectedLevel, 8);
    });

    test('copyWith preserves other fields', () {
      const state = PiiScanState(inputText: 'hello', selectedLevel: 3);
      final updated = state.copyWith(redactedText: 'redacted');
      expect(updated.inputText, 'hello');
      expect(updated.selectedLevel, 3);
      expect(updated.redactedText, 'redacted');
    });

    test('highSensitivityCount counts matches >= 4', () {
      final state = PiiScanState(matches: [
        PiiMatch(
          patternId: 'a',
          patternName: 'SSN',
          category: 'id',
          matchedText: '123-45-6789',
          start: 0,
          end: 11,
          sensitivity: 5,
          countryCode: 'us',
        ),
        PiiMatch(
          patternId: 'b',
          patternName: 'Name',
          category: 'name',
          matchedText: 'John',
          start: 12,
          end: 16,
          sensitivity: 2,
          countryCode: 'us',
        ),
      ]);
      expect(state.highSensitivityCount, 1);
    });
  });
}
