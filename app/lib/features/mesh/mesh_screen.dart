import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 9: Q-Mesh — Quantum-secured mesh networking via WiFi CSI.
class MeshScreen extends StatelessWidget {
  const MeshScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Q-Mesh')),
      body: GradientBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PillarStatusBanner(
                description: 'Quantum-secured mesh networking',
                status: PillarStatus.ready,
              ),

              PillarHeader(
                icon: Icons.hub_outlined,
                title: 'Q-Mesh',
                subtitle: 'WiFi CSI Mesh Network',
                iconColor: QuantumTheme.quantumCyan,
                badges: [
                  PqcBadge(
                    label: 'QRNG Entropy',
                    color: QuantumTheme.quantumCyan,
                    isActive: true,
                  ),
                ],
              ),

              QuantumCard(
                glowColor: QuantumTheme.quantumCyan,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.wifi, color: QuantumTheme.quantumCyan),
                        const SizedBox(width: 8),
                        Text('Mesh Status',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Q-Mesh uses WiFi Channel State Information (CSI) to create '
                      'quantum-secured device mesh networks. Keys are derived from '
                      'QRNG entropy, replacing classical Diffie-Hellman.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    _StatusRow(
                      icon: Icons.router_outlined,
                      label: 'Nearby nodes',
                      value: 'Scanning...',
                    ),
                    const SizedBox(height: 8),
                    _StatusRow(
                      icon: Icons.key,
                      label: 'Key agreement',
                      value: 'ML-KEM-768',
                    ),
                    const SizedBox(height: 8),
                    _StatusRow(
                      icon: Icons.speed,
                      label: 'Entropy source',
                      value: 'QRNG Pool',
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

              const SizedBox(height: 16),

              QuantumCard(
                glowColor: QuantumTheme.quantumPurple,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('How it works',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    _StepTile(
                      step: '1',
                      title: 'Discover',
                      description:
                          'Scan for nearby devices using WiFi CSI fingerprints.',
                    ),
                    _StepTile(
                      step: '2',
                      title: 'Key Exchange',
                      description:
                          'Establish PQC session keys via ML-KEM-768 encapsulation.',
                    ),
                    _StepTile(
                      step: '3',
                      title: 'Mesh',
                      description:
                          'Form encrypted mesh network with quantum-safe tunnels.',
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _StatusRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: QuantumTheme.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(label,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: QuantumTheme.textSecondary)),
        ),
        Text(value,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontFamily: 'JetBrains Mono',
                  color: QuantumTheme.quantumCyan,
                )),
      ],
    );
  }
}

class _StepTile extends StatelessWidget {
  final String step;
  final String title;
  final String description;

  const _StepTile({
    required this.step,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: QuantumTheme.quantumCyan.withValues(alpha: 0.2),
            child: Text(step,
                style: TextStyle(
                    color: QuantumTheme.quantumCyan,
                    fontSize: 12,
                    fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                Text(description,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
