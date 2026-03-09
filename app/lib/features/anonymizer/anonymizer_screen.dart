import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/pii_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Pillar 5: 10-Level Anonymizer — PII scanning and redaction.
class AnonymizerScreen extends ConsumerStatefulWidget {
  const AnonymizerScreen({super.key});

  @override
  ConsumerState<AnonymizerScreen> createState() => _AnonymizerScreenState();
}

class _AnonymizerScreenState extends ConsumerState<AnonymizerScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pii = ref.watch(piiProvider);
    final notifier = ref.read(piiProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Anonymizer'),
        actions: [
          if (pii.matches.isNotEmpty)
            Chip(
              label: Text('${pii.matches.length} found'),
              backgroundColor: QuantumTheme.quantumOrange.withValues(alpha: 0.2),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('PII Scanner',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text('Powered by Rust regex engine (166+ patterns)',
                        style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _controller,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        hintText:
                            'Paste text to scan for PII...\ne.g. "My SSN is 123-45-6789, email me at test@example.com"',
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              notifier.scan(_controller.text);
                            },
                            icon: const Icon(Icons.search),
                            label: const Text('Scan'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton(
                          onPressed: () {
                            _controller.clear();
                            notifier.clear();
                          },
                          child: const Text('Clear'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Results
            if (pii.matches.isNotEmpty) ...[
              // Summary
              Card(
                color: pii.highSensitivityCount > 0
                    ? QuantumTheme.quantumRed.withValues(alpha: 0.1)
                    : QuantumTheme.quantumGreen.withValues(alpha: 0.1),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(
                        pii.highSensitivityCount > 0
                            ? Icons.warning_amber
                            : Icons.check_circle_outline,
                        color: pii.highSensitivityCount > 0
                            ? QuantumTheme.quantumRed
                            : QuantumTheme.quantumGreen,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${pii.matches.length} PII items detected '
                          '(${pii.highSensitivityCount} high sensitivity)',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Individual matches
              ...pii.matches.map((m) => Card(
                    child: ListTile(
                      leading: _sensitivityBadge(m.sensitivity),
                      title: Text(m.patternName),
                      subtitle: Text(
                        '${m.category} | "${m.matchedText}" | ${m.countryCode.toUpperCase()}',
                      ),
                      trailing: Text('L${m.sensitivity}',
                          style: Theme.of(context).textTheme.labelLarge),
                    ),
                  )),
            ],

            if (pii.matches.isEmpty && pii.inputText.isNotEmpty)
              Card(
                color: QuantumTheme.quantumGreen.withValues(alpha: 0.1),
                child: const Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: QuantumTheme.quantumGreen),
                      SizedBox(width: 12),
                      Text('No PII detected'),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _sensitivityBadge(int level) {
    final color = level >= 4
        ? QuantumTheme.quantumRed
        : level >= 3
            ? QuantumTheme.quantumOrange
            : QuantumTheme.quantumGreen;
    return CircleAvatar(
      radius: 16,
      backgroundColor: color.withValues(alpha: 0.2),
      child: Text('$level', style: TextStyle(color: color, fontSize: 12)),
    );
  }
}
