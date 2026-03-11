import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';

/// Helper to pump the full app and navigate to a specific pillar.
Future<void> pumpApp(WidgetTester tester) async {
  tester.view.physicalSize = const Size(400, 800);
  tester.view.devicePixelRatio = 1.0;
  await tester.pumpWidget(const ProviderScope(child: ZipminatorApp()));
  await tester.pumpAndSettle();
}

void main() {
  // ── Pillar 1: Vault ──
  group('Vault Screen', () {
    testWidgets('shows key management header', (tester) async {
      await pumpApp(tester);
      expect(find.text('ML-KEM-768 Key Management'), findsOneWidget);
      expect(find.text('FIPS 203'), findsOneWidget);
    });

    testWidgets('has Generate Keypair button', (tester) async {
      await pumpApp(tester);
      expect(find.text('Generate Keypair'), findsOneWidget);
      expect(find.byIcon(Icons.key), findsOneWidget);
    });
  });

  // ── Pillar 2: Messenger ──
  group('Messenger Screen', () {
    testWidgets('shows PQ Double Ratchet info and Start Session button',
        (tester) async {
      await pumpApp(tester);
      // Navigate to Messenger tab
      await tester.tap(find.text('Messenger'));
      await tester.pumpAndSettle();

      expect(find.text('PQC Messenger'), findsOneWidget);
      expect(find.text('Double Ratchet'), findsOneWidget);
      expect(find.text('Start Session'), findsOneWidget);
    });
  });

  // ── Pillar 3: VoIP ──
  group('VoIP Screen', () {
    testWidgets('shows PQ-SRTP info', (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('VoIP'));
      await tester.pumpAndSettle();

      expect(find.text('Quantum VoIP'), findsOneWidget);
      expect(find.text('PQ-SRTP Encrypted Calls'), findsOneWidget);
    });

    testWidgets('shows protocol info cards when not in call', (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('VoIP'));
      await tester.pumpAndSettle();

      expect(find.text('HKDF-SHA-256'), findsOneWidget);
      expect(find.text('AES-128-CM'), findsOneWidget);
    });
  });

  // ── Pillar 4: VPN ──
  group('VPN Screen', () {
    testWidgets('shows disconnect state and connect button', (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('VPN'));
      await tester.pumpAndSettle();

      expect(find.text('Q-VPN'), findsOneWidget);
      expect(find.text('Disconnected'), findsOneWidget);
      expect(find.byIcon(Icons.power_settings_new), findsOneWidget);
    });

    testWidgets('has kill switch toggle', (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('VPN'));
      await tester.pumpAndSettle();

      expect(find.text('Kill Switch'), findsOneWidget);
      expect(find.text('Block traffic if VPN disconnects'), findsOneWidget);
    });
  });

  // ── Pillar 5: Anonymizer ──
  group('Anonymizer Screen', () {
    testWidgets('shows PII scanner with scan button', (tester) async {
      // Use desktop size since Anonymizer is in mobile overflow menu
      tester.view.physicalSize = const Size(1200, 800);
      tester.view.devicePixelRatio = 1.0;
      await tester.pumpWidget(const ProviderScope(child: ZipminatorApp()));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Anonymizer'));
      await tester.pumpAndSettle();

      expect(find.text('Anonymizer'), findsWidgets);
      expect(find.text('PII Scanner'), findsOneWidget);
      expect(find.text('Scan'), findsOneWidget);
    });
  });

  // Reset view after each test
  tearDown(() {
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.resetPhysicalSize();
    binding.platformDispatcher.views.first.resetDevicePixelRatio();
  });
}
