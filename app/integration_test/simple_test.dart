import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';
import 'package:zipminator/src/rust/api/simple.dart';
import 'package:zipminator/src/rust/frb_generated.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async => await RustLib.init());

  testWidgets('App launches with Rust bridge initialized', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: ZipminatorApp()));
    await tester.pumpAndSettle();
    expect(find.text('Quantum Vault'), findsOneWidget);
  });

  testWidgets('Rust version returns non-empty string', (
    WidgetTester tester,
  ) async {
    final v = version();
    expect(v.isNotEmpty, true);
  });
}
