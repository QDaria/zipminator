import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zipminator/core/providers/biometric_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// First-login welcome tour: 5 glass morphic cards with swipe navigation.
/// Shown once; flag saved in SharedPreferences.
class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  final _pageController = PageController();
  int _currentPage = 0;
  static const _pageCount = 5;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_complete', true);
    if (mounted) context.go('/home');
  }

  void _nextPage() {
    if (_currentPage < _pageCount - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      _completeOnboarding();
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Skip button
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextButton(
                    onPressed: _completeOnboarding,
                    child: Text(
                      'Skip',
                      style: TextStyle(color: QuantumTheme.textSecondary),
                    ),
                  ),
                ),
              ),

              // Pages
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (i) => setState(() => _currentPage = i),
                  children: [
                    _WelcomeCard(),
                    _FeaturesCard(),
                    _SecurityCard(),
                    _UniquenessCard(),
                    _GetStartedCard(
                      onComplete: _completeOnboarding,
                      ref: ref,
                    ),
                  ],
                ),
              ),

              // Navigation: arrows + dots
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 20,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back arrow
                    IconButton(
                      onPressed: _currentPage > 0 ? _prevPage : null,
                      icon: Icon(
                        Icons.arrow_back_ios,
                        color: _currentPage > 0
                            ? QuantumTheme.quantumCyan
                            : QuantumTheme.textSecondary.withValues(alpha: 0.3),
                      ),
                    ),
                    // Dot indicators
                    Row(
                      children: List.generate(_pageCount, (i) {
                        final isActive = i == _currentPage;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: isActive ? 24 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            color: isActive
                                ? QuantumTheme.quantumCyan
                                : QuantumTheme.textSecondary
                                    .withValues(alpha: 0.3),
                          ),
                        );
                      }),
                    ),
                    // Forward arrow / Get Started
                    _currentPage < _pageCount - 1
                        ? IconButton(
                            onPressed: _nextPage,
                            icon: const Icon(
                              Icons.arrow_forward_ios,
                              color: QuantumTheme.quantumCyan,
                            ),
                          )
                        : TextButton(
                            onPressed: _completeOnboarding,
                            child: const Text(
                              'Start',
                              style: TextStyle(
                                color: QuantumTheme.quantumCyan,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Card 1: Welcome ─────────────────────────────────────────────────────

class _WelcomeCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _CardWrapper(
      glowColor: QuantumTheme.quantumCyan,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SvgPicture.asset(
            'assets/logos/Zipminator_0_light.svg',
            width: 220,
            colorFilter: const ColorFilter.mode(
              Colors.white,
              BlendMode.srcIn,
            ),
          ).animate().fadeIn(duration: 800.ms).scale(
                begin: const Offset(0.8, 0.8),
                end: const Offset(1, 1),
              ),
          const SizedBox(height: 24),
          Text(
            'Welcome to Zipminator',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 300.ms, duration: 500.ms),
          const SizedBox(height: 12),
          Text(
            'The World\'s First\nPost-Quantum Cyber Security Super-App',
            style: TextStyle(
              color: QuantumTheme.quantumCyan.withValues(alpha: 0.8),
              fontSize: 15,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 500.ms, duration: 500.ms),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('By ', style: TextStyle(color: QuantumTheme.textSecondary)),
              Image.asset(
                'assets/logos/QDaria_logo_teal.png',
                width: 80,
              ),
            ],
          ).animate().fadeIn(delay: 700.ms, duration: 400.ms),
        ],
      ),
    );
  }
}

// ── Card 2: Features ────────────────────────────────────────────────────

class _FeaturesCard extends StatelessWidget {
  static const _features = [
    (Icons.lock, 'Vault', QuantumTheme.quantumCyan),
    (Icons.chat_bubble, 'Messenger', QuantumTheme.quantumGreen),
    (Icons.phone, 'VoIP', QuantumTheme.quantumBlue),
    (Icons.vpn_key, 'VPN', QuantumTheme.quantumPurple),
    (Icons.language, 'Browser', QuantumTheme.quantumOrange),
    (Icons.email, 'Email', QuantumTheme.quantumCyan),
    (Icons.psychology, 'Q-AI', QuantumTheme.quantumAmber),
    (Icons.visibility_off, 'Anonymizer', QuantumTheme.quantumOrange),
    (Icons.hub, 'Q-Mesh', QuantumTheme.quantumGreen),
  ];

  @override
  Widget build(BuildContext context) {
    return _CardWrapper(
      glowColor: QuantumTheme.quantumPurple,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '9 Pillars of\nQuantum-Safe Security',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            alignment: WrapAlignment.center,
            children: _features.asMap().entries.map((entry) {
              final i = entry.key;
              final (icon, label, color) = entry.value;
              return SizedBox(
                width: 80,
                child: Column(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: color.withValues(alpha: 0.15),
                        border: Border.all(
                          color: color.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Icon(icon, color: color, size: 24),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      label,
                      style: TextStyle(color: Colors.white, fontSize: 11),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ).animate(delay: Duration(milliseconds: 200 + i * 80))
                  .fadeIn(duration: 300.ms)
                  .scale(
                    begin: const Offset(0.8, 0.8),
                    end: const Offset(1, 1),
                  );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

// ── Card 3: Security ────────────────────────────────────────────────────

class _SecurityCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _CardWrapper(
      glowColor: QuantumTheme.quantumGreen,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  QuantumTheme.quantumGreen.withValues(alpha: 0.8),
                  QuantumTheme.quantumCyan.withValues(alpha: 0.4),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: QuantumTheme.quantumGreen.withValues(alpha: 0.3),
                  blurRadius: 20,
                ),
              ],
            ),
            child: const Icon(Icons.shield, size: 36, color: Colors.white),
          ),
          const SizedBox(height: 20),
          Text(
            'Military-Grade Encryption',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ...[
            ('ML-KEM-768 (NIST FIPS 203)', Icons.verified_user),
            ('3 Patents Pending (46 claims)', Icons.article),
            ('On-Device AI; Your Data Never Leaves', Icons.phone_android),
            ('Zero-Knowledge Architecture', Icons.remove_red_eye),
          ].asMap().entries.map((entry) {
            final i = entry.key;
            final (text, icon) = entry.value;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Icon(icon, color: QuantumTheme.quantumGreen, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      text,
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ).animate(delay: Duration(milliseconds: 300 + i * 150))
                .fadeIn(duration: 400.ms)
                .slideX(begin: -0.1);
          }),
        ],
      ),
    );
  }
}

// ── Card 4: Uniqueness ──────────────────────────────────────────────────

class _UniquenessCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _CardWrapper(
      glowColor: QuantumTheme.quantumAmber,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  QuantumTheme.quantumAmber.withValues(alpha: 0.8),
                  QuantumTheme.quantumOrange.withValues(alpha: 0.4),
                ],
              ),
            ),
            child:
                const Icon(Icons.diamond_outlined, size: 36, color: Colors.white),
          ),
          const SizedBox(height: 20),
          Text(
            'What Makes Us Different',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ...[
            'Quantum Random Number Generation\n(156-qubit IBM Quantum)',
            'Post-Quantum Cryptography built in Rust',
            '10-Level Certified Anonymization',
            'On-Device Gemma 4 AI\nNo API Keys, No Cloud',
          ].asMap().entries.map((entry) {
            final i = entry.key;
            final text = entry.value;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.star, color: QuantumTheme.quantumAmber, size: 18),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      text,
                      style: TextStyle(color: Colors.white, fontSize: 14, height: 1.3),
                    ),
                  ),
                ],
              ),
            ).animate(delay: Duration(milliseconds: 300 + i * 150))
                .fadeIn(duration: 400.ms);
          }),
        ],
      ),
    );
  }
}

// ── Card 5: Get Started ─────────────────────────────────────────────────

class _GetStartedCard extends StatelessWidget {
  final VoidCallback onComplete;
  final WidgetRef ref;

  const _GetStartedCard({required this.onComplete, required this.ref});

  @override
  Widget build(BuildContext context) {
    return _CardWrapper(
      glowColor: QuantumTheme.quantumCyan,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  QuantumTheme.quantumCyan.withValues(alpha: 0.8),
                  QuantumTheme.quantumBlue.withValues(alpha: 0.4),
                ],
              ),
            ),
            child:
                const Icon(Icons.rocket_launch, size: 36, color: Colors.white),
          ),
          const SizedBox(height: 20),
          Text(
            'You\'re All Set!',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // Biometric toggle
          _BiometricOnboardingToggle(ref: ref),
          const SizedBox(height: 32),

          // Get Started button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: onComplete,
              style: ElevatedButton.styleFrom(
                backgroundColor: QuantumTheme.quantumCyan,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Get Started',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ).animate().fadeIn(delay: 500.ms, duration: 400.ms),
        ],
      ),
    );
  }
}

class _BiometricOnboardingToggle extends StatelessWidget {
  final WidgetRef ref;

  const _BiometricOnboardingToggle({required this.ref});

  @override
  Widget build(BuildContext context) {
    final biometric = ref.watch(biometricProvider);

    return biometric.when(
      data: (state) {
        if (!state.available) return const SizedBox.shrink();
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: QuantumTheme.quantumGreen.withValues(alpha: 0.08),
            border: Border.all(
              color: QuantumTheme.quantumGreen.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              Icon(Icons.fingerprint,
                  color: QuantumTheme.quantumGreen, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Enable Face ID',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'Extra security when you leave the app',
                      style: TextStyle(
                        color: QuantumTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: state.enabled,
                onChanged: (_) =>
                    ref.read(biometricProvider.notifier).toggle(),
                activeTrackColor:
                    QuantumTheme.quantumGreen.withValues(alpha: 0.6),
                activeThumbColor: QuantumTheme.quantumGreen,
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

// ── Shared glass morphic card wrapper ───────────────────────────────────

class _CardWrapper extends StatelessWidget {
  final Color glowColor;
  final Widget child;

  const _CardWrapper({required this.glowColor, required this.child});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: QuantumTheme.surfaceCard.withValues(alpha: 0.7),
          border: Border.all(
            color: glowColor.withValues(alpha: 0.3),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: glowColor.withValues(alpha: 0.12),
              blurRadius: 32,
              spreadRadius: -8,
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}
