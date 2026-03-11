import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/srtp_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 3: Quantum VoIP — PQ-SRTP encrypted voice/video calls.
class VoipScreen extends ConsumerWidget {
  const VoipScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voip = ref.watch(voipProvider);

    return Scaffold(
      appBar: AppBar(),
      body: GradientBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Header
                PillarHeader(
                  icon: voip.inCall
                      ? Icons.phone_in_talk
                      : Icons.phone_outlined,
                  title: 'Quantum VoIP',
                  subtitle: 'PQ-SRTP Encrypted Calls',
                  iconColor: voip.inCall
                      ? QuantumTheme.quantumGreen
                      : QuantumTheme.quantumCyan,
                  badges: [
                    PqcBadge(
                      label: 'PQ-SRTP',
                      isActive: voip.isPqSecured,
                      color: QuantumTheme.quantumGreen,
                    ),
                  ],
                ),

                // Caller avatar placeholder
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        QuantumTheme.quantumCyan.withValues(alpha: 0.6),
                        QuantumTheme.quantumPurple.withValues(alpha: 0.6),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (voip.inCall
                                ? QuantumTheme.quantumGreen
                                : QuantumTheme.quantumCyan)
                            .withValues(alpha: 0.3),
                        blurRadius: 24,
                        spreadRadius: -4,
                      ),
                    ],
                  ),
                  child: Icon(
                    voip.inCall ? Icons.person : Icons.person_outline,
                    size: 56,
                    color: Colors.white,
                  ),
                ).animate().fadeIn(delay: 300.ms, duration: 400.ms).scale(
                    begin: const Offset(0.9, 0.9),
                    end: const Offset(1, 1)),
                const SizedBox(height: 8),
                Text(
                  voip.inCall ? 'In Call' : 'Ready',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: QuantumTheme.textSecondary,
                      ),
                ),
                const SizedBox(height: 24),

                // SRTP key info (in call)
                if (voip.inCall && voip.srtpMasterKey != null)
                  QuantumCard(
                    glowColor: QuantumTheme.quantumPurple,
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
                  ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1),

                if (voip.inCall && voip.srtpMasterKey != null)
                  const SizedBox(height: 16),

                // Protocol info cards (not in call)
                if (!voip.inCall) ...[
                  QuantumCard(
                    glowColor: QuantumTheme.quantumPurple,
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(Icons.security,
                          color: QuantumTheme.quantumPurple),
                      title: const Text('HKDF-SHA-256'),
                      subtitle: const Text(
                          'Key derivation from Kyber shared secret'),
                    ),
                  ).animate().fadeIn(delay: 400.ms, duration: 300.ms).slideX(begin: -0.05),
                  const SizedBox(height: 8),
                  QuantumCard(
                    glowColor: QuantumTheme.quantumBlue,
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(Icons.music_note,
                          color: QuantumTheme.quantumBlue),
                      title: const Text('AES-128-CM'),
                      subtitle: const Text('SRTP cipher suite'),
                    ),
                  ).animate().fadeIn(delay: 500.ms, duration: 300.ms).slideX(begin: -0.05),
                ],
              ],
            ),
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
        Text('$bytes bytes',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  fontFamily: 'JetBrains Mono',
                )),
      ],
    );
  }
}
