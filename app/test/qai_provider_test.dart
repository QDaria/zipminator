import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/services/qai_service.dart';

void main() {
  group('QaiService', () {
    test('resolveModel maps known models correctly', () {
      expect(QaiService.resolveModel('opus'), 'claude-opus-4-6');
      expect(QaiService.resolveModel('sonnet'), 'claude-sonnet-4-6');
      expect(QaiService.resolveModel('haiku'), 'claude-haiku-4-5-20251001');
      expect(QaiService.resolveModel('auto'), 'claude-sonnet-4-6');
    });

    test('resolveModel falls back to sonnet for unknown', () {
      expect(QaiService.resolveModel('unknown'), 'claude-sonnet-4-6');
    });
  });

  group('QaiException', () {
    test('toString includes message', () {
      final e = QaiException('test error');
      expect(e.toString(), contains('test error'));
    });
  });
}
