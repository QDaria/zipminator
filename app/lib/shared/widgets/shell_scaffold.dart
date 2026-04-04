import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:zipminator/core/providers/srtp_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Persistent shell with navigation for all 9 pillars.
/// Desktop: NavigationRail with logo + settings.
/// Mobile: NavigationBar (4 tabs + "More") with overflow bottom sheet.
/// Shows a mini call bar when a VoIP call is active on a non-VoIP tab.
class ShellScaffold extends ConsumerWidget {
  final Widget child;

  const ShellScaffold({super.key, required this.child});

  static const _tabs = [
    _NavTab('/vault', Icons.lock_outline, Icons.lock, 'Vault', 'Encrypted storage'),
    _NavTab('/messenger', Icons.chat_bubble_outline, Icons.chat_bubble, 'Messenger', 'PQC messaging'),
    _NavTab('/voip', Icons.phone_outlined, Icons.phone, 'VoIP', 'Quantum-safe calls'),
    _NavTab('/vpn', Icons.vpn_key_outlined, Icons.vpn_key, 'VPN', 'PQC tunnel'),
    _NavTab('/browser', Icons.language_outlined, Icons.language, 'Browser', 'Privacy browser'),
    _NavTab('/email', Icons.email_outlined, Icons.email, 'Email', 'PQC-encrypted mail'),
    _NavTab('/ai', Icons.psychology_outlined, Icons.psychology, 'Q-AI', 'Quantum AI assistant'),
    _NavTab('/anonymizer', Icons.visibility_off_outlined, Icons.visibility_off, 'Anonymizer', 'PII scanner'),
    _NavTab('/mesh', Icons.hub_outlined, Icons.hub, 'Q-Mesh', 'Mesh networking'),
  ];

  /// Number of primary tabs shown in mobile bottom nav (5th is "More").
  static const _mobileTabCount = 4;

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final idx = _tabs.indexWhere((t) => location.startsWith(t.path));
    return idx >= 0 ? idx : 0;
  }

  Widget _animatedChild(Widget page) => AnimatedSwitcher(
    duration: const Duration(milliseconds: 300),
    child: page,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final index = _currentIndex(context);
    final isWide = MediaQuery.sizeOf(context).width > 800;
    final voip = ref.watch(voipProvider);
    final isOnVoipTab = GoRouterState.of(context).uri.path.startsWith('/voip');
    final showCallBar = voip.inCall && !isOnVoipTab;

    if (isWide) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: index,
              onDestinationSelected: (i) => context.go(_tabs[i].path),
              labelType: NavigationRailLabelType.all,
              backgroundColor: QuantumTheme.surfaceCard,
              indicatorColor: QuantumTheme.quantumCyan.withValues(alpha: 0.15),
              leading: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: QuantumTheme.cyanPurpleGradient(),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: SvgPicture.asset(
                    'assets/logos/Z.svg',
                    width: 28,
                    height: 28,
                    colorFilter: const ColorFilter.mode(
                      Colors.white,
                      BlendMode.srcIn,
                    ),
                  ),
                ),
              ),
              trailing: Expanded(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: IconButton(
                      icon: const Icon(Icons.settings_outlined),
                      onPressed: () => context.go('/settings'),
                      tooltip: 'Settings',
                      style: IconButton.styleFrom(
                        foregroundColor: QuantumTheme.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
              destinations: _tabs
                  .map(
                    (t) => NavigationRailDestination(
                      icon: Icon(t.icon),
                      selectedIcon: Icon(t.selectedIcon),
                      label: Text(t.label),
                    ),
                  )
                  .toList(),
            ),
            const VerticalDivider(width: 1),
            Expanded(
              child: Column(
                children: [
                  if (showCallBar) _MiniCallBar(voip: voip),
                  Expanded(
                    child: GradientBackground(child: _animatedChild(child)),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Mobile layout: 4 primary tabs + "More" overflow
    final mobileIndex = index < _mobileTabCount ? index : _mobileTabCount;

    return Scaffold(
      body: Column(
        children: [
          if (showCallBar) _MiniCallBar(voip: voip),
          Expanded(
            child: GradientBackground(child: _animatedChild(child)),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: mobileIndex,
        onDestinationSelected: (i) {
          if (i < _mobileTabCount) {
            context.go(_tabs[i].path);
          } else {
            // "More" tapped — show overflow sheet
            _showOverflowSheet(context);
          }
        },
        destinations: [
          ..._tabs.take(_mobileTabCount).map(
            (t) => NavigationDestination(
              icon: Icon(t.icon),
              selectedIcon: Icon(t.selectedIcon),
              label: t.label,
            ),
          ),
          const NavigationDestination(
            icon: Icon(Icons.more_horiz),
            label: 'More',
          ),
        ],
      ),
    );
  }

  void _showOverflowSheet(BuildContext context) {
    final overflowTabs = _tabs.sublist(_mobileTabCount);

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: QuantumTheme.textSecondary.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'More Pillars',
                    style: Theme.of(ctx).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              // Pillar list tiles with icon, title, and subtitle
              ...overflowTabs.map(
                (t) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor:
                        QuantumTheme.quantumCyan.withValues(alpha: 0.15),
                    child: Icon(t.icon, color: QuantumTheme.quantumCyan),
                  ),
                  title: Text(t.label),
                  subtitle: Text(t.subtitle),
                  trailing: const Icon(Icons.chevron_right, size: 20),
                  onTap: () {
                    Navigator.pop(ctx);
                    context.go(t.path);
                  },
                ),
              ),
              const Divider(height: 1),
              // Settings at the bottom
              ListTile(
                leading: CircleAvatar(
                  backgroundColor:
                      QuantumTheme.textSecondary.withValues(alpha: 0.1),
                  child:
                      Icon(Icons.settings_outlined, color: QuantumTheme.textSecondary),
                ),
                title: const Text('Settings'),
                subtitle: const Text('Theme, API keys, about'),
                trailing: const Icon(Icons.chevron_right, size: 20),
                onTap: () {
                  Navigator.pop(ctx);
                  context.go('/settings');
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}


class _NavTab {
  final String path;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final String subtitle;

  const _NavTab(this.path, this.icon, this.selectedIcon, this.label, this.subtitle);
}

/// Compact call bar shown when a VoIP call is active but the user is on
/// another tab. Tap to return to the VoIP screen.
class _MiniCallBar extends StatelessWidget {
  final VoipState voip;

  const _MiniCallBar({required this.voip});

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '${d.inHours > 0 ? '${d.inHours}:' : ''}$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/voip'),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + 4,
          bottom: 6,
          left: 16,
          right: 16,
        ),
        decoration: BoxDecoration(
          color: QuantumTheme.quantumGreen.withValues(alpha: 0.15),
          border: Border(
            bottom: BorderSide(
              color: QuantumTheme.quantumGreen.withValues(alpha: 0.3),
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              voip.isConference ? Icons.video_call : Icons.phone_in_talk,
              color: QuantumTheme.quantumGreen,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                voip.isConference
                    ? 'Conference: ${voip.roomId ?? ""}'
                    : 'Call: ${voip.contact?.name ?? "Unknown"}',
                style: TextStyle(
                  color: QuantumTheme.quantumGreen,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              _formatDuration(voip.callDuration),
              style: TextStyle(
                color: QuantumTheme.quantumGreen,
                fontSize: 13,
                fontFamily: 'JetBrains Mono',
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Tap to return',
              style: TextStyle(
                color: QuantumTheme.quantumGreen.withValues(alpha: 0.7),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
