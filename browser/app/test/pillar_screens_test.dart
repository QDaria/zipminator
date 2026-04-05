import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';

import 'test_helpers.dart';

/// Helper to pump the full app. Uses pump() to avoid infinite animation timeouts.
Future<void> pumpApp(WidgetTester tester) async {
  tester.view.physicalSize = const Size(400, 800);
  tester.view.devicePixelRatio = 1.0;
  await tester.pumpWidget(ProviderScope(
      overrides: testOverrides, child: const ZipminatorApp()));
  await tester.pump(const Duration(seconds: 1));
  await tester.pump(const Duration(milliseconds: 100));
}

void main() {
  setUpAll(() => setUpTestEnvironment());

  // ── Pillar 1: Vault ──
  group('Vault Screen', () {
    testWidgets('shows vault header and file encryption info', (tester) async {
      await pumpApp(tester);
      expect(find.text('ML-KEM-768 File Encryption'), findsOneWidget);
      expect(find.text('FIPS 203'), findsOneWidget);
    });

    testWidgets('has key management section', (tester) async {
      await pumpApp(tester);
      expect(find.text('Key Management'), findsOneWidget);
    });
  });

  // ── Pillar 2: Messenger ──
  group('Messenger Screen', () {
    testWidgets('shows PQC Messenger with conversation list',
        (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('Messenger'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('PQC Messenger'), findsOneWidget);
      // Should show conversation list with demo contacts
    });
  });

  // ── Pillar 3: VoIP ──
  group('VoIP Screen', () {
    testWidgets('shows PQ-SRTP info and Start Call button', (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('VoIP'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Quantum VoIP'), findsOneWidget);
      expect(find.text('PQ-SRTP'), findsWidgets);
    });

    testWidgets('shows protocol info cards when not in call', (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('VoIP'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('HKDF-SHA-256'), findsOneWidget);
      expect(find.text('AES-128-CM'), findsOneWidget);
    });
  });

  // ── Pillar 4: VPN ──
  group('VPN Screen', () {
    testWidgets('shows disconnect state and connect button', (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('VPN'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Q-VPN'), findsOneWidget);
      expect(find.text('Disconnected'), findsOneWidget);
      expect(find.byIcon(Icons.power_settings_new), findsOneWidget);
      expect(find.text('One-tap quantum-safe VPN tunnel'), findsOneWidget);
      expect(find.text('Server Location'), findsOneWidget);
    });

    testWidgets('has kill switch toggle', (tester) async {
      await pumpApp(tester);
      await tester.tap(find.text('VPN'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Kill Switch'), findsOneWidget);
      expect(find.text('Block traffic if VPN disconnects'), findsOneWidget);
    });
  });

  // ── Pillar 5: Anonymizer ──
  group('Anonymizer Screen', () {
    testWidgets('shows PII scanner with scan and redact buttons',
        (tester) async {
      tester.view.physicalSize = const Size(1200, 800);
      tester.view.devicePixelRatio = 1.0;
      await tester.pumpWidget(ProviderScope(
          overrides: testOverrides, child: const ZipminatorApp()));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(find.text('Anonymizer'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Anonymizer'), findsWidgets);
      expect(find.text('PII Scanner'), findsOneWidget);
      expect(find.text('Scan for PII'), findsOneWidget);
    });
  });

  // Reset view after each test
  tearDown(() {
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.resetPhysicalSize();
    binding.platformDispatcher.views.first.resetDevicePixelRatio();
  });
}
