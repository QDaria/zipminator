import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 6: Q-AI Assistant — AI chat with model routing.
class QaiScreen extends StatefulWidget {
  const QaiScreen({super.key});

  @override
  State<QaiScreen> createState() => _QaiScreenState();
}

class _QaiScreenState extends State<QaiScreen> {
  final _controller = TextEditingController();
  String _selectedModel = 'auto';
  final List<_AiMessage> _messages = [];

  static const _modelColors = {
    'opus': QuantumTheme.quantumPurple,
    'sonnet': QuantumTheme.quantumBlue,
    'haiku': QuantumTheme.quantumCyan,
    'local': QuantumTheme.quantumGreen,
  };

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Q-AI Assistant'),
      ),
      body: GradientBackground(
        child: Column(
          children: [
            // Model selector chip row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _modelChip('auto', 'Auto Route', Icons.auto_awesome),
                    const SizedBox(width: 8),
                    _modelChip('opus', 'Opus', Icons.diamond_outlined),
                    const SizedBox(width: 8),
                    _modelChip('sonnet', 'Sonnet', Icons.speed),
                    const SizedBox(width: 8),
                    _modelChip('haiku', 'Haiku', Icons.bolt),
                    const SizedBox(width: 8),
                    _modelChip('local', 'Local', Icons.computer),
                  ],
                ),
              ),
            ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.2),

            // Messages
            Expanded(
              child: _messages.isEmpty
                  ? Center(
                      child: SingleChildScrollView(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            PillarHeader(
                              icon: Icons.psychology_outlined,
                              title: 'Q-AI Assistant',
                              subtitle:
                                  'Multi-model Routing by Task Complexity',
                              iconColor: QuantumTheme.quantumPurple,
                            ),
                            Text(
                              'Opus for crypto, Sonnet for features, Haiku for config',
                              style: Theme.of(context).textTheme.bodySmall,
                            )
                                .animate()
                                .fadeIn(delay: 500.ms, duration: 400.ms),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) {
                        final msg = _messages[i];
                        return _AiMessageBubble(message: msg, index: i);
                      },
                    ),
            ),

            // Input
            QuantumCard(
              borderRadius: 0,
              padding: const EdgeInsets.all(8),
              glowColor: QuantumTheme.quantumPurple,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: 'Ask anything...',
                        border: InputBorder.none,
                        suffixText: _selectedModel,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  IconButton(
                    icon:
                        Icon(Icons.send, color: QuantumTheme.quantumPurple),
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

  Widget _modelChip(String value, String label, IconData icon) {
    final isSelected = _selectedModel == value;
    final chipColor = _modelColors[value] ??
        Theme.of(context).colorScheme.primary;

    return ChoiceChip(
      avatar: Icon(icon, size: 16,
          color: isSelected ? Colors.white : chipColor),
      label: Text(label),
      selected: isSelected,
      selectedColor: chipColor.withValues(alpha: 0.3),
      side: BorderSide(
        color: isSelected
            ? chipColor.withValues(alpha: 0.6)
            : chipColor.withValues(alpha: 0.2),
      ),
      labelStyle: TextStyle(
        color: isSelected ? chipColor : null,
        fontWeight: isSelected ? FontWeight.w600 : null,
      ),
      onSelected: (_) => setState(() => _selectedModel = value),
    );
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add(_AiMessage(text: text, isUser: true, model: _selectedModel));
      _messages.add(_AiMessage(
        text: 'Q-AI response will be generated here. '
            'Model: $_selectedModel. '
            'This pillar connects to cloud/local LLM via Rust bridge.',
        isUser: false,
        model: _selectedModel,
      ));
    });
    _controller.clear();
  }
}

class _AiMessage {
  final String text;
  final bool isUser;
  final String model;

  _AiMessage({required this.text, required this.isUser, required this.model});
}

class _AiMessageBubble extends StatelessWidget {
  final _AiMessage message;
  final int index;

  static const _modelColors = {
    'opus': QuantumTheme.quantumPurple,
    'sonnet': QuantumTheme.quantumBlue,
    'haiku': QuantumTheme.quantumCyan,
    'local': QuantumTheme.quantumGreen,
  };

  const _AiMessageBubble({required this.message, required this.index});

  @override
  Widget build(BuildContext context) {
    final glowColor = message.isUser
        ? QuantumTheme.quantumPurple
        : (_modelColors[message.model] ?? QuantumTheme.quantumCyan);

    return Align(
      alignment:
          message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.8),
        child: QuantumCard(
          glowColor: glowColor,
          padding: const EdgeInsets.all(12),
          borderRadius: 12,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(message.text),
              if (!message.isUser) ...[
                const SizedBox(height: 4),
                Text('via ${message.model}',
                    style: Theme.of(context).textTheme.labelSmall),
              ],
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 200.ms)
        .slideY(begin: 0.1);
  }
}
