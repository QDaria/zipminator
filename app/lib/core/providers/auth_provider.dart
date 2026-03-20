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

  AuthState copyWith({User? user, bool? isLoading, String? error}) => AuthState(
        user: user ?? this.user,
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
      state = state.copyWith(user: data.session?.user, isLoading: false);
    });
  }

  Future<void> signInWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await SupabaseService.signInWithEmail(email, password);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> signUpWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await SupabaseService.signUpWithEmail(email, password);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> signInWithOAuth(OAuthProvider provider) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await SupabaseService.signInWithOAuth(provider);
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
