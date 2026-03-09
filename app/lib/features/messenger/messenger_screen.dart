import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

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
        title: const Text('PQC Messenger'),
        actions: [
          if (ratchet.isConnected)
            Chip(
              avatar: Icon(Icons.lock, size: 16, color: QuantumTheme.quantumGreen),
              label: const Text('PQ-Secured'),
              backgroundColor: QuantumTheme.quantumGreen.withValues(alpha: 0.1),
            ),
        ],
      ),
      body: Column(
        children: [
          // Status bar
          if (!ratchet.isConnected)
            Container(
              padding: const EdgeInsets.all(16),
              color: QuantumTheme.surfaceElevated,
              child: Column(
                children: [
                  Icon(Icons.chat_bubble_outline,
                      size: 48, color: QuantumTheme.quantumPurple),
                  const SizedBox(height: 12),
                  Text('PQ Double Ratchet',
                      style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 4),
                  Text('Forward-secret messaging with ML-KEM ratchet steps',
                      style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () async {
                      // Demo: create a loopback session (Alice + Bob)
                      final notifier = ref.read(ratchetProvider.notifier);
                      final messenger = ScaffoldMessenger.of(context);
                      final alicePk = await notifier.initAlice();
                      // In a real app, Bob would be on another device
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text(
                              'Session initialized (${alicePk.length} byte PK)'),
                        ),
                      );
                    },
                    icon: const Icon(Icons.handshake),
                    label: const Text('Start Session'),
                  ),
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
                      return _MessageBubble(message: msg);
                    },
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
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: QuantumTheme.surfaceCard,
                border: Border(
                  top: BorderSide(
                      color: QuantumTheme.quantumCyan.withValues(alpha: 0.2)),
                ),
              ),
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
                    icon: Icon(Icons.send, color: QuantumTheme.quantumCyan),
                    onPressed: _sendMessage,
                  ),
                ],
              ),
            ),
        ],
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
    return Align(
      alignment: message.isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.75),
        decoration: BoxDecoration(
          color: message.isMine
              ? QuantumTheme.quantumCyan.withValues(alpha: 0.2)
              : QuantumTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message.text),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock, size: 10, color: QuantumTheme.quantumGreen),
                const SizedBox(width: 4),
                Text(
                  'PQ-encrypted',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: QuantumTheme.textSecondary,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
