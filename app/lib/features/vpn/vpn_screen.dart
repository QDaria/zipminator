import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/vpn_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 4: Q-VPN — PQC VPN with ML-KEM handshake and location selector.
class VpnScreen extends ConsumerWidget {
  const VpnScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vpn = ref.watch(vpnProvider);
    final notifier = ref.read(vpnProvider.notifier);

    return Scaffold(
      appBar: AppBar(),
      body: GradientBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Status banner
                const PillarStatusBanner(
                  description: 'One-tap quantum-safe VPN tunnel',
                  status: PillarStatus.ready,
                ),

                // Header
                PillarHeader(
                  icon: Icons.vpn_key_outlined,
                  title: 'Q-VPN',
                  subtitle: 'PQ-WireGuard Tunnel',
                  iconColor: QuantumTheme.quantumBlue,
                  badges: [
                    PqcBadge(
                      label: 'ML-KEM-768',
                      isActive: vpn.isActive,
                      color: QuantumTheme.quantumBlue,
                    ),
                  ],
                ),

                // Location selector
                QuantumCard(
                  glowColor: QuantumTheme.quantumBlue,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Server Location',
                          style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 8),

                      // Region selector chips
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: VpnRegion.values.map((region) {
                            final isSelected =
                                vpn.selectedRegion == region;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(region.label),
                                selected: isSelected,
                                selectedColor: QuantumTheme.quantumBlue
                                    .withValues(alpha: 0.3),
                                side: BorderSide(
                                  color: isSelected
                                      ? QuantumTheme.quantumBlue
                                          .withValues(alpha: 0.6)
                                      : QuantumTheme.quantumBlue
                                          .withValues(alpha: 0.15),
                                ),
                                labelStyle: TextStyle(
                                  color: isSelected
                                      ? QuantumTheme.quantumBlue
                                      : null,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : null,
                                  fontSize: 12,
                                ),
                                onSelected: vpn.isActive
                                    ? null
                                    : (_) =>
                                        notifier.selectRegion(region),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Country dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 2),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: QuantumTheme.quantumBlue
                                .withValues(alpha: 0.3),
                          ),
                        ),
                        child: DropdownButton<VpnLocation>(
                          value: vpn.selectedLocation,
                          isExpanded: true,
                          underline: const SizedBox.shrink(),
                          items: vpn.regionLocations.map((loc) {
                            return DropdownMenuItem(
                              value: loc,
                              child: Text(loc.displayName,
                                  style: const TextStyle(fontSize: 14)),
                            );
                          }).toList(),
                          onChanged: vpn.isActive
                              ? null
                              : (loc) {
                                  if (loc != null) {
                                    notifier.selectLocation(loc);
                                  }
                                },
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(delay: 200.ms, duration: 300.ms)
                    .slideY(begin: 0.05),
                const SizedBox(height: 16),

                // Connection indicator
                _VpnStatusIndicator(status: vpn.status)
                    .animate()
                    .fadeIn(duration: 300.ms),
                const SizedBox(height: 24),

                Text(
                  vpn.status == VpnStatus.connected
                      ? 'Connected'
                      : vpn.status == VpnStatus.connecting
                          ? 'Establishing PQ Handshake...'
                          : 'Disconnected',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),

                if (vpn.serverAddress != null)
                  Text(vpn.serverAddress!,
                      style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 32),

                // Connect/disconnect button with pulse ring
                SizedBox(
                  width: 200,
                  height: 200,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Animated pulse ring (visible when connecting)
                      if (vpn.status == VpnStatus.connecting)
                        Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: QuantumTheme.quantumCyan
                                  .withValues(alpha: 0.4),
                              width: 2,
                            ),
                          ),
                        )
                            .animate(onPlay: (c) => c.repeat())
                            .scale(
                              begin: const Offset(0.8, 0.8),
                              end: const Offset(1.3, 1.3),
                              duration: 1500.ms,
                            )
                            .fadeOut(duration: 1500.ms),
                      // Second pulse ring offset
                      if (vpn.status == VpnStatus.connecting)
                        Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: QuantumTheme.quantumCyan
                                  .withValues(alpha: 0.3),
                              width: 2,
                            ),
                          ),
                        )
                            .animate(onPlay: (c) => c.repeat())
                            .scale(
                              begin: const Offset(0.8, 0.8),
                              end: const Offset(1.3, 1.3),
                              duration: 1500.ms,
                              delay: 500.ms,
                            )
                            .fadeOut(duration: 1500.ms, delay: 500.ms),
                      // Button
                      SizedBox(
                        width: 160,
                        height: 160,
                        child: ElevatedButton(
                          onPressed:
                              vpn.status == VpnStatus.connecting ||
                                      vpn.status == VpnStatus.disconnecting
                                  ? null
                                  : () {
                                      if (vpn.isActive) {
                                        notifier.disconnect();
                                      } else {
                                        notifier.connect();
                                      }
                                    },
                          style: ElevatedButton.styleFrom(
                            shape: const CircleBorder(),
                            backgroundColor: vpn.isActive
                                ? QuantumTheme.quantumGreen
                                : QuantumTheme.surfaceElevated,
                            foregroundColor: vpn.isActive
                                ? QuantumTheme.surfaceDark
                                : QuantumTheme.textPrimary,
                          ),
                          child: Icon(
                            Icons.power_settings_new,
                            size: 64,
                            color: vpn.isActive
                                ? QuantumTheme.surfaceDark
                                : QuantumTheme.quantumCyan,
                          ),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 300.ms, duration: 400.ms),
                const SizedBox(height: 32),

                // Kill switch toggle
                QuantumCard(
                  glowColor: QuantumTheme.quantumOrange,
                  child: SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Kill Switch'),
                    subtitle:
                        const Text('Block traffic if VPN disconnects'),
                    value: vpn.killSwitchEnabled,
                    onChanged: (_) => notifier.toggleKillSwitch(),
                    activeTrackColor: QuantumTheme.quantumCyan,
                    secondary: const Icon(Icons.shield_outlined),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 500.ms, duration: 300.ms)
                    .slideY(begin: 0.05),
                const SizedBox(height: 8),

                // Protocol info
                QuantumCard(
                  glowColor: QuantumTheme.quantumPurple,
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.lock_outline,
                        color: QuantumTheme.quantumPurple),
                    title: const Text('ML-KEM-768 Handshake'),
                    subtitle: const Text('PQ-WireGuard tunnel'),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 600.ms, duration: 300.ms)
                    .slideY(begin: 0.05),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _VpnStatusIndicator extends StatelessWidget {
  final VpnStatus status;

  const _VpnStatusIndicator({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      VpnStatus.connected => QuantumTheme.quantumGreen,
      VpnStatus.connecting ||
      VpnStatus.disconnecting =>
        QuantumTheme.quantumOrange,
      VpnStatus.error => QuantumTheme.quantumRed,
      VpnStatus.disconnected => QuantumTheme.textSecondary,
    };

    return SizedBox(
      width: 24,
      height: 24,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Animated pulse ring when connecting
          if (status == VpnStatus.connecting ||
              status == VpnStatus.disconnecting)
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: color.withValues(alpha: 0.5), width: 2),
              ),
            )
                .animate(onPlay: (c) => c.repeat())
                .scale(
                  begin: const Offset(1, 1),
                  end: const Offset(1.8, 1.8),
                  duration: 1200.ms,
                )
                .fadeOut(duration: 1200.ms),
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: color.withValues(alpha: 0.4), blurRadius: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
