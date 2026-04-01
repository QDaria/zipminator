import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase
    show AuthState;
import 'package:supabase_flutter/supabase_flutter.dart'
    hide AuthState;
import 'package:zipminator/core/services/supabase_service.dart';

/// Immutable auth state container.
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool clearUser = false,
  }) =>
      AuthState(
        user: clearUser ? null : (user ?? this.user),
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );

  bool get isAuthenticated => user != null;
}

/// Notifier that tracks Supabase auth state and exposes sign-in/sign-out.
class AuthNotifier extends Notifier<AuthState> {
  StreamSubscription<supabase.AuthState>? _sub;

  @override
  AuthState build() {
    final user = SupabaseService.currentUser;
    _listenToAuthChanges();
    ref.onDispose(() => _sub?.cancel());
    return AuthState(user: user);
  }

  void _listenToAuthChanges() {
    _sub?.cancel();
    _sub = SupabaseService.authStateChanges.listen((data) {
      final user = data.session?.user;
      if (user != null) {
        state = state.copyWith(user: user, isLoading: false);
      } else {
        state = const AuthState(); // Fully reset on sign-out.
      }
    });
  }

  /// Email + password sign in.
  Future<void> signInWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await SupabaseService.signInWithEmail(email, password);
      state = state.copyWith(
        user: response.user,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Email + password sign up.
  Future<void> signUpWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await SupabaseService.signUpWithEmail(email, password);
      if (response.session == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Account may already exist. Try Sign In instead.',
        );
      } else {
        state = state.copyWith(user: response.user, isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Native Google Sign-In (no browser redirect).
  Future<void> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await SupabaseService.signInWithGoogle();
      state = state.copyWith(user: response.user, isLoading: false);
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('cancelled') || msg.contains('canceled')) {
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(isLoading: false, error: msg);
      }
    }
  }

  /// Native Apple Sign-In (system sheet, no browser redirect).
  Future<void> signInWithApple() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await SupabaseService.signInWithApple();
      state = state.copyWith(user: response.user, isLoading: false);
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('canceled') || msg.contains('1001')) {
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(isLoading: false, error: msg);
      }
    }
  }

  /// Browser-based OAuth (GitHub, LinkedIn).
  Future<void> signInWithOAuth(OAuthProvider provider) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final ok = await SupabaseService.signInWithOAuth(provider);
      if (!ok) {
        state = state.copyWith(isLoading: false, error: 'OAuth was cancelled.');
        return;
      }
      // Browser opened; wait for deep-link callback via onAuthStateChange.
      // Timeout after 30s in case redirect fails.
      Future.delayed(const Duration(seconds: 30), () {
        if (state.isLoading) {
          state = state.copyWith(
            isLoading: false,
            error: 'OAuth timed out. Use Google or Apple native sign-in.',
          );
        }
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Sign out completely. Clears all local session data.
  Future<void> signOut() async {
    await SupabaseService.signOut();
    state = const AuthState();
  }
}

final authProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
