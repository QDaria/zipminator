import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';

/// Pump app in desktop mode (NavigationRail with all 8 tabs visible).
Future<void> pumpDesktop(WidgetTester tester) async {
  tester.view.physicalSize = const Size(1200, 800);
  tester.view.devicePixelRatio = 1.0;
  await tester.pumpWidget(const ProviderScope(child: ZipminatorApp()));
  await tester.pump(const Duration(seconds: 1));
  await tester.pump(const Duration(milliseconds: 100));
}

void main() {
  // ── Pillar 6: Q-AI Assistant ──
  group('Q-AI Screen', () {
    testWidgets('shows provider and model selectors', (tester) async {
      await pumpDesktop(tester);
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
    testWidgets('shows tabbed interface with Inbox and Compose', (tester) async {
      await pumpDesktop(tester);
      await tester.tap(find.text('Email'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Quantum Mail'), findsWidgets);
      // Tab bar with Inbox and Compose (Compose may appear as tab + button)
      expect(find.text('Inbox'), findsOneWidget);
      expect(find.text('Compose'), findsWidgets);
    });

    testWidgets('email screen has Quantum Mail title', (tester) async {
      await pumpDesktop(tester);
      await tester.tap(find.text('Email'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      // Email screen shows Quantum Mail and has both tabs
      expect(find.text('Quantum Mail'), findsWidgets);
      expect(find.text('Inbox'), findsOneWidget);
    });
  });

  // ── Pillar 8: Browser ──
  group('Browser Screen', () {
    testWidgets('shows PQC proxy toggle and privacy controls', (tester) async {
      await pumpDesktop(tester);
      await tester.tap(find.text('Browser'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

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
