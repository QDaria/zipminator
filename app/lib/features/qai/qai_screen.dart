import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/comparison_provider.dart';
import 'package:zipminator/core/providers/pii_provider.dart';
import 'package:zipminator/core/providers/qai_provider.dart';
import 'package:zipminator/core/providers/voice_provider.dart';
import 'package:zipminator/core/services/llm_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/features/qai/comparison_view.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 6: Q-AI Assistant — AI chat with multi-provider model routing and PII guard.
class QaiScreen extends ConsumerStatefulWidget {
  const QaiScreen({super.key});

  @override
  ConsumerState<QaiScreen> createState() => _QaiScreenState();
}

class _QaiScreenState extends ConsumerState<QaiScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  static const _providerColors = {
    LLMProvider.gemini: QuantumTheme.quantumBlue,
    LLMProvider.groq: QuantumTheme.quantumGreen,
    LLMProvider.deepSeek: QuantumTheme.quantumCyan,
    LLMProvider.mistral: QuantumTheme.quantumOrange,
    LLMProvider.claude: QuantumTheme.quantumPurple,
    LLMProvider.openRouter: Color(0xFFFF6D00),
    LLMProvider.ollama: QuantumTheme.quantumGreen,
  };

  /// Tracks whether the local Ollama server is reachable.
  bool _ollamaAvailable = false;

  @override
  void initState() {
    super.initState();
    _checkOllamaHealth();
  }

  Future<void> _checkOllamaHealth() async {
    final available = await OllamaService.isAvailable();
    if (mounted && available != _ollamaAvailable) {
      setState(() => _ollamaAvailable = available);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    // PII guard: scan message before sending
    ref.read(piiProvider.notifier).scan(text);
    final piiAfter = ref.read(piiProvider);
    if (piiAfter.highSensitivityCount > 0) {
      if (!mounted) return;
      final proceed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('PII Detected'),
          content: Text(
            '${piiAfter.highSensitivityCount} high-sensitivity PII items found. '
            'Send anyway?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Send Anyway'),
            ),
          ],
        ),
      );
      if (proceed != true) return;
    }

    _controller.clear();
    await ref.read(qaiProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final qai = ref.watch(qaiProvider);
    final providerColor =
        _providerColors[qai.selectedProvider] ?? QuantumTheme.quantumPurple;

    return GestureDetector(onTap: () => FocusScope.of(context).unfocus(), child: Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: const Text('Q-AI Assistant'),
        actions: [
          IconButton(
            icon: Icon(
              ref.watch(comparisonProvider).isActive
                  ? Icons.compare
                  : Icons.compare_arrows,
              size: 20,
            ),
            onPressed: () =>
                ref.read(comparisonProvider.notifier).toggleActive(),
            tooltip: 'Compare models',
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20),
            onPressed: qai.messages.isEmpty
                ? null
                : () => ref.read(qaiProvider.notifier).clearConversation(),
            tooltip: 'Clear conversation',
          ),
        ],
      ),
      body: GradientBackground(
        child: Column(
          children: [
            // API key / Ollama status banner
            if (!qai.hasApiKey)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                color: QuantumTheme.quantumOrange.withValues(alpha: 0.1),
                child: Row(
                  children: [
                    Icon(Icons.key_off,
                        size: 18, color: QuantumTheme.quantumOrange),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Set your ${qai.selectedProvider.displayName} API key in Settings to chat',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            if (qai.selectedProvider == LLMProvider.ollama && !_ollamaAvailable)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                color: QuantumTheme.quantumRed.withValues(alpha: 0.1),
                child: Row(
                  children: [
                    Icon(Icons.warning_amber_rounded,
                        size: 18, color: QuantumTheme.quantumRed),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Ollama not running. Start it with: ollama serve',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh, size: 16),
                      onPressed: _checkOllamaHealth,
                      tooltip: 'Retry connection',
                    ),
                  ],
                ),
              ),

            // Provider selector chip row
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: LLMProvider.values.map((provider) {
                    final isSelected = qai.selectedProvider == provider;
                    final color = _providerColors[provider] ??
                        Theme.of(context).colorScheme.primary;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        avatar: provider == LLMProvider.ollama
                            ? _OllamaHealthDot(
                                available: _ollamaAvailable,
                                color: isSelected ? Colors.white : color,
                              )
                            : Icon(
                                _providerIcon(provider),
                                size: 16,
                                color: isSelected ? Colors.white : color,
                              ),
                        label: Text(provider.displayName),
                        selected: isSelected,
                        selectedColor: color.withValues(alpha: 0.3),
                        side: BorderSide(
                          color: isSelected
                              ? color.withValues(alpha: 0.6)
                              : color.withValues(alpha: 0.2),
                        ),
                        labelStyle: TextStyle(
                          color: isSelected ? color : null,
                          fontWeight: isSelected ? FontWeight.w600 : null,
                        ),
                        onSelected: (_) {
                          ref
                              .read(qaiProvider.notifier)
                              .selectProvider(provider);
                          if (provider == LLMProvider.ollama) {
                            _checkOllamaHealth();
                          }
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
            ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.2),

            // Model selector chip row (dynamic based on provider)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: qai.availableModels.map((model) {
                    final isSelected = qai.selectedModel == model.id;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(model.displayName),
                        selected: isSelected,
                        selectedColor: providerColor.withValues(alpha: 0.3),
                        side: BorderSide(
                          color: isSelected
                              ? providerColor.withValues(alpha: 0.6)
                              : providerColor.withValues(alpha: 0.15),
                        ),
                        labelStyle: TextStyle(
                          color: isSelected ? providerColor : null,
                          fontWeight: isSelected ? FontWeight.w600 : null,
                          fontSize: 12,
                        ),
                        onSelected: (_) => ref
                            .read(qaiProvider.notifier)
                            .selectModel(model.id),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // Comparison mode or Messages
            if (ref.watch(comparisonProvider).isActive)
              const Expanded(child: ComparisonView()),

            if (!ref.watch(comparisonProvider).isActive)
            Expanded(
              child: qai.messages.isEmpty
                  ? Center(
                      child: SingleChildScrollView(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const PillarStatusBanner(
                              description:
                                  'AI assistant with PQC-encrypted queries',
                              status: PillarStatus.demo,
                            ),
                            PillarHeader(
                              icon: Icons.psychology_outlined,
                              title: 'Q-AI Assistant',
                              subtitle:
                                  'Multi-Provider Model Routing',
                              iconColor: providerColor,
                            ),
                            Text(
                              '7 providers, 18 models — select above',
                              style: Theme.of(context).textTheme.bodySmall,
                            )
                                .animate()
                                .fadeIn(delay: 500.ms, duration: 400.ms),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(12),
                      itemCount: qai.messages.length,
                      itemBuilder: (context, i) {
                        final msg = qai.messages[i];
                        return _QaiMessageBubble(message: msg, index: i);
                      },
                    ),
            ),

            // Loading indicator
            if (qai.isLoading)
              Padding(
                padding: const EdgeInsets.all(8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: providerColor,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('Thinking...',
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),

            // Error
            if (qai.error != null)
              Container(
                padding: const EdgeInsets.all(8),
                color: QuantumTheme.quantumRed.withValues(alpha: 0.1),
                child: Row(
                  children: [
                    Icon(Icons.error_outline,
                        size: 16, color: QuantumTheme.quantumRed),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(qai.error!,
                          style: TextStyle(color: QuantumTheme.quantumRed)),
                    ),
                  ],
                ),
              ),

            // Input (hidden in comparison mode)
            if (!ref.watch(comparisonProvider).isActive)
            QuantumCard(
              borderRadius: 0,
              padding: const EdgeInsets.all(8),
              glowColor: providerColor,
              child: Row(
                children: [
                  // Mic button (STT)
                  IconButton(
                    icon: Icon(
                      ref.watch(voiceProvider).isListening
                          ? Icons.mic
                          : Icons.mic_none,
                      color: ref.watch(voiceProvider).isListening
                          ? QuantumTheme.quantumRed
                          : providerColor,
                    ),
                    onPressed: () => ref
                        .read(voiceProvider.notifier)
                        .toggleListening(_controller),
                    tooltip: 'Voice input',
                  ),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: _inputHint(qai),
                        border: InputBorder.none,
                        suffixText: qai.selectedModel.split('/').last,
                      ),
                      enabled: _canSend(qai),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.send, color: providerColor),
                    onPressed: _canSend(qai) ? _sendMessage : null,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ));
  }

  IconData _providerIcon(LLMProvider provider) => switch (provider) {
        LLMProvider.gemini => Icons.auto_awesome,
        LLMProvider.groq => Icons.bolt,
        LLMProvider.deepSeek => Icons.psychology,
        LLMProvider.mistral => Icons.air,
        LLMProvider.claude => Icons.diamond_outlined,
        LLMProvider.openRouter => Icons.router_outlined,
        LLMProvider.ollama => Icons.computer,
      };

  /// Whether the send button / text field should be enabled.
  bool _canSend(QaiState qai) {
    if (qai.isLoading) return false;
    if (qai.selectedProvider == LLMProvider.ollama) return _ollamaAvailable;
    return qai.hasApiKey;
  }

  /// Hint text for the input field based on provider state.
  String _inputHint(QaiState qai) {
    if (qai.selectedProvider == LLMProvider.ollama) {
      return _ollamaAvailable
          ? 'Ask anything (local)...'
          : 'Start Ollama first: ollama serve';
    }
    return qai.hasApiKey ? 'Ask anything...' : 'Set API key in Settings first';
  }
}

/// Green/red health indicator dot for the Ollama chip.
class _OllamaHealthDot extends StatelessWidget {
  final bool available;
  final Color color;

  const _OllamaHealthDot({required this.available, required this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 16,
      height: 16,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.computer, size: 16, color: color),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: available
                    ? QuantumTheme.quantumGreen
                    : QuantumTheme.quantumRed,
                border: Border.all(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  width: 1,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QaiMessageBubble extends StatelessWidget {
  final QaiMessage message;
  final int index;

  const _QaiMessageBubble({required this.message, required this.index});

  @override
  Widget build(BuildContext context) {
    // Resolve display name from model ID
    final modelInfo =
        kAvailableModels.where((m) => m.id == message.model).firstOrNull;
    final modelLabel = modelInfo?.displayName ?? message.model;

    final glowColor = message.isUser
        ? QuantumTheme.quantumPurple
        : QuantumTheme.quantumCyan;

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
              SelectableText(message.text),
              if (!message.isUser) ...[
                const SizedBox(height: 4),
                Text('via $modelLabel',
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
