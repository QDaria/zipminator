import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/srtp_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Pillar 3: Quantum VoIP — PQ-SRTP encrypted voice/video calls.
class VoipScreen extends ConsumerWidget {
  const VoipScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voip = ref.watch(voipProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quantum VoIP'),
        actions: [
          if (voip.isPqSecured)
            Chip(
              avatar: Icon(Icons.lock, size: 14, color: QuantumTheme.quantumGreen),
              label: const Text('PQ-SRTP'),
              backgroundColor: QuantumTheme.quantumGreen.withValues(alpha: 0.1),
            ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                voip.inCall ? Icons.phone_in_talk : Icons.phone_outlined,
                size: 64,
                color: voip.inCall
                    ? QuantumTheme.quantumGreen
                    : QuantumTheme.quantumCyan,
              ),
              const SizedBox(height: 16),
              Text(
                voip.inCall ? 'In Call' : 'PQ-SRTP Voice & Video',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                'Quantum-safe SRTP key derivation for real-time media',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              if (voip.inCall && voip.srtpMasterKey != null) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _KeyInfo(
                            label: 'SRTP Master Key',
                            bytes: voip.srtpMasterKey!.length),
                        const Divider(),
                        _KeyInfo(
                            label: 'SRTP Master Salt',
                            bytes: voip.srtpMasterSalt!.length),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Protocol info cards
              if (!voip.inCall) ...[
                Card(
                  child: ListTile(
                    leading: Icon(Icons.security, color: QuantumTheme.quantumPurple),
                    title: const Text('HKDF-SHA-256'),
                    subtitle: const Text('Key derivation from Kyber shared secret'),
                  ),
                ),
                Card(
                  child: ListTile(
                    leading: Icon(Icons.music_note, color: QuantumTheme.quantumBlue),
                    title: const Text('AES-128-CM'),
                    subtitle: const Text('SRTP cipher suite'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _KeyInfo extends StatelessWidget {
  final String label;
  final int bytes;

  const _KeyInfo({required this.label, required this.bytes});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.key, size: 16, color: QuantumTheme.quantumCyan),
        const SizedBox(width: 8),
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        const Spacer(),
        Text('$bytes bytes', style: Theme.of(context).textTheme.labelMedium),
      ],
    );
  }
}
