import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/crypto_provider.dart';
import 'package:zipminator/core/providers/srtp_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 3: Quantum VoIP — PQ-SRTP encrypted voice/video calls.
class VoipScreen extends ConsumerStatefulWidget {
  const VoipScreen({super.key});

  @override
  ConsumerState<VoipScreen> createState() => _VoipScreenState();
}

class _VoipScreenState extends ConsumerState<VoipScreen> {
  Timer? _callTimer;

  @override
  void dispose() {
    _callTimer?.cancel();
    super.dispose();
  }

  void _startCallTimer() {
    _callTimer?.cancel();
    _callTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      final current = ref.read(voipProvider).callDuration;
      ref.read(voipProvider.notifier).updateCallDuration(
            current + const Duration(seconds: 1),
          );
    });
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '${d.inHours > 0 ? '${d.inHours}:' : ''}$m:$s';
  }

  Future<void> _startCall() async {
    final crypto = ref.read(cryptoProvider);
    final notifier = ref.read(voipProvider.notifier);
    final messenger = ScaffoldMessenger.of(context);

    if (crypto.publicKey == null) {
      // Auto-generate a keypair for the demo
      await ref.read(cryptoProvider.notifier).generateKeypair();
    }

    final pk = ref.read(cryptoProvider).publicKey;
    if (pk == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Key generation failed')),
      );
      return;
    }

    // Run KEM exchange to derive SRTP keys
    final enc = await ref.read(cryptoProvider.notifier).encapsulate(pk);
    if (enc == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('KEM exchange failed')),
      );
      return;
    }

    await notifier.startCall(enc.sharedSecret);
    _startCallTimer();
  }

  void _endCall() {
    _callTimer?.cancel();
    ref.read(voipProvider.notifier).endCall();
  }

  @override
  Widget build(BuildContext context) {
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
                // Status banner
                const PillarStatusBanner(
                  description: 'Quantum-safe voice & video calls',
                  status: PillarStatus.demo,
                ),

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

                // Caller avatar
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

                // Call duration or status
                Text(
                  voip.inCall
                      ? _formatDuration(voip.callDuration)
                      : 'Ready',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: voip.inCall
                            ? QuantumTheme.quantumGreen
                            : QuantumTheme.textSecondary,
                        fontFamily: voip.inCall ? 'JetBrains Mono' : null,
                      ),
                ),
                if (voip.inCall)
                  Text(
                    'PQ-SRTP Secured',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: QuantumTheme.quantumGreen,
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

                // In-call controls
                if (voip.inCall) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _CallControl(
                        icon: voip.isMuted ? Icons.mic_off : Icons.mic,
                        label: voip.isMuted ? 'Unmute' : 'Mute',
                        color: voip.isMuted
                            ? QuantumTheme.quantumRed
                            : QuantumTheme.quantumCyan,
                        onTap: () =>
                            ref.read(voipProvider.notifier).toggleMute(),
                      ),
                      const SizedBox(width: 24),
                      // End call button
                      GestureDetector(
                        onTap: _endCall,
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: QuantumTheme.quantumRed,
                            boxShadow: [
                              BoxShadow(
                                color: QuantumTheme.quantumRed
                                    .withValues(alpha: 0.4),
                                blurRadius: 16,
                              ),
                            ],
                          ),
                          child: const Icon(Icons.call_end,
                              color: Colors.white, size: 32),
                        ),
                      ),
                      const SizedBox(width: 24),
                      _CallControl(
                        icon: voip.isSpeaker
                            ? Icons.volume_up
                            : Icons.volume_down,
                        label: 'Speaker',
                        color: voip.isSpeaker
                            ? QuantumTheme.quantumGreen
                            : QuantumTheme.quantumCyan,
                        onTap: () =>
                            ref.read(voipProvider.notifier).toggleSpeaker(),
                      ),
                    ],
                  ).animate().fadeIn(duration: 300.ms),
                ],

                // Start call button (not in call)
                if (!voip.inCall) ...[
                  SizedBox(
                    width: 160,
                    height: 160,
                    child: ElevatedButton(
                      onPressed: _startCall,
                      style: ElevatedButton.styleFrom(
                        shape: const CircleBorder(),
                        backgroundColor: QuantumTheme.quantumGreen,
                        foregroundColor: QuantumTheme.surfaceDark,
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.call, size: 48),
                          SizedBox(height: 4),
                          Text('Start Call',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: 300.ms, duration: 400.ms),
                  const SizedBox(height: 16),
                  Text(
                    'Runs ML-KEM key exchange then derives SRTP keys',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: QuantumTheme.textSecondary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],

                // Protocol info cards (not in call)
                if (!voip.inCall) ...[
                  const SizedBox(height: 24),
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

                // Error display
                if (voip.error != null) ...[
                  const SizedBox(height: 16),
                  Text(voip.error!,
                      style: TextStyle(color: QuantumTheme.quantumRed)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CallControl extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _CallControl({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.15),
              border: Border.all(color: color.withValues(alpha: 0.4)),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(height: 4),
          Text(label,
              style: Theme.of(context)
                  .textTheme
                  .labelSmall
                  ?.copyWith(color: color)),
        ],
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
