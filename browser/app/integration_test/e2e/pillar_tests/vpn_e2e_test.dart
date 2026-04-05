import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 4: Q-VPN E2E -- status display, connect button, kill switch toggle.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 4: VPN E2E', () {
    testWidgets('displays Q-VPN header and Disconnected status',
        (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'VPN');

      expect(find.text('Q-VPN'), findsOneWidget);
      expect(find.text('Disconnected'), findsOneWidget);
      await takeScreenshot(tester, 'vpn_disconnected');
    });

    testWidgets('tapping connect button changes state', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'VPN');

      // The connect button uses a power icon in a circular ElevatedButton
      final powerButton = find.byIcon(Icons.power_settings_new);
      expect(powerButton, findsOneWidget);
      await takeScreenshot(tester, 'vpn_before_connect');

      await tester.tap(powerButton);
      await tester.pumpAndSettle();

      // After tap, state should change to Connecting or show an error
      // (no real VPN server in test). Either way the Disconnected text
      // should be replaced or an error should appear.
      final stillDisconnected = find.text('Disconnected');
      final connecting = find.text('Establishing PQ Handshake...');
      final connected = find.text('Connected');

      // State should have changed from Disconnected
      expect(
        stillDisconnected.evaluate().isEmpty ||
            connecting.evaluate().isNotEmpty ||
            connected.evaluate().isNotEmpty,
        isTrue,
      );

      await takeScreenshot(tester, 'vpn_after_connect_tap');
    });

    testWidgets('kill switch toggle is present and tappable', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'VPN');

      expect(find.text('Kill Switch'), findsOneWidget);
      expect(find.text('Block traffic if VPN disconnects'), findsOneWidget);

      // Find the SwitchListTile and toggle it
      final switches = find.byType(Switch);
      if (switches.evaluate().isNotEmpty) {
        await tester.tap(switches.first);
        await tester.pumpAndSettle();
      }

      await takeScreenshot(tester, 'vpn_kill_switch_toggled');
    });

    testWidgets('server location selector shows regions', (tester) async {
      await pumpDesktopApp(tester);
      await navigateToPillar(tester, 'VPN');

      expect(find.text('Server Location'), findsOneWidget);

      // ChoiceChip regions should be visible
      final chips = find.byType(ChoiceChip);
      expect(chips, findsWidgets);
      await takeScreenshot(tester, 'vpn_region_selector');
    });
  });
}
