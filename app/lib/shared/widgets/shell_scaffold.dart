import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Persistent shell with bottom navigation for all 8 pillars.
class ShellScaffold extends StatelessWidget {
  final Widget child;

  const ShellScaffold({super.key, required this.child});

  static const _tabs = [
    _NavTab('/vault', Icons.lock_outline, 'Vault'),
    _NavTab('/messenger', Icons.chat_bubble_outline, 'Messenger'),
    _NavTab('/voip', Icons.phone_outlined, 'VoIP'),
    _NavTab('/vpn', Icons.vpn_key_outlined, 'VPN'),
    _NavTab('/anonymizer', Icons.visibility_off_outlined, 'Anonymizer'),
    _NavTab('/ai', Icons.psychology_outlined, 'Q-AI'),
    _NavTab('/email', Icons.email_outlined, 'Email'),
    _NavTab('/browser', Icons.language_outlined, 'Browser'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final idx = _tabs.indexWhere((t) => location.startsWith(t.path));
    return idx >= 0 ? idx : 0;
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);
    final isWide = MediaQuery.sizeOf(context).width > 800;

    if (isWide) {
      // Desktop: NavigationRail
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: index,
              onDestinationSelected: (i) => context.go(_tabs[i].path),
              labelType: NavigationRailLabelType.all,
              backgroundColor: QuantumTheme.surfaceCard,
              indicatorColor: QuantumTheme.quantumCyan.withValues(alpha: 0.15),
              trailing: Padding(
                padding: const EdgeInsets.only(top: 16),
                child: IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  onPressed: () => context.go('/settings'),
                  tooltip: 'Settings',
                ),
              ),
              destinations: _tabs
                  .map(
                    (t) => NavigationRailDestination(
                      icon: Icon(t.icon),
                      label: Text(t.label),
                    ),
                  )
                  .toList(),
            ),
            const VerticalDivider(width: 1),
            Expanded(child: child),
          ],
        ),
      );
    }

    // Mobile: Bottom navigation (show 5, overflow menu for rest)
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index.clamp(0, 4),
        onDestinationSelected: (i) {
          if (i < _tabs.length) context.go(_tabs[i].path);
        },
        destinations: _tabs
            .take(5)
            .map(
              (t) => NavigationDestination(icon: Icon(t.icon), label: t.label),
            )
            .toList(),
      ),
    );
  }
}

class _NavTab {
  final String path;
  final IconData icon;
  final String label;

  const _NavTab(this.path, this.icon, this.label);
}
