import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Home dashboard: branded header + Q-AI hero + pillar grid.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  static const _pillars = [
    _Pillar('/vault', Icons.lock, 'Vault', QuantumTheme.quantumCyan),
    _Pillar('/messenger', Icons.chat_bubble, 'Messenger', QuantumTheme.quantumGreen),
    _Pillar('/voip', Icons.phone, 'VoIP', QuantumTheme.quantumBlue),
    _Pillar('/vpn', Icons.vpn_key, 'VPN', QuantumTheme.quantumPurple),
    _Pillar('/browser', Icons.language, 'Browser', QuantumTheme.quantumOrange),
    _Pillar('/email', Icons.email, 'Email', QuantumTheme.quantumCyan),
    _Pillar('/anonymizer', Icons.visibility_off, 'Anonymizer', QuantumTheme.quantumOrange),
    _Pillar('/mesh', Icons.hub, 'Q-Mesh', QuantumTheme.quantumGreen),
    _Pillar('/settings', Icons.settings, 'Settings', QuantumTheme.quantumPurple),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              children: [
                const SizedBox(height: 16),

                // ── Branded Header ───────────────────────────────────
                SvgPicture.asset(
                  'assets/logos/Zipminator_0_light.svg',
                  width: 200,
                  colorFilter: const ColorFilter.mode(
                    Colors.white,
                    BlendMode.srcIn,
                  ),
                ).animate().fadeIn(duration: 600.ms).slideY(begin: -0.2),
                const SizedBox(height: 8),
                Text(
                  'By',
                  style: TextStyle(
                    color: QuantumTheme.textSecondary,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 6),
                Image.asset(
                  'assets/logos/QDaria_logo_teal.png',
                  width: 120,
                  fit: BoxFit.contain,
                ).animate().fadeIn(delay: 200.ms, duration: 500.ms),
                const SizedBox(height: 28),

                // ── Q-AI Personal Assistant Hero Card ─────────────────
                GestureDetector(
                  onTap: () => context.go('/ai'),
                  child: _QaiHeroCard(),
                ).animate().fadeIn(delay: 300.ms, duration: 500.ms)
                    .slideY(begin: 0.1),
                const SizedBox(height: 12),

                // ── Q-AI Quick Access Card ────────────────────────────
                GestureDetector(
                  onTap: () => context.go('/ai'),
                  child: _QaiQuickCard(),
                ).animate().fadeIn(delay: 400.ms, duration: 500.ms)
                    .slideY(begin: 0.1),
                const SizedBox(height: 24),

                // ── Pillar Grid (2 rows) ──────────────────────────────
                _buildPillarGrid(context),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPillarGrid(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(
            '9 Pillars of Quantum Security',
            style: TextStyle(
              color: QuantumTheme.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w500,
              letterSpacing: 0.5,
            ),
          ),
        ).animate().fadeIn(delay: 500.ms, duration: 400.ms),
        GridView.count(
          crossAxisCount: MediaQuery.sizeOf(context).width > 600 ? 5 : 3,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: _pillars.asMap().entries.map((entry) {
            final i = entry.key;
            final p = entry.value;
            return _PillarButton(pillar: p, index: i);
          }).toList(),
        ).animate().fadeIn(delay: 600.ms, duration: 500.ms),
      ],
    );
  }
}

class _QaiHeroCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            QuantumTheme.quantumAmber.withValues(alpha: 0.12),
            QuantumTheme.quantumOrange.withValues(alpha: 0.08),
          ],
        ),
        border: Border.all(
          color: QuantumTheme.quantumAmber.withValues(alpha: 0.35),
        ),
        boxShadow: [
          BoxShadow(
            color: QuantumTheme.quantumAmber.withValues(alpha: 0.15),
            blurRadius: 24,
            spreadRadius: -4,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  QuantumTheme.quantumAmber.withValues(alpha: 0.8),
                  QuantumTheme.quantumOrange.withValues(alpha: 0.6),
                ],
              ),
            ),
            child: const Icon(Icons.psychology, color: Colors.white, size: 26),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    SvgPicture.asset(
                      'assets/logos/QDwordmark2.svg',
                      width: 70,
                    ),
                    const SizedBox(width: 6),
                    const Flexible(
                      child: Text(
                        'Q-AI Personal Assistant',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Powered by Gemma 4, on-device, private, personal',
                  style: TextStyle(
                    color: QuantumTheme.quantumAmber.withValues(alpha: 0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.arrow_forward_ios,
            color: QuantumTheme.quantumAmber.withValues(alpha: 0.5),
            size: 16,
          ),
        ],
      ),
    );
  }
}

class _QaiQuickCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: QuantumTheme.quantumRose.withValues(alpha: 0.08),
        border: Border.all(
          color: QuantumTheme.quantumRose.withValues(alpha: 0.25),
        ),
      ),
      child: Row(
        children: [
          SvgPicture.asset('assets/logos/QDwordmark2.svg', width: 60),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Q-AI Assistant',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Icon(
            Icons.arrow_forward_ios,
            color: QuantumTheme.quantumRose.withValues(alpha: 0.5),
            size: 14,
          ),
        ],
      ),
    );
  }
}

class _PillarButton extends StatelessWidget {
  final _Pillar pillar;
  final int index;

  const _PillarButton({required this.pillar, required this.index});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.go(pillar.path),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: pillar.color.withValues(alpha: 0.08),
            border: Border.all(
              color: pillar.color.withValues(alpha: 0.2),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(pillar.icon, color: pillar.color, size: 28),
              const SizedBox(height: 6),
              Text(
                pillar.label,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    ).animate(delay: Duration(milliseconds: 600 + index * 50))
        .fadeIn(duration: 300.ms)
        .scale(begin: const Offset(0.9, 0.9), end: const Offset(1, 1));
  }
}

class _Pillar {
  final String path;
  final IconData icon;
  final String label;
  final Color color;

  const _Pillar(this.path, this.icon, this.label, this.color);
}
