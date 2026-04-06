import 'package:flutter_riverpod/flutter_riverpod.dart';

class BrowserState {
  final String url;
  final bool isLoading;
  final bool proxyActive;
  final bool canGoBack;
  final bool canGoForward;
  final bool fingerprintProtection;
  final bool cookieRotation;
  final List<String> history;
  final int historyIndex;
  final String? error;

  const BrowserState({
    this.url = 'https://zipminator.zip',
    this.isLoading = false,
    this.proxyActive = true,
    this.canGoBack = false,
    this.canGoForward = false,
    this.fingerprintProtection = true,
    this.cookieRotation = true,
    this.history = const ['https://zipminator.zip'],
    this.historyIndex = 0,
    this.error,
  });

  BrowserState copyWith({
    String? url,
    bool? isLoading,
    bool? proxyActive,
    bool? canGoBack,
    bool? canGoForward,
    bool? fingerprintProtection,
    bool? cookieRotation,
    List<String>? history,
    int? historyIndex,
    String? error,
  }) =>
      BrowserState(
        url: url ?? this.url,
        isLoading: isLoading ?? this.isLoading,
        proxyActive: proxyActive ?? this.proxyActive,
        canGoBack: canGoBack ?? this.canGoBack,
        canGoForward: canGoForward ?? this.canGoForward,
        fingerprintProtection:
            fingerprintProtection ?? this.fingerprintProtection,
        cookieRotation: cookieRotation ?? this.cookieRotation,
        history: history ?? this.history,
        historyIndex: historyIndex ?? this.historyIndex,
        error: error,
      );
}

class BrowserNotifier extends Notifier<BrowserState> {
  @override
  BrowserState build() => const BrowserState();

  void navigate(String url) {
    final normalized = url.startsWith('http') ? url : 'https://$url';
    // Truncate forward history on new navigation
    final newHistory = [
      ...state.history.sublist(0, state.historyIndex + 1),
      normalized,
    ];
    state = state.copyWith(
      url: normalized,
      isLoading: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canGoBack: newHistory.length > 1,
      canGoForward: false,
    );
  }

  void goBack() {
    if (state.historyIndex <= 0) return;
    final newIndex = state.historyIndex - 1;
    state = state.copyWith(
      url: state.history[newIndex],
      historyIndex: newIndex,
      canGoBack: newIndex > 0,
      canGoForward: true,
      isLoading: true,
    );
  }

  void goForward() {
    if (state.historyIndex >= state.history.length - 1) return;
    final newIndex = state.historyIndex + 1;
    state = state.copyWith(
      url: state.history[newIndex],
      historyIndex: newIndex,
      canGoBack: true,
      canGoForward: newIndex < state.history.length - 1,
      isLoading: true,
    );
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

  void toggleFingerprint() {
    state = state.copyWith(
        fingerprintProtection: !state.fingerprintProtection);
  }

  void toggleCookieRotation() {
    state = state.copyWith(cookieRotation: !state.cookieRotation);
  }
}

final browserProvider =
    NotifierProvider<BrowserNotifier, BrowserState>(BrowserNotifier.new);
