import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/theme_provider.dart';
import 'package:zipminator/core/router.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Root application widget.
class ZipminatorApp extends ConsumerWidget {
  const ZipminatorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'Zipminator',
      debugShowCheckedModeBanner: false,
      theme: QuantumTheme.light(),
      darkTheme: QuantumTheme.dark(),
      themeMode: themeMode,
      routerConfig: appRouter,
    );
  }
}
