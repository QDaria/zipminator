import 'package:flutter/material.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Pillar 6: Q-AI Assistant — AI chat with model routing.
class OpenClawScreen extends StatefulWidget {
  const OpenClawScreen({super.key});

  @override
  State<OpenClawScreen> createState() => _OpenClawScreenState();
}

class _OpenClawScreenState extends State<OpenClawScreen> {
  final _controller = TextEditingController();
  String _selectedModel = 'auto';
  final List<_AiMessage> _messages = [];

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
        actions: [
          // Model selector
          PopupMenuButton<String>(
            initialValue: _selectedModel,
            onSelected: (v) => setState(() => _selectedModel = v),
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'auto', child: Text('Auto Route')),
              const PopupMenuItem(value: 'opus', child: Text('Opus (Deep)')),
              const PopupMenuItem(value: 'sonnet', child: Text('Sonnet (Fast)')),
              const PopupMenuItem(value: 'haiku', child: Text('Haiku (Light)')),
              const PopupMenuItem(value: 'local', child: Text('Local LLM')),
            ],
            child: Chip(
              avatar: const Icon(Icons.auto_awesome, size: 16),
              label: Text(_selectedModel),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.psychology_outlined,
                            size: 64, color: QuantumTheme.quantumPurple),
                        const SizedBox(height: 16),
                        Text('Quantum AI Assistant',
                            style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: 8),
                        Text('Multi-model routing by task complexity',
                            style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Opus for crypto, Sonnet for features, Haiku for config',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _messages.length,
                    itemBuilder: (context, i) {
                      final msg = _messages[i];
                      return _AiMessageBubble(message: msg);
                    },
                  ),
          ),

          // Input
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: QuantumTheme.surfaceCard,
              border: Border(
                top: BorderSide(
                    color: QuantumTheme.quantumPurple.withValues(alpha: 0.2)),
              ),
            ),
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
                  icon: Icon(Icons.send, color: QuantumTheme.quantumPurple),
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

  const _AiMessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment:
          message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.all(12),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.8),
        decoration: BoxDecoration(
          color: message.isUser
              ? QuantumTheme.quantumPurple.withValues(alpha: 0.2)
              : QuantumTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(12),
        ),
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
    );
  }
}
