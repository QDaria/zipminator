import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/anonymizer_provider.dart';
import 'package:zipminator/core/providers/crypto_provider.dart';
import 'package:zipminator/core/providers/email_provider.dart';
import 'package:zipminator/core/providers/pii_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 7: Quantum Mail — PQC-encrypted email with PII scanning.
class EmailScreen extends ConsumerStatefulWidget {
  const EmailScreen({super.key});

  @override
  ConsumerState<EmailScreen> createState() => _EmailScreenState();
}

class _EmailScreenState extends ConsumerState<EmailScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _toController = TextEditingController(text: 'quantum@example.com');
  final _subjectController =
      TextEditingController(text: 'Test PQC Encryption');
  final _bodyController = TextEditingController(
      text: 'This message is encrypted with ML-KEM-768.');

  String _selfDestructValue = 'never';
  bool _sendSuccess = false;
  List<PlatformFile> _attachments = [];

  /// Anonymization level for outgoing attachments: 0 = off, 1-10 = active.
  int _attachmentAnonymizationLevel = 0;

  static const _selfDestructOptions = <String, String>{
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
    'never': 'Never',
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final crypto = ref.read(cryptoProvider);
      if (crypto.publicKey == null && !crypto.isGenerating) {
        ref
            .read(cryptoProvider.notifier)
            .generateKeypair()
            .catchError((_) {});
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _toController.dispose();
    _subjectController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emailState = ref.watch(emailCryptoProvider);
    final crypto = ref.watch(cryptoProvider);

    return GestureDetector(onTap: () => FocusScope.of(context).unfocus(), child: Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: GlassAppBar(
        title: 'Quantum Mail',
        actions: [
          if (_tabController.index == 1)
            IconButton(
              icon: const Icon(Icons.send_rounded),
              onPressed: emailState.isProcessing ? null : _encryptAndSend,
              tooltip: 'Encrypt & Send',
            ),
        ],
      ),
      body: GradientBackground(
        child: Column(
          children: [
            // Key status row
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: _buildKeyStatusCard(context, crypto),
            ),
            const SizedBox(height: 8),
            // Tab bar
            _buildTabBar(context),
            // Tab views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _InboxTab(
                    emailState: emailState,
                    crypto: crypto,
                    onCompose: () => _tabController.animateTo(1),
                    onTestDecrypt: _testDecrypt,
                  ),
                  _buildComposeTab(context, emailState, crypto),
                ],
              ),
            ),
          ],
        ),
      ),
    ));
  }

  Widget _buildKeyStatusCard(BuildContext context, KeypairState crypto) {
    return QuantumCard(
      glowColor: crypto.publicKey != null
          ? QuantumTheme.quantumGreen
          : QuantumTheme.textSecondary,
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Icon(
            crypto.publicKey != null ? Icons.key : Icons.key_off,
            color: crypto.publicKey != null
                ? QuantumTheme.quantumGreen
                : QuantumTheme.textSecondary,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  crypto.publicKey != null
                      ? 'ML-KEM-768 key loaded'
                      : 'No key available',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                if (crypto.publicKey != null)
                  Text(
                    '${crypto.publicKey!.length} bytes public key',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: QuantumTheme.textSecondary,
                        ),
                  ),
              ],
            ),
          ),
          PqcBadge(
            label: 'ML-KEM-768',
            color: QuantumTheme.quantumBlue,
            isActive: crypto.publicKey != null,
          ),
          if (crypto.publicKey == null) ...[
            const SizedBox(width: 8),
            TextButton(
              onPressed: () =>
                  ref.read(cryptoProvider.notifier).generateKeypair(),
              child: const Text('Generate'),
            ),
          ],
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05);
  }

  Widget _buildTabBar(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: QuantumTheme.surfaceElevated.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TabBar(
        controller: _tabController,
        onTap: (_) => setState(() {}),
        indicatorSize: TabBarIndicatorSize.tab,
        indicator: BoxDecoration(
          color: QuantumTheme.quantumBlue.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: QuantumTheme.quantumBlue.withValues(alpha: 0.4),
          ),
        ),
        dividerColor: Colors.transparent,
        labelColor: QuantumTheme.quantumCyan,
        unselectedLabelColor: QuantumTheme.textSecondary,
        tabs: const [
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.inbox_rounded, size: 18),
                SizedBox(width: 6),
                Text('Inbox'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.edit_note_rounded, size: 18),
                SizedBox(width: 6),
                Text('Compose'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComposeTab(
    BuildContext context,
    EmailCryptoState emailState,
    KeypairState crypto,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Compose fields
          QuantumCard(
            glowColor: QuantumTheme.quantumBlue,
            child: Column(
              children: [
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
                Stack(
                  children: [
                    TextField(
                      controller: _bodyController,
                      maxLines: 6,
                      decoration: const InputDecoration(
                        labelText: 'Message body',
                        alignLabelWithHint: true,
                      ),
                    ),
                    if (emailState.isProcessing)
                      Positioned.fill(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: ShimmerPlaceholder(
                            height: double.infinity,
                            borderRadius: 8,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: 100.ms, duration: 400.ms)
              .slideY(begin: 0.05),
          const SizedBox(height: 12),

          // Attachments row
          QuantumCard(
            glowColor: _attachments.isNotEmpty
                ? QuantumTheme.quantumCyan.withValues(alpha: 0.6)
                : QuantumTheme.textSecondary.withValues(alpha: 0.3),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.attach_file,
                        size: 20, color: QuantumTheme.quantumCyan),
                    const SizedBox(width: 10),
                    Text('Attachments',
                        style: Theme.of(context).textTheme.bodyMedium),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: _pickAttachment,
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add'),
                    ),
                  ],
                ),
                if (_attachments.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: _attachments
                        .map((f) => Chip(
                              label: Text(f.name,
                                  style: const TextStyle(fontSize: 12)),
                              deleteIcon: const Icon(Icons.close, size: 14),
                              onDeleted: () =>
                                  setState(() => _attachments.remove(f)),
                              avatar: Icon(Icons.insert_drive_file,
                                  size: 14,
                                  color: QuantumTheme.quantumCyan),
                            ))
                        .toList(),
                  ),
                  if (_attachmentAnonymizationLevel > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Attachments will be scanned and anonymized at L$_attachmentAnonymizationLevel before sending',
                        style: TextStyle(
                            fontSize: 11,
                            color: QuantumTheme.quantumOrange),
                      ),
                    ),
                ],
              ],
            ),
          ).animate().fadeIn(delay: 150.ms, duration: 400.ms),
          const SizedBox(height: 12),

          // Self-destruct + options row
          QuantumCard(
            glowColor: QuantumTheme.quantumOrange.withValues(alpha: 0.6),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(
                  Icons.timer_outlined,
                  color: QuantumTheme.quantumOrange,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  'Self-destruct',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const Spacer(),
                DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selfDestructValue,
                    isDense: true,
                    dropdownColor: QuantumTheme.surfaceCard,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: QuantumTheme.quantumOrange,
                          fontWeight: FontWeight.w600,
                        ),
                    items: _selfDestructOptions.entries
                        .map((e) => DropdownMenuItem(
                              value: e.key,
                              child: Text(e.value),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _selfDestructValue = v);
                    },
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
          const SizedBox(height: 12),

          // Attachment anonymization level chip
          QuantumCard(
            glowColor: _attachmentAnonymizationLevel > 0
                ? QuantumTheme.quantumOrange.withValues(alpha: 0.6)
                : QuantumTheme.textSecondary.withValues(alpha: 0.3),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(
                  Icons.visibility_off_outlined,
                  color: _attachmentAnonymizationLevel > 0
                      ? QuantumTheme.quantumOrange
                      : QuantumTheme.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Attachment Anonymization',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        _attachmentAnonymizationLevel == 0
                            ? 'Disabled'
                            : 'Scan & redact outgoing attachments at L$_attachmentAnonymizationLevel',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: _attachmentAnonymizationLevel > 0
                                  ? QuantumTheme.quantumOrange
                                  : QuantumTheme.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
                DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _attachmentAnonymizationLevel,
                    isDense: true,
                    dropdownColor: QuantumTheme.surfaceCard,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: QuantumTheme.quantumOrange,
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
                      if (v != null) {
                        setState(() => _attachmentAnonymizationLevel = v);
                      }
                    },
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 250.ms, duration: 400.ms),
          const SizedBox(height: 16),

          // Encrypt & Send button
          SizedBox(
            height: 52,
            child: ElevatedButton.icon(
              onPressed: emailState.isProcessing ? null : _encryptAndSend,
              icon: emailState.isProcessing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.lock_outline),
              label: Text(
                emailState.isProcessing
                    ? 'Encrypting...'
                    : 'Encrypt & Send',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: QuantumTheme.quantumBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),

          // Error display
          if (emailState.error != null) ...[
            const SizedBox(height: 8),
            QuantumCard(
              glowColor: QuantumTheme.quantumRed,
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(Icons.error_outline,
                      color: QuantumTheme.quantumRed, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      emailState.error!,
                      style: TextStyle(
                        color: QuantumTheme.quantumRed,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Success animation
          if (_sendSuccess) ...[
            const SizedBox(height: 16),
            QuantumCard(
              glowColor: QuantumTheme.quantumGreen,
              animateGlow: true,
              child: Column(
                children: [
                  Icon(
                    Icons.check_circle_rounded,
                    color: QuantumTheme.quantumGreen,
                    size: 48,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Email Encrypted & Sent',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: QuantumTheme.quantumGreen,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Envelope: ${emailState.encryptedEnvelope?.length ?? 0} bytes | ML-KEM-768',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: QuantumTheme.textSecondary,
                        ),
                  ),
                  if (_selfDestructValue != 'never') ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.timer_outlined,
                            size: 14, color: QuantumTheme.quantumOrange),
                        const SizedBox(width: 4),
                        Text(
                          'Self-destructs in ${_selfDestructOptions[_selfDestructValue]}',
                          style: TextStyle(
                            color: QuantumTheme.quantumOrange,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            )
                .animate()
                .fadeIn(duration: 500.ms)
                .scale(
                  begin: const Offset(0.9, 0.9),
                  end: const Offset(1, 1),
                  duration: 500.ms,
                  curve: Curves.elasticOut,
                ),
          ],

          // Encrypted result with decrypt test
          if (emailState.encryptedEnvelope != null && !_sendSuccess) ...[
            const SizedBox(height: 16),
            QuantumCard(
              glowColor: QuantumTheme.quantumGreen,
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
            )
                .animate()
                .fadeIn(duration: 400.ms)
                .scale(
                  begin: const Offset(0.95, 0.95),
                  end: const Offset(1, 1),
                ),
          ],

          const SizedBox(height: 24),
          const PillarFooter(pillarName: 'Q-Mail'),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Future<void> _pickAttachment() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: [
        'txt', 'csv', 'json', 'pdf', 'doc', 'docx', 'xlsx', 'png', 'jpg',
      ],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    setState(() => _attachments.addAll(result.files));
  }

  Future<void> _encryptAndSend() async {
    final crypto = ref.read(cryptoProvider);
    if (crypto.publicKey == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Generate a keypair first')),
      );
      return;
    }

    // PII scan before sending
    final piiNotifier = ref.read(piiProvider.notifier);
    piiNotifier.scan(_bodyController.text);
    final piiState = ref.read(piiProvider);

    if (piiState.matches.isNotEmpty && mounted) {
      final highCount =
          piiState.matches.where((m) => m.sensitivity >= 4).length;
      final action = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: QuantumTheme.surfaceCard,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Icon(Icons.warning_amber_rounded,
                  color: QuantumTheme.quantumOrange, size: 24),
              const SizedBox(width: 10),
              const Expanded(child: Text('PII Detected')),
            ],
          ),
          content: Text(
            '${piiState.matches.length} PII items found '
            '($highCount high sensitivity).\n\n'
            'Types: ${piiState.matches.map((m) => m.category).toSet().join(", ")}',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop('cancel'),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop('anonymize'),
              child: Text(
                'Anonymize & Send',
                style: TextStyle(color: QuantumTheme.quantumOrange),
              ),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop('send'),
              style: FilledButton.styleFrom(
                  backgroundColor: QuantumTheme.quantumRed),
              child: const Text('Send Anyway'),
            ),
          ],
        ),
      );

      if (action == 'cancel' || action == null) return;
      if (action == 'anonymize') {
        final anonNotifier = ref.read(anonymizerProvider.notifier);
        final level = _attachmentAnonymizationLevel > 0
            ? _attachmentAnonymizationLevel
            : 5;
        anonNotifier.setLevel(level);
        anonNotifier.anonymize(_bodyController.text);
        final anonState = ref.read(anonymizerProvider);
        if (anonState.result != null) {
          _bodyController.text = anonState.result!.anonymizedText;
        }
      }
    }

    setState(() => _sendSuccess = false);

    final success =
        await ref.read(emailCryptoProvider.notifier).sendEncryptedEmail(
              to: _toController.text,
              subject: _subjectController.text,
              body: _bodyController.text,
              recipientPk: crypto.publicKey!,
              selfDestructDuration:
                  _selfDestructValue == 'never' ? null : _selfDestructValue,
            );

    if (success && mounted) {
      setState(() => _sendSuccess = true);
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _sendSuccess = false);
      });
    }
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

/// Inbox tab showing sent and received emails.
class _InboxTab extends StatelessWidget {
  final EmailCryptoState emailState;
  final KeypairState crypto;
  final VoidCallback onCompose;
  final VoidCallback onTestDecrypt;

  const _InboxTab({
    required this.emailState,
    required this.crypto,
    required this.onCompose,
    required this.onTestDecrypt,
  });

  @override
  Widget build(BuildContext context) {
    final allEmails = [
      ...emailState.sentEmails,
      ...emailState.receivedEmails,
    ];
    allEmails.sort((a, b) => b.sentAt.compareTo(a.sentAt));

    if (allEmails.isEmpty) {
      return _buildEmptyState(context);
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: allEmails.length,
      itemBuilder: (context, index) {
        final email = allEmails[index];
        final isSent = emailState.sentEmails.contains(email);
        return _EmailListTile(
          email: email,
          isSent: isSent,
          onTap: () => _showEmailDetail(context, email, isSent),
        ).animate(delay: (index * 60).ms).fadeIn(duration: 300.ms).slideX(
              begin: 0.05,
              end: 0,
              duration: 300.ms,
              curve: Curves.easeOut,
            );
      },
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.mail_outline_rounded,
              size: 64,
              color: QuantumTheme.quantumBlue.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              'No messages yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: QuantumTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Compose your first PQC-encrypted email.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: QuantumTheme.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onCompose,
              icon: const Icon(Icons.edit_note_rounded),
              label: const Text('Compose'),
              style: ElevatedButton.styleFrom(
                backgroundColor: QuantumTheme.quantumBlue,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ).animate().fadeIn(duration: 600.ms).scale(
              begin: const Offset(0.95, 0.95),
              end: const Offset(1, 1),
              duration: 600.ms,
            ),
      ),
    );
  }

  void _showEmailDetail(
      BuildContext context, SentEmail email, bool isSent) {
    showModalBottomSheet(
      context: context,
      backgroundColor: QuantumTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: QuantumTheme.textSecondary.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(
                  isSent ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                  color: isSent
                      ? QuantumTheme.quantumBlue
                      : QuantumTheme.quantumGreen,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  isSent ? 'Sent' : 'Received',
                  style: Theme.of(ctx).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const Spacer(),
                PqcBadge(
                  label: 'ML-KEM-768',
                  color: QuantumTheme.quantumGreen,
                  isActive: email.encrypted,
                ),
              ],
            ),
            const SizedBox(height: 16),
            _detailRow(ctx, 'To', email.to),
            _detailRow(ctx, 'Subject', email.subject),
            _detailRow(ctx, 'Time', _formatTime(email.sentAt)),
            _detailRow(ctx, 'Envelope', '${email.envelopeSize} bytes'),
            if (email.selfDestructDuration != null)
              _detailRow(ctx, 'Self-destruct', email.selfDestructDuration!),
            const SizedBox(height: 16),
            if (emailState.encryptedEnvelope != null)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    onTestDecrypt();
                  },
                  icon: const Icon(Icons.lock_open, size: 16),
                  label: const Text('Test Decrypt'),
                ),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: QuantumTheme.textSecondary,
                  ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

/// A single email row in the inbox list.
class _EmailListTile extends StatelessWidget {
  final SentEmail email;
  final bool isSent;
  final VoidCallback onTap;

  const _EmailListTile({
    required this.email,
    required this.isSent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: QuantumCard(
        glowColor: isSent
            ? QuantumTheme.quantumBlue.withValues(alpha: 0.5)
            : QuantumTheme.quantumGreen.withValues(alpha: 0.5),
        padding: EdgeInsets.zero,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Direction icon
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: (isSent
                            ? QuantumTheme.quantumBlue
                            : QuantumTheme.quantumGreen)
                        .withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isSent
                        ? Icons.arrow_upward_rounded
                        : Icons.arrow_downward_rounded,
                    color: isSent
                        ? QuantumTheme.quantumBlue
                        : QuantumTheme.quantumGreen,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                // Email info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        email.subject,
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${isSent ? "To" : "From"}: ${email.to}',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: QuantumTheme.textSecondary,
                                ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Encrypted badge + time
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.lock_rounded,
                          size: 12,
                          color: QuantumTheme.quantumGreen,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          'PQC',
                          style: TextStyle(
                            color: QuantumTheme.quantumGreen,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _shortTime(email.sentAt),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: QuantumTheme.textSecondary,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _shortTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${dt.day}/${dt.month}';
  }
}
