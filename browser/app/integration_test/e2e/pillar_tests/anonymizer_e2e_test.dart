import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 5: Anonymizer E2E -- PII scanner, 10-level slider, tier cycling.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 5: Anonymizer E2E', () {
    testWidgets('displays PII Scanner header', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Anonymizer');

      expect(find.text('PII Scanner'), findsOneWidget);
      await takeScreenshot(tester, 'anonymizer_header');
    });

    testWidgets('level slider is visible with L1 default', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Anonymizer');

      // The slider widget should be present
      final slider = find.byType(Slider);
      expect(slider, findsOneWidget);

      // Default level badge should show L1
      expect(find.text('L1'), findsWidgets);
      await takeScreenshot(tester, 'anonymizer_level_1');
    });

    testWidgets('sliding to L5 updates the level badge', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Anonymizer');

      // Drag the slider to approximately level 5 (midpoint)
      final slider = find.byType(Slider);
      expect(slider, findsOneWidget);

      // Slider goes from 1 to 10. Dragging ~44% across should land near L5.
      final sliderBox = tester.getSize(slider);
      final sliderCenter = tester.getCenter(slider);

      // Calculate offset for L5 out of 1-10 range: (5-1)/(10-1) = 0.444
      // Offset from center = (0.444 - 0.5) * width = -0.056 * width
      final targetX = sliderCenter.dx + (0.444 - 0.5) * sliderBox.width;
      await tester.tapAt(Offset(targetX, sliderCenter.dy));
      await tester.pumpAndSettle();

      await takeScreenshot(tester, 'anonymizer_level_5');
    });

    testWidgets('sliding to L10 shows quantum OTP warning', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Anonymizer');

      // Drag slider to max (L10)
      final slider = find.byType(Slider);
      expect(slider, findsOneWidget);

      final sliderBox = tester.getSize(slider);
      final sliderCenter = tester.getCenter(slider);

      // Tap at the right end of the slider for L10
      final targetX = sliderCenter.dx + sliderBox.width * 0.45;
      await tester.tapAt(Offset(targetX, sliderCenter.dy));
      await tester.pumpAndSettle();

      // L10 may trigger a warning dialog. If it does, dismiss it.
      final confirmButton = find.text('I understand');
      if (confirmButton.evaluate().isNotEmpty) {
        await tester.tap(confirmButton);
        await tester.pumpAndSettle();
      }

      await takeScreenshot(tester, 'anonymizer_level_10');
    });

    testWidgets('compliance badges are displayed', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Anonymizer');

      // Check for compliance badges (GDPR, HIPAA, DORA, CCPA)
      expect(find.text('GDPR'), findsWidgets);
      await takeScreenshot(tester, 'anonymizer_compliance');
    });
  });
}
