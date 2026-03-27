import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/pii_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

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

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
      appBar: AppBar(
        title: const Text('Anonymizer'),
        actions: [
          if (pii.matches.isNotEmpty)
            Chip(
              label: Text('${pii.matches.length} found'),
              backgroundColor:
                  QuantumTheme.quantumOrange.withValues(alpha: 0.2),
            ),
        ],
      ),
      body: GradientBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PillarStatusBanner(
                description: 'Find & redact personal data in text',
                status: PillarStatus.ready,
              ),

              PillarHeader(
                icon: Icons.visibility_off_outlined,
                title: 'Anonymizer',
                subtitle: 'PII Scanner & Redactor',
                iconColor: QuantumTheme.quantumOrange,
                badges: [
                  PqcBadge(
                    label: '166+ patterns',
                    color: QuantumTheme.quantumOrange,
                    isActive: true,
                  ),
                ],
              ),

              // 10-Level Anonymization Selector
              QuantumCard(
                glowColor: QuantumTheme.quantumOrange,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Anonymization Level',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Level ${pii.selectedLevel}: ${_levelDescription(pii.selectedLevel)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: _levelColor(pii.selectedLevel),
                        thumbColor: _levelColor(pii.selectedLevel),
                        inactiveTrackColor:
                            _levelColor(pii.selectedLevel).withValues(alpha: 0.2),
                        overlayColor:
                            _levelColor(pii.selectedLevel).withValues(alpha: 0.1),
                      ),
                      child: Slider(
                        value: pii.selectedLevel.toDouble(),
                        min: 1,
                        max: 10,
                        divisions: 9,
                        label: 'L${pii.selectedLevel}',
                        onChanged: (v) => notifier.setLevel(v.round()),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('L1 Basic',
                            style: Theme.of(context).textTheme.labelSmall),
                        Text('L10 Maximum',
                            style: Theme.of(context).textTheme.labelSmall),
                      ],
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 200.ms, duration: 300.ms),
              const SizedBox(height: 12),

              // Redact button + output
              if (pii.redactedText != null) ...[
                QuantumCard(
                  glowColor: QuantumTheme.quantumGreen,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.check_circle,
                              color: QuantumTheme.quantumGreen, size: 20),
                          const SizedBox(width: 8),
                          Text('Redacted Output (L${pii.selectedLevel})',
                              style: Theme.of(context).textTheme.titleSmall),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SelectableText(
                        pii.redactedText!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontFamily: 'JetBrains Mono',
                            ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 300.ms),
                const SizedBox(height: 12),
              ],

              // PII Scanner card
              QuantumCard(
                glowColor: QuantumTheme.quantumOrange,
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
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: ActionChip(
                        avatar: const Icon(Icons.science_outlined, size: 16),
                        label: const Text('Try Example'),
                        onPressed: () {
                          _controller.text =
                              'John Smith, SSN 123-45-6789, john@acme.com, '
                              '555-0123, CC 4111-1111-1111-1111';
                          setState(() {});
                        },
                      ),
                    ),
                    const SizedBox(height: 8),
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
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _controller.text.isNotEmpty
                                ? () => notifier.redact(_controller.text)
                                : null,
                            icon: const Icon(Icons.shield),
                            label: const Text('Redact'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: QuantumTheme.quantumOrange,
                            ),
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
              ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
              const SizedBox(height: 16),

              // Results
              if (pii.matches.isNotEmpty) ...[
                // Summary card
                QuantumCard(
                  glowColor: pii.highSensitivityCount > 0
                      ? QuantumTheme.quantumRed
                      : QuantumTheme.quantumGreen,
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
                )
                    .animate()
                    .fadeIn(duration: 300.ms)
                    .scale(
                      begin: const Offset(0.95, 0.95),
                      end: const Offset(1, 1),
                    ),
                const SizedBox(height: 8),

                // Individual matches with staggered animation
                ...pii.matches.asMap().entries.map((entry) {
                  final index = entry.key;
                  final m = entry.value;
                  final glowColor = m.sensitivity >= 4
                      ? QuantumTheme.quantumRed
                      : m.sensitivity >= 3
                          ? QuantumTheme.quantumOrange
                          : QuantumTheme.quantumGreen;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: QuantumCard(
                      glowColor: glowColor,
                      padding: EdgeInsets.zero,
                      child: ListTile(
                        leading: _sensitivityBadge(m.sensitivity)
                            .animate()
                            .fadeIn(delay: (index * 100).ms),
                        title: Text(m.patternName),
                        subtitle: Text(
                          '${m.category} | "${m.matchedText}" | ${m.countryCode.toUpperCase()}',
                        ),
                        trailing: Text('L${m.sensitivity}',
                            style: Theme.of(context).textTheme.labelLarge),
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: (index * 100).ms, duration: 300.ms)
                      .slideY(begin: 0.1);
                }),
              ],

              if (pii.matches.isEmpty && pii.inputText.isNotEmpty)
                QuantumCard(
                  glowColor: QuantumTheme.quantumGreen,
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle,
                          color: QuantumTheme.quantumGreen),
                      SizedBox(width: 12),
                      Text('No PII detected'),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(duration: 400.ms)
                    .scale(
                      begin: const Offset(0.95, 0.95),
                      end: const Offset(1, 1),
                    ),
            ],
          ),
        ),
      ),
    ));
  }

  String _levelDescription(int level) => switch (level) {
        1 => 'Names only',
        2 => 'Names + emails',
        3 => 'Names + emails + phones',
        4 => 'All contact info + addresses',
        5 => 'All PII including SSN/ID numbers',
        6 => 'All PII + financial data',
        7 => 'All PII + IP addresses + devices',
        8 => 'All PII + biometrics + medical',
        9 => 'All PII + behavioral patterns',
        10 => 'Maximum: all detectable PII',
        _ => 'Unknown',
      };

  Color _levelColor(int level) {
    if (level <= 3) return QuantumTheme.quantumGreen;
    if (level <= 6) return QuantumTheme.quantumOrange;
    return QuantumTheme.quantumRed;
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
