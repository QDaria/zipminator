import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:zipminator/core/services/supabase_service.dart';
import 'package:zipminator/features/auth/login_screen.dart';
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

/// Auth-reactive GoRouter. Re-evaluates redirect on every auth state change.
final GoRouter appRouter = GoRouter(
  initialLocation: '/vault',
  refreshListenable: _StreamNotifier(SupabaseService.authStateChanges),
  redirect: (context, state) {
    final isLoginRoute = state.matchedLocation == '/login';
    // Guard against Supabase not being initialized (e.g. in tests)
    bool loggedIn;
    try {
      loggedIn = SupabaseService.currentUser != null;
    } catch (_) {
      // Supabase not initialized — skip auth redirect
      return isLoginRoute ? '/vault' : null;
    }

    if (!loggedIn && !isLoginRoute) return '/login';
    if (loggedIn && isLoginRoute) return '/vault';
    return null;
  },
  routes: [
    // OAuth callback — Supabase handles the code exchange via onAuthStateChange;
    // just redirect to the main app once the deep link arrives.
    GoRoute(
      path: '/login-callback',
      redirect: (context, state) => '/vault',
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
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
