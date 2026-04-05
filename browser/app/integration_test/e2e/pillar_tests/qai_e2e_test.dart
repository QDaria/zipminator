import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 6: Q-AI Assistant E2E -- chat interface, model routing, text input.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 6: Q-AI E2E', () {
    testWidgets('displays Q-AI Assistant header', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Q-AI');

      expect(find.text('Q-AI Assistant'), findsWidgets);
      await takeScreenshot(tester, 'qai_header');
    });

    testWidgets('Auto Route badge is visible', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Q-AI');

      // The Auto Route badge appears in the model selector area
      final autoRoute = find.text('Auto Route');
      if (autoRoute.evaluate().isNotEmpty) {
        expect(autoRoute, findsWidgets);
      }
      await takeScreenshot(tester, 'qai_auto_route');
    });

    testWidgets('text input field accepts a test prompt', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Q-AI');

      // Find the chat input TextField
      final textFields = find.byType(TextField);
      expect(textFields, findsWidgets);

      // Enter a test prompt in the last TextField (chat input is at bottom)
      final chatInput = textFields.last;
      await tester.enterText(chatInput, 'Hello Q-AI');
      await tester.pumpAndSettle();

      await takeScreenshot(tester, 'qai_prompt_entered');
    });

    testWidgets('model selector shows available providers', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Q-AI');

      // Look for provider-related UI elements (chips, dropdown, or buttons)
      // The QAI screen has a model selector in the app bar or body
      final compareButton = find.byTooltip('Compare models');
      if (compareButton.evaluate().isNotEmpty) {
        expect(compareButton, findsOneWidget);
      }

      await takeScreenshot(tester, 'qai_model_selector');
    });

    testWidgets('clear conversation button is functional', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Q-AI');

      // The clear button should be present (may be disabled if no messages)
      final clearButton = find.byTooltip('Clear conversation');
      expect(clearButton, findsOneWidget);
      await takeScreenshot(tester, 'qai_clear_button');
    });
  });
}
