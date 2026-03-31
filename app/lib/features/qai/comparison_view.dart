import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/comparison_provider.dart';
import 'package:zipminator/core/providers/qai_provider.dart';
import 'package:zipminator/core/services/llm_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Provider color mapping per [LLMProvider].
Color _providerColor(LLMProvider provider) => switch (provider) {
      LLMProvider.gemini => QuantumTheme.quantumBlue,
      LLMProvider.groq => QuantumTheme.quantumGreen,
      LLMProvider.deepSeek => QuantumTheme.quantumCyan,
      LLMProvider.mistral => QuantumTheme.quantumOrange,
      LLMProvider.claude => QuantumTheme.quantumPurple,
      LLMProvider.openRouter => const Color(0xFFFF6D00),
    };

/// Side-by-side comparison view: shared input + grid of response cards.
class ComparisonView extends ConsumerWidget {
  const ComparisonView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final comparison = ref.watch(comparisonProvider);
    final qaiState = ref.watch(qaiProvider);
    final controller = TextEditingController(text: comparison.query ?? '');
    final anyLoading =
        comparison.loadingStates.values.any((loading) => loading);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Model selection chips ───────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: kAvailableModels.map((model) {
              final selected = comparison.selectedModelIds.contains(model.id);
              final hasKey = qaiState.apiKeys.containsKey(model.provider) &&
                  qaiState.apiKeys[model.provider]!.isNotEmpty;
              return FilterChip(
                label: Text(model.displayName),
                selected: selected,
                onSelected: hasKey
                    ? (_) => ref
                        .read(comparisonProvider.notifier)
                        .toggleModel(model.id)
                    : null,
                avatar: CircleAvatar(
                  radius: 6,
                  backgroundColor: _providerColor(model.provider),
                ),
                tooltip: hasKey
                    ? model.provider.displayName
                    : '${model.provider.displayName} - API key required',
              );
            }).toList(),
          ),
        ),

        // ── Shared query input ─────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: const InputDecoration(
                    hintText: 'Ask all selected models...',
                  ),
                  textInputAction: TextInputAction.send,
                  onSubmitted: comparison.selectedModelIds.isEmpty || anyLoading
                      ? null
                      : (text) => _send(ref, text, qaiState.apiKeys),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed:
                    comparison.selectedModelIds.isEmpty || anyLoading
                        ? null
                        : () => _send(ref, controller.text, qaiState.apiKeys),
                icon: anyLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send_rounded),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // ── Response grid ──────────────────────────────────────────────
        Expanded(
          child: comparison.selectedModelIds.isEmpty
              ? const Center(
                  child: Text(
                    'Select up to 4 models to compare',
                    style: TextStyle(color: QuantumTheme.textSecondary),
                  ),
                )
              : LayoutBuilder(
                  builder: (context, constraints) {
                    final crossAxisCount =
                        constraints.maxWidth > 600 ? 2 : 1;
                    return GridView.count(
                      crossAxisCount: crossAxisCount,
                      padding: const EdgeInsets.all(16),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: crossAxisCount == 2 ? 1.0 : 2.0,
                      children: comparison.selectedModelIds.map((modelId) {
                        return _ResponseCard(
                          modelId: modelId,
                          comparison: comparison,
                        );
                      }).toList(),
                    );
                  },
                ),
        ),
      ],
    );
  }

  void _send(
    WidgetRef ref,
    String text,
    Map<LLMProvider, String> apiKeys,
  ) {
    if (text.trim().isEmpty) return;
    ref.read(comparisonProvider.notifier).sendToAll(text.trim(), apiKeys);
  }
}

/// A single response card within the comparison grid.
class _ResponseCard extends StatelessWidget {
  final String modelId;
  final ComparisonState comparison;

  const _ResponseCard({
    required this.modelId,
    required this.comparison,
  });

  @override
  Widget build(BuildContext context) {
    final model =
        kAvailableModels.where((m) => m.id == modelId).firstOrNull;
    final color =
        model != null ? _providerColor(model.provider) : QuantumTheme.quantumCyan;
    final isLoading = comparison.loadingStates[modelId] ?? false;
    final response = comparison.responses[modelId];
    final error = comparison.errors[modelId];

    return QuantumCard(
      glowColor: color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: model name + provider dot.
          Row(
            children: [
              CircleAvatar(radius: 5, backgroundColor: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  model?.displayName ?? modelId,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: color,
                        fontWeight: FontWeight.w600,
                      ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          const SizedBox(height: 8),

          // Body: loading / error / response.
          Expanded(
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : error != null
                    ? Text(
                        error,
                        style: const TextStyle(color: QuantumTheme.quantumRed),
                      )
                    : response != null
                        ? SingleChildScrollView(
                            child: SelectableText(
                              response,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          )
                        : const Center(
                            child: Text(
                              'Waiting for query...',
                              style: TextStyle(
                                  color: QuantumTheme.textSecondary),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
