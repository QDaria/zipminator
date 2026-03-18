import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';
import 'package:zipminator/core/providers/theme_provider.dart';

/// Cross-pillar integration tests verifying navigation between all pillars,
/// theme switching, and shared state consistency.
void main() {
  group('Cross-pillar navigation', () {
    testWidgets('can navigate between all 8 pillars on desktop',
        (tester) async {
      tester.view.physicalSize = const Size(1200, 800);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(const ProviderScope(child: ZipminatorApp()));
      await tester.pumpAndSettle();

      // Start at Vault
      expect(find.text('Quantum Vault'), findsOneWidget);

      // Navigate through each pillar and verify it loads
      final pillars = [
        ('Messenger', 'PQC Messenger'),
        ('VoIP', 'Quantum VoIP'),
        ('VPN', 'Q-VPN'),
        ('Anonymizer', 'Anonymizer'),
        ('Q-AI', 'Q-AI Assistant'),
        ('Email', 'Quantum Mail'),
        ('Browser', 'PQC'), // Full-page browser shows compact privacy chips
      ];

      for (final (tab, expectedTitle) in pillars) {
        await tester.tap(find.text(tab));
        // Use pump instead of pumpAndSettle — some screens have looping animations
        await tester.pump(const Duration(seconds: 1));
        await tester.pump(const Duration(milliseconds: 100));
        expect(find.text(expectedTitle), findsWidgets,
            reason: '$tab screen should show "$expectedTitle"');
      }

      // Navigate back to Vault
      await tester.tap(find.text('Vault'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('Quantum Vault'), findsOneWidget);

      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  });

  group('Theme switching', () {
    testWidgets('theme mode provider defaults to dark', (tester) async {
      late ThemeMode capturedMode;
      await tester.pumpWidget(
        ProviderScope(
          child: Consumer(
            builder: (context, ref, _) {
              capturedMode = ref.watch(themeModeProvider);
              return MaterialApp(home: Text('mode: $capturedMode'));
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(capturedMode, ThemeMode.dark);
    });

    testWidgets('theme toggle switches between dark and light', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(themeModeProvider), ThemeMode.dark);
      container.read(themeModeProvider.notifier).toggle();
      expect(container.read(themeModeProvider), ThemeMode.light);
      container.read(themeModeProvider.notifier).toggle();
      expect(container.read(themeModeProvider), ThemeMode.dark);
    });
  });

  group('Settings screen', () {
    testWidgets('settings accessible from navigation rail', (tester) async {
      tester.view.physicalSize = const Size(1200, 800);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(const ProviderScope(child: ZipminatorApp()));
      await tester.pumpAndSettle();

      // Tap settings icon
      await tester.tap(find.byIcon(Icons.settings_outlined));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Settings'), findsWidgets);
      expect(find.text('Theme'), findsOneWidget);
      expect(find.text('AI Provider API Keys'), findsOneWidget);
      expect(find.text('Crypto Engine'), findsOneWidget);
      expect(find.text('ML-KEM-768 (NIST FIPS 203)'), findsOneWidget);

      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  });

  group('Shared crypto state', () {
    testWidgets('email screen reflects crypto provider key status',
        (tester) async {
      tester.view.physicalSize = const Size(1200, 800);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(const ProviderScope(child: ZipminatorApp()));
      await tester.pumpAndSettle();

      // Go to Email - auto-generates key, shows pre-filled subject
      await tester.tap(find.text('Email'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));
      expect(find.text('Test PQC Encryption'), findsOneWidget);

      // Go to Vault - generate button should be available
      await tester.tap(find.text('Vault'));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 100));
      expect(find.text('Generate Keypair'), findsOneWidget);

      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  });
}
