import 'package:flutter_test/flutter_test.dart';

import '../helpers/e2e_utils.dart';

/// Pillar 1: Quantum Vault E2E tests.
void main() {
  setUpAll(() async => await initE2e());
  tearDown(resetViewSize);

  group('Pillar 1: Vault E2E', () {
    testWidgets('renders vault with all core elements', (tester) async {
      await pumpDesktopApp(tester);

      expect(find.text('Quantum Vault'), findsOneWidget);
      expect(find.text('FIPS 203'), findsOneWidget);
      expect(find.text('Generate Keypair'), findsOneWidget);
      expect(find.text('Key Management'), findsOneWidget);
      expect(find.text('Encrypted Files'), findsOneWidget);
      expect(find.text('Your vault is empty'), findsOneWidget);
      expect(find.text('Encrypt File'), findsOneWidget);

      await takeScreenshot(tester, 'vault_e2e');
    });
  });
}
