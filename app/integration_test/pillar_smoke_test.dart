import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:integration_test/integration_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:zipminator/app.dart';
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/router.dart' show skipAuthRedirectForTests;
import 'package:zipminator/core/services/supabase_service.dart';
import 'package:zipminator/src/rust/frb_generated.dart';

class _TestAuth extends AuthNotifier {
  @override
  AuthState build() => const AuthState();
}

/// Integration smoke tests for all 8 pillar screens, settings, and theme
/// switching. Uses desktop-width viewport so all pillar tabs are visible
/// in the NavigationRail (no "More" overflow needed).
///
/// Run on macOS:  flutter test integration_test/pillar_smoke_test.dart -d macos
/// Run on iOS:    flutter test integration_test/pillar_smoke_test.dart -d [ios-id]
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    skipAuthRedirectForTests = true;
    try { await RustLib.init(); } catch (_) {}
    try { await SupabaseService.initialize(); } catch (_) {
      try { await Supabase.initialize(
        url: 'https://placeholder.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
      ); } catch (_) {}
    }
  });

  Future<void> pumpDesktopApp(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1.0;
    await tester.pumpWidget(ProviderScope(
      overrides: [
        authProvider.overrideWith(() => _TestAuth()),
        signalingInitProvider.overrideWithValue(null),
      ],
      child: const ZipminatorApp(),
    ));
    await tester.pumpAndSettle(const Duration(seconds: 3));
  }

  tearDown(() {
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.resetPhysicalSize();
    binding.platformDispatcher.views.first.resetDevicePixelRatio();
  });

  testWidgets('All 8 pillars render via NavigationRail', (tester) async {
    await pumpDesktopApp(tester);

    // Verify NavigationRail is shown (desktop layout)
    expect(find.byType(NavigationRail), findsOneWidget);

    // Pillar 1: Vault (initial route)
    expect(find.text('Quantum Vault'), findsOneWidget);
    expect(find.text('Generate Keypair'), findsOneWidget);
    expect(find.text('FIPS 203'), findsOneWidget);

    // Pillar 2: Messenger
    await tester.tap(find.text('Messenger'));
    await tester.pumpAndSettle();
    expect(find.text('PQC Messenger'), findsOneWidget);
    expect(find.text('Double Ratchet'), findsOneWidget);

    // Pillar 3: VoIP
    await tester.tap(find.text('VoIP'));
    await tester.pumpAndSettle();
    expect(find.text('Quantum VoIP'), findsOneWidget);

    // Pillar 4: VPN
    await tester.tap(find.text('VPN'));
    await tester.pumpAndSettle();
    expect(find.text('Q-VPN'), findsOneWidget);
    expect(find.text('Disconnected'), findsOneWidget);

    // Pillar 5: Anonymizer
    await tester.tap(find.text('Anonymizer'));
    await tester.pumpAndSettle();
    expect(find.text('PII Scanner'), findsOneWidget);

    // Pillar 6: Q-AI
    await tester.tap(find.text('Q-AI'));
    await tester.pumpAndSettle();
    expect(find.text('Q-AI Assistant'), findsWidgets);
    expect(find.text('Auto Route'), findsOneWidget);

    // Pillar 7: Email
    await tester.tap(find.text('Email'));
    await tester.pumpAndSettle();
    expect(find.text('Quantum Mail'), findsWidgets);

    // Pillar 8: Browser
    await tester.tap(find.text('Browser'));
    await tester.pumpAndSettle();
    expect(find.text('PQC Browser'), findsWidgets);
    expect(find.text('Enable PQC Proxy'), findsOneWidget);

    // Navigate back to Vault to verify round-trip
    await tester.tap(find.text('Vault'));
    await tester.pumpAndSettle();
    expect(find.text('Quantum Vault'), findsOneWidget);
  });

  testWidgets('Settings screen renders with theme toggle', (tester) async {
    await pumpDesktopApp(tester);

    // Tap settings icon in NavigationRail trailing
    await tester.tap(find.byIcon(Icons.settings_outlined));
    await tester.pumpAndSettle();

    expect(find.text('Settings'), findsWidgets);
    expect(find.text('Theme'), findsOneWidget);
    expect(find.text('Crypto Engine'), findsOneWidget);
    expect(find.text('ML-KEM-768 (NIST FIPS 203)'), findsOneWidget);
    expect(find.byType(Switch), findsOneWidget);
  });

  testWidgets('Theme toggle switches dark to light', (tester) async {
    await pumpDesktopApp(tester);

    // Navigate to Settings
    await tester.tap(find.byIcon(Icons.settings_outlined));
    await tester.pumpAndSettle();

    // Starts in dark mode
    expect(find.text('Dark'), findsOneWidget);

    // Toggle
    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();

    // Now light mode
    expect(find.text('Light'), findsOneWidget);

    // Toggle back
    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect(find.text('Dark'), findsOneWidget);
  });
}
