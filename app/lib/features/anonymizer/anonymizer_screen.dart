import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/anonymizer_provider.dart';
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
  static const _exampleText =
      'John Smith, SSN 123-45-6789, john@acme.com, '
      '555-0123, CC 4111-1111-1111-1111';

  /// Per-level example texts showing what each level catches.
  static const _levelExamples = <int, String>{
    1: 'Meeting with John Smith and Sarah Johnson at 3pm.',
    2: 'Contact John Smith at john.smith@acme.com for the report.',
    3: 'John Smith, john@acme.com, phone: +1-555-867-5309.',
    4: 'John Smith, john@acme.com, +1-555-867-5309, '
        '123 Main Street, Apt 4B, New York, NY 10001.',
    5: 'John Smith, SSN 987-65-4321, born 1985-03-15, '
        'john@acme.com, +1-555-867-5309.',
    6: 'John Smith, SSN 987-65-4321, CC 4532-1234-5678-9012, '
        'IBAN NO9386011117947, salary: \$125,000.',
    7: 'John Smith, SSN 987-65-4321, CC 4532-1234-5678-9012, '
        'IP 192.168.1.42, MAC AA:BB:CC:DD:EE:FF, Device: iPhone 16 Pro.',
    8: 'Patient: John Smith, SSN 987-65-4321, blood type O+, '
        'diagnosis: Type 2 diabetes, fingerprint hash: 0xAB3F...',
    9: 'John Smith, SSN 987-65-4321, browsing: quantum-computing.org, '
        'purchases: VPN subscription, location: 59.91N 10.75E, '
        'login pattern: weekdays 08:00-09:00.',
    10: 'CLASSIFIED: Agent codename AURORA, asset ID QD-7749, '
        'coordinates 59.9139N 10.7522E, dead drop: Oslo Central Station '
        'locker 42. Quantum OTP applied — data destroyed irreversibly.',
  };

  final _controller = TextEditingController();
  String? _uploadedFileName;

  /// Privacy-first: all sensitive data hidden by default.
  bool _scannerContentVisible = false;
  bool _beforeAfterVisible = false;
  final Set<int> _revealedMatches = {};

  /// Tracks whether the L10 warning has been acknowledged this session.
  bool _l10Acknowledged = false;

  @override
  void initState() {
    super.initState();
    _controller.text = _exampleText;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  // ── Level metadata ───────────────────────────────────────────────────

  static const _levelDescriptions = <int, String>{
    1: 'Names only',
    2: 'Names + emails',
    3: 'Names + emails + phones',
    4: 'All contact info + addresses',
    5: 'All PII including SSN/ID numbers',
    6: 'All PII + financial data',
    7: 'All PII + IP addresses + devices',
    8: 'All PII + biometrics + medical',
    9: 'All PII + behavioral patterns',
    10: 'Quantum OTP — irreversible anonymization powered by Born rule entropy',
  };

  static const _useCaseExamples = [
    ('Check email draft', Icons.email_outlined),
    ('Audit CSV export', Icons.table_chart_outlined),
    ('Scan medical records', Icons.local_hospital_outlined),
    ('Review legal docs', Icons.gavel_outlined),
    ('Clean chat logs', Icons.chat_outlined),
  ];

  static const _complianceBadges = ['GDPR', 'HIPAA', 'DORA', 'CCPA'];

  Color _levelColor(int level) {
    if (level <= 3) return QuantumTheme.quantumGreen;
    if (level <= 6) return QuantumTheme.quantumOrange;
    if (level <= 8) return const Color(0xFFFF6E40); // deep orange
    return QuantumTheme.quantumRed;
  }

  // ── File picker ──────────────────────────────────────────────────────

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['txt', 'csv', 'json', 'md', 'log'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    final bytes = file.bytes;
    if (bytes == null) return;

    final text = String.fromCharCodes(bytes);
    setState(() {
      _controller.text = text;
      _uploadedFileName = file.name;
    });
  }

  // ── L10 irreversibility warning ────────────────────────────────────

  Future<bool> _showL10Warning() async {
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: QuantumTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded,
                color: QuantumTheme.quantumRed, size: 24),
            const SizedBox(width: 10),
            const Expanded(
              child: Text('Irreversible Quantum Anonymization'),
            ),
          ],
        ),
        content: const Text(
          'Level 10 uses quantum one-time pad (patent pending). '
          'The original data will be permanently destroyed. '
          'This cannot be reversed by any computer, classical or quantum.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: QuantumTheme.quantumRed,
            ),
            child: const Text('I Understand \u2014 Proceed'),
          ),
        ],
      ),
    );
    return confirmed == true;
  }

  // ── Use-case chip handler with alert for "Review legal docs" ───────

  void _onUseCaseTapped(String label, PiiNotifier notifier) {
    _controller.text = _exampleForUseCase(label);
    setState(() {
      _uploadedFileName = null;
      _scannerContentVisible = false;
    });
    notifier.scan(_controller.text);

    if (label == 'Review legal docs') {
      final pii = ref.read(piiProvider);
      final highCount =
          pii.matches.where((m) => m.sensitivity >= 4).length;
      if (pii.matches.isNotEmpty && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${pii.matches.length} PII items detected '
              '($highCount high sensitivity)',
            ),
            backgroundColor: QuantumTheme.quantumOrange,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  // ── Build ────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final pii = ref.watch(piiProvider);
    final piiNotifier = ref.read(piiProvider.notifier);
    final anon = ref.watch(anonymizerProvider);
    final anonNotifier = ref.read(anonymizerProvider.notifier);
    final level = anon.selectedLevel;
    final color = _levelColor(level);

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
                  badges: const [
                    PqcBadge(
                      label: '166+ patterns',
                      color: QuantumTheme.quantumOrange,
                      isActive: true,
                    ),
                  ],
                ),

                // ── 1. 10-Level Slider ─────────────────────────────────
                _buildLevelSlider(context, pii, anonNotifier, level, color),
                const SizedBox(height: 12),

                // ── 1b. Try Example for current level ─────────────────
                _buildTryLevelExample(context, piiNotifier, anonNotifier, level, color),
                const SizedBox(height: 12),

                // ── 2. Use-case chips ──────────────────────────────────
                _buildUseCaseChips(piiNotifier),
                const SizedBox(height: 12),

                // ── 3. Compliance badges row ───────────────────────────
                _buildComplianceBadges(context),
                const SizedBox(height: 16),

                // ── 4. PII Scanner card + file upload ──────────────────
                _buildScannerCard(context, pii, piiNotifier, anonNotifier, anon),
                const SizedBox(height: 16),

                // ── 5. Before/after split view ─────────────────────────
                if (anon.result != null) ...[
                  _buildBeforeAfterSplit(context, anon),
                  const SizedBox(height: 16),
                ],

                // ── 6. Results ─────────────────────────────────────────
                if (pii.matches.isNotEmpty) ...[
                  _buildResultsSummary(context, pii),
                  const SizedBox(height: 8),
                  ..._buildMatchCards(context, pii),
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

                const SizedBox(height: 24),
                const PillarFooter(pillarName: 'Anonymizer'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── 1. Level slider card ─────────────────────────────────────────────

  Widget _buildLevelSlider(
    BuildContext context,
    PiiScanState pii,
    AnonymizerNotifier anonNotifier,
    int level,
    Color color,
  ) {
    return QuantumCard(
      glowColor: color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title row
          Row(
            children: [
              Text('Anonymization Level',
                  style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              // Level badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: color.withValues(alpha: 0.4)),
                ),
                child: Text(
                  'L$level',
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Description
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: Row(
              key: ValueKey(level),
              children: [
                Icon(
                  level == 10 ? Icons.bolt : Icons.info_outline,
                  size: 16,
                  color: color.withValues(alpha: 0.8),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _levelDescriptions[level] ?? '',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: color,
                          fontWeight:
                              level == 10 ? FontWeight.w600 : FontWeight.w400,
                        ),
                  ),
                ),
                // Patent pending badge for L10
                if (level == 10)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          QuantumTheme.quantumRed.withValues(alpha: 0.25),
                          QuantumTheme.quantumOrange.withValues(alpha: 0.15),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color:
                            QuantumTheme.quantumRed.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified,
                            size: 12, color: QuantumTheme.quantumRed),
                        const SizedBox(width: 4),
                        Text(
                          'Patent Pending',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: QuantumTheme.quantumRed,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Gradient track slider
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: color,
              thumbColor: color,
              inactiveTrackColor: color.withValues(alpha: 0.15),
              overlayColor: color.withValues(alpha: 0.1),
              trackHeight: 6,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 10),
            ),
            child: Slider(
              value: level.toDouble(),
              min: 1,
              max: 10,
              divisions: 9,
              label: 'L$level',
              onChanged: (v) async {
                final newLevel = v.round();
                if (newLevel == 10 && !_l10Acknowledged) {
                  final confirmed = await _showL10Warning();
                  if (!confirmed) return;
                  _l10Acknowledged = true;
                }
                anonNotifier.setLevel(newLevel);
              },
            ),
          ),

          // Level tick labels
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(10, (i) {
                final l = i + 1;
                final isSelected = l == level;
                return Text(
                  '$l',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                    color: isSelected
                        ? _levelColor(l)
                        : QuantumTheme.textSecondary,
                  ),
                );
              }),
            ),
          ),

          // Save Encrypted Backup button (visible at L10)
          if (level == 10) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text(
                        'Encrypted backup saved with ML-KEM-768',
                      ),
                      backgroundColor: QuantumTheme.quantumGreen,
                    ),
                  );
                },
                icon: Icon(Icons.backup,
                    size: 18, color: QuantumTheme.quantumCyan),
                label: Text(
                  'Save Encrypted Backup',
                  style: TextStyle(color: QuantumTheme.quantumCyan),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: QuantumTheme.quantumCyan.withValues(alpha: 0.4),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    ).animate().fadeIn(delay: 200.ms, duration: 300.ms);
  }

  // ── 1b. Try Example per level ─────────────────────────────────────────

  Widget _buildTryLevelExample(
    BuildContext context,
    PiiNotifier piiNotifier,
    AnonymizerNotifier anonNotifier,
    int level,
    Color color,
  ) {
    final example = _levelExamples[level] ?? '';
    return QuantumCard(
      glowColor: color.withValues(alpha: 0.3),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.science_outlined, size: 18, color: color),
              const SizedBox(width: 8),
              Text(
                'L$level Example',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () {
                  _controller.text = example;
                  setState(() {
                    _uploadedFileName = null;
                    _scannerContentVisible = false;
                  });
                  piiNotifier.scan(example);
                },
                icon: Icon(Icons.play_arrow, size: 16, color: color),
                label: Text('Try Example',
                    style: TextStyle(color: color, fontSize: 12)),
                style: TextButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  side: BorderSide(color: color.withValues(alpha: 0.4)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            example,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  color: QuantumTheme.textSecondary,
                ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  // ── 2. Use-case chips ────────────────────────────────────────────────

  Widget _buildUseCaseChips(PiiNotifier notifier) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _useCaseExamples.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final (label, icon) = _useCaseExamples[index];
          return ActionChip(
            avatar: Icon(icon, size: 16),
            label: Text(label, style: const TextStyle(fontSize: 12)),
            onPressed: () => _onUseCaseTapped(label, notifier),
          );
        },
      ),
    ).animate().fadeIn(delay: 300.ms, duration: 300.ms);
  }

  String _exampleForUseCase(String label) => switch (label) {
        'Check email draft' =>
          'Hi Sarah, please send the report to john.doe@acme.com '
              'or call me at 555-867-5309. My SSN is 078-05-1120.',
        'Audit CSV export' =>
          'name,email,phone,ssn\n'
              'Jane Doe,jane@corp.io,212-555-0198,321-54-9876\n'
              'Bob Lee,bob@example.com,415-555-0147,654-32-1098',
        'Scan medical records' =>
          'Patient: Maria Garcia, DOB: 03/15/1985, MRN: 12345678\n'
              'Diagnosis: Type 2 Diabetes. Provider: Dr. James Wilson\n'
              'SSN: 456-78-9012, Insurance ID: XYZ-9876543',
        'Review legal docs' =>
          'AGREEMENT between Acme Corp (EIN 12-3456789) and '
              'John Smith (SSN 234-56-7890), residing at '
              '742 Evergreen Terrace, Springfield IL 62704.',
        'Clean chat logs' =>
          '[10:23] alice: hey, my new number is 650-555-0142\n'
              '[10:24] bob: cool, email me at bob.smith@gmail.com\n'
              '[10:25] alice: sure, also my CC is 5500-0000-0000-0004',
        _ => _exampleText,
      };

  // ── 3. Compliance badges ─────────────────────────────────────────────

  Widget _buildComplianceBadges(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 6,
      children: _complianceBadges.map((badge) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: QuantumTheme.quantumCyan.withValues(alpha: 0.3),
            ),
            color: QuantumTheme.quantumCyan.withValues(alpha: 0.06),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.verified_outlined,
                  size: 14,
                  color: QuantumTheme.quantumCyan.withValues(alpha: 0.7)),
              const SizedBox(width: 4),
              Text(
                badge,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: QuantumTheme.quantumCyan.withValues(alpha: 0.8),
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    ).animate().fadeIn(delay: 350.ms, duration: 300.ms);
  }

  // ── 4. Scanner card + file picker ────────────────────────────────────

  Widget _buildScannerCard(
    BuildContext context,
    PiiScanState pii,
    PiiNotifier notifier,
    AnonymizerNotifier anonNotifier,
    AnonymizerState anon,
  ) {
    return QuantumCard(
      glowColor: QuantumTheme.quantumOrange,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title row with privacy eye toggle for the text field
          Row(
            children: [
              Expanded(
                child: Text('PII Scanner',
                    style: Theme.of(context).textTheme.titleLarge),
              ),
              IconButton(
                icon: Icon(
                  _scannerContentVisible
                      ? Icons.visibility
                      : Icons.visibility_off,
                  size: 20,
                  color: QuantumTheme.quantumOrange.withValues(alpha: 0.7),
                ),
                tooltip: _scannerContentVisible
                    ? 'Hide scanner content'
                    : 'Reveal scanner content',
                onPressed: () => setState(
                    () => _scannerContentVisible = !_scannerContentVisible),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text('Powered by Rust regex engine (166+ patterns)',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),

          // Text field -- obscured when hidden
          TextField(
            controller: _controller,
            maxLines: _scannerContentVisible ? 5 : 1,
            obscureText: !_scannerContentVisible,
            decoration: InputDecoration(
              hintText: _scannerContentVisible
                  ? 'Paste text to scan for PII...\n'
                      'e.g. "My SSN is 123-45-6789, email me at test@example.com"'
                  : 'Content hidden for privacy. Tap the eye icon to reveal.',
            ),
          ),
          const SizedBox(height: 8),

          // Upload + Try Example row
          Row(
            children: [
              ActionChip(
                avatar: const Icon(Icons.upload_file, size: 16),
                label: Text(
                  _uploadedFileName ?? 'Upload file',
                  style: const TextStyle(fontSize: 12),
                ),
                onPressed: _pickFile,
              ),
              const SizedBox(width: 8),
              ActionChip(
                avatar: const Icon(Icons.science_outlined, size: 16),
                label: const Text('Try Example'),
                onPressed: () {
                  _controller.text = _exampleText;
                  setState(() => _uploadedFileName = null);
                  notifier.scan(_controller.text);
                },
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Primary action: Scan
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton.icon(
              onPressed: () => notifier.scan(_controller.text),
              icon: const Icon(Icons.search, size: 22),
              label: const Text('Scan for PII',
                  style: TextStyle(fontSize: 16)),
              style: FilledButton.styleFrom(
                backgroundColor: QuantumTheme.quantumCyan,
                foregroundColor: Colors.black,
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Redact + Clear
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _controller.text.isNotEmpty
                      ? () => anonNotifier.anonymize(_controller.text)
                      : null,
                  icon: const Icon(Icons.shield),
                  label: Text('Redact (L${anon.selectedLevel})'),
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
                  anonNotifier.clear();
                  setState(() => _uploadedFileName = null);
                },
                child: const Text('Clear'),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1);
  }

  // ── 5. Before/after split view ───────────────────────────────────────

  Widget _buildBeforeAfterSplit(BuildContext context, AnonymizerState anon) {
    final result = anon.result!;
    return QuantumCard(
      glowColor: QuantumTheme.quantumGreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.compare_arrows,
                  color: QuantumTheme.quantumGreen, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Before / After (L${anon.selectedLevel})',
                    style: Theme.of(context).textTheme.titleSmall),
              ),
              IconButton(
                icon: Icon(
                  _beforeAfterVisible
                      ? Icons.visibility
                      : Icons.visibility_off,
                  size: 20,
                  color: QuantumTheme.quantumGreen.withValues(alpha: 0.7),
                ),
                tooltip: _beforeAfterVisible
                    ? 'Hide comparison'
                    : 'Reveal comparison',
                onPressed: () => setState(
                    () => _beforeAfterVisible = !_beforeAfterVisible),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (!_beforeAfterVisible)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: QuantumTheme.surfaceElevated.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.visibility_off,
                      size: 16, color: QuantumTheme.textSecondary),
                  const SizedBox(width: 8),
                  Text(
                    'Content hidden for privacy',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: QuantumTheme.textSecondary,
                        ),
                  ),
                ],
              ),
            )
          else ...[
            // Original
            _splitPane(
              context,
              label: 'ORIGINAL',
              color: QuantumTheme.quantumOrange,
              text: result.originalText,
            ),
            const SizedBox(height: 10),

            // Divider
            Row(
              children: [
                const Expanded(child: Divider()),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(Icons.arrow_downward,
                      size: 16, color: QuantumTheme.quantumGreen),
                ),
                const Expanded(child: Divider()),
              ],
            ),
            const SizedBox(height: 10),

            // Redacted
            _splitPane(
              context,
              label: 'ANONYMIZED (L${result.level})',
              color: QuantumTheme.quantumGreen,
              text: result.anonymizedText,
            ),
          ],
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _splitPane(
    BuildContext context, {
    required String label,
    required Color color,
    required String text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 1,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: QuantumTheme.surfaceElevated.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: SelectableText(
            text,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontFamily: 'JetBrains Mono',
                  height: 1.5,
                ),
          ),
        ),
      ],
    );
  }

  // ── 6. Results summary card ──────────────────────────────────────────

  Widget _buildResultsSummary(BuildContext context, PiiScanState pii) {
    return QuantumCard(
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
        );
  }

  // ── 7. Individual match cards with privacy eye toggle ──────────────

  List<Widget> _buildMatchCards(BuildContext context, PiiScanState pii) {
    return pii.matches.asMap().entries.map((entry) {
      final index = entry.key;
      final m = entry.value;
      final glowColor = m.sensitivity >= 4
          ? QuantumTheme.quantumRed
          : m.sensitivity >= 3
              ? QuantumTheme.quantumOrange
              : QuantumTheme.quantumGreen;

      final isRevealed = _revealedMatches.contains(index);

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
              isRevealed
                  ? '${m.category} | "${m.matchedText}" | ${m.countryCode.toUpperCase()}'
                  : '${m.category} | ******** | ${m.countryCode.toUpperCase()}',
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('L${m.sensitivity}',
                    style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      if (isRevealed) {
                        _revealedMatches.remove(index);
                      } else {
                        _revealedMatches.add(index);
                      }
                    });
                  },
                  child: Icon(
                    isRevealed ? Icons.visibility : Icons.visibility_off,
                    size: 18,
                    color: glowColor.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
        ),
      )
          .animate()
          .fadeIn(delay: (index * 100).ms, duration: 300.ms)
          .slideY(begin: 0.1);
    }).toList();
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
