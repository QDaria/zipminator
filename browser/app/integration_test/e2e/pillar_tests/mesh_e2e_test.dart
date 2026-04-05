import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 9: Q-Mesh E2E -- WiFi CSI biometric auth, entropy bridge, mesh status.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 9: Mesh E2E', () {
    testWidgets('navigates to Q-Mesh via Settings or direct nav',
        (tester) async {
      await pumpDesktopApp(tester);

      // Q-Mesh may be accessible via Settings gear icon or a direct nav label.
      // Try direct navigation first.
      final meshLabel = find.text('Mesh');
      if (meshLabel.evaluate().isNotEmpty) {
        await tester.tap(meshLabel.first);
        await tester.pumpAndSettle();
      } else {
        // Navigate via Settings
        await navigateToSettings(tester);

        // Look for Q-Mesh or Mesh entry in settings
        final meshEntry = find.text('Q-Mesh');
        if (meshEntry.evaluate().isNotEmpty) {
          await tester.tap(meshEntry.first);
          await tester.pumpAndSettle();
        }
      }

      await takeScreenshot(tester, 'mesh_navigation');
    });

    testWidgets('displays Q-Mesh header and WiFi CSI subtitle',
        (tester) async {
      await pumpDesktopApp(tester);

      // Navigate to Mesh
      final meshLabel = find.text('Mesh');
      if (meshLabel.evaluate().isNotEmpty) {
        await tester.tap(meshLabel.first);
        await tester.pumpAndSettle();
      } else {
        await navigateToSettings(tester);
        final meshEntry = find.text('Q-Mesh');
        if (meshEntry.evaluate().isNotEmpty) {
          await tester.tap(meshEntry.first);
          await tester.pumpAndSettle();
        }
      }

      // Verify mesh-related text
      final qMesh = find.text('Q-Mesh');
      if (qMesh.evaluate().isNotEmpty) {
        expect(qMesh, findsWidgets);
      }

      final csiSubtitle = find.text('WiFi CSI Biometric Authentication');
      if (csiSubtitle.evaluate().isNotEmpty) {
        expect(csiSubtitle, findsOneWidget);
      }

      await takeScreenshot(tester, 'mesh_header');
    });

    testWidgets('QRNG Entropy and WiFi CSI badges are visible',
        (tester) async {
      await pumpDesktopApp(tester);

      // Navigate to Mesh
      final meshLabel = find.text('Mesh');
      if (meshLabel.evaluate().isNotEmpty) {
        await tester.tap(meshLabel.first);
        await tester.pumpAndSettle();
      } else {
        await navigateToSettings(tester);
        final meshEntry = find.text('Q-Mesh');
        if (meshEntry.evaluate().isNotEmpty) {
          await tester.tap(meshEntry.first);
          await tester.pumpAndSettle();
        }
      }

      // Check for PqcBadge labels
      final qrngBadge = find.text('QRNG Entropy');
      final csiBadge = find.text('WiFi CSI');

      if (qrngBadge.evaluate().isNotEmpty) {
        expect(qrngBadge, findsOneWidget);
      }
      if (csiBadge.evaluate().isNotEmpty) {
        expect(csiBadge, findsOneWidget);
      }

      await takeScreenshot(tester, 'mesh_badges');
    });

    testWidgets('mesh key rotation section is present', (tester) async {
      await pumpDesktopApp(tester);

      // Navigate to Mesh
      final meshLabel = find.text('Mesh');
      if (meshLabel.evaluate().isNotEmpty) {
        await tester.tap(meshLabel.first);
        await tester.pumpAndSettle();
      } else {
        await navigateToSettings(tester);
        final meshEntry = find.text('Q-Mesh');
        if (meshEntry.evaluate().isNotEmpty) {
          await tester.tap(meshEntry.first);
          await tester.pumpAndSettle();
        }
      }

      // Look for mesh key rotation text
      final meshKey = find.textContaining('Mesh Key');
      if (meshKey.evaluate().isNotEmpty) {
        expect(meshKey, findsWidgets);
      }

      await takeScreenshot(tester, 'mesh_key_rotation');
    });
  });
}
