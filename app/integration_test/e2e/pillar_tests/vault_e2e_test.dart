import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 1: Quantum Vault E2E -- key generation, FIPS badge, file encryption UI.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 1: Vault E2E', () {
    testWidgets('displays Vault header, FIPS badge, and Generate Keypair',
        (tester) async {
      await pumpDesktopApp(tester);

      // Vault is the initial route
      expect(find.text('Quantum Vault'), findsOneWidget);
      expect(find.text('FIPS 203'), findsOneWidget);
      expect(find.text('Generate Keypair'), findsOneWidget);
      await takeScreenshot(tester, 'vault_initial');
    });

    testWidgets('generates keypair and shows Public Key', (tester) async {
      await pumpDesktopApp(tester);

      // Expand the Key Management card first
      final keyMgmt = find.text('Key Management');
      expect(keyMgmt, findsOneWidget);
      await tester.tap(keyMgmt);
      await tester.pumpAndSettle();

      await takeScreenshot(tester, 'vault_key_management_expanded');

      // Tap Generate Keypair button
      final genButton = find.text('Generate Keypair');
      expect(genButton, findsOneWidget);
      await tester.tap(genButton);

      // Wait for keypair generation to complete (look for Public Key label)
      await waitForWidget(
        tester,
        find.text('Public Key'),
        timeout: const Duration(seconds: 15),
      );

      expect(find.text('Public Key'), findsOneWidget);
      expect(find.text('Secret Key'), findsOneWidget);
      await takeScreenshot(tester, 'vault_keypair_generated');
    });

    testWidgets('shows empty vault state with hint', (tester) async {
      await pumpDesktopApp(tester);

      // Empty vault should show the hint text
      expect(find.text('Your vault is empty'), findsOneWidget);
      expect(find.text('Encrypted Files'), findsOneWidget);
      await takeScreenshot(tester, 'vault_empty_state');
    });

    testWidgets('Encrypt File FAB is visible', (tester) async {
      await pumpDesktopApp(tester);

      final fab = find.text('Encrypt File');
      expect(fab, findsOneWidget);
      await takeScreenshot(tester, 'vault_encrypt_fab');
    });
  });
}
