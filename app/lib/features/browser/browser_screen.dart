import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/browser_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

// Conditional import: webview_flutter only works on iOS/Android/macOS
import 'browser_webview.dart' if (dart.library.html) 'browser_fallback.dart';

/// Pillar 8: ZipBrowser — PQC proxy browser with privacy features.
class BrowserScreen extends ConsumerStatefulWidget {
  const BrowserScreen({super.key});

  @override
  ConsumerState<BrowserScreen> createState() => _BrowserScreenState();
}

class _BrowserScreenState extends ConsumerState<BrowserScreen> {
  late TextEditingController _urlController;
  bool _fingerprintProtection = true;
  bool _cookieRotation = true;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(
      text: ref.read(browserProvider).url,
    );
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  bool get _supportsWebView {
    if (kIsWeb) return false;
    try {
      return Platform.isIOS || Platform.isAndroid || Platform.isMacOS;
    } catch (_) {
      return false;
    }
  }

  void _navigate() {
    final url = _urlController.text.trim();
    if (url.isNotEmpty) {
      ref.read(browserProvider.notifier).navigate(url);
    }
  }

  @override
  Widget build(BuildContext context) {
    final browser = ref.watch(browserProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            // PQC badge indicator
            PqcBadge(
              label: browser.proxyActive ? 'PQC' : 'STD',
              color:
                  browser.proxyActive ? QuantumTheme.quantumGreen : null,
              isActive: browser.proxyActive,
            ),
            const SizedBox(width: 8),
            // URL bar
            Expanded(
              child: TextField(
                controller: _urlController,
                style: Theme.of(context).textTheme.bodySmall,
                decoration: InputDecoration(
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 8),
                  filled: true,
                  fillColor: QuantumTheme.surfaceElevated,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: BorderSide.none,
                  ),
                  prefixIcon: browser.isLoading
                      ? const Padding(
                          padding: EdgeInsets.all(10),
                          child: SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : Icon(
                          browser.proxyActive ? Icons.lock : Icons.lock_open,
                          size: 16,
                          color: browser.proxyActive
                              ? QuantumTheme.quantumGreen
                              : QuantumTheme.textSecondary,
                        ),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.arrow_forward, size: 18),
                    onPressed: _navigate,
                  ),
                ),
                onSubmitted: (_) => _navigate(),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.arrow_back, size: 20),
            onPressed: browser.canGoBack ? () {} : null,
            tooltip: 'Back',
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward, size: 20),
            onPressed: browser.canGoForward ? () {} : null,
            tooltip: 'Forward',
          ),
        ],
      ),
      body: _supportsWebView
          ? Stack(
              children: [
                // Full-page WebView (like Safari)
                buildWebView(),

                // Floating privacy bar at bottom
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: SafeArea(
                    child: Container(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: QuantumTheme.surfaceDark.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: browser.proxyActive
                              ? QuantumTheme.quantumGreen
                                  .withValues(alpha: 0.3)
                              : QuantumTheme.surfaceElevated,
                        ),
                      ),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 6),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _PrivacyChip(
                            icon: Icons.shield,
                            label: 'PQC',
                            active: browser.proxyActive,
                            onTap: () => ref
                                .read(browserProvider.notifier)
                                .toggleProxy(),
                          ),
                          _PrivacyChip(
                            icon: Icons.fingerprint,
                            label: 'FP',
                            active: _fingerprintProtection,
                            onTap: () => setState(() =>
                                _fingerprintProtection =
                                    !_fingerprintProtection),
                          ),
                          _PrivacyChip(
                            icon: Icons.cookie_outlined,
                            label: 'Cookie',
                            active: _cookieRotation,
                            onTap: () => setState(
                                () => _cookieRotation = !_cookieRotation),
                          ),
                          _PrivacyChip(
                            icon: Icons.block,
                            label: 'Telemetry',
                            active: true,
                            onTap: () {},
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            )
          : GradientBackground(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: PillarHeader(
                      icon: Icons.language,
                      title: 'PQC Browser',
                      subtitle: 'ML-KEM-768 TLS Proxy',
                      iconColor: QuantumTheme.quantumGreen,
                    ),
                  ),
                  Expanded(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.desktop_windows_outlined,
                              size: 48, color: QuantumTheme.textSecondary),
                          const SizedBox(height: 12),
                          Text(
                            'WebView not supported on this platform.\n'
                            'Use the Tauri desktop browser for full PQC browsing.',
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: QuantumTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _PrivacyChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _PrivacyChip({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: active
              ? QuantumTheme.quantumGreen.withValues(alpha: 0.15)
              : QuantumTheme.surfaceElevated.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 14,
                color: active
                    ? QuantumTheme.quantumGreen
                    : QuantumTheme.textSecondary),
            const SizedBox(width: 4),
            Text(label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: active
                          ? QuantumTheme.quantumGreen
                          : QuantumTheme.textSecondary,
                      fontSize: 11,
                    )),
          ],
        ),
      ),
    );
  }
}
