import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:zipminator/core/providers/crypto_provider.dart';
import 'package:zipminator/core/providers/vault_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/features/vault/encrypt_sheet.dart';
import 'package:zipminator/features/vault/file_card.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 1: Quantum Vault -- PQC file encryption & key management.
class VaultScreen extends ConsumerWidget {
  const VaultScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vault = ref.watch(vaultProvider);
    final crypto = ref.watch(cryptoProvider);
    final vaultNotifier = ref.read(vaultProvider.notifier);

    return Scaffold(
      appBar: AppBar(),
      body: GradientBackground(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const PillarStatusBanner(
                      description: 'Encrypt files with quantum-safe cryptography',
                      status: PillarStatus.ready,
                    ),
                    PillarHeader(
                      icon: Icons.lock_outline,
                      title: 'Quantum Vault',
                      subtitle: 'ML-KEM-768 File Encryption',
                      iconColor: QuantumTheme.quantumCyan,
                      badges: [
                        PqcBadge(
                          label: 'FIPS 203',
                          isActive: true,
                          color: QuantumTheme.quantumCyan,
                        ),
                      ],
                    ),

                    // Error display
                    if (vault.error != null) ...[
                      QuantumCard(
                        glowColor: QuantumTheme.quantumRed,
                        child: Row(
                          children: [
                            Icon(Icons.error_outline,
                                color: QuantumTheme.quantumRed, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                vault.error!,
                                style: TextStyle(
                                    color: QuantumTheme.quantumRed,
                                    fontSize: 13),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, size: 16),
                              onPressed: () => vaultNotifier.clearError(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],

                    // Key management (expandable)
                    _KeyManagementCard(crypto: crypto),

                    const SizedBox(height: 16),

                    // Section header for file list
                    Row(
                      children: [
                        Icon(Icons.folder_special,
                            color: QuantumTheme.quantumCyan, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Encrypted Files',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                        const Spacer(),
                        if (vault.files.isNotEmpty)
                          Text(
                            '${vault.files.length} file${vault.files.length == 1 ? '' : 's'}',
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color:
                                          Colors.white.withValues(alpha: 0.5),
                                    ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),

            // File list or empty state
            if (vault.files.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _EmptyVault(),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList.separated(
                  itemCount: vault.files.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final file = vault.files[index];
                    return FileCard(
                      file: file,
                      onTap: () => _showFileActions(context, ref, file),
                    ).animate().fadeIn(
                          duration: 200.ms,
                          delay: (index * 50).ms,
                        );
                  },
                ),
              ),

            // Bottom padding
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: vault.isProcessing ? null : () => _pickAndEncrypt(context, ref),
        backgroundColor: vault.isProcessing
            ? QuantumTheme.surfaceElevated
            : QuantumTheme.quantumCyan,
        foregroundColor: vault.isProcessing
            ? Colors.white.withValues(alpha: 0.4)
            : QuantumTheme.surfaceDark,
        icon: vault.isProcessing
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.white),
              )
            : const Icon(Icons.add),
        label: Text(vault.isProcessing ? 'Processing...' : 'Encrypt File'),
      ),
    );
  }

  Future<void> _pickAndEncrypt(BuildContext context, WidgetRef ref) async {
    final result = await FilePicker.platform.pickFiles();
    if (result == null || result.files.isEmpty) return;
    final path = result.files.single.path;
    if (path == null) return;
    if (!context.mounted) return;

    final encrypted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EncryptSheet(file: File(path)),
    );

    if (encrypted == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('File encrypted and stored in vault'),
          backgroundColor: QuantumTheme.quantumGreen,
        ),
      );
    }
  }

  void _showFileActions(
      BuildContext context, WidgetRef ref, VaultFile file) {
    showModalBottomSheet(
      context: context,
      backgroundColor: QuantumTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _FileActionsSheet(file: file),
    );
  }
}

// ---------------------------------------------------------------------------
// File actions bottom sheet
// ---------------------------------------------------------------------------

class _FileActionsSheet extends ConsumerWidget {
  final VaultFile file;

  const _FileActionsSheet({required this.file});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // File info header
          Row(
            children: [
              Icon(Icons.lock, color: QuantumTheme.quantumGreen, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      file.name,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '${formatBytes(file.originalSize)} -> ${formatBytes(file.encryptedSize)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          _ActionTile(
            icon: Icons.lock_open,
            label: 'Decrypt & Preview',
            color: QuantumTheme.quantumCyan,
            onTap: () async {
              Navigator.of(context).pop();
              final decrypted =
                  await ref.read(vaultProvider.notifier).decryptFile(file);
              if (decrypted != null && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Decrypted to ${decrypted.path}'),
                    backgroundColor: QuantumTheme.quantumGreen,
                  ),
                );
              }
            },
          ),
          _ActionTile(
            icon: Icons.share,
            label: 'Share Encrypted File',
            color: QuantumTheme.quantumPurple,
            onTap: () async {
              Navigator.of(context).pop();
              await Share.shareXFiles(
                [XFile(file.filePath)],
                text: '${file.name}.pqc (ML-KEM-768 encrypted)',
              );
            },
          ),
          _ActionTile(
            icon: Icons.info_outline,
            label: 'File Info',
            color: QuantumTheme.quantumCyan,
            onTap: () {
              Navigator.of(context).pop();
              _showInfo(context);
            },
          ),
          _ActionTile(
            icon: Icons.delete_outline,
            label: 'Delete from Vault',
            color: QuantumTheme.quantumRed,
            onTap: () => _confirmDelete(context, ref),
          ),
        ],
      ),
    );
  }

  void _showInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: QuantumTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.info_outline, color: QuantumTheme.quantumCyan, size: 20),
            const SizedBox(width: 8),
            const Text('File Info'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _InfoRow('Name', file.name),
            _InfoRow('Original size', formatBytes(file.originalSize)),
            _InfoRow('Encrypted size', formatBytes(file.encryptedSize)),
            _InfoRow('Algorithm', 'ML-KEM-768 + AES-256-GCM'),
            _InfoRow('Standard', 'NIST FIPS 203'),
            _InfoRow('Encrypted', _formatDateTime(file.encryptedAt)),
            _InfoRow('ID', file.id),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: QuantumTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete file?'),
        content: Text(
          'This will permanently remove "${file.name}" from your vault. '
          'The encrypted data cannot be recovered.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop(); // close dialog
              Navigator.of(context).pop(); // close actions sheet
              ref.read(vaultProvider.notifier).deleteFile(file);
            },
            style: TextButton.styleFrom(
              foregroundColor: QuantumTheme.quantumRed,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  static String _formatDateTime(DateTime dt) {
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontFamily: 'JetBrains Mono',
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color, size: 22),
      title: Text(label,
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(fontWeight: FontWeight.w500)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      onTap: onTap,
      dense: true,
      visualDensity: VisualDensity.compact,
    );
  }
}

// ---------------------------------------------------------------------------
// Empty vault state
// ---------------------------------------------------------------------------

class _EmptyVault extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return QuantumCard(
      glowColor: QuantumTheme.quantumCyan.withValues(alpha: 0.3),
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: QuantumTheme.quantumCyan.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.shield_outlined,
              color: QuantumTheme.quantumCyan.withValues(alpha: 0.6),
              size: 32,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Your vault is empty',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Encrypt your first file with quantum-safe\n'
            'ML-KEM-768 + AES-256-GCM encryption.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.5),
                  height: 1.5,
                ),
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: null, // Hint only; the FAB is the primary action.
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Tap + to encrypt a file'),
            style: OutlinedButton.styleFrom(
              side: BorderSide(
                  color: QuantumTheme.quantumCyan.withValues(alpha: 0.3)),
              foregroundColor: QuantumTheme.quantumCyan.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Key management card (collapsible, preserves original key-gen feature)
// ---------------------------------------------------------------------------

class _KeyManagementCard extends ConsumerStatefulWidget {
  final KeypairState crypto;

  const _KeyManagementCard({required this.crypto});

  @override
  ConsumerState<_KeyManagementCard> createState() => _KeyManagementCardState();
}

class _KeyManagementCardState extends ConsumerState<_KeyManagementCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final crypto = widget.crypto;
    final notifier = ref.read(cryptoProvider.notifier);

    return QuantumCard(
      glowColor: QuantumTheme.quantumPurple.withValues(alpha: 0.5),
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          // Header (always visible)
          InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Icon(Icons.key, color: QuantumTheme.quantumPurple, size: 20),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Key Management',
                        style:
                            Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                      Text(
                        crypto.publicKey != null
                            ? 'Keypair active (${crypto.publicKey!.length}B PK)'
                            : 'No keypair generated',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color:
                                      Colors.white.withValues(alpha: 0.5),
                                  fontSize: 11,
                                ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  if (crypto.publicKey != null)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: QuantumTheme.quantumGreen,
                        shape: BoxShape.circle,
                      ),
                    ),
                  const SizedBox(width: 8),
                  AnimatedRotation(
                    turns: _expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.expand_more,
                      color: Colors.white.withValues(alpha: 0.5),
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Expanded content
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Divider(height: 1),
                  const SizedBox(height: 12),

                  ElevatedButton.icon(
                    onPressed: crypto.isGenerating
                        ? null
                        : () => notifier.generateKeypair(),
                    icon: crypto.isGenerating
                        ? const ShimmerPlaceholder(
                            width: 16, height: 16, borderRadius: 8)
                        : const Icon(Icons.key, size: 18),
                    label: Text(crypto.isGenerating
                        ? 'Generating...'
                        : 'Generate Keypair'),
                  ),

                  if (crypto.error != null) ...[
                    const SizedBox(height: 8),
                    Text(crypto.error!,
                        style: TextStyle(
                            color: QuantumTheme.quantumRed, fontSize: 12)),
                  ],

                  if (crypto.publicKey != null) ...[
                    const SizedBox(height: 12),
                    _KeyCard(
                      title: 'Public Key',
                      subtitle:
                          '${crypto.publicKey!.length} bytes (ML-KEM-768)',
                      bytes: crypto.publicKey!,
                      color: QuantumTheme.quantumCyan,
                    ),
                    const SizedBox(height: 8),
                    _KeyCard(
                      title: 'Secret Key',
                      subtitle:
                          '${crypto.secretKey!.length} bytes (zeroized on drop)',
                      bytes: crypto.secretKey!,
                      color: QuantumTheme.quantumPurple,
                      isSecret: true,
                    ),
                    const SizedBox(height: 12),
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
                      icon: const Icon(Icons.verified_outlined, size: 18),
                      label: const Text('Test KEM Roundtrip'),
                    ),
                  ],
                ],
              ),
            ),
            crossFadeState: _expanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 250),
          ),
        ],
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

// ---------------------------------------------------------------------------
// Key display card (re-used from original)
// ---------------------------------------------------------------------------

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
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: QuantumTheme.surfaceElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: widget.color.withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(widget.isSecret ? Icons.lock : Icons.key,
                  color: widget.color, size: 16),
              const SizedBox(width: 6),
              Text(widget.title,
                  style: Theme.of(context)
                      .textTheme
                      .labelLarge
                      ?.copyWith(color: widget.color)),
              const Spacer(),
              GestureDetector(
                onTap: () => setState(() => _revealed = !_revealed),
                child: Icon(
                  _revealed ? Icons.visibility_off : Icons.visibility,
                  size: 16,
                  color: widget.color.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: _hexPreview()));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${widget.title} copied')),
                  );
                },
                child: Icon(Icons.copy, size: 16,
                    color: Colors.white.withValues(alpha: 0.4)),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(widget.subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 10,
                    color: Colors.white.withValues(alpha: 0.4),
                  )),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: QuantumTheme.surfaceDark,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              !_revealed ? '** hidden **' : _hexPreview(),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    fontFamily: 'JetBrains Mono',
                    letterSpacing: 1.2,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
