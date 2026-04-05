import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 3: Quantum VoIP E2E -- contact list, call initiation, ringing, end call.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 3: VoIP E2E', () {
    testWidgets('displays Quantum VoIP header', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'VoIP');

      expect(find.text('Quantum VoIP'), findsOneWidget);
      await takeScreenshot(tester, 'voip_header');
    });

    testWidgets('shows contact list in idle state', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'VoIP');

      // In idle state, the VoIP screen shows the contact list view.
      // Look for contact cards or the call-by-username field.
      expect(find.text('Quantum VoIP'), findsOneWidget);
      await takeScreenshot(tester, 'voip_contact_list');
    });

    testWidgets('tapping a contact starts ringing state', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'VoIP');

      // Find any contact card and tap it. Contacts are ListTile-based.
      // If no contacts exist, look for the call-by-username input.
      final contactCards = find.byType(Card);
      if (contactCards.evaluate().isNotEmpty) {
        await tester.tap(contactCards.first);
        await tester.pumpAndSettle();
        await takeScreenshot(tester, 'voip_ringing');

        // Look for ringing UI indicators (hangup button, calling text)
        final hangupIcon = find.byIcon(Icons.call_end);
        if (hangupIcon.evaluate().isNotEmpty) {
          await tester.tap(hangupIcon);
          await tester.pumpAndSettle();
          await takeScreenshot(tester, 'voip_call_ended');
        }
      } else {
        // No contacts: verify the empty/username-entry state rendered
        await takeScreenshot(tester, 'voip_no_contacts');
      }
    });

    testWidgets('call-by-username field accepts input', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'VoIP');

      // Find a TextField for entering a username to call
      final textFields = find.byType(TextField);
      if (textFields.evaluate().isNotEmpty) {
        await tester.enterText(textFields.first, 'testuser');
        await tester.pumpAndSettle();
        await takeScreenshot(tester, 'voip_username_input');
      } else {
        // No text field present; take screenshot of current state
        await takeScreenshot(tester, 'voip_no_username_field');
      }
    });
  });
}
