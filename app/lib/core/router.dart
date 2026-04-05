import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:zipminator/core/services/supabase_service.dart';
import 'package:zipminator/features/auth/login_screen.dart';
import 'package:zipminator/features/auth/onboarding_screen.dart';
import 'package:zipminator/features/auth/profile_screen.dart';
import 'package:zipminator/features/vault/vault_screen.dart';
import 'package:zipminator/features/messenger/messenger_screen.dart';
import 'package:zipminator/features/voip/voip_screen.dart';
import 'package:zipminator/features/vpn/vpn_screen.dart';
import 'package:zipminator/features/anonymizer/anonymizer_screen.dart';
import 'package:zipminator/features/qai/qai_screen.dart';
import 'package:zipminator/features/email/email_screen.dart';
import 'package:zipminator/features/browser/browser_screen.dart';
import 'package:zipminator/features/mesh/mesh_screen.dart';
import 'package:zipminator/features/settings/settings_screen.dart';
import 'package:zipminator/shared/widgets/shell_scaffold.dart';

/// Set to true in E2E/integration tests to bypass auth redirect.
/// Defaults to false; only test harnesses should set this.
bool skipAuthRedirectForTests = false;

/// Converts a Stream into a Listenable for GoRouter.refreshListenable.
class _StreamNotifier extends ChangeNotifier {
  late final StreamSubscription<dynamic> _sub;
  _StreamNotifier(Stream<dynamic> stream) {
    _sub = stream.listen((_) => notifyListeners());
  }
  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

/// No-op listenable for tests where Supabase is not initialized.
class _NoopNotifier extends ChangeNotifier {}

/// Safe auth stream listenable: returns no-op in test environments.
ChangeNotifier _authRefreshListenable() {
  try {
    return _StreamNotifier(SupabaseService.authStateChanges);
  } catch (_) {
    return _NoopNotifier();
  }
}

/// Auth-reactive GoRouter. Re-evaluates redirect on every auth state change.
final GoRouter appRouter = GoRouter(
  initialLocation: '/vault',
  refreshListenable: _authRefreshListenable(),
  redirect: (context, state) {
    final path = state.matchedLocation;
    final isLoginRoute = path == '/login';
    final isOnboarding = path == '/onboarding';
    final isCallback = path == '/login-callback';

    // In E2E tests, skip all auth redirects so pillar screens render directly.
    if (skipAuthRedirectForTests) return null;

    // Guard against Supabase not being initialized (e.g. in tests).
    bool loggedIn;
    try {
      loggedIn = SupabaseService.currentUser != null;
    } catch (_) {
      return isLoginRoute ? '/vault' : null;
    }

    // Not logged in: force login (except callback route).
    if (!loggedIn && !isLoginRoute && !isCallback) return '/login';

    // Logged in on login page: check if onboarding needed.
    if (loggedIn && isLoginRoute) {
      final username = SupabaseService.currentUsername;
      if (username == null || username.isEmpty) return '/onboarding';
      return '/vault';
    }

    // Logged in but still need username: keep on onboarding.
    if (loggedIn && !isOnboarding) {
      final username = SupabaseService.currentUsername;
      if (username == null || username.isEmpty) return '/onboarding';
    }

    return null;
  },
  routes: [
    // OAuth callback: Supabase handles the code exchange via deep link
    // handler in supabase_flutter. Redirect to vault once processed.
    GoRoute(
      path: '/login-callback',
      redirect: (context, state) => '/vault',
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      name: 'onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => ShellScaffold(child: child),
      routes: [
        GoRoute(
          path: '/vault',
          name: 'vault',
          builder: (context, state) => const VaultScreen(),
        ),
        GoRoute(
          path: '/messenger',
          name: 'messenger',
          builder: (context, state) => const MessengerScreen(),
        ),
        GoRoute(
          path: '/voip',
          name: 'voip',
          builder: (context, state) => const VoipScreen(),
        ),
        GoRoute(
          path: '/vpn',
          name: 'vpn',
          builder: (context, state) => const VpnScreen(),
        ),
        GoRoute(
          path: '/anonymizer',
          name: 'anonymizer',
          builder: (context, state) => const AnonymizerScreen(),
        ),
        GoRoute(
          path: '/ai',
          name: 'ai',
          builder: (context, state) => const QaiScreen(),
        ),
        GoRoute(
          path: '/email',
          name: 'email',
          builder: (context, state) => const EmailScreen(),
        ),
        GoRoute(
          path: '/browser',
          name: 'browser',
          builder: (context, state) => const BrowserScreen(),
        ),
        GoRoute(
          path: '/mesh',
          name: 'mesh',
          builder: (context, state) => const MeshScreen(),
        ),
        GoRoute(
          path: '/settings',
          name: 'settings',
          builder: (context, state) => const SettingsScreen(),
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
  ],
);
