import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/providers/browser_provider.dart';

void main() {
  group('BrowserState', () {
    test('initial state defaults', () {
      const state = BrowserState();
      expect(state.url, 'https://zipminator.zip');
      expect(state.isLoading, false);
      expect(state.proxyActive, true);
      expect(state.canGoBack, false);
      expect(state.canGoForward, false);
    });

    test('copyWith updates URL', () {
      const state = BrowserState();
      final updated = state.copyWith(url: 'https://example.com');
      expect(updated.url, 'https://example.com');
      expect(updated.proxyActive, true); // unchanged
    });

    test('copyWith toggles proxy', () {
      const state = BrowserState();
      final toggled = state.copyWith(proxyActive: true);
      expect(toggled.proxyActive, true);
    });
  });
}
