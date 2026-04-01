import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Singleton wrapper around Supabase client for auth and data access.
class SupabaseService {
  SupabaseService._();

  static SupabaseClient get client => Supabase.instance.client;

  static const _redirectTo = 'com.qdaria.zipminator://login-callback';

  static Future<void> initialize() async {
    await dotenv.load(fileName: '.env');
    await Supabase.initialize(
      url: dotenv.env['SUPABASE_URL']!,
      anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
      authOptions: FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
      debug: false,
    );
  }

  static User? get currentUser => client.auth.currentUser;

  static Stream<AuthState> get authStateChanges =>
      client.auth.onAuthStateChange;

  static Future<AuthResponse> signInWithEmail(
    String email,
    String password,
  ) =>
      client.auth.signInWithPassword(email: email, password: password);

  static Future<AuthResponse> signUpWithEmail(
    String email,
    String password,
  ) =>
      client.auth.signUp(email: email, password: password);

  static Future<bool> signInWithOAuth(OAuthProvider provider) =>
      client.auth.signInWithOAuth(
        provider,
        redirectTo: _redirectTo,
        authScreenLaunchMode: LaunchMode.externalApplication,
      );

  /// Native Sign in with Apple (iOS/macOS). Uses system auth sheet,
  /// no browser redirect needed. Returns the Supabase AuthResponse.
  static Future<AuthResponse> signInWithApple() async {
    // Generate nonce for security.
    final rawNonce = _generateNonce();
    final hashedNonce = sha256.convert(utf8.encode(rawNonce)).toString();

    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
      nonce: hashedNonce,
    );

    final idToken = credential.identityToken;
    if (idToken == null) {
      throw const AuthException('Apple Sign In failed: no ID token');
    }

    return client.auth.signInWithIdToken(
      provider: OAuthProvider.apple,
      idToken: idToken,
      nonce: rawNonce,
    );
  }

  static String _generateNonce([int length = 32]) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final rng = Random.secure();
    return List.generate(length, (_) => chars[rng.nextInt(chars.length)]).join();
  }

  static Future<void> signOut() async {
    try {
      await client.auth.signOut(scope: SignOutScope.local);
    } catch (_) {}
  }
}
