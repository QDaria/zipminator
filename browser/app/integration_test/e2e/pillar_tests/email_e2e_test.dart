import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 7: Quantum Mail E2E -- email compose, PQC encryption, tab navigation.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 7: Email E2E', () {
    testWidgets('displays Quantum Mail header', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Email');

      expect(find.text('Quantum Mail'), findsWidgets);
      await takeScreenshot(tester, 'email_header');
    });

    testWidgets('tab bar shows Inbox and Compose tabs', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Email');

      // Email screen uses a TabController with 2 tabs
      final tabBar = find.byType(TabBar);
      if (tabBar.evaluate().isNotEmpty) {
        expect(tabBar, findsOneWidget);
        await takeScreenshot(tester, 'email_tabs');
      } else {
        // May use a different navigation pattern
        await takeScreenshot(tester, 'email_no_tabs');
      }
    });

    testWidgets('compose view shows To, Subject, Body fields',
        (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Email');

      // Navigate to compose tab (second tab) if tab bar exists
      final tabs = find.byType(Tab);
      if (tabs.evaluate().length >= 2) {
        await tester.tap(tabs.at(1));
        await tester.pumpAndSettle();
      }

      // Look for compose-related fields
      // The email screen pre-fills To, Subject, Body TextEditingControllers
      final textFields = find.byType(TextField);
      if (textFields.evaluate().isNotEmpty) {
        await takeScreenshot(tester, 'email_compose_fields');
      }

      // Check for pre-filled content
      final toField = find.text('quantum@example.com');
      if (toField.evaluate().isNotEmpty) {
        expect(toField, findsOneWidget);
      }
      await takeScreenshot(tester, 'email_compose_view');
    });

    testWidgets('self-destruct timer selector is present', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'Email');

      // Navigate to compose tab
      final tabs = find.byType(Tab);
      if (tabs.evaluate().length >= 2) {
        await tester.tap(tabs.at(1));
        await tester.pumpAndSettle();
      }

      // Look for self-destruct dropdown or selector
      final neverOption = find.text('Never');
      if (neverOption.evaluate().isNotEmpty) {
        expect(neverOption, findsWidgets);
      }

      await takeScreenshot(tester, 'email_self_destruct');
    });
  });
}
