import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';

import 'test_helpers.dart';

/// Pump app in desktop mode (NavigationRail with all 8 tabs visible).
Future<void> pumpDesktop(WidgetTester tester) async {
  tester.view.physicalSize = const Size(1200, 800);
  tester.view.devicePixelRatio = 1.0;
  await tester.pumpWidget(ProviderScope(
      overrides: testOverrides, child: const ZipminatorApp()));
  await tester.pump(const Duration(seconds: 1));
  await tester.pump(const Duration(milliseconds: 100));
}

void main() {
  setUpAll(() => setUpTestEnvironment());

  // ── Pillar 6: Q-AI Assistant ──
  group('Q-AI Screen', () {
    testWidgets('shows provider and model selectors', (tester) async {
      await pumpDesktop(tester);
      await tester.tap(find.text('Q-AI'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Q-AI Assistant'), findsWidgets);
      // Provider chips (default is On-Device)
      expect(find.text('On-Device'), findsOneWidget);
      expect(find.text('Claude'), findsOneWidget);
      expect(find.text('Gemini'), findsOneWidget);
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

      // Browser shows floating privacy chips (may appear multiple times)
      expect(find.text('PQC'), findsWidgets);
      expect(find.text('FP'), findsWidgets);
      expect(find.text('Cookie'), findsWidgets);
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
