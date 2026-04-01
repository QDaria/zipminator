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
    _sub = SupabaseService.authStateChanges.listen((data) {
      final user = data.session?.user;
      if (user != null) {
        state = state.copyWith(user: user, isLoading: false);
      } else {
        state = state.copyWith(clearUser: true, isLoading: false);
      }
    });
  }

  Future<void> signInWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await SupabaseService.signInWithEmail(email, password);
      if (response.session == null) {
        state = state.copyWith(isLoading: false, error: 'Sign in failed. Check email and password.');
      } else {
        // Success: onAuthStateChange will set user, but ensure loading stops.
        state = state.copyWith(user: response.user, isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> signUpWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await SupabaseService.signUpWithEmail(email, password);
      if (response.session == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Account may already exist. Try Sign In instead.',
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> signInWithOAuth(OAuthProvider provider) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final ok = await SupabaseService.signInWithOAuth(provider);
      if (!ok) {
        state = state.copyWith(isLoading: false, error: 'OAuth flow was cancelled.');
      }
      // On macOS, OAuth opens browser. Reset loading after a delay
      // since the callback may never arrive if redirect fails.
      Future.delayed(const Duration(seconds: 15), () {
        if (state.isLoading) {
          state = state.copyWith(isLoading: false, error: 'OAuth timed out. Try email login instead.');
        }
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> signOut() async {
    await SupabaseService.signOut();
    state = const AuthState();
  }
}

final authProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
