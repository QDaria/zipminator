import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/vault_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/features/vault/file_card.dart';

/// Bottom sheet for encrypting a picked file.
class EncryptSheet extends ConsumerStatefulWidget {
  final File file;

  const EncryptSheet({super.key, required this.file});

  @override
  ConsumerState<EncryptSheet> createState() => _EncryptSheetState();
}

class _EncryptSheetState extends ConsumerState<EncryptSheet> {
  bool _started = false;
  bool _done = false;
  String? _error;

  /// Anonymization level: 0 = disabled (no scan), 1-10 = scan + redact.
  int _anonymizationLevel = 0;

  String get _fileName => widget.file.uri.pathSegments.last;

  int get _fileSize => widget.file.lengthSync();

  Future<void> _encrypt() async {
    setState(() {
      _started = true;
      _error = null;
    });

    await ref.read(vaultProvider.notifier).encryptFile(widget.file);

    if (!mounted) return;
    final vaultState = ref.read(vaultProvider);
    if (vaultState.error != null) {
      setState(() {
        _error = vaultState.error;
        _started = false;
      });
    } else {
      setState(() => _done = true);
      await Future<void>.delayed(const Duration(milliseconds: 800));
      if (mounted) Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final vault = ref.watch(vaultProvider);
    final operation = vault.currentOperation ?? 'Processing...';

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: QuantumTheme.surfaceCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(
          color: QuantumTheme.quantumCyan.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Title
          Row(
            children: [
              Icon(Icons.shield, color: QuantumTheme.quantumCyan, size: 22),
              const SizedBox(width: 10),
              Text(
                'Encrypt File',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // File info
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: QuantumTheme.surfaceElevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.06),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.insert_drive_file,
                  color: QuantumTheme.quantumCyan.withValues(alpha: 0.8),
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _fileName,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatBytes(_fileSize),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.5),
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Algorithm badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: QuantumTheme.quantumCyan.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: QuantumTheme.quantumCyan.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock, size: 14, color: QuantumTheme.quantumCyan),
                const SizedBox(width: 6),
                Text(
                  'ML-KEM-768 + AES-256-GCM',
                  style: TextStyle(
                    color: QuantumTheme.quantumCyan,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Anonymization level picker
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: QuantumTheme.quantumOrange.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: QuantumTheme.quantumOrange.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.visibility_off_outlined,
                    size: 18, color: QuantumTheme.quantumOrange),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PII Anonymization',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                      Text(
                        _anonymizationLevel == 0
                            ? 'Disabled'
                            : 'Scan & redact at L$_anonymizationLevel before encrypting',
                        style: TextStyle(
                          fontSize: 10,
                          color: QuantumTheme.quantumOrange.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                ),
                DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _anonymizationLevel,
                    isDense: true,
                    dropdownColor: QuantumTheme.surfaceCard,
                    style: TextStyle(
                      color: QuantumTheme.quantumOrange,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: 0,
                        child: Text('Off'),
                      ),
                      ...List.generate(10, (i) {
                        final level = i + 1;
                        return DropdownMenuItem(
                          value: level,
                          child: Text('L$level'),
                        );
                      }),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _anonymizationLevel = v);
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Error
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: QuantumTheme.quantumRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: QuantumTheme.quantumRed.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline,
                      color: QuantumTheme.quantumRed, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: TextStyle(
                          color: QuantumTheme.quantumRed, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Progress / button
          if (_started && !_done) ...[
            Column(
              children: [
                LinearProgressIndicator(
                  backgroundColor:
                      QuantumTheme.quantumCyan.withValues(alpha: 0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(
                      QuantumTheme.quantumCyan),
                ),
                const SizedBox(height: 10),
                Text(
                  operation,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: QuantumTheme.quantumCyan,
                      ),
                ),
              ],
            ),
          ] else if (_done) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.check_circle,
                    color: QuantumTheme.quantumGreen, size: 22),
                const SizedBox(width: 8),
                Text(
                  'Encrypted successfully',
                  style: TextStyle(
                    color: QuantumTheme.quantumGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ] else ...[
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _encrypt,
                style: ElevatedButton.styleFrom(
                  backgroundColor: QuantumTheme.quantumCyan,
                  foregroundColor: QuantumTheme.surfaceDark,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.lock),
                label: const Text(
                  'Encrypt with ML-KEM-768',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
