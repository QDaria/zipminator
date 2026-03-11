import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 2: PQC Messenger — Double Ratchet encrypted chat.
class MessengerScreen extends ConsumerStatefulWidget {
  const MessengerScreen({super.key});

  @override
  ConsumerState<MessengerScreen> createState() => _MessengerScreenState();
}

class _MessengerScreenState extends ConsumerState<MessengerScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ratchet = ref.watch(ratchetProvider);

    return Scaffold(
      appBar: AppBar(
        actions: [
          PqcBadge(
            label: 'PQ-Ratchet',
            isActive: ratchet.isConnected,
            color: QuantumTheme.quantumGreen,
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: GradientBackground(
        child: Column(
          children: [
            // Not-connected state with PillarHeader
            if (!ratchet.isConnected)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    PillarHeader(
                      icon: Icons.chat_bubble_outline,
                      title: 'PQC Messenger',
                      subtitle:
                          'Forward-secret messaging with ML-KEM ratchet steps',
                      iconColor: QuantumTheme.quantumPurple,
                      badges: [
                        PqcBadge(
                          label: 'Double Ratchet',
                          color: QuantumTheme.quantumPurple,
                        ),
                        PqcBadge(
                          label: 'ML-KEM-768',
                          color: QuantumTheme.quantumCyan,
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      onPressed: () async {
                        final notifier = ref.read(ratchetProvider.notifier);
                        final messenger = ScaffoldMessenger.of(context);
                        final alicePk = await notifier.initAlice();
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(
                                'Session initialized (${alicePk.length} byte PK)'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.handshake),
                      label: const Text('Start Session'),
                    ).animate().fadeIn(delay: 500.ms, duration: 300.ms),
                  ],
                ),
              ),

            // Messages
            Expanded(
              child: ratchet.messages.isEmpty
                  ? Center(
                      child: Text(
                        ratchet.isConnected
                            ? 'Send your first quantum-safe message'
                            : 'Initialize a session to begin',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(8),
                      itemCount: ratchet.messages.length,
                      itemBuilder: (context, index) {
                        final msg = ratchet.messages[index];
                        return _MessageBubble(message: msg)
                            .animate()
                            .fadeIn(duration: 200.ms)
                            .slideY(begin: 0.1);
                      },
                    ),
            ),

            // Typing indicator placeholder
            if (ratchet.isConnected && ratchet.messages.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(left: 16, bottom: 4),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: _TypingIndicator(),
                ),
              ),

            // Error
            if (ratchet.error != null)
              Container(
                padding: const EdgeInsets.all(8),
                color: QuantumTheme.quantumRed.withValues(alpha: 0.1),
                child: Text(ratchet.error!,
                    style: TextStyle(color: QuantumTheme.quantumRed)),
              ),

            // Input
            if (ratchet.isConnected)
              QuantumCard(
                glowColor: QuantumTheme.quantumCyan,
                borderRadius: 0,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        decoration: const InputDecoration(
                          hintText: 'Type a message...',
                          border: InputBorder.none,
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    IconButton(
                      icon:
                          Icon(Icons.send, color: QuantumTheme.quantumCyan),
                      onPressed: _sendMessage,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    ref.read(ratchetProvider.notifier).sendMessage(text);
    _controller.clear();
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isMine = message.isMine;

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: ConstrainedBox(
          constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width * 0.75),
          child: QuantumCard(
            glowColor: isMine
                ? QuantumTheme.quantumCyan
                : QuantumTheme.quantumPurple,
            borderRadius: 16,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(message.text),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock,
                        size: 10, color: QuantumTheme.quantumGreen),
                    const SizedBox(width: 4),
                    Text(
                      'PQ-encrypted',
                      style:
                          Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: QuantumTheme.textSecondary,
                              ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 2),
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: QuantumTheme.quantumPurple.withValues(alpha: 0.5),
            shape: BoxShape.circle,
          ),
        )
            .animate(
              onPlay: (controller) => controller.repeat(reverse: true),
            )
            .fadeIn(duration: 400.ms, delay: (i * 150).ms)
            .slideY(begin: 0.0, end: -0.5, duration: 400.ms, delay: (i * 150).ms);
      }),
    );
  }
}
