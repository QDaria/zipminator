import 'package:go_router/go_router.dart';
import 'package:zipminator/features/vault/vault_screen.dart';
import 'package:zipminator/features/messenger/messenger_screen.dart';
import 'package:zipminator/features/voip/voip_screen.dart';
import 'package:zipminator/features/vpn/vpn_screen.dart';
import 'package:zipminator/features/anonymizer/anonymizer_screen.dart';
import 'package:zipminator/features/qai/qai_screen.dart';
import 'package:zipminator/features/email/email_screen.dart';
import 'package:zipminator/features/browser/browser_screen.dart';
import 'package:zipminator/features/settings/settings_screen.dart';
import 'package:zipminator/shared/widgets/shell_scaffold.dart';

/// App-wide GoRouter configuration.
///
/// Uses ShellRoute for persistent bottom navigation across all 8 pillars.
final GoRouter appRouter = GoRouter(
  initialLocation: '/vault',
  routes: [
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
          path: '/settings',
          name: 'settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
    ),
  ],
);
