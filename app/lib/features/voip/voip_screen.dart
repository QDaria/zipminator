import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:zipminator/core/providers/crypto_provider.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
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
      HapticFeedback.heavyImpact();
      _startCallTimer();
    });
  }

  void _endCall() {
    _callTimer?.cancel();
    _ringTimer?.cancel();
    final voip = ref.read(voipProvider);
    final duration = voip.callDuration;
    final contactName = voip.contact?.name;
    ref.read(voipProvider.notifier).endCall();

    // Record to call history and show summary if the call was connected.
    if (duration > Duration.zero && contactName != null) {
      ref.read(callHistoryProvider.notifier).addEntry(
            CallHistoryEntry(
              contactName: contactName,
              duration: duration,
              timestamp: DateTime.now(),
            ),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Call secured with PQ-SRTP  \u2022  ${_formatDuration(duration)}',
            ),
            backgroundColor: QuantumTheme.quantumGreen.withValues(alpha: 0.85),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final voip = ref.watch(voipProvider);

    return Scaffold(
      appBar: AppBar(),
      body: GradientBackground(
        child: switch (voip.phase) {
          CallPhase.idle || CallPhase.ended => _ContactListView(
              onCall: _callContact,
              formatDuration: _formatDuration,
            ),
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
          CallPhase.conferencing => _ConferenceView(
              voip: voip,
              formatDuration: _formatDuration,
              onEndCall: _endCall,
              onToggleMute: () =>
                  ref.read(voipProvider.notifier).toggleMute(),
              onToggleVideo: () =>
                  ref.read(voipProvider.notifier).toggleVideo(),
            ),
        },
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Contact List (Idle state)
// ═══════════════════════════════════════════════════════════════════════════

class _ContactListView extends ConsumerWidget {
  final void Function(VoipContact) onCall;
  final String Function(Duration) formatDuration;
  const _ContactListView({
    required this.onCall,
    required this.formatDuration,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(callHistoryProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          PillarStatusBanner(
            description: 'Quantum-safe voice & video calls',
            status: ref.watch(ratchetProvider).isLive
                ? PillarStatus.ready
                : PillarStatus.demo,
          ),
          PillarHeader(
            icon: Icons.phone_outlined,
            title: 'Quantum VoIP',
            subtitle: ref.watch(ratchetProvider).isLive
                ? 'Call any peer via live signaling'
                : 'Select a contact to start a PQ-SRTP call',
            iconColor: QuantumTheme.quantumCyan,
            badges: [
              PqcBadge(
                label: 'PQ-SRTP',
                isActive: ref.watch(ratchetProvider).isLive,
                color: QuantumTheme.quantumGreen,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Call by username (when Live)
          if (ref.watch(ratchetProvider).isLive)
            _CallByUsernameField(onCall: onCall),

          // Conference buttons (when Live)
          if (ref.watch(ratchetProvider).isLive)
            _ConferenceButtons(),

          // Contact cards
          ...ref.watch(voipContactsProvider).asMap().entries.map((entry) {
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

          // Call history section
          if (history.isNotEmpty) ...[
            const SizedBox(height: 24),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Recent Calls',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: QuantumTheme.textSecondary,
                    ),
              ),
            ),
            const SizedBox(height: 8),
            ...history.map((entry) {
              final time = '${entry.timestamp.hour.toString().padLeft(2, '0')}:'
                  '${entry.timestamp.minute.toString().padLeft(2, '0')}';
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: QuantumCard(
                  glowColor: QuantumTheme.quantumGreen.withValues(alpha: 0.3),
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.call_made,
                        color: QuantumTheme.quantumGreen, size: 20),
                    title: Text(entry.contactName),
                    subtitle: Text(
                      'PQ-SRTP  \u2022  ${formatDuration(entry.duration)}',
                      style: TextStyle(
                        color: QuantumTheme.quantumGreen,
                        fontSize: 12,
                      ),
                    ),
                    trailing: Text(
                      time,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: QuantumTheme.textSecondary,
                          ),
                    ),
                  ),
                ),
              );
            }),
          ],

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
              right: -1,
              bottom: -1,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: contact.isOnline
                      ? const Color(0xFF00E676)
                      : QuantumTheme.textSecondary,
                  border: Border.all(
                    color: Colors.white,
                    width: 2,
                  ),
                  boxShadow: contact.isOnline
                      ? [
                          BoxShadow(
                            color: const Color(0xFF00E676).withValues(alpha: 0.6),
                            blurRadius: 4,
                            spreadRadius: 1,
                          ),
                        ]
                      : [],
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
            description: 'PQ-SRTP call in progress',
            status: PillarStatus.ready,
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
              description: 'PQ-SRTP secured call',
              status: PillarStatus.ready,
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

/// Field for calling a peer by username (like messenger's add contact).
class _CallByUsernameField extends StatefulWidget {
  final void Function(VoipContact) onCall;
  const _CallByUsernameField({required this.onCall});
  @override
  State<_CallByUsernameField> createState() => _CallByUsernameFieldState();
}

class _CallByUsernameFieldState extends State<_CallByUsernameField> {
  final _ctrl = TextEditingController();

  void _call() {
    final input = _ctrl.text.trim();
    if (input.isEmpty) return;
    final username = input.contains('@') ? input.split('@').first : input;
    final contact = VoipContact(
      id: 'live-$username',
      name: username,
      email: '$username@zipminator.zip',
      isOnline: true,
    );
    widget.onCall(contact);
    _ctrl.clear();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: QuantumCard(
        glowColor: QuantumTheme.quantumGreen,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _ctrl,
                decoration: const InputDecoration(
                  hintText: 'Call by username...',
                  prefixIcon: Icon(Icons.person_add, size: 20),
                  isDense: true,
                  border: InputBorder.none,
                ),
                onSubmitted: (_) => _call(),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: _call,
              icon: const Icon(Icons.call, size: 18),
              style: IconButton.styleFrom(
                backgroundColor: QuantumTheme.quantumGreen,
                foregroundColor: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Conference Buttons (Start / Join)
// ═══════════════════════════════════════════════════════════════════════════

class _ConferenceButtons extends ConsumerStatefulWidget {
  @override
  ConsumerState<_ConferenceButtons> createState() => _ConferenceButtonsState();
}

class _ConferenceButtonsState extends ConsumerState<_ConferenceButtons> {
  final _roomCtrl = TextEditingController();
  bool _showJoinField = false;

  @override
  void dispose() {
    _roomCtrl.dispose();
    super.dispose();
  }

  void _startConference() {
    final roomId = 'zip-${DateTime.now().millisecondsSinceEpoch % 100000}';
    ref.read(voipProvider.notifier).createConference(roomId);
  }

  void _joinConference() {
    final roomId = _roomCtrl.text.trim();
    if (roomId.isEmpty) return;
    ref.read(voipProvider.notifier).joinConference(roomId);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: QuantumCard(
        glowColor: QuantumTheme.quantumPurple,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.video_call, color: QuantumTheme.quantumPurple, size: 20),
                const SizedBox(width: 8),
                Text('Conference', style: Theme.of(context).textTheme.titleSmall),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _startConference,
                    icon: const Icon(Icons.add_call, size: 16),
                    label: const Text('Start'),
                    style: FilledButton.styleFrom(
                      backgroundColor: QuantumTheme.quantumPurple,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => setState(() => _showJoinField = !_showJoinField),
                    icon: const Icon(Icons.login, size: 16),
                    label: const Text('Join'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: QuantumTheme.quantumPurple,
                      side: BorderSide(color: QuantumTheme.quantumPurple.withValues(alpha: 0.5)),
                    ),
                  ),
                ),
              ],
            ),
            if (_showJoinField) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _roomCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Room ID...',
                        isDense: true,
                        border: InputBorder.none,
                      ),
                      onSubmitted: (_) => _joinConference(),
                    ),
                  ),
                  IconButton.filled(
                    onPressed: _joinConference,
                    icon: const Icon(Icons.arrow_forward, size: 16),
                    style: IconButton.styleFrom(
                      backgroundColor: QuantumTheme.quantumPurple,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Conference View (multi-peer video grid)
// ═══════════════════════════════════════════════════════════════════════════

class _ConferenceView extends ConsumerStatefulWidget {
  final VoipState voip;
  final String Function(Duration) formatDuration;
  final VoidCallback onEndCall;
  final VoidCallback onToggleMute;
  final VoidCallback onToggleVideo;

  const _ConferenceView({
    required this.voip,
    required this.formatDuration,
    required this.onEndCall,
    required this.onToggleMute,
    required this.onToggleVideo,
  });

  @override
  ConsumerState<_ConferenceView> createState() => _ConferenceViewState();
}

class _ConferenceViewState extends ConsumerState<_ConferenceView> {
  Timer? _durationTimer;
  final _localRenderer = RTCVideoRenderer();
  final Map<String, RTCVideoRenderer> _remoteRenderers = {};
  StreamSubscription<Map<String, MediaStream>>? _streamsSub;

  @override
  void initState() {
    super.initState();
    _initRendererAndStreams();
    _startDurationTimer();
  }

  Future<void> _initRendererAndStreams() async {
    await _localRenderer.initialize();
    if (!mounted) return;
    _setupStreams();
    setState(() {});
  }

  void _startDurationTimer() {
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      final current = ref.read(voipProvider).callDuration;
      ref.read(voipProvider.notifier).updateCallDuration(
            current + const Duration(seconds: 1),
          );
    });
  }

  void _setupStreams() {
    final conference = ref.read(voipProvider.notifier).conference;
    if (conference == null) return;

    // Set up local video.
    if (conference.localStream != null) {
      _localRenderer.srcObject = conference.localStream;
    }

    // Listen for remote stream changes.
    _streamsSub = conference.remoteStreams.listen((streams) {
      _updateRemoteRenderers(streams);
    });
  }

  void _updateRemoteRenderers(Map<String, MediaStream> streams) async {
    // Remove renderers for peers who left.
    final gone = _remoteRenderers.keys
        .where((id) => !streams.containsKey(id))
        .toList();
    for (final id in gone) {
      await _remoteRenderers[id]!.dispose();
      _remoteRenderers.remove(id);
    }

    // Add renderers for new peers.
    for (final entry in streams.entries) {
      if (!_remoteRenderers.containsKey(entry.key)) {
        final renderer = RTCVideoRenderer();
        await renderer.initialize();
        renderer.srcObject = entry.value;
        _remoteRenderers[entry.key] = renderer;
      }
    }

    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _streamsSub?.cancel();
    _localRenderer.dispose();
    for (final r in _remoteRenderers.values) {
      r.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final voip = ref.watch(voipProvider);
    final participantCount = _remoteRenderers.length + 1; // +1 for local

    return Column(
      children: [
        // Header
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                PqcBadge(
                  label: 'PQ-SRTP',
                  isActive: true,
                  color: QuantumTheme.quantumGreen,
                ),
                const SizedBox(width: 8),
                Text(
                  'Room: ${voip.roomId ?? ""}',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: QuantumTheme.quantumGreen.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$participantCount participant${participantCount != 1 ? 's' : ''}',
                    style: TextStyle(
                      color: QuantumTheme.quantumGreen,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Video grid
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: _buildVideoGrid(),
          ),
        ),

        // Duration
        Text(
          widget.formatDuration(voip.callDuration),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontFamily: 'JetBrains Mono',
                color: QuantumTheme.quantumGreen,
              ),
        ),
        const SizedBox(height: 16),

        // Controls
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _ControlButton(
                  icon: voip.isMuted ? Icons.mic_off : Icons.mic,
                  label: voip.isMuted ? 'Unmute' : 'Mute',
                  color: voip.isMuted
                      ? QuantumTheme.quantumRed
                      : QuantumTheme.quantumCyan,
                  onTap: widget.onToggleMute,
                ),
                const SizedBox(width: 24),
                _ControlButton(
                  icon: Icons.videocam_off,
                  label: 'Video',
                  color: QuantumTheme.quantumCyan,
                  onTap: widget.onToggleVideo,
                ),
                const SizedBox(width: 24),
                _ControlButton(
                  icon: Icons.call_end,
                  label: 'Leave',
                  color: QuantumTheme.quantumRed,
                  onTap: widget.onEndCall,
                  filled: true,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVideoGrid() {
    final tiles = <Widget>[
      // Local video (always first)
      _VideoTile(
        renderer: _localRenderer,
        label: 'You',
        isMuted: ref.watch(voipProvider).isMuted,
        isLocal: true,
      ),
      // Remote videos
      ..._remoteRenderers.entries.map((e) => _VideoTile(
            renderer: e.value,
            label: e.key,
            isMuted: false,
            isLocal: false,
          )),
    ];

    if (tiles.length <= 2) {
      // 1-2 participants: column layout
      return Column(
        children: tiles.map((t) => Expanded(child: t)).toList(),
      );
    }
    // 3+ participants: 2-column grid
    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 4 / 3,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      children: tiles,
    );
  }
}

class _VideoTile extends StatelessWidget {
  final RTCVideoRenderer renderer;
  final String label;
  final bool isMuted;
  final bool isLocal;

  const _VideoTile({
    required this.renderer,
    required this.label,
    required this.isMuted,
    required this.isLocal,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Container(
            color: QuantumTheme.surfaceElevated,
            child: RTCVideoView(
              renderer,
              mirror: isLocal,
              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
            ),
          ),
          // Name label
          Positioned(
            left: 8,
            bottom: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isMuted) ...[
                    Icon(Icons.mic_off, size: 12, color: QuantumTheme.quantumRed),
                    const SizedBox(width: 4),
                  ],
                  Icon(Icons.lock, size: 10, color: QuantumTheme.quantumGreen),
                  const SizedBox(width: 4),
                  Text(
                    label,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool filled;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: filled ? color : color.withValues(alpha: 0.15),
              border: Border.all(color: color.withValues(alpha: 0.4)),
            ),
            child: Icon(icon, color: filled ? Colors.white : color),
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: color, fontSize: 11)),
      ],
    );
  }
}
