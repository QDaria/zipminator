import 'dart:ui';

/// E2E test configuration constants.
class E2eConfig {
  E2eConfig._();

  // Signaling server
  static const signalingHost = 'localhost';
  static const signalingPort = 8765;
  static String get signalingUrl => 'ws://$signalingHost:$signalingPort';
  static String get signalingHttpUrl => 'http://$signalingHost:$signalingPort';

  // Test accounts (real Supabase accounts)
  static const accounts = [
    TestAccount(
      email: 'mo@qdaria.com',
      displayName: 'Mo Houshmand',
      id: 'user-mo',
    ),
    TestAccount(
      email: 'houshmand.81@gmail.com',
      displayName: 'Houshmand 81',
      id: 'user-h81',
    ),
    TestAccount(
      email: 'dmo.houshmand@gmail.com',
      displayName: 'DMO Houshmand',
      id: 'user-dmo',
    ),
  ];

  // Timeouts
  static const pumpSettleTimeout = Duration(seconds: 5);
  static const wsConnectTimeout = Duration(seconds: 10);
  static const callSetupTimeout = Duration(seconds: 15);

  // Viewports
  static const desktopSize = Size(1200, 800);
  static const mobileSize = Size(400, 800);

  // RALPH loop
  static const maxRalphIterations = 12;
}

/// A test account with email, display name, and local ID.
class TestAccount {
  final String email;
  final String displayName;
  final String id;

  const TestAccount({
    required this.email,
    required this.displayName,
    required this.id,
  });
}
