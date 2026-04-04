import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zipminator/core/services/biometric_service.dart';

const _kBiometricEnabled = 'biometric_lock_enabled';

class BiometricState {
  /// Whether the user has toggled biometric lock on in Settings.
  final bool enabled;

  /// Whether the app is currently locked (awaiting biometric).
  final bool locked;

  /// Whether biometric hardware is available on this device.
  final bool available;

  const BiometricState({
    this.enabled = false,
    this.locked = false,
    this.available = false,
  });

  BiometricState copyWith({bool? enabled, bool? locked, bool? available}) =>
      BiometricState(
        enabled: enabled ?? this.enabled,
        locked: locked ?? this.locked,
        available: available ?? this.available,
      );
}

class BiometricNotifier extends AsyncNotifier<BiometricState> {
  @override
  Future<BiometricState> build() async {
    final prefs = await SharedPreferences.getInstance();
    final enabled = prefs.getBool(_kBiometricEnabled) ?? false;
    final available = await BiometricService.isAvailable;
    return BiometricState(
      enabled: enabled,
      available: available,
      locked: enabled && available,
    );
  }

  /// Toggle biometric lock on/off. When turning on, verifies with biometric
  /// first so only the device owner can enable it.
  Future<void> toggle() async {
    final current = state.value ?? const BiometricState();
    if (!current.available) return;

    if (!current.enabled) {
      // Turning ON: verify identity first.
      final ok = await BiometricService.authenticate(
        reason: 'Verify your identity to enable biometric lock',
      );
      if (!ok) return;
    }

    final newEnabled = !current.enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kBiometricEnabled, newEnabled);
    state = AsyncData(current.copyWith(enabled: newEnabled, locked: false));
  }

  /// Attempt to unlock. Called from the lock screen.
  Future<bool> unlock() async {
    final ok = await BiometricService.authenticate();
    if (ok) {
      final current = state.value ?? const BiometricState();
      state = AsyncData(current.copyWith(locked: false));
    }
    return ok;
  }

  /// Lock the app (called when app goes to background).
  void lock() {
    final current = state.value;
    if (current != null && current.enabled && current.available) {
      state = AsyncData(current.copyWith(locked: true));
    }
  }
}

final biometricProvider =
    AsyncNotifierProvider<BiometricNotifier, BiometricState>(
        BiometricNotifier.new);
