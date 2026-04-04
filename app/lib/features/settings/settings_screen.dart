import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/providers/biometric_provider.dart';
import 'package:zipminator/core/providers/qai_provider.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/services/messenger_service.dart';
import 'package:zipminator/core/providers/theme_provider.dart';
import 'package:zipminator/core/services/llm_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

// ---------------------------------------------------------------------------
// Self-Destruct Timer — local state management
// ---------------------------------------------------------------------------

/// Predefined auto-destruct durations.
enum DestructDuration {
  oneHour('1 hour', Duration(hours: 1)),
  twentyFourHours('24 hours', Duration(hours: 24)),
  sevenDays('7 days', Duration(days: 7)),
  thirtyDays('30 days', Duration(days: 30)),
  never('Never', Duration.zero);

  final String label;
  final Duration duration;
  const DestructDuration(this.label, this.duration);
}

class SelfDestructState {
  final bool enabled;
  final DestructDuration selectedDuration;
  final DateTime? activatedAt;

  const SelfDestructState({
    this.enabled = false,
    this.selectedDuration = DestructDuration.never,
    this.activatedAt,
  });

  SelfDestructState copyWith({
    bool? enabled,
    DestructDuration? selectedDuration,
    DateTime? activatedAt,
    bool clearActivatedAt = false,
  }) =>
      SelfDestructState(
        enabled: enabled ?? this.enabled,
        selectedDuration: selectedDuration ?? this.selectedDuration,
        activatedAt:
            clearActivatedAt ? null : (activatedAt ?? this.activatedAt),
      );

  /// Remaining time until auto-destruct fires.
  Duration? get remaining {
    if (!enabled ||
        activatedAt == null ||
        selectedDuration == DestructDuration.never) {
      return null;
    }
    final deadline = activatedAt!.add(selectedDuration.duration);
    final diff = deadline.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  /// Human-readable countdown string.
  String? get countdownText {
    final r = remaining;
    if (r == null) return null;
    if (r == Duration.zero) return 'Destructing now...';
    final days = r.inDays;
    final hours = r.inHours % 24;
    final minutes = r.inMinutes % 60;
    if (days > 0) return '${days}d ${hours}h ${minutes}m';
    if (hours > 0) return '${hours}h ${minutes}m';
    return '${minutes}m';
  }
}

class SelfDestructNotifier extends Notifier<SelfDestructState> {
  @override
  SelfDestructState build() => const SelfDestructState();

  void toggle() {
    if (state.enabled) {
      // Disable
      state = state.copyWith(enabled: false, clearActivatedAt: true);
    } else {
      // Enable with current duration
      if (state.selectedDuration == DestructDuration.never) {
        state = state.copyWith(
          enabled: true,
          selectedDuration: DestructDuration.twentyFourHours,
          activatedAt: DateTime.now(),
        );
      } else {
        state = state.copyWith(enabled: true, activatedAt: DateTime.now());
      }
    }
  }

  void setDuration(DestructDuration duration) {
    if (duration == DestructDuration.never) {
      state = state.copyWith(
        enabled: false,
        selectedDuration: duration,
        clearActivatedAt: true,
      );
    } else {
      state = state.copyWith(
        selectedDuration: duration,
        activatedAt: state.enabled ? DateTime.now() : null,
      );
    }
  }
}

final selfDestructProvider =
    NotifierProvider<SelfDestructNotifier, SelfDestructState>(
        SelfDestructNotifier.new);

// Browser self-destruct state (clear-on-close + auto-clear timer).
class BrowserDestructState {
  final bool clearOnClose;
  final bool useGlobalTimer;

  const BrowserDestructState({
    this.clearOnClose = false,
    this.useGlobalTimer = false,
  });

  BrowserDestructState copyWith({bool? clearOnClose, bool? useGlobalTimer}) =>
      BrowserDestructState(
        clearOnClose: clearOnClose ?? this.clearOnClose,
        useGlobalTimer: useGlobalTimer ?? this.useGlobalTimer,
      );
}

class BrowserDestructNotifier extends Notifier<BrowserDestructState> {
  @override
  BrowserDestructState build() => const BrowserDestructState();

  void toggleClearOnClose() {
    state = state.copyWith(clearOnClose: !state.clearOnClose);
  }

  void toggleUseGlobalTimer() {
    state = state.copyWith(useGlobalTimer: !state.useGlobalTimer);
  }
}

final browserDestructProvider =
    NotifierProvider<BrowserDestructNotifier, BrowserDestructState>(
        BrowserDestructNotifier.new);

/// Settings screen with theme toggle, per-provider API keys, and app info.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  static const _providerColors = {
    LLMProvider.gemini: QuantumTheme.quantumBlue,
    LLMProvider.groq: QuantumTheme.quantumGreen,
    LLMProvider.deepSeek: QuantumTheme.quantumCyan,
    LLMProvider.mistral: QuantumTheme.quantumOrange,
    LLMProvider.claude: QuantumTheme.quantumPurple,
    LLMProvider.openRouter: Color(0xFFFF6D00),
  };

  static const _providerHints = {
    LLMProvider.gemini: 'AIza...',
    LLMProvider.groq: 'gsk_...',
    LLMProvider.deepSeek: 'sk-...',
    LLMProvider.mistral: '...',
    LLMProvider.claude: 'sk-ant-...',
    LLMProvider.openRouter: 'sk-or-...',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final qai = ref.watch(qaiProvider);
    final destruct = ref.watch(selfDestructProvider);
    final destructNotifier = ref.read(selfDestructProvider.notifier);
    final browserDestruct = ref.watch(browserDestructProvider);
    final browserDestructNotifier =
        ref.read(browserDestructProvider.notifier);

    final auth = ref.watch(authProvider);
    final signalingState = ref.watch(ratchetProvider).signalingState;

    return GestureDetector(onTap: () => FocusScope.of(context).unfocus(), child: Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // ---- ACCOUNT SECTION ----
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Text('Account',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: QuantumTheme.quantumCyan,
                    )),
          ),
          ListTile(
            leading: CircleAvatar(
              backgroundColor: QuantumTheme.quantumCyan.withValues(alpha: 0.2),
              child: Icon(Icons.person, color: QuantumTheme.quantumCyan),
            ),
            title: Text(auth.displayName),
            subtitle: Text(
              auth.username != null
                  ? '@${auth.username}'
                  : (auth.user?.email ?? 'Not signed in'),
              style: TextStyle(
                color: QuantumTheme.textSecondary,
                fontSize: 13,
              ),
            ),
            trailing: auth.isAuthenticated
                ? TextButton(
                    onPressed: () async {
                      ref.read(ratchetProvider.notifier).disconnectFromSignaling();
                      await ref.read(authProvider.notifier).signOut();
                      if (context.mounted) context.go('/login');
                    },
                    child: const Text('Sign Out',
                        style: TextStyle(color: QuantumTheme.quantumRed)),
                  )
                : TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Sign In'),
                  ),
            onTap: () => context.go('/profile'),
          ),

          // Biometric lock
          _BiometricTile(),

          // Signaling status
          ListTile(
            leading: Icon(
              Icons.cell_tower,
              color: signalingState == SignalingConnectionState.connected
                  ? QuantumTheme.quantumGreen
                  : QuantumTheme.quantumRed,
            ),
            title: const Text('Signaling Server'),
            subtitle: Text(
              signalingState == SignalingConnectionState.connected
                  ? 'Connected'
                  : signalingState.name,
              style: TextStyle(
                color: signalingState == SignalingConnectionState.connected
                    ? QuantumTheme.quantumGreen
                    : QuantumTheme.quantumRed,
                fontSize: 12,
              ),
            ),
          ),
          const Divider(),

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

          // ---- AUTO-DESTRUCT SECTION ----
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Text('Auto-Destruct',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: QuantumTheme.quantumRed,
                    )),
          ),
          _AutoDestructCard(
            state: destruct,
            onToggle: () => destructNotifier.toggle(),
            onDurationChanged: (d) => destructNotifier.setDuration(d),
          ),
          const Divider(),

          // ---- BROWSER SELF-DESTRUCT SECTION ----
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Text('Browser Privacy',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: QuantumTheme.quantumOrange,
                    )),
          ),
          _BrowserDestructCard(
            state: browserDestruct,
            globalDuration: destruct.selectedDuration,
            globalEnabled: destruct.enabled,
            onToggleClearOnClose: () =>
                browserDestructNotifier.toggleClearOnClose(),
            onToggleAutoTimer: () =>
                browserDestructNotifier.toggleUseGlobalTimer(),
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

          // On-device status (no API key needed)
          ListTile(
            leading: Icon(Icons.smartphone, color: QuantumTheme.quantumGreen),
            title: const Text('On-Device (Google AI Edge)'),
            subtitle: const Text('No API key needed. Models run locally.'),
            trailing: Icon(Icons.check_circle,
                color: QuantumTheme.quantumGreen, size: 20),
          ),

          // Per-provider API key tiles (skip on-device)
          for (final provider in LLMProvider.values)
            if (!provider.isOnDevice)
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

// ---------------------------------------------------------------------------
// Auto-Destruct Card
// ---------------------------------------------------------------------------

class _AutoDestructCard extends StatefulWidget {
  final SelfDestructState state;
  final VoidCallback onToggle;
  final ValueChanged<DestructDuration> onDurationChanged;

  const _AutoDestructCard({
    required this.state,
    required this.onToggle,
    required this.onDurationChanged,
  });

  @override
  State<_AutoDestructCard> createState() => _AutoDestructCardState();
}

class _AutoDestructCardState extends State<_AutoDestructCard> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _startTicker();
  }

  @override
  void didUpdateWidget(_AutoDestructCard old) {
    super.didUpdateWidget(old);
    if (widget.state.enabled != old.state.enabled) {
      _startTicker();
    }
  }

  void _startTicker() {
    _ticker?.cancel();
    if (widget.state.enabled) {
      _ticker = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) setState(() {});
      });
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: QuantumTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: s.enabled
                ? QuantumTheme.quantumRed.withValues(alpha: 0.4)
                : QuantumTheme.quantumOrange.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Toggle row
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Row(
                children: [
                  Icon(Icons.timer_off,
                      color: s.enabled
                          ? QuantumTheme.quantumRed
                          : QuantumTheme.quantumOrange,
                      size: 22),
                  const SizedBox(width: 10),
                  const Text('Auto-Destruct'),
                ],
              ),
              value: s.enabled,
              onChanged: (_) => widget.onToggle(),
              activeTrackColor:
                  QuantumTheme.quantumRed.withValues(alpha: 0.6),
              activeThumbColor: QuantumTheme.quantumRed,
            ),
            Text(
              'When enabled, messages, call logs, browser history, '
              'Q-AI chat, and emails are automatically deleted after '
              'the selected duration.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: QuantumTheme.textSecondary,
                    fontSize: 12,
                  ),
            ),
            const SizedBox(height: 12),

            // Duration picker
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: DestructDuration.values.map((d) {
                final selected = s.selectedDuration == d;
                final isNever = d == DestructDuration.never;
                return ChoiceChip(
                  label: Text(d.label),
                  selected: selected,
                  selectedColor: isNever
                      ? QuantumTheme.quantumGreen.withValues(alpha: 0.25)
                      : QuantumTheme.quantumRed.withValues(alpha: 0.25),
                  side: BorderSide(
                    color: selected
                        ? (isNever
                            ? QuantumTheme.quantumGreen
                                .withValues(alpha: 0.5)
                            : QuantumTheme.quantumRed
                                .withValues(alpha: 0.5))
                        : QuantumTheme.textSecondary
                            .withValues(alpha: 0.2),
                  ),
                  labelStyle: TextStyle(
                    color: selected
                        ? (isNever
                            ? QuantumTheme.quantumGreen
                            : QuantumTheme.quantumRed)
                        : QuantumTheme.textSecondary,
                    fontWeight: selected ? FontWeight.w600 : null,
                    fontSize: 12,
                  ),
                  onSelected: (_) => widget.onDurationChanged(d),
                );
              }).toList(),
            ),

            // Countdown timer
            if (s.enabled && s.countdownText != null) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color:
                      QuantumTheme.quantumRed.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: QuantumTheme.quantumRed
                        .withValues(alpha: 0.25),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.timer,
                        size: 18, color: QuantumTheme.quantumRed),
                    const SizedBox(width: 8),
                    Text(
                      'Auto-destruct in: ${s.countdownText}',
                      style:
                          Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: QuantumTheme.quantumRed,
                                fontFamily: 'JetBrains Mono',
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Browser Self-Destruct Card
// ---------------------------------------------------------------------------

class _BrowserDestructCard extends StatelessWidget {
  final BrowserDestructState state;
  final DestructDuration globalDuration;
  final bool globalEnabled;
  final VoidCallback onToggleClearOnClose;
  final VoidCallback onToggleAutoTimer;

  const _BrowserDestructCard({
    required this.state,
    required this.globalDuration,
    required this.globalEnabled,
    required this.onToggleClearOnClose,
    required this.onToggleAutoTimer,
  });

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
            color: QuantumTheme.quantumOrange.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Clear on close
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Row(
                children: [
                  Icon(Icons.delete_sweep,
                      color: QuantumTheme.quantumOrange, size: 22),
                  const SizedBox(width: 10),
                  const Text('Clear on Close'),
                ],
              ),
              subtitle: const Text(
                  'Erase all browser data when the browser window closes'),
              value: state.clearOnClose,
              onChanged: (_) => onToggleClearOnClose(),
              activeTrackColor:
                  QuantumTheme.quantumOrange.withValues(alpha: 0.6),
              activeThumbColor: QuantumTheme.quantumOrange,
            ),
            const SizedBox(height: 4),

            // Auto-clear timer (synced with global self-destruct)
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Row(
                children: [
                  Icon(Icons.sync,
                      color: QuantumTheme.quantumOrange, size: 22),
                  const SizedBox(width: 10),
                  const Expanded(child: Text('Auto-Clear Timer')),
                ],
              ),
              subtitle: Text(
                globalEnabled
                    ? 'Synced with global auto-destruct (${globalDuration.label})'
                    : 'Enable global auto-destruct to sync browser clearing',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: globalEnabled
                          ? QuantumTheme.quantumOrange
                          : QuantumTheme.textSecondary,
                      fontSize: 12,
                    ),
              ),
              value: state.useGlobalTimer && globalEnabled,
              onChanged:
                  globalEnabled ? (_) => onToggleAutoTimer() : null,
              activeTrackColor:
                  QuantumTheme.quantumOrange.withValues(alpha: 0.6),
              activeThumbColor: QuantumTheme.quantumOrange,
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Biometric Lock Tile
// ---------------------------------------------------------------------------

class _BiometricTile extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final biometric = ref.watch(biometricProvider);

    return biometric.when(
      data: (state) {
        if (!state.available) return const SizedBox.shrink();
        return SwitchListTile(
          secondary: Icon(
            Icons.fingerprint,
            color: state.enabled
                ? QuantumTheme.quantumGreen
                : QuantumTheme.quantumCyan,
          ),
          title: const Text('Face ID / Biometric Lock'),
          subtitle: Text(
            state.enabled
                ? 'App locks when backgrounded'
                : 'Unlock Zipminator with biometrics',
            style: TextStyle(fontSize: 12, color: QuantumTheme.textSecondary),
          ),
          value: state.enabled,
          onChanged: (_) => ref.read(biometricProvider.notifier).toggle(),
          activeTrackColor: QuantumTheme.quantumGreen.withValues(alpha: 0.6),
          activeThumbColor: QuantumTheme.quantumGreen,
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}
