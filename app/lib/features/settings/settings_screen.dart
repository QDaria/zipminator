import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/theme_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// Settings screen with theme toggle, app info, and version.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // Theme
          ListTile(
            leading: Icon(
              themeMode == ThemeMode.dark
                  ? Icons.dark_mode
                  : Icons.light_mode,
              color: QuantumTheme.quantumCyan,
            ),
            title: const Text('Theme'),
            subtitle: Text(themeMode == ThemeMode.dark ? 'Dark' : 'Light'),
            trailing: Switch(
              value: themeMode == ThemeMode.dark,
              onChanged: (_) => ref.read(themeModeProvider.notifier).toggle(),
              activeTrackColor: QuantumTheme.quantumCyan,
            ),
          ),
          const Divider(),

          // Version info
          ListTile(
            leading: Icon(Icons.info_outline, color: QuantumTheme.quantumPurple),
            title: const Text('Rust Bridge Version'),
            subtitle: Text(_rustVersion()),
          ),

          // Architecture
          ListTile(
            leading: Icon(Icons.security, color: QuantumTheme.quantumGreen),
            title: const Text('Crypto Engine'),
            subtitle: const Text('ML-KEM-768 (NIST FIPS 203)'),
          ),

          ListTile(
            leading:
                Icon(Icons.architecture, color: QuantumTheme.quantumBlue),
            title: const Text('Platform'),
            subtitle: Text('Flutter ${_platformName()}'),
          ),

          const Divider(),

          // About
          ListTile(
            leading: Icon(Icons.shield, color: QuantumTheme.quantumCyan),
            title: const Text('About Zipminator'),
            subtitle: const Text(
              'World\'s first PQC super-app. '
              '8 pillars of quantum-safe encryption.',
            ),
          ),

          // Licenses
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('Open Source Licenses'),
            onTap: () => showLicensePage(
              context: context,
              applicationName: 'Zipminator',
              applicationVersion: '1.0.0-beta',
            ),
          ),
        ],
      ),
    );
  }

  String _rustVersion() {
    try {
      return rust.version();
    } catch (_) {
      return 'unavailable';
    }
  }

  String _platformName() {
    return 'Multi-platform (macOS, iOS, Android, Windows, Linux)';
  }
}
