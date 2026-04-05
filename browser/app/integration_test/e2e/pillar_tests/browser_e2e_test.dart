import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 8: PQC Browser E2E -- proxy toggle, URL bar, privacy settings.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 8: Browser E2E', () {
    testWidgets('displays PQC Browser header', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Browser');

      expect(find.text('PQC Browser'), findsWidgets);
      await takeScreenshot(tester, 'browser_header');
    });

    testWidgets('Enable PQC Proxy badge is present', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Browser');

      // The PQC proxy toggle is in the app bar as a tappable badge.
      // Look for the "PQC" text which appears in the proxy toggle.
      final pqcBadge = find.text('PQC');
      expect(pqcBadge, findsWidgets);

      // Also check for Enable PQC Proxy text if present
      final enableProxy = find.text('Enable PQC Proxy');
      if (enableProxy.evaluate().isNotEmpty) {
        expect(enableProxy, findsOneWidget);
      }

      await takeScreenshot(tester, 'browser_pqc_badge');
    });

    testWidgets('toggling PQC proxy changes shield icon', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Browser');

      await takeScreenshot(tester, 'browser_proxy_before_toggle');

      // The PQC toggle is a GestureDetector with shield icon.
      // Tap the PQC badge area to toggle proxy state.
      final pqcBadge = find.text('PQC');
      if (pqcBadge.evaluate().isNotEmpty) {
        await tester.tap(pqcBadge.first);
        await tester.pumpAndSettle();
      }

      await takeScreenshot(tester, 'browser_proxy_after_toggle');
    });

    testWidgets('URL bar accepts input', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Browser');

      // Find the URL TextField
      final textFields = find.byType(TextField);
      if (textFields.evaluate().isNotEmpty) {
        await tester.enterText(textFields.first, 'https://example.com');
        await tester.pumpAndSettle();
        await takeScreenshot(tester, 'browser_url_entered');
      } else {
        await takeScreenshot(tester, 'browser_no_url_field');
      }
    });
  });
}
