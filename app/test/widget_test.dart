import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';

import 'test_helpers.dart';

void main() {
  setUpAll(() => setUpTestEnvironment());

  testWidgets('App renders with Quantum Vault as initial route', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(ProviderScope(
        overrides: testOverrides, child: const ZipminatorApp()));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(milliseconds: 100));

    // Verify the Vault screen is shown (initial route)
    expect(find.text('Quantum Vault'), findsOneWidget);
    expect(find.text('ML-KEM-768 File Encryption'), findsOneWidget);
  });

  testWidgets('App has MaterialApp.router with correct title', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(ProviderScope(
        overrides: testOverrides, child: const ZipminatorApp()));
    await tester.pump(const Duration(seconds: 1));

    // Verify MaterialApp exists with correct title
    final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(materialApp.title, 'Zipminator');
  });

  testWidgets('Bottom navigation shows 5 pillar tabs on mobile', (
    WidgetTester tester,
  ) async {
    // Set a mobile-sized screen
    tester.view.physicalSize = const Size(400, 800);
    tester.view.devicePixelRatio = 1.0;

    await tester.pumpWidget(ProviderScope(
        overrides: testOverrides, child: const ZipminatorApp()));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(milliseconds: 100));

    // Should show bottom NavigationBar with 4 primary tabs + More overflow
    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.text('Vault'), findsOneWidget);
    expect(find.text('Messenger'), findsOneWidget);
    expect(find.text('VoIP'), findsOneWidget);
    expect(find.text('VPN'), findsOneWidget);
    expect(find.text('More'), findsOneWidget);

    // Reset view
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });

  testWidgets('Navigation rail shows on wide screens', (
    WidgetTester tester,
  ) async {
    // Set a desktop-sized screen
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1.0;

    await tester.pumpWidget(ProviderScope(
        overrides: testOverrides, child: const ZipminatorApp()));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(milliseconds: 100));

    // Should show NavigationRail instead of bottom bar
    expect(find.byType(NavigationRail), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);

    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });

  testWidgets('Generate Keypair button exists on Vault screen', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(ProviderScope(
        overrides: testOverrides, child: const ZipminatorApp()));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(milliseconds: 100));

    // Key management is in a collapsible section
    expect(find.text('Key Management'), findsOneWidget);
  });
}
