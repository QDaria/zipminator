import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/qai_provider.dart';
import 'package:zipminator/core/providers/theme_provider.dart';
import 'package:zipminator/core/services/llm_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// Settings screen with theme toggle, per-provider API keys, and app info.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  static const _providerColors = {
    LLMProvider.claude: QuantumTheme.quantumPurple,
    LLMProvider.gemini: QuantumTheme.quantumBlue,
    LLMProvider.openRouter: QuantumTheme.quantumOrange,
  };

  static const _providerHints = {
    LLMProvider.claude: 'sk-ant-...',
    LLMProvider.gemini: 'AIza...',
    LLMProvider.openRouter: 'sk-or-...',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final qai = ref.watch(qaiProvider);

    return GestureDetector(onTap: () => FocusScope.of(context).unfocus(), child: Scaffold(
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

          // Section header for API keys
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Text('AI Provider API Keys',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: QuantumTheme.textSecondary,
                    )),
          ),

          // Per-provider API key tiles
          for (final provider in LLMProvider.values)
            _ProviderApiKeyTile(
              provider: provider,
              color: _providerColors[provider] ?? QuantumTheme.quantumPurple,
              hint: _providerHints[provider] ?? '',
              isConfigured: qai.apiKeys.containsKey(provider) &&
                  qai.apiKeys[provider]!.isNotEmpty,
            ),

          const Divider(),

          // Version info
          ListTile(
            leading:
                Icon(Icons.info_outline, color: QuantumTheme.quantumPurple),
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

          // System Status
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Text('System Status',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: QuantumTheme.textSecondary,
                    )),
          ),

          _SystemStatusCard(rustVersion: _rustVersion()),

          const Divider(),

          // About
          ListTile(
            leading: Icon(Icons.shield, color: QuantumTheme.quantumCyan),
            title: const Text('About Zipminator'),
            subtitle: const Text(
              'World\'s first PQC super-app. '
              '9 pillars of quantum-safe encryption.',
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
    ));
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

class _ProviderApiKeyTile extends ConsumerStatefulWidget {
  final LLMProvider provider;
  final Color color;
  final String hint;
  final bool isConfigured;

  const _ProviderApiKeyTile({
    required this.provider,
    required this.color,
    required this.hint,
    required this.isConfigured,
  });

  @override
  ConsumerState<_ProviderApiKeyTile> createState() =>
      _ProviderApiKeyTileState();
}

class _ProviderApiKeyTileState extends ConsumerState<_ProviderApiKeyTile> {
  final _keyController = TextEditingController();
  bool _editing = false;
  bool _obscured = true;

  @override
  void dispose() {
    _keyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_editing) {
      return ListTile(
        leading: Icon(
          widget.isConfigured ? Icons.key : Icons.key_off,
          color: widget.isConfigured
              ? QuantumTheme.quantumGreen
              : widget.color.withValues(alpha: 0.5),
        ),
        title: Text('${widget.provider.displayName} API Key'),
        subtitle: Text(widget.isConfigured ? 'Configured' : 'Not set'),
        trailing: TextButton(
          onPressed: () => setState(() => _editing = true),
          child: Text(widget.isConfigured ? 'Change' : 'Set'),
        ),
      );
    }

    return ListTile(
      leading: Icon(Icons.key, color: widget.color),
      title: TextField(
        controller: _keyController,
        obscureText: _obscured,
        decoration: InputDecoration(
          hintText: widget.hint,
          isDense: true,
          suffixIcon: IconButton(
            icon: Icon(
                _obscured ? Icons.visibility : Icons.visibility_off,
                size: 18),
            onPressed: () => setState(() => _obscured = !_obscured),
          ),
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: Icon(Icons.check, color: QuantumTheme.quantumGreen),
            onPressed: () {
              ref
                  .read(qaiProvider.notifier)
                  .setApiKey(widget.provider, _keyController.text.trim());
              setState(() => _editing = false);
            },
          ),
          IconButton(
            icon: Icon(Icons.close, color: QuantumTheme.quantumRed),
            onPressed: () => setState(() => _editing = false),
          ),
        ],
      ),
    );
  }
}

class _SystemStatusCard extends StatelessWidget {
  final String rustVersion;

  const _SystemStatusCard({required this.rustVersion});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: QuantumTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: QuantumTheme.quantumCyan.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _StatusRow(
              icon: Icons.memory,
              label: 'Rust Crypto Engine',
              value: rustVersion,
              color: QuantumTheme.quantumGreen,
            ),
            const SizedBox(height: 10),
            _StatusRow(
              icon: Icons.cell_tower,
              label: 'Signaling Server',
              value: 'Offline',
              color: QuantumTheme.quantumRed,
            ),
            const SizedBox(height: 10),
            _StatusRow(
              icon: Icons.shield,
              label: 'Entropy Pool',
              value: 'Ready (QRNG)',
              color: QuantumTheme.quantumCyan,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatusRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 10),
        Expanded(
          child: Text(label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: QuantumTheme.textSecondary,
                  )),
        ),
        Text(value,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontFamily: 'JetBrains Mono',
                  color: color,
                  fontSize: 12,
                )),
      ],
    );
  }
}
