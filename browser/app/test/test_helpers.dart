import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/providers/biometric_provider.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/router.dart';

/// Provider overrides that stub out Supabase and biometric dependencies
/// so widget tests can pump [ZipminatorApp] without real backend services.
final testOverrides = [
  // Stub auth: unauthenticated, no Supabase call.
  authProvider.overrideWith(_StubAuthNotifier.new),
  // Stub signaling: no-op (depends on auth).
  signalingInitProvider.overrideWithValue(null),
  // Stub biometric: unlocked, not available.
  biometricProvider.overrideWith(_StubBiometricNotifier.new),
];

/// Call in setUp or at the top of main() to bypass auth redirects in tests.
void setUpTestEnvironment() {
  skipAuthRedirectForTests = true;
}

class _StubAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState();
}

class _StubBiometricNotifier extends BiometricNotifier {
  @override
  Future<BiometricState> build() async => const BiometricState();
}
