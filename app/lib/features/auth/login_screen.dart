import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show OAuthProvider;
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Glassmorphic login screen with email/password and OAuth options.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isSignUp = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final notifier = ref.read(authProvider.notifier);

    if (_isSignUp) {
      await notifier.signUpWithEmail(email, password);
    } else {
      await notifier.signInWithEmail(email, password);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final size = MediaQuery.sizeOf(context);
    final isWide = size.width > 600;

    return GestureDetector(onTap: () => FocusScope.of(context).unfocus(), child: Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                horizontal: isWide ? size.width * 0.25 : 24,
                vertical: 32,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo
                  SvgPicture.asset(
                    'assets/logos/Z.svg',
                    width: 80,
                    height: 80,
                    colorFilter: const ColorFilter.mode(
                      QuantumTheme.quantumCyan,
                      BlendMode.srcIn,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Brand name
                  Text(
                    'Zipminator',
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: QuantumTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Tagline
                  Text(
                    'Post-Quantum Security',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: QuantumTheme.quantumCyan.withValues(alpha: 0.8),
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 40),

                  // --- PRIMARY: OAuth buttons ---
                  _PrimaryOAuthButton(
                    icon: Icons.g_mobiledata,
                    label: 'Continue with Google',
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF1F1F1F),
                    onPressed: () => ref
                        .read(authProvider.notifier)
                        .signInWithOAuth(OAuthProvider.google),
                  ),
                  const SizedBox(height: 12),
                  _PrimaryOAuthButton(
                    icon: Icons.apple,
                    label: 'Continue with Apple',
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    onPressed: () =>
                        ref.read(authProvider.notifier).signInWithApple(),
                  ),
                  const SizedBox(height: 12),
                  _PrimaryOAuthButton(
                    icon: Icons.code,
                    label: 'Continue with GitHub',
                    backgroundColor: const Color(0xFF24292F),
                    foregroundColor: Colors.white,
                    onPressed: () => ref
                        .read(authProvider.notifier)
                        .signInWithOAuth(OAuthProvider.github),
                  ),
                  const SizedBox(height: 12),
                  _PrimaryOAuthButton(
                    icon: Icons.business,
                    label: 'Continue with LinkedIn',
                    backgroundColor: const Color(0xFF0A66C2),
                    foregroundColor: Colors.white,
                    onPressed: () => ref
                        .read(authProvider.notifier)
                        .signInWithOAuth(OAuthProvider.linkedinOidc),
                  ),
                  const SizedBox(height: 28),

                  // --- Divider ---
                  Row(
                    children: [
                      Expanded(
                        child: Divider(
                          color: QuantumTheme.textSecondary.withValues(
                            alpha: 0.3,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'or continue with email',
                          style: TextStyle(
                            color: QuantumTheme.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Divider(
                          color: QuantumTheme.textSecondary.withValues(
                            alpha: 0.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // --- SECONDARY: Email/password form card ---
                  QuantumCard(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            _isSignUp ? 'Create Account' : 'Welcome Back',
                            style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w600,
                              color: QuantumTheme.textPrimary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),

                          // Email field
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            autocorrect: false,
                            decoration: const InputDecoration(
                              labelText: 'Email',
                              prefixIcon: Icon(Icons.email_outlined),
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Email is required';
                              }
                              if (!v.contains('@')) return 'Invalid email';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Password field
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              labelText: 'Password',
                              prefixIcon: const Icon(Icons.lock_outline),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                ),
                                onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword,
                                ),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return 'Password is required';
                              }
                              if (v.length < 6) {
                                return 'At least 6 characters';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 8),

                          // Error message
                          if (auth.error != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Text(
                                auth.error!,
                                style: const TextStyle(
                                  color: QuantumTheme.quantumRed,
                                  fontSize: 13,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),

                          const SizedBox(height: 16),

                          // Submit button
                          SizedBox(
                            height: 48,
                            child: ElevatedButton(
                              onPressed: auth.isLoading ? null : _submit,
                              child: auth.isLoading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Text(_isSignUp ? 'Sign Up' : 'Sign In'),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Toggle sign in / sign up
                          TextButton(
                            onPressed: () =>
                                setState(() => _isSignUp = !_isSignUp),
                            child: Text(
                              _isSignUp
                                  ? 'Already have an account? Sign In'
                                  : "Don't have an account? Sign Up",
                              style: TextStyle(
                                color: QuantumTheme.quantumCyan
                                    .withValues(alpha: 0.9),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // --- Skip / Continue without account ---
                  TextButton(
                    onPressed: () {
                      if (Navigator.of(context).canPop()) {
                        Navigator.of(context).pushReplacementNamed('/vault');
                      } else {
                        Navigator.of(context).pushNamed('/vault');
                      }
                    },
                    child: Text(
                      'Continue without account',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: QuantumTheme.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ));
  }
}

class _PrimaryOAuthButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color foregroundColor;
  final VoidCallback onPressed;

  const _PrimaryOAuthButton({
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 22, color: foregroundColor),
        label: Text(
          label,
          style: TextStyle(
            color: foregroundColor,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
      ),
    );
  }
}
