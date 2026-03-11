import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 8: ZipBrowser — PQC proxy browser with privacy features.
class BrowserScreen extends StatefulWidget {
  const BrowserScreen({super.key});

  @override
  State<BrowserScreen> createState() => _BrowserScreenState();
}

class _BrowserScreenState extends State<BrowserScreen> {
  final _urlController = TextEditingController(text: 'https://');
  bool _proxyActive = false;
  bool _fingerprintProtection = true;
  bool _cookieRotation = true;
  int _selectedTab = 0;

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            // PQC badge indicator
            PqcBadge(
              label: _proxyActive ? 'PQC' : 'STD',
              color: _proxyActive ? QuantumTheme.quantumGreen : null,
              isActive: _proxyActive,
            ),
            const SizedBox(width: 8),
            // URL bar
            Expanded(
              child: TextField(
                controller: _urlController,
                style: Theme.of(context).textTheme.bodySmall,
                decoration: InputDecoration(
                  isDense: true,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  filled: true,
                  fillColor: QuantumTheme.surfaceElevated,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: BorderSide.none,
                  ),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.arrow_forward, size: 18),
                    onPressed: () {
                      // TODO: Load URL through PQC proxy
                    },
                  ),
                ),
                onSubmitted: (_) {
                  // TODO: Navigate
                },
              ),
            ),
          ],
        ),
      ),
      body: GradientBackground(
        child: Column(
          children: [
            // Tab chip row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _tabChip(0, 'New Tab', Icons.add),
                    const SizedBox(width: 8),
                    _tabChip(1, 'Search', Icons.search),
                    const SizedBox(width: 8),
                    _tabChip(2, 'Bookmarks', Icons.bookmark_outline),
                  ],
                ),
              ),
            ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.2),

            // WebView placeholder
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      PillarHeader(
                        icon: Icons.language,
                        title: 'PQC Browser',
                        subtitle: 'ML-KEM-768 TLS Proxy',
                        iconColor: QuantumTheme.quantumGreen,
                      ),

                      // PQC padlock with glow animation
                      Icon(
                        _proxyActive ? Icons.lock : Icons.lock_open,
                        size: 48,
                        color: _proxyActive
                            ? QuantumTheme.quantumGreen
                            : QuantumTheme.textSecondary,
                      )
                          .animate(
                            target: _proxyActive ? 1 : 0,
                          )
                          .scale(
                            begin: const Offset(0.9, 0.9),
                            end: const Offset(1.1, 1.1),
                          )
                          .fadeIn(),
                      const SizedBox(height: 16),

                      ElevatedButton.icon(
                        onPressed: () {
                          setState(() => _proxyActive = !_proxyActive);
                        },
                        icon: Icon(_proxyActive
                            ? Icons.shield
                            : Icons.shield_outlined),
                        label: Text(_proxyActive
                            ? 'PQC Proxy Active'
                            : 'Enable PQC Proxy'),
                      )
                          .animate()
                          .fadeIn(delay: 400.ms, duration: 400.ms),
                    ],
                  ),
                ),
              ),
            ),

            // Privacy controls
            QuantumCard(
              borderRadius: 0,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
              glowColor: QuantumTheme.quantumGreen,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _PrivacyToggle(
                    icon: Icons.fingerprint,
                    label: 'Fingerprint',
                    active: _fingerprintProtection,
                    onTap: () => setState(
                        () => _fingerprintProtection = !_fingerprintProtection),
                  ),
                  _PrivacyToggle(
                    icon: Icons.cookie_outlined,
                    label: 'Cookie Rot.',
                    active: _cookieRotation,
                    onTap: () =>
                        setState(() => _cookieRotation = !_cookieRotation),
                  ),
                  _PrivacyToggle(
                    icon: Icons.block,
                    label: 'Telemetry',
                    active: true,
                    onTap: () {},
                  ),
                ],
              ),
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
          ],
        ),
      ),
    );
  }

  Widget _tabChip(int index, String label, IconData icon) {
    final isSelected = _selectedTab == index;
    return ChoiceChip(
      avatar: Icon(icon, size: 16,
          color: isSelected ? Colors.white : QuantumTheme.quantumGreen),
      label: Text(label),
      selected: isSelected,
      selectedColor: QuantumTheme.quantumGreen.withValues(alpha: 0.3),
      side: BorderSide(
        color: isSelected
            ? QuantumTheme.quantumGreen.withValues(alpha: 0.6)
            : QuantumTheme.quantumGreen.withValues(alpha: 0.2),
      ),
      labelStyle: TextStyle(
        color: isSelected ? QuantumTheme.quantumGreen : null,
        fontWeight: isSelected ? FontWeight.w600 : null,
      ),
      onSelected: (_) => setState(() => _selectedTab = index),
    );
  }
}

class _PrivacyToggle extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _PrivacyToggle({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: QuantumCard(
        glowColor: active ? QuantumTheme.quantumGreen : null,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        borderRadius: 12,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: active
                  ? QuantumTheme.quantumGreen
                  : QuantumTheme.textSecondary,
              size: 20,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: active
                        ? QuantumTheme.quantumGreen
                        : QuantumTheme.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
