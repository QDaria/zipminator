import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
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

  /// OAuth via ASWebAuthenticationSession (iOS) / browser (macOS).
  ///
  /// Uses ephemeral sessions to avoid stale cookie issues on iOS 17+.
  /// Delegates URL parsing to Supabase's getSessionFromUrl which handles
  /// both query-param and fragment-based callbacks correctly.
  static Future<AuthResponse> signInWithOAuthBrowser(
      OAuthProvider provider) async {
    final oauthResponse = await client.auth.getOAuthSignInUrl(
      provider: provider,
      redirectTo: _redirectTo,
    );

    final resultUrl = await FlutterWebAuth2.authenticate(
      url: oauthResponse.url.toString(),
      callbackUrlScheme: _callbackScheme,
      options: const FlutterWebAuth2Options(
        preferEphemeral: true,
      ),
    );

    // Let Supabase parse the full callback URL (handles code in query
    // params, fragments, error responses, and PKCE exchange).
    final uri = Uri.parse(resultUrl);
    final sessionResponse = await client.auth.getSessionFromUrl(uri);
    return AuthResponse(
      session: sessionResponse.session,
      user: sessionResponse.session.user,
    );
  }

  /// Native Apple Sign-In (system sheet, no browser).
  ///
  /// Extracts givenName/familyName from the Apple credential (only sent
  /// on first sign-in) and stores them in Supabase user_metadata.
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

    final response = await client.auth.signInWithIdToken(
      provider: OAuthProvider.apple,
      idToken: idToken,
      nonce: rawNonce,
    );

    // Apple only sends name on FIRST sign-in; capture it immediately.
    final givenName = credential.givenName;
    final familyName = credential.familyName;
    if (givenName != null || familyName != null) {
      final fullName =
          '${givenName ?? ''} ${familyName ?? ''}'.trim();
      try {
        await client.auth.updateUser(UserAttributes(
          data: {
            'full_name': fullName,
            'given_name': givenName,
            'family_name': familyName,
          },
        ));
      } catch (e) {
        debugPrint('Failed to store Apple name: $e');
      }
    }

    return response;
  }

  // ---- Profile helpers ----

  /// Read the username from user_metadata.
  static String? get currentUsername {
    return currentUser?.userMetadata?['username'] as String?;
  }

  /// Read the display name (full_name or email prefix).
  static String get currentDisplayName {
    final meta = currentUser?.userMetadata;
    final fullName = meta?['full_name'] as String?;
    if (fullName != null && fullName.isNotEmpty) return fullName;
    final email = currentUser?.email ?? '';
    if (email.contains('@')) return email.split('@').first;
    return email;
  }

  /// Update username and/or display name in user_metadata.
  static Future<void> updateProfile({
    String? username,
    String? displayName,
  }) async {
    final data = <String, dynamic>{};
    if (username != null) data['username'] = username;
    if (displayName != null) data['full_name'] = displayName;
    if (data.isEmpty) return;
    await client.auth.updateUser(UserAttributes(data: data));
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
