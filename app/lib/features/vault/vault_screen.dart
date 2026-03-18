import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/crypto_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 1: Quantum Vault — Key generation, encapsulate/decapsulate, entropy.
class VaultScreen extends ConsumerWidget {
  const VaultScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final crypto = ref.watch(cryptoProvider);
    final notifier = ref.read(cryptoProvider.notifier);

    return Scaffold(
      appBar: AppBar(),
      body: GradientBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Status banner
              const PillarStatusBanner(
                description: 'Generate & test quantum-safe encryption keys',
                status: PillarStatus.ready,
              ),

              // Header
              PillarHeader(
                icon: Icons.lock_outline,
                title: 'Quantum Vault',
                subtitle: 'ML-KEM-768 Key Management',
                iconColor: QuantumTheme.quantumCyan,
                badges: [
                  PqcBadge(
                    label: 'FIPS 203',
                    isActive: true,
                    color: QuantumTheme.quantumCyan,
                  ),
                ],
              ),

              // Generate keypair button
              ElevatedButton.icon(
                onPressed: crypto.isGenerating
                    ? null
                    : () => notifier.generateKeypair(),
                icon: crypto.isGenerating
                    ? const ShimmerPlaceholder(
                        width: 16, height: 16, borderRadius: 8)
                    : const Icon(Icons.key),
                label: Text(
                    crypto.isGenerating ? 'Generating...' : 'Generate Keypair'),
              ).animate().fadeIn(delay: 500.ms, duration: 300.ms),
              const SizedBox(height: 16),

              // Error display
              if (crypto.error != null)
                QuantumCard(
                  glowColor: QuantumTheme.quantumRed,
                  child: Text(crypto.error!,
                      style: TextStyle(color: QuantumTheme.quantumRed)),
                ),

              // Key display
              if (crypto.publicKey != null) ...[
                _KeyCard(
                  title: 'Public Key',
                  subtitle: '${crypto.publicKey!.length} bytes (ML-KEM-768)',
                  bytes: crypto.publicKey!,
                  color: QuantumTheme.quantumCyan,
                ).animate().fadeIn(duration: 300.ms).slideX(begin: -0.1),
                const SizedBox(height: 8),
                _KeyCard(
                  title: 'Secret Key',
                  subtitle:
                      '${crypto.secretKey!.length} bytes (zeroized on drop)',
                  bytes: crypto.secretKey!,
                  color: QuantumTheme.quantumPurple,
                  isSecret: true,
                ).animate().fadeIn(duration: 300.ms).slideX(begin: -0.1),
                const SizedBox(height: 16),

                // KEM roundtrip test
                OutlinedButton.icon(
                  onPressed: () async {
                    final enc = await notifier.encapsulate(crypto.publicKey!);
                    if (enc == null || !context.mounted) return;
                    final ss = await notifier.decapsulate(
                      Uint8List.fromList(enc.ciphertext),
                      crypto.secretKey!,
                    );
                    if (!context.mounted) return;
                    final match = ss != null &&
                        ss.length == 32 &&
                        _listEquals(
                            ss, Uint8List.fromList(enc.sharedSecret));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(match
                            ? 'KEM roundtrip verified: 32-byte shared secret matches'
                            : 'KEM roundtrip FAILED'),
                        backgroundColor: match
                            ? QuantumTheme.quantumGreen
                            : QuantumTheme.quantumRed,
                      ),
                    );
                  },
                  icon: const Icon(Icons.verified_outlined),
                  label: const Text('Test KEM Roundtrip'),
                ).animate().fadeIn(delay: 200.ms, duration: 300.ms),
              ],
            ],
          ),
        ),
      ),
    );
  }

  static bool _listEquals(Uint8List a, Uint8List b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}

class _KeyCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final Uint8List bytes;
  final Color color;
  final bool isSecret;

  const _KeyCard({
    required this.title,
    required this.subtitle,
    required this.bytes,
    required this.color,
    this.isSecret = false,
  });

  @override
  State<_KeyCard> createState() => _KeyCardState();
}

class _KeyCardState extends State<_KeyCard> {
  late bool _revealed = !widget.isSecret;

  String _hexPreview() {
    final preview = widget.bytes
        .take(16)
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join(' ');
    return '$preview ...';
  }

  @override
  Widget build(BuildContext context) {
    return QuantumCard(
      glowColor: widget.color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(widget.isSecret ? Icons.lock : Icons.key,
                  color: widget.color, size: 20),
              const SizedBox(width: 8),
              Text(widget.title,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(color: widget.color)),
              const Spacer(),
              IconButton(
                  icon: Icon(
                    _revealed ? Icons.visibility_off : Icons.visibility,
                    size: 18,
                    color: widget.color.withValues(alpha: 0.7),
                  ),
                  onPressed: () => setState(() => _revealed = !_revealed),
                  tooltip: _revealed ? 'Hide' : 'Reveal',
                ),
              IconButton(
                icon: const Icon(Icons.copy, size: 18),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: _hexPreview()));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${widget.title} copied')),
                  );
                },
                tooltip: 'Copy',
              ),
            ],
          ),
          Text(widget.subtitle,
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Container(
              key: ValueKey<bool>(
                  widget.isSecret && !_revealed ? false : true),
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: QuantumTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                !_revealed
                    ? '** hidden **'
                    : _hexPreview(),
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontFamily: 'JetBrains Mono',
                      letterSpacing: 1.2,
                    ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
