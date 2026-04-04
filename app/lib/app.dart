import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zipminator/core/providers/biometric_provider.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/providers/theme_provider.dart';
import 'package:zipminator/core/router.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Root application widget.
class ZipminatorApp extends ConsumerStatefulWidget {
  const ZipminatorApp({super.key});

  @override
  ConsumerState<ZipminatorApp> createState() => _ZipminatorAppState();
}

class _ZipminatorAppState extends ConsumerState<ZipminatorApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Lock when app goes to background; auto-unlock prompt on resume.
    final bio = ref.read(biometricProvider);
    if (!bio.hasValue) return; // Provider still loading.

    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden) {
      ref.read(biometricProvider.notifier).lock();
    } else if (state == AppLifecycleState.resumed) {
      if (bio.value!.locked) {
        ref.read(biometricProvider.notifier).unlock();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final biometric = ref.watch(biometricProvider);

    // Auto-connect signaling server when authenticated (app-wide).
    ref.watch(signalingInitProvider);

    return MaterialApp.router(
      title: 'Zipminator',
      debugShowCheckedModeBanner: false,
      theme: QuantumTheme.light(),
      darkTheme: QuantumTheme.dark(),
      themeMode: themeMode,
      routerConfig: appRouter,
      builder: (context, child) {
        final isLocked =
            biometric.value?.locked ?? false;
        return Stack(
          children: [
            child ?? const SizedBox.shrink(),
            if (isLocked) _LockScreen(),
          ],
        );
      },
    );
  }
}

/// Full-screen overlay shown when biometric lock is active.
class _LockScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: QuantumTheme.surfaceDark,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock_outline,
                size: 64, color: QuantumTheme.quantumCyan),
            const SizedBox(height: 16),
            Text(
              'Zipminator is Locked',
              style: GoogleFonts.outfit(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: QuantumTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Authenticate to continue',
              style: TextStyle(color: QuantumTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () =>
                  ref.read(biometricProvider.notifier).unlock(),
              icon: const Icon(Icons.fingerprint),
              label: const Text('Unlock'),
            ),
          ],
        ),
      ),
    );
  }
}
