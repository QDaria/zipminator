import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// First-time onboarding: pick a username after sign-in.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _saving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final username = _controller.text.trim().toLowerCase();
    await ref.read(authProvider.notifier).updateProfile(username: username);

    if (mounted) {
      final auth = ref.read(authProvider);
      if (auth.error != null) {
        setState(() => _saving = false);
      } else {
        // Check if welcome tour has been completed
        final prefs = await SharedPreferences.getInstance();
        final onboardingComplete = prefs.getBool('onboarding_complete') ?? false;
        if (mounted) {
          context.go(onboardingComplete ? '/home' : '/welcome');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final size = MediaQuery.sizeOf(context);
    final isWide = size.width > 600;

    return Scaffold(
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
                  Icon(
                    Icons.person_add_alt_1,
                    size: 64,
                    color: QuantumTheme.quantumCyan,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Choose Your Username',
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: QuantumTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'This is how other Zipminator users will find you.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: QuantumTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  QuantumCard(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Show who they signed in as
                          Text(
                            'Signed in as ${auth.displayName}',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: QuantumTheme.quantumCyan
                                  .withValues(alpha: 0.8),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 20),

                          TextFormField(
                            controller: _controller,
                            autocorrect: false,
                            textInputAction: TextInputAction.done,
                            decoration: const InputDecoration(
                              labelText: 'Username',
                              prefixIcon: Icon(Icons.alternate_email),
                              hintText: 'e.g. sharareh',
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Username is required';
                              }
                              final u = v.trim();
                              if (u.length < 3) return 'At least 3 characters';
                              if (u.length > 30) return 'Max 30 characters';
                              if (!RegExp(r'^[a-zA-Z0-9._-]+$').hasMatch(u)) {
                                return 'Letters, numbers, . _ - only';
                              }
                              return null;
                            },
                            onFieldSubmitted: (_) => _save(),
                          ),
                          const SizedBox(height: 8),

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

                          SizedBox(
                            height: 48,
                            child: ElevatedButton(
                              onPressed: _saving ? null : _save,
                              child: _saving
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text('Continue'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
