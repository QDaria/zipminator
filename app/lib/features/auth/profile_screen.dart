import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Profile screen showing user info, linked providers, and logout.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return GradientBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 16),

            // Header
            Text(
              'Profile',
              style: GoogleFonts.outfit(
                fontSize: 28,
                fontWeight: FontWeight.w600,
                color: QuantumTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 24),

            // Avatar + email card
            QuantumCard(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor:
                        QuantumTheme.quantumCyan.withValues(alpha: 0.2),
                    child: Text(
                      _initials(user),
                      style: GoogleFonts.outfit(
                        fontSize: 28,
                        fontWeight: FontWeight.w600,
                        color: QuantumTheme.quantumCyan,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.email ?? 'Not signed in',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      color: QuantumTheme.textPrimary,
                    ),
                  ),
                  if (user?.id != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'ID: ${user!.id.substring(0, 8)}...',
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 12,
                        color: QuantumTheme.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Linked providers
            QuantumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Linked Providers',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: QuantumTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (user?.appMetadata['providers'] != null)
                    ..._buildProviderChips(
                      List<String>.from(
                        user!.appMetadata['providers'] as List,
                      ),
                    )
                  else
                    Text(
                      'No linked providers',
                      style: TextStyle(color: QuantumTheme.textSecondary),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // App info
            QuantumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'App Info',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: QuantumTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _InfoRow(label: 'Version', value: '0.2.0-beta'),
                  _InfoRow(label: 'Crypto Engine', value: 'ML-KEM-768'),
                  _InfoRow(label: 'Standard', value: 'NIST FIPS 203'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout button
            SizedBox(
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).signOut();
                  if (context.mounted) context.go('/login');
                },
                icon: const Icon(Icons.logout, color: QuantumTheme.quantumRed),
                label: Text(
                  'Sign Out',
                  style: TextStyle(color: QuantumTheme.quantumRed),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: QuantumTheme.quantumRed.withValues(alpha: 0.5),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _initials(dynamic user) {
    if (user == null) return '?';
    final email = user.email as String? ?? '';
    if (email.isEmpty) return '?';
    return email[0].toUpperCase();
  }

  List<Widget> _buildProviderChips(List<String> providers) {
    return [
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: providers.map((p) {
          return Chip(
            avatar: Icon(_providerIcon(p), size: 16),
            label: Text(p),
          );
        }).toList(),
      ),
    ];
  }

  IconData _providerIcon(String provider) {
    return switch (provider) {
      'google' => Icons.g_mobiledata,
      'github' => Icons.code,
      'linkedin' || 'linkedin_oidc' => Icons.business,
      'email' => Icons.email_outlined,
      _ => Icons.link,
    };
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: QuantumTheme.textSecondary,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 14,
              color: QuantumTheme.quantumCyan,
            ),
          ),
        ],
      ),
    );
  }
}
