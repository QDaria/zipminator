import 'package:flutter/material.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

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
            // PQC indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: _proxyActive
                    ? QuantumTheme.quantumGreen.withValues(alpha: 0.2)
                    : QuantumTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _proxyActive ? Icons.lock : Icons.lock_open,
                    size: 14,
                    color: _proxyActive
                        ? QuantumTheme.quantumGreen
                        : QuantumTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _proxyActive ? 'PQC' : 'STD',
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                ],
              ),
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
      body: Column(
        children: [
          // WebView placeholder (requires webview_flutter package)
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.language,
                      size: 64, color: QuantumTheme.quantumGreen),
                  const SizedBox(height: 16),
                  Text('PQC Privacy Browser',
                      style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text(
                    'WebView routes through local Rust proxy\n'
                    'for ML-KEM-768 TLS interception',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 24),
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
                  ),
                ],
              ),
            ),
          ),

          // Privacy controls
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: QuantumTheme.surfaceCard,
              border: Border(
                top: BorderSide(
                    color: QuantumTheme.quantumGreen.withValues(alpha: 0.2)),
              ),
            ),
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
          ),
        ],
      ),
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
    );
  }
}
