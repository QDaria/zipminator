import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/crypto_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Pillar 1: Quantum Vault — Key generation, encapsulate/decapsulate, entropy.
class VaultScreen extends ConsumerWidget {
  const VaultScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final crypto = ref.watch(cryptoProvider);
    final notifier = ref.read(cryptoProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Quantum Vault')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(Icons.lock_outline,
                        size: 48, color: QuantumTheme.quantumCyan),
                    const SizedBox(height: 12),
                    Text('ML-KEM-768 Key Management',
                        style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 4),
                    Text('NIST FIPS 203 compliant',
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Generate keypair button
            ElevatedButton.icon(
              onPressed: crypto.isGenerating ? null : () => notifier.generateKeypair(),
              icon: crypto.isGenerating
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.key),
              label: Text(crypto.isGenerating
                  ? 'Generating...'
                  : 'Generate Keypair'),
            ),
            const SizedBox(height: 16),

            // Error display
            if (crypto.error != null)
              Card(
                color: QuantumTheme.quantumRed.withValues(alpha: 0.1),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(crypto.error!,
                      style: TextStyle(color: QuantumTheme.quantumRed)),
                ),
              ),

            // Key display
            if (crypto.publicKey != null) ...[
              _KeyCard(
                title: 'Public Key',
                subtitle: '${crypto.publicKey!.length} bytes (ML-KEM-768)',
                bytes: crypto.publicKey!,
                color: QuantumTheme.quantumCyan,
              ),
              const SizedBox(height: 8),
              _KeyCard(
                title: 'Secret Key',
                subtitle: '${crypto.secretKey!.length} bytes (zeroized on drop)',
                bytes: crypto.secretKey!,
                color: QuantumTheme.quantumPurple,
                isSecret: true,
              ),
              const SizedBox(height: 16),

              // KEM roundtrip test
              OutlinedButton.icon(
                onPressed: () async {
                  final enc =
                      await notifier.encapsulate(crypto.publicKey!);
                  if (enc == null || !context.mounted) return;
                  final ss = await notifier.decapsulate(
                    Uint8List.fromList(enc.ciphertext),
                    crypto.secretKey!,
                  );
                  if (!context.mounted) return;
                  final match = ss != null &&
                      ss.length == 32 &&
                      _listEquals(ss, Uint8List.fromList(enc.sharedSecret));
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
              ),
            ],
          ],
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

class _KeyCard extends StatelessWidget {
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

  String _hexPreview() {
    final preview = bytes.take(16).map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ');
    return '$preview ...';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(isSecret ? Icons.lock : Icons.key, color: color, size: 20),
                const SizedBox(width: 8),
                Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(color: color)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.copy, size: 18),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: _hexPreview()));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('$title copied')),
                    );
                  },
                  tooltip: 'Copy',
                ),
              ],
            ),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: QuantumTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isSecret ? '** hidden **' : _hexPreview(),
                style: Theme.of(context).textTheme.labelMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
