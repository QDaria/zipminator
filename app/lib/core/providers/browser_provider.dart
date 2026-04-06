import 'package:flutter_riverpod/flutter_riverpod.dart';

class BrowserState {
  final String url;
  final bool isLoading;
  final bool proxyActive;
  final bool canGoBack;
  final bool canGoForward;
  final String? error;

  const BrowserState({
    this.url = 'https://zipminator.zip',
    this.isLoading = false,
    this.proxyActive = true,
    this.canGoBack = false,
    this.canGoForward = false,
    this.error,
  });

  BrowserState copyWith({
    String? url,
    bool? isLoading,
    bool? proxyActive,
    bool? canGoBack,
    bool? canGoForward,
    String? error,
  }) =>
      BrowserState(
        url: url ?? this.url,
        isLoading: isLoading ?? this.isLoading,
        proxyActive: proxyActive ?? this.proxyActive,
        canGoBack: canGoBack ?? this.canGoBack,
        canGoForward: canGoForward ?? this.canGoForward,
        error: error,
      );
}

class BrowserNotifier extends Notifier<BrowserState> {
  @override
  BrowserState build() => const BrowserState();

  void navigate(String url) {
    final normalized = url.startsWith('http') ? url : 'https://$url';
    state = state.copyWith(url: normalized, isLoading: true);
  }

  void onPageFinished() {
    state = state.copyWith(isLoading: false);
  }

  void updateNavigation({bool? canGoBack, bool? canGoForward}) {
    state = state.copyWith(canGoBack: canGoBack, canGoForward: canGoForward);
  }

  void toggleProxy() {
    state = state.copyWith(proxyActive: !state.proxyActive);
  }
}

final browserProvider =
    NotifierProvider<BrowserNotifier, BrowserState>(BrowserNotifier.new);
