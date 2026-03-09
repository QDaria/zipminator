import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/crypto_provider.dart';
import 'package:zipminator/core/providers/email_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Pillar 7: Quantum Mail — PQC-encrypted email with PII scanning.
class EmailScreen extends ConsumerStatefulWidget {
  const EmailScreen({super.key});

  @override
  ConsumerState<EmailScreen> createState() => _EmailScreenState();
}

class _EmailScreenState extends ConsumerState<EmailScreen> {
  final _toController = TextEditingController();
  final _subjectController = TextEditingController();
  final _bodyController = TextEditingController();

  @override
  void dispose() {
    _toController.dispose();
    _subjectController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emailState = ref.watch(emailCryptoProvider);
    final crypto = ref.watch(cryptoProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quantum Mail'),
        actions: [
          IconButton(
            icon: const Icon(Icons.send),
            onPressed: emailState.isProcessing ? null : _encryptAndSend,
            tooltip: 'Encrypt & Send',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Key status
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Icon(
                      crypto.publicKey != null
                          ? Icons.key
                          : Icons.key_off,
                      color: crypto.publicKey != null
                          ? QuantumTheme.quantumGreen
                          : QuantumTheme.textSecondary,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        crypto.publicKey != null
                            ? 'ML-KEM-768 key loaded (${crypto.publicKey!.length} bytes)'
                            : 'No key — generate one in Vault first',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    if (crypto.publicKey == null)
                      TextButton(
                        onPressed: () =>
                            ref.read(cryptoProvider.notifier).generateKeypair(),
                        child: const Text('Generate'),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Compose
            TextField(
              controller: _toController,
              decoration: const InputDecoration(
                labelText: 'To',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _subjectController,
              decoration: const InputDecoration(
                labelText: 'Subject',
                prefixIcon: Icon(Icons.subject),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _bodyController,
              maxLines: 8,
              decoration: const InputDecoration(
                labelText: 'Message body',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 16),

            // Encrypt button
            ElevatedButton.icon(
              onPressed: emailState.isProcessing ? null : _encryptAndSend,
              icon: emailState.isProcessing
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.lock_outline),
              label: Text(emailState.isProcessing
                  ? 'Encrypting...'
                  : 'Encrypt with ML-KEM-768'),
            ),

            // Error
            if (emailState.error != null) ...[
              const SizedBox(height: 8),
              Text(emailState.error!,
                  style: TextStyle(color: QuantumTheme.quantumRed)),
            ],

            // Result
            if (emailState.encryptedEnvelope != null) ...[
              const SizedBox(height: 16),
              Card(
                color: QuantumTheme.quantumGreen.withValues(alpha: 0.1),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.check_circle,
                              color: QuantumTheme.quantumGreen),
                          const SizedBox(width: 8),
                          const Text('Email Encrypted'),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Envelope: ${emailState.encryptedEnvelope!.length} bytes',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: _testDecrypt,
                        icon: const Icon(Icons.lock_open, size: 16),
                        label: const Text('Test Decrypt'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _encryptAndSend() async {
    final crypto = ref.read(cryptoProvider);
    if (crypto.publicKey == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Generate a keypair first')),
      );
      return;
    }
    final headers =
        'From: me@qdaria.com\nTo: ${_toController.text}\nSubject: ${_subjectController.text}';
    await ref.read(emailCryptoProvider.notifier).encryptEmail(
          recipientPk: crypto.publicKey!,
          body: _bodyController.text,
          headers: headers,
        );
  }

  Future<void> _testDecrypt() async {
    final crypto = ref.read(cryptoProvider);
    final emailState = ref.read(emailCryptoProvider);
    if (crypto.secretKey == null || emailState.encryptedEnvelope == null) return;

    final headers =
        'From: me@qdaria.com\nTo: ${_toController.text}\nSubject: ${_subjectController.text}';
    final body = await ref.read(emailCryptoProvider.notifier).decryptEmail(
          secretKey: crypto.secretKey!,
          envelope: emailState.encryptedEnvelope!,
          headers: headers,
        );
    if (body != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Decrypted: $body'),
          backgroundColor: QuantumTheme.quantumGreen,
        ),
      );
    }
  }
}
