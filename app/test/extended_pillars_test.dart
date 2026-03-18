import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';

/// Pump app in desktop mode (NavigationRail with all 8 tabs visible).
Future<void> pumpDesktop(WidgetTester tester) async {
  tester.view.physicalSize = const Size(1200, 800);
  tester.view.devicePixelRatio = 1.0;
  await tester.pumpWidget(const ProviderScope(child: ZipminatorApp()));
  await tester.pumpAndSettle();
}

void main() {
  // ── Pillar 6: Q-AI Assistant ──
  group('Q-AI Screen', () {
    testWidgets('shows provider and model selectors', (tester) async {
      await pumpDesktop(tester);
      // Navigate via rail
      await tester.tap(find.text('Q-AI'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Q-AI Assistant'), findsWidgets);
      // Provider chips
      expect(find.text('Claude'), findsOneWidget);
      expect(find.text('Gemini'), findsOneWidget);
      expect(find.text('OpenRouter'), findsOneWidget);
      // Default model chips for Claude
      expect(find.text('Claude Sonnet 4.6'), findsOneWidget);
    });
  });

  // ── Pillar 7: Email ──
  group('Email Screen', () {
    testWidgets('shows compose form with encrypt button', (tester) async {
      await pumpDesktop(tester);
      await tester.tap(find.text('Email'));
      await tester.pumpAndSettle();

      expect(find.text('Quantum Mail'), findsWidgets);
      expect(find.text('Encrypt with ML-KEM-768'), findsOneWidget);
      // Compose fields
      expect(find.text('To'), findsOneWidget);
      expect(find.text('Subject'), findsOneWidget);
      expect(find.text('Message body'), findsOneWidget);
    });

    testWidgets('auto-generates key when none loaded', (tester) async {
      await pumpDesktop(tester);
      await tester.tap(find.text('Email'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      // Email now auto-generates keypair and pre-fills fields
      expect(find.text('Quantum Mail'), findsWidgets);
      expect(find.text('Test PQC Encryption'), findsOneWidget);
    });
  });

  // ── Pillar 8: Browser ──
  group('Browser Screen', () {
    testWidgets('shows PQC proxy toggle and privacy controls', (tester) async {
      await pumpDesktop(tester);
      await tester.tap(find.text('Browser'));
      await tester.pumpAndSettle();

      // Browser shows floating privacy chips on macOS (WebView path)
      expect(find.text('PQC'), findsOneWidget);
      expect(find.text('FP'), findsOneWidget);
      expect(find.text('Cookie'), findsOneWidget);
      expect(find.text('Telemetry'), findsOneWidget);
    });
  });

  // ── Navigation: all 8 tabs visible on desktop ──
  group('Desktop Navigation', () {
    testWidgets('shows all 8 pillar labels in NavigationRail', (tester) async {
      await pumpDesktop(tester);

      expect(find.text('Vault'), findsOneWidget);
      expect(find.text('Messenger'), findsOneWidget);
      expect(find.text('VoIP'), findsOneWidget);
      expect(find.text('VPN'), findsOneWidget);
      expect(find.text('Anonymizer'), findsOneWidget);
      expect(find.text('Q-AI'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Browser'), findsOneWidget);
    });
  });

  tearDown(() {
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.resetPhysicalSize();
    binding.platformDispatcher.views.first.resetDevicePixelRatio();
  });
}
