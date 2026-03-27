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
  Timer? _ringTimer;

  @override
  void dispose() {
    _callTimer?.cancel();
    _ringTimer?.cancel();
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

  /// User tapped a contact: enter ringing, run KEM, then connect after 2s.
  Future<void> _callContact(VoipContact contact) async {
    final notifier = ref.read(voipProvider.notifier);
    final messenger = ScaffoldMessenger.of(context);

    // 1. Ringing
    notifier.startRinging(contact);

    // 2. Generate keypair if needed (runs in background during ring)
    if (ref.read(cryptoProvider).publicKey == null) {
      await ref.read(cryptoProvider.notifier).generateKeypair();
    }

    final pk = ref.read(cryptoProvider).publicKey;
    if (pk == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Key generation failed')),
      );
      notifier.endCall();
      return;
    }

    // 3. Run KEM exchange
    final enc = await ref.read(cryptoProvider.notifier).encapsulate(pk);
    if (enc == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('KEM exchange failed')),
      );
      notifier.endCall();
      return;
    }

    // 4. Wait for a minimum 2s ringing animation, then connect
    _ringTimer?.cancel();
    _ringTimer = Timer(const Duration(seconds: 2), () async {
      if (!mounted) return;
      await notifier.connectCall(enc.sharedSecret);
      _startCallTimer();
    });
  }

  void _endCall() {
    _callTimer?.cancel();
    _ringTimer?.cancel();
    ref.read(voipProvider.notifier).endCall();
  }

  @override
  Widget build(BuildContext context) {
    final voip = ref.watch(voipProvider);

    return Scaffold(
      appBar: AppBar(),
      body: GradientBackground(
        child: switch (voip.phase) {
          CallPhase.idle => _ContactListView(onCall: _callContact),
          CallPhase.ringing => _RingingView(
              contact: voip.contact!,
              onHangup: _endCall,
            ),
          CallPhase.connected => _ConnectedView(
              voip: voip,
              formatDuration: _formatDuration,
              onEndCall: _endCall,
              onToggleMute: () =>
                  ref.read(voipProvider.notifier).toggleMute(),
              onToggleSpeaker: () =>
                  ref.read(voipProvider.notifier).toggleSpeaker(),
            ),
          CallPhase.ended => _ContactListView(onCall: _callContact),
        },
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Contact List (Idle state)
// ═══════════════════════════════════════════════════════════════════════════

class _ContactListView extends StatelessWidget {
  final void Function(VoipContact) onCall;
  const _ContactListView({required this.onCall});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const PillarStatusBanner(
            description: 'Quantum-safe voice & video calls',
            status: PillarStatus.demo,
          ),
          PillarHeader(
            icon: Icons.phone_outlined,
            title: 'Quantum VoIP',
            subtitle: 'Select a contact to start a PQ-SRTP call',
            iconColor: QuantumTheme.quantumCyan,
            badges: const [
              PqcBadge(
                label: 'PQ-SRTP',
                isActive: false,
                color: QuantumTheme.quantumGreen,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Contact cards
          ...demoVoipContacts.asMap().entries.map((entry) {
            final i = entry.key;
            final c = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _ContactCard(contact: c, onTap: () => onCall(c))
                  .animate()
                  .fadeIn(delay: (200 + i * 100).ms, duration: 300.ms)
                  .slideY(begin: 0.05),
            );
          }),

          const SizedBox(height: 24),

          // Protocol info cards
          QuantumCard(
            glowColor: QuantumTheme.quantumPurple,
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              leading:
                  Icon(Icons.security, color: QuantumTheme.quantumPurple),
              title: const Text('HKDF-SHA-256'),
              subtitle:
                  const Text('Key derivation from Kyber shared secret'),
            ),
          )
              .animate()
              .fadeIn(delay: 500.ms, duration: 300.ms)
              .slideX(begin: -0.05),
          const SizedBox(height: 8),
          QuantumCard(
            glowColor: QuantumTheme.quantumBlue,
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              leading:
                  Icon(Icons.music_note, color: QuantumTheme.quantumBlue),
              title: const Text('AES-128-CM'),
              subtitle: const Text('SRTP cipher suite'),
            ),
          )
              .animate()
              .fadeIn(delay: 600.ms, duration: 300.ms)
              .slideX(begin: -0.05),
        ],
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  final VoipContact contact;
  final VoidCallback onTap;

  const _ContactCard({required this.contact, required this.onTap});

  String get _initials {
    final parts = contact.name.split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}';
    return contact.name.substring(0, 1);
  }

  @override
  Widget build(BuildContext context) {
    return QuantumCard(
      glowColor: contact.isOnline
          ? QuantumTheme.quantumGreen
          : QuantumTheme.quantumCyan.withValues(alpha: 0.3),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Stack(
          children: [
            CircleAvatar(
              backgroundColor:
                  QuantumTheme.quantumCyan.withValues(alpha: 0.2),
              child: Text(
                _initials,
                style: const TextStyle(
                  color: QuantumTheme.quantumCyan,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: contact.isOnline
                      ? QuantumTheme.quantumGreen
                      : QuantumTheme.textSecondary,
                  border: Border.all(
                    color: QuantumTheme.surfaceCard,
                    width: 2,
                  ),
                ),
              ),
            ),
          ],
        ),
        title: Text(contact.name),
        subtitle: Text(
          contact.isOnline ? 'Online' : 'Offline',
          style: TextStyle(
            color: contact.isOnline
                ? QuantumTheme.quantumGreen
                : QuantumTheme.textSecondary,
            fontSize: 12,
          ),
        ),
        trailing: IconButton(
          onPressed: contact.isOnline ? onTap : null,
          icon: Icon(
            Icons.call,
            color: contact.isOnline
                ? QuantumTheme.quantumGreen
                : QuantumTheme.textSecondary.withValues(alpha: 0.4),
          ),
        ),
        onTap: contact.isOnline ? onTap : null,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Ringing View
// ═══════════════════════════════════════════════════════════════════════════

class _RingingView extends StatelessWidget {
  final VoipContact contact;
  final VoidCallback onHangup;

  const _RingingView({required this.contact, required this.onHangup});

  String get _initials {
    final parts = contact.name.split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}';
    return contact.name.substring(0, 1);
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const PillarStatusBanner(
            description: 'Quantum-safe voice & video calls',
            status: PillarStatus.demo,
          ),
          const SizedBox(height: 32),

          // Pulsing ring animation around avatar
          Stack(
            alignment: Alignment.center,
            children: [
              // Outer pulse ring
              Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: QuantumTheme.quantumGreen.withValues(alpha: 0.3),
                    width: 2,
                  ),
                ),
              )
                  .animate(onPlay: (c) => c.repeat())
                  .scale(
                    begin: const Offset(0.8, 0.8),
                    end: const Offset(1.2, 1.2),
                    duration: 1200.ms,
                    curve: Curves.easeOut,
                  )
                  .fadeOut(duration: 1200.ms),

              // Middle pulse ring
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: QuantumTheme.quantumGreen.withValues(alpha: 0.2),
                    width: 2,
                  ),
                ),
              )
                  .animate(onPlay: (c) => c.repeat())
                  .scale(
                    begin: const Offset(0.9, 0.9),
                    end: const Offset(1.15, 1.15),
                    duration: 1200.ms,
                    delay: 400.ms,
                    curve: Curves.easeOut,
                  )
                  .fadeOut(duration: 1200.ms, delay: 400.ms),

              // Avatar
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
                      color:
                          QuantumTheme.quantumGreen.withValues(alpha: 0.3),
                      blurRadius: 24,
                      spreadRadius: -4,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    _initials,
                    style: const TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Contact name
          Text(
            contact.name,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: QuantumTheme.textPrimary,
                ),
          ),
          const SizedBox(height: 8),

          // "Calling..." label
          Text(
            'Calling...',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: QuantumTheme.quantumGreen,
                ),
          )
              .animate(onPlay: (c) => c.repeat())
              .fadeIn(duration: 600.ms)
              .then()
              .fadeOut(duration: 600.ms),

          const SizedBox(height: 8),
          Text(
            'Negotiating ML-KEM key exchange',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: QuantumTheme.textSecondary,
                ),
          ),

          const SizedBox(height: 48),

          // Hangup button
          GestureDetector(
            onTap: onHangup,
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: QuantumTheme.quantumRed,
                boxShadow: [
                  BoxShadow(
                    color: QuantumTheme.quantumRed.withValues(alpha: 0.4),
                    blurRadius: 16,
                  ),
                ],
              ),
              child: const Icon(Icons.call_end, color: Colors.white, size: 32),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Cancel',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: QuantumTheme.quantumRed,
                ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Connected View (in-call)
// ═══════════════════════════════════════════════════════════════════════════

class _ConnectedView extends StatelessWidget {
  final VoipState voip;
  final String Function(Duration) formatDuration;
  final VoidCallback onEndCall;
  final VoidCallback onToggleMute;
  final VoidCallback onToggleSpeaker;

  const _ConnectedView({
    required this.voip,
    required this.formatDuration,
    required this.onEndCall,
    required this.onToggleMute,
    required this.onToggleSpeaker,
  });

  String get _initials {
    if (voip.contact == null) return '?';
    final parts = voip.contact!.name.split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}';
    return voip.contact!.name.substring(0, 1);
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const PillarStatusBanner(
              description: 'Quantum-safe voice & video calls',
              status: PillarStatus.demo,
            ),
            PillarHeader(
              icon: Icons.phone_in_talk,
              title: 'Quantum VoIP',
              subtitle: 'PQ-SRTP Encrypted Call',
              iconColor: QuantumTheme.quantumGreen,
              badges: [
                PqcBadge(
                  label: 'PQ-SRTP',
                  isActive: voip.isPqSecured,
                  color: QuantumTheme.quantumGreen,
                ),
              ],
            ),

            // Avatar
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
                    color:
                        QuantumTheme.quantumGreen.withValues(alpha: 0.3),
                    blurRadius: 24,
                    spreadRadius: -4,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  _initials,
                  style: const TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ).animate().fadeIn(duration: 400.ms).scale(
                begin: const Offset(0.9, 0.9),
                end: const Offset(1, 1)),

            const SizedBox(height: 8),

            // Contact name
            if (voip.contact != null)
              Text(
                voip.contact!.name,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: QuantumTheme.textPrimary,
                    ),
              ),

            const SizedBox(height: 4),

            // Call duration
            Text(
              formatDuration(voip.callDuration),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: QuantumTheme.quantumGreen,
                    fontFamily: 'JetBrains Mono',
                  ),
            ),
            Text(
              'PQ-SRTP Secured',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: QuantumTheme.quantumGreen,
                  ),
            ),
            const SizedBox(height: 24),

            // SRTP key info
            if (voip.srtpMasterKey != null)
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

            if (voip.srtpMasterKey != null) const SizedBox(height: 16),

            // In-call controls
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _CallControl(
                  icon: voip.isMuted ? Icons.mic_off : Icons.mic,
                  label: voip.isMuted ? 'Unmute' : 'Mute',
                  color: voip.isMuted
                      ? QuantumTheme.quantumRed
                      : QuantumTheme.quantumCyan,
                  onTap: onToggleMute,
                ),
                const SizedBox(width: 24),
                // End call button
                GestureDetector(
                  onTap: onEndCall,
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
                  icon:
                      voip.isSpeaker ? Icons.volume_up : Icons.volume_down,
                  label: 'Speaker',
                  color: voip.isSpeaker
                      ? QuantumTheme.quantumGreen
                      : QuantumTheme.quantumCyan,
                  onTap: onToggleSpeaker,
                ),
              ],
            ).animate().fadeIn(duration: 300.ms),

            // Error display
            if (voip.error != null) ...[
              const SizedBox(height: 16),
              Text(voip.error!,
                  style: TextStyle(color: QuantumTheme.quantumRed)),
            ],
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared helper widgets
// ═══════════════════════════════════════════════════════════════════════════

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
