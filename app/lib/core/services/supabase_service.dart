import 'package:flutter_dotenv/flutter_dotenv.dart';
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

  static Future<void> signOut() async {
    try {
      await client.auth.signOut(scope: SignOutScope.local);
    } catch (_) {
      // Ignore errors on sign-out (e.g. expired session)
    }
  }
}
