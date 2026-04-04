import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:zipminator/app.dart';
import 'package:zipminator/src/rust/frb_generated.dart';

import 'test_config.dart';

/// Initialize E2E test binding and RustLib.
/// Call this once at the top of main() in each test file.
Future<void> initE2e() async {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  await RustLib.init();
}

/// Pump the app in desktop viewport (1200x800) and wait for settle.
Future<void> pumpDesktopApp(
  WidgetTester tester, {
  List<Override>? overrides,
}) async {
  tester.view.physicalSize = E2eConfig.desktopSize;
  tester.view.devicePixelRatio = 1.0;
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides ?? [],
      child: const ZipminatorApp(),
    ),
  );
  await tester.pumpAndSettle(E2eConfig.pumpSettleTimeout);
}

/// Pump the app in mobile viewport (400x800) and wait for settle.
Future<void> pumpMobileApp(
  WidgetTester tester, {
  List<Override>? overrides,
}) async {
  tester.view.physicalSize = E2eConfig.mobileSize;
  tester.view.devicePixelRatio = 1.0;
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides ?? [],
      child: const ZipminatorApp(),
    ),
  );
  await tester.pumpAndSettle(E2eConfig.pumpSettleTimeout);
}

/// Navigate to a pillar by tapping its label in the NavigationRail.
Future<void> navigateToPillar(WidgetTester tester, String pillarLabel) async {
  await tester.tap(find.text(pillarLabel));
  await tester.pumpAndSettle();
}

/// Navigate to Settings via the gear icon.
Future<void> navigateToSettings(WidgetTester tester) async {
  await tester.tap(find.byIcon(Icons.settings_outlined));
  await tester.pumpAndSettle();
}

/// Reset view size after a test. Call in tearDown.
void resetViewSize() {
  final binding = TestWidgetsFlutterBinding.instance;
  binding.platformDispatcher.views.first.resetPhysicalSize();
  binding.platformDispatcher.views.first.resetDevicePixelRatio();
}

/// Take a named screenshot for visual evidence.
/// Integration test binding captures these automatically.
Future<void> takeScreenshot(WidgetTester tester, String name) async {
  final binding = IntegrationTestWidgetsFlutterBinding.instance;
  await binding.convertFlutterSurfaceToImage();
  await tester.pumpAndSettle();
  await binding.takeScreenshot(name);
}

/// Wait for a widget matching [finder] to appear, with [timeout].
/// Polls every 250ms. Throws [TimeoutException] if not found in time.
Future<void> waitForWidget(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 10),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 250));
    if (finder.evaluate().isNotEmpty) return;
  }
  throw TimeoutException('Widget not found: $finder', timeout);
}

/// Verify a text widget exists and take a screenshot as proof.
Future<void> verifyAndCapture(
  WidgetTester tester,
  String expectedText,
  String screenshotName,
) async {
  expect(find.text(expectedText), findsWidgets);
  await takeScreenshot(tester, screenshotName);
}
