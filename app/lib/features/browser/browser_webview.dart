import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:zipminator/core/providers/browser_provider.dart';

/// Builds a platform WebView widget (iOS, Android, macOS).
/// Returns a fallback widget if the platform implementation is not available
/// (e.g., in unit tests).
Widget buildWebView() {
  // Check if WebViewPlatform is available before creating a controller
  if (WebViewPlatform.instance == null) {
    return const Center(
      child: Text('WebView not available (no platform implementation)'),
    );
  }
  return const _WebViewContainer();
}

class _WebViewContainer extends ConsumerStatefulWidget {
  const _WebViewContainer();

  @override
  ConsumerState<_WebViewContainer> createState() => _WebViewContainerState();
}

class _WebViewContainerState extends ConsumerState<_WebViewContainer> {
  late WebViewController _controller;

  @override
  void initState() {
    super.initState();
    final url = ref.read(browserProvider).url;
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) {},
        onPageFinished: (_) {
          ref.read(browserProvider.notifier).onPageFinished();
          _controller.canGoBack().then((v) {
            _controller.canGoForward().then((f) {
              ref
                  .read(browserProvider.notifier)
                  .updateNavigation(canGoBack: v, canGoForward: f);
            });
          });
        },
      ))
      ..loadRequest(Uri.parse(url));

    // Listen for URL changes from the provider — safe in ConsumerStatefulWidget
    ref.listenManual(browserProvider, (prev, next) {
      if (prev?.url != next.url) {
        _controller.loadRequest(Uri.parse(next.url));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return WebViewWidget(controller: _controller);
  }
}
