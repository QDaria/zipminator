import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/vpn_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Pillar 4: Q-VPN — PQC VPN with ML-KEM handshake.
class VpnScreen extends ConsumerWidget {
  const VpnScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vpn = ref.watch(vpnProvider);
    final notifier = ref.read(vpnProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Q-VPN')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Connection indicator
              _VpnStatusIndicator(status: vpn.status),
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

              // Connect/disconnect button
              SizedBox(
                width: 200,
                height: 200,
                child: ElevatedButton(
                  onPressed: vpn.status == VpnStatus.connecting ||
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
              const SizedBox(height: 32),

              // Kill switch toggle
              Card(
                child: SwitchListTile(
                  title: const Text('Kill Switch'),
                  subtitle:
                      const Text('Block traffic if VPN disconnects'),
                  value: vpn.killSwitchEnabled,
                  onChanged: (_) => notifier.toggleKillSwitch(),
                  activeTrackColor: QuantumTheme.quantumCyan,
                  secondary: const Icon(Icons.shield_outlined),
                ),
              ),

              // Protocol info
              Card(
                child: ListTile(
                  leading: Icon(Icons.lock_outline,
                      color: QuantumTheme.quantumPurple),
                  title: const Text('ML-KEM-768 Handshake'),
                  subtitle: const Text('PQ-WireGuard tunnel'),
                ),
              ),
            ],
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
      VpnStatus.connecting || VpnStatus.disconnecting => QuantumTheme.quantumOrange,
      VpnStatus.error => QuantumTheme.quantumRed,
      VpnStatus.disconnected => QuantumTheme.textSecondary,
    };

    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 8)],
      ),
    );
  }
}
