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

  /// Display name from user_metadata, or email prefix.
  String get displayName {
    final meta = user?.userMetadata;
    final fullName = meta?['full_name'] as String?;
    if (fullName != null && fullName.isNotEmpty) return fullName;
    final email = user?.email ?? '';
    if (email.contains('@')) return email.split('@').first;
    return email;
  }

  /// Username from user_metadata (null if not yet set).
  String? get username => user?.userMetadata?['username'] as String?;

  /// Whether onboarding (username creation) is needed.
  bool get needsOnboarding =>
      isAuthenticated && (username == null || username!.isEmpty);
}

/// Notifier that tracks Supabase auth state and exposes sign-in/sign-out.
class AuthNotifier extends Notifier<AuthState> {
  StreamSubscription<supabase.AuthState>? _sub;

  @override
  AuthState build() {
    final user = SupabaseService.currentUser;
    if (SupabaseService.client != null) {
      _listenToAuthChanges();
    }
    ref.onDispose(() => _sub?.cancel());
    if (user != null) _ensureUsername(user);
    return AuthState(user: user);
  }

  void _listenToAuthChanges() {
    if (SupabaseService.client == null) return;
    _sub?.cancel();
    _sub = SupabaseService.authStateChanges.listen((data) {
      final user = data.session?.user;
      if (user != null) {
        state = state.copyWith(user: user, isLoading: false);
        _ensureUsername(user);
      } else {
        state = const AuthState(); // Fully reset on sign-out.
      }
    });
  }

  /// Auto-generate username from OAuth profile if not set.
  /// Skips onboarding for users who signed in via Google/GitHub/LinkedIn.
  Future<void> _ensureUsername(User user) async {
    final meta = user.userMetadata;
    final existing = meta?['username'] as String?;
    if (existing != null && existing.isNotEmpty) return;

    // Derive username from email prefix or full_name
    final email = user.email ?? '';
    final fullName = meta?['full_name'] as String? ?? '';
    String candidate;
    if (fullName.isNotEmpty) {
      candidate = fullName
          .toLowerCase()
          .replaceAll(RegExp(r'[^a-z0-9._-]'), '.')
          .replaceAll(RegExp(r'\.{2,}'), '.');
    } else if (email.contains('@')) {
      candidate = email.split('@').first.toLowerCase();
    } else {
      return; // No data to derive from
    }
    if (candidate.length < 3) candidate = '${candidate}user';
    if (candidate.length > 30) candidate = candidate.substring(0, 30);

    try {
      await SupabaseService.updateProfile(username: candidate);
      final refreshed = SupabaseService.currentUser;
      if (refreshed != null) {
        state = state.copyWith(user: refreshed);
      }
    } catch (_) {
      // Non-fatal; user can set username manually via onboarding
    }
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

  /// Native Apple Sign-In (system sheet, no browser).
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

  /// OAuth via ASWebAuthenticationSession (iOS) or browser (macOS).
  /// Works for Google, GitHub, LinkedIn. Uses ephemeral sessions and
  /// Supabase's getSessionFromUrl for correct PKCE + fragment handling.
  Future<void> signInWithOAuth(OAuthProvider provider) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await SupabaseService.signInWithOAuthBrowser(provider);
      state = state.copyWith(user: response.user, isLoading: false);
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('CANCELED') ||
          msg.contains('canceled') ||
          msg.contains('cancelled')) {
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(isLoading: false, error: msg);
      }
    }
  }

  /// Update the user's profile (username and/or display name).
  Future<void> updateProfile({
    String? username,
    String? displayName,
  }) async {
    try {
      await SupabaseService.updateProfile(
        username: username,
        displayName: displayName,
      );
      // Refresh user to pick up new metadata.
      final refreshed = SupabaseService.currentUser;
      if (refreshed != null) {
        state = state.copyWith(user: refreshed);
      }
    } catch (e) {
      state = state.copyWith(error: e.toString());
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
