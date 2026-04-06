import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';

/// Thin wrapper around local_auth for FaceID / fingerprint.
class BiometricService {
  BiometricService._();

  static final _auth = LocalAuthentication();

  /// Whether FaceID or fingerprint hardware is available AND enrolled.
  static Future<bool> get isAvailable async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isSupported = await _auth.isDeviceSupported();
      return canCheck && isSupported;
    } on PlatformException {
      return false;
    }
  }

  /// Prompt the user for biometric authentication.
  /// Returns true if authentication succeeded.
  static Future<bool> authenticate({
    String reason = 'Unlock Zipminator',
  }) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
    } on PlatformException catch (e) {
      debugPrint('Biometric auth error: $e');
      return false;
    }
  }
}
