import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Profile screen showing user info, linked providers, and logout.
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _usernameController = TextEditingController();
  bool _editingUsername = false;

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _saveUsername() async {
    final username = _usernameController.text.trim().toLowerCase();
    if (username.isEmpty || username.length < 3) return;
    await ref.read(authProvider.notifier).updateProfile(username: username);
    if (mounted) setState(() => _editingUsername = false);
  }

  @override
  Widget build(BuildContext context) {
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

            // Avatar + name + email card
            QuantumCard(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor:
                        QuantumTheme.quantumCyan.withValues(alpha: 0.2),
                    child: Text(
                      _initials(auth),
                      style: GoogleFonts.outfit(
                        fontSize: 28,
                        fontWeight: FontWeight.w600,
                        color: QuantumTheme.quantumCyan,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Display name
                  Text(
                    auth.displayName,
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: QuantumTheme.textPrimary,
                    ),
                  ),
                  // Username
                  if (auth.username != null && auth.username!.isNotEmpty)
                    Text(
                      '@${auth.username}',
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 14,
                        color: QuantumTheme.quantumCyan,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? 'Not signed in',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: QuantumTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Edit username
            QuantumCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Username',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: QuantumTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_editingUsername) ...[
                    TextField(
                      controller: _usernameController,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.alternate_email),
                        hintText: 'new-username',
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () =>
                              setState(() => _editingUsername = false),
                          child: const Text('Cancel'),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _saveUsername,
                          child: const Text('Save'),
                        ),
                      ],
                    ),
                  ] else
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.alternate_email,
                          color: QuantumTheme.quantumCyan),
                      title: Text(auth.username ?? 'Not set'),
                      trailing: TextButton(
                        onPressed: () {
                          _usernameController.text = auth.username ?? '';
                          setState(() => _editingUsername = true);
                        },
                        child: const Text('Change'),
                      ),
                    ),
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
                  _InfoRow(label: 'Version', value: '0.5.0-beta'),
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

  String _initials(AuthState auth) {
    final name = auth.displayName;
    if (name.isEmpty) return '?';
    // Use first letter of first and last word if available.
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
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
