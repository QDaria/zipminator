import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  SupabaseService._();

  static SupabaseClient get client => Supabase.instance.client;

  static const _callbackScheme = 'com.qdaria.zipminator';
  static const _redirectTo = '$_callbackScheme://login-callback';

  static Future<void> initialize() async {
    await dotenv.load(fileName: '.env');
    await Supabase.initialize(
      url: dotenv.env['SUPABASE_URL']!,
      anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
      authOptions: const FlutterAuthClientOptions(
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

  /// OAuth using ASWebAuthenticationSession (iOS) / browser (macOS).
  ///
  /// Uses Supabase's internal PKCE state management (getOAuthSignInUrl
  /// stores the code verifier, exchangeCodeForSession reads it back).
  /// FlutterWebAuth2 handles the redirect capture.
  static Future<AuthResponse> signInWithOAuthProper(
      OAuthProvider provider) async {
    // Let Supabase generate the OAuth URL and store the PKCE verifier.
    final oauthResponse = await client.auth.getOAuthSignInUrl(
      provider: provider,
      redirectTo: _redirectTo,
    );

    // Open ASWebAuthenticationSession (iOS) or browser (macOS).
    final resultUrl = await FlutterWebAuth2.authenticate(
      url: oauthResponse.url.toString(),
      callbackUrlScheme: _callbackScheme,
      options: const FlutterWebAuth2Options(
        preferEphemeral: false,
      ),
    );

    // Extract the auth code from the callback.
    final uri = Uri.parse(resultUrl);
    final code = uri.queryParameters['code'];
    if (code == null) {
      throw const AuthException('OAuth failed: no auth code in callback');
    }

    // Exchange the code for a session (Supabase reads back the stored verifier).
    final sessionResponse = await client.auth.exchangeCodeForSession(code);
    return AuthResponse(
      session: sessionResponse.session,
      user: sessionResponse.session?.user,
    );
  }

  /// Native Apple Sign-In (system sheet, no browser).
  static Future<AuthResponse> signInWithApple() async {
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
    const chars =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final rng = Random.secure();
    return List.generate(length, (_) => chars[rng.nextInt(chars.length)]).join();
  }

  static Future<void> signOut() async {
    try {
      await client.auth.signOut(scope: SignOutScope.local);
    } catch (_) {}
  }
}
