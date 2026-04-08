import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/vpn_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 4: Q-VPN — PQC VPN with ML-KEM handshake and location selector.
class VpnScreen extends ConsumerWidget {
  const VpnScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vpn = ref.watch(vpnProvider);
    final notifier = ref.read(vpnProvider.notifier);

    return Scaffold(
      appBar: AppBar(),
      body: GradientBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Status banner
                const PillarStatusBanner(
                  description: 'One-tap quantum-safe VPN tunnel',
                  status: PillarStatus.ready,
                ),

                // Header
                PillarHeader(
                  icon: Icons.vpn_key_outlined,
                  title: 'Q-VPN',
                  subtitle: 'PQ-WireGuard Tunnel',
                  iconColor: QuantumTheme.quantumBlue,
                  badges: [
                    PqcBadge(
                      label: 'ML-KEM-768',
                      isActive: vpn.isActive,
                      color: QuantumTheme.quantumBlue,
                    ),
                  ],
                ),

                // Location selector
                QuantumCard(
                  glowColor: QuantumTheme.quantumBlue,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Server Location',
                          style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 8),

                      // Region selector chips
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: VpnRegion.values.map((region) {
                            final isSelected =
                                vpn.selectedRegion == region;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(region.label),
                                selected: isSelected,
                                selectedColor: QuantumTheme.quantumBlue
                                    .withValues(alpha: 0.3),
                                side: BorderSide(
                                  color: isSelected
                                      ? QuantumTheme.quantumBlue
                                          .withValues(alpha: 0.6)
                                      : QuantumTheme.quantumBlue
                                          .withValues(alpha: 0.15),
                                ),
                                labelStyle: TextStyle(
                                  color: isSelected
                                      ? QuantumTheme.quantumBlue
                                      : null,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : null,
                                  fontSize: 12,
                                ),
                                onSelected: vpn.isActive
                                    ? null
                                    : (_) =>
                                        notifier.selectRegion(region),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Country dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 2),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: QuantumTheme.quantumBlue
                                .withValues(alpha: 0.3),
                          ),
                        ),
                        child: DropdownButton<VpnLocation>(
                          value: vpn.selectedLocation,
                          isExpanded: true,
                          underline: const SizedBox.shrink(),
                          items: vpn.regionLocations.map((loc) {
                            return DropdownMenuItem(
                              value: loc,
                              child: Text(loc.displayName,
                                  style: const TextStyle(fontSize: 14)),
                            );
                          }).toList(),
                          onChanged: vpn.isActive
                              ? null
                              : (loc) {
                                  if (loc != null) {
                                    notifier.selectLocation(loc);
                                  }
                                },
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(delay: 200.ms, duration: 300.ms)
                    .slideY(begin: 0.05),
                const SizedBox(height: 16),

                // Connection indicator
                _VpnStatusIndicator(status: vpn.status)
                    .animate()
                    .fadeIn(duration: 300.ms),
                const SizedBox(height: 24),

                Text(
                  vpn.status == VpnStatus.connected
                      ? 'Connected'
                      : vpn.status == VpnStatus.connecting
                          ? 'Establishing PQ Handshake...'
                          : 'Disconnected',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),

                if (vpn.serverAddress != null)
                  Text(vpn.serverAddress!,
                      style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 32),

                // Connect/disconnect button with pulse ring
                SizedBox(
                  width: 200,
                  height: 200,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Animated pulse ring (visible when connecting)
                      if (vpn.status == VpnStatus.connecting)
                        Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: QuantumTheme.quantumCyan
                                  .withValues(alpha: 0.4),
                              width: 2,
                            ),
                          ),
                        )
                            .animate(onPlay: (c) => c.repeat())
                            .scale(
                              begin: const Offset(0.8, 0.8),
                              end: const Offset(1.3, 1.3),
                              duration: 1500.ms,
                            )
                            .fadeOut(duration: 1500.ms),
                      // Second pulse ring offset
                      if (vpn.status == VpnStatus.connecting)
                        Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: QuantumTheme.quantumCyan
                                  .withValues(alpha: 0.3),
                              width: 2,
                            ),
                          ),
                        )
                            .animate(onPlay: (c) => c.repeat())
                            .scale(
                              begin: const Offset(0.8, 0.8),
                              end: const Offset(1.3, 1.3),
                              duration: 1500.ms,
                              delay: 500.ms,
                            )
                            .fadeOut(duration: 1500.ms, delay: 500.ms),
                      // Button
                      SizedBox(
                        width: 160,
                        height: 160,
                        child: ElevatedButton(
                          onPressed:
                              vpn.status == VpnStatus.connecting ||
                                      vpn.status == VpnStatus.disconnecting
                                  ? null
                                  : () {
                                      if (vpn.isActive) {
                                        notifier.disconnect();
                                      } else {
                                        notifier.connect();
                                      }
                                    },
                          style: ElevatedButton.styleFrom(
                            shape: const CircleBorder(),
                            backgroundColor: vpn.isActive
                                ? QuantumTheme.quantumGreen
                                : QuantumTheme.surfaceElevated,
                            foregroundColor: vpn.isActive
                                ? QuantumTheme.surfaceDark
                                : QuantumTheme.textPrimary,
                          ),
                          child: Icon(
                            Icons.power_settings_new,
                            size: 64,
                            color: vpn.isActive
                                ? QuantumTheme.surfaceDark
                                : QuantumTheme.quantumCyan,
                          ),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 300.ms, duration: 400.ms),
                const SizedBox(height: 32),

                // Kill switch toggle
                QuantumCard(
                  glowColor: QuantumTheme.quantumOrange,
                  child: SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Kill Switch'),
                    subtitle:
                        const Text('Block traffic if VPN disconnects'),
                    value: vpn.killSwitchEnabled,
                    onChanged: (_) => notifier.toggleKillSwitch(),
                    activeTrackColor: QuantumTheme.quantumCyan,
                    secondary: const Icon(Icons.shield_outlined),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 500.ms, duration: 300.ms)
                    .slideY(begin: 0.05),
                const SizedBox(height: 8),

                // Location Anonymization section
                QuantumCard(
                  glowColor: QuantumTheme.quantumPurple,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Location Anonymization'),
                        subtitle: const Text(
                            'Auto-rotate relay location for plausible deniability'),
                        value: vpn.locationAnonymization,
                        onChanged: (_) =>
                            notifier.toggleLocationAnonymization(),
                        activeTrackColor: QuantumTheme.quantumPurple,
                        secondary: Icon(Icons.shuffle,
                            color: QuantumTheme.quantumPurple),
                      ),
                      if (vpn.locationAnonymization) ...[
                        const Divider(height: 1),
                        const SizedBox(height: 12),

                        // Current relay location display
                        _WorldMapWidget(
                          location: vpn.displayLocation,
                          isHidden: vpn.locationHidden,
                        ),
                        const SizedBox(height: 12),

                        // Eye toggle row
                        Row(
                          children: [
                            Icon(
                              vpn.locationHidden
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                              color: vpn.locationHidden
                                  ? QuantumTheme.quantumRed
                                  : QuantumTheme.quantumGreen,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                vpn.locationHidden
                                    ? 'Location hidden'
                                    : 'Location visible',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: vpn.locationHidden
                                          ? QuantumTheme.quantumRed
                                          : QuantumTheme.textSecondary,
                                    ),
                              ),
                            ),
                            IconButton(
                              icon: Icon(
                                vpn.locationHidden
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                                color: vpn.locationHidden
                                    ? QuantumTheme.quantumRed
                                    : QuantumTheme.quantumCyan,
                              ),
                              onPressed: () =>
                                  notifier.toggleLocationVisibility(),
                              tooltip: vpn.locationHidden
                                  ? 'Show location'
                                  : 'Hide location',
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Auto-rotate dropdown
                        Row(
                          children: [
                            Icon(Icons.autorenew,
                                color: QuantumTheme.quantumPurple,
                                size: 20),
                            const SizedBox(width: 8),
                            Text('Auto-rotate:',
                                style:
                                    Theme.of(context).textTheme.bodySmall),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 2),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: QuantumTheme.quantumPurple
                                        .withValues(alpha: 0.3),
                                  ),
                                ),
                                child: DropdownButton<RotationInterval>(
                                  value: vpn.rotationInterval,
                                  isExpanded: true,
                                  underline: const SizedBox.shrink(),
                                  style: const TextStyle(fontSize: 13),
                                  items: RotationInterval.values
                                      .map((interval) {
                                    return DropdownMenuItem(
                                      value: interval,
                                      child: Text(
                                        interval.label,
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: interval ==
                                                  RotationInterval
                                                      .everyMinute
                                              ? QuantumTheme.quantumRed
                                              : null,
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (v) {
                                    if (v != null) {
                                      notifier.setRotationInterval(v);
                                    }
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        if (vpn.rotationInterval ==
                            RotationInterval.everyMinute)
                          Padding(
                            padding:
                                const EdgeInsets.only(left: 28, top: 4),
                            child: Text(
                              'Max security: location changes every minute',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: QuantumTheme.quantumRed
                                        .withValues(alpha: 0.8),
                                    fontSize: 11,
                                  ),
                            ),
                          ),

                        // Manual rotate button
                        const SizedBox(height: 8),
                        Center(
                          child: TextButton.icon(
                            icon: const Icon(Icons.refresh, size: 18),
                            label: const Text('Rotate Now'),
                            onPressed: () => notifier.rotateLocation(),
                            style: TextButton.styleFrom(
                              foregroundColor: QuantumTheme.quantumPurple,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(delay: 550.ms, duration: 300.ms)
                    .slideY(begin: 0.05),
                const SizedBox(height: 8),

                // Protocol info
                QuantumCard(
                  glowColor: QuantumTheme.quantumPurple,
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.lock_outline,
                        color: QuantumTheme.quantumPurple),
                    title: const Text('ML-KEM-768 Handshake'),
                    subtitle: const Text('PQ-WireGuard tunnel'),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 600.ms, duration: 300.ms)
                    .slideY(begin: 0.05),
                const SizedBox(height: 24),
                const PillarFooter(pillarName: 'VPN'),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Simplified world map widget showing continent outlines with a location dot.
class _WorldMapWidget extends StatelessWidget {
  final String location;
  final bool isHidden;

  const _WorldMapWidget({
    required this.location,
    required this.isHidden,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 120,
      decoration: BoxDecoration(
        color: QuantumTheme.surfaceDark.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isHidden
              ? QuantumTheme.quantumRed.withValues(alpha: 0.3)
              : QuantumTheme.quantumPurple.withValues(alpha: 0.2),
        ),
      ),
      child: Stack(
        children: [
          // Grid lines (latitude/longitude hint)
          CustomPaint(
            size: const Size(double.infinity, 120),
            painter: _GridPainter(
              color: QuantumTheme.quantumPurple.withValues(alpha: 0.08),
            ),
          ),
          // Continent outlines (simplified dots)
          CustomPaint(
            size: const Size(double.infinity, 120),
            painter: _ContinentPainter(
              color: QuantumTheme.quantumCyan.withValues(alpha: 0.25),
            ),
          ),
          // Location dot (only when not hidden)
          if (!isHidden)
            Positioned(
              left: _longitudeToX(location),
              top: _latitudeToY(location),
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: QuantumTheme.quantumGreen,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: QuantumTheme.quantumGreen.withValues(alpha: 0.6),
                      blurRadius: 8,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
            ),
          // Location label
          Positioned(
            bottom: 6,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: QuantumTheme.surfaceCard.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isHidden
                      ? 'Unknown \u2014 Your location is hidden even from you'
                      : location,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontSize: 10,
                        color: isHidden
                            ? QuantumTheme.quantumRed
                            : QuantumTheme.quantumCyan,
                        fontFamily: 'JetBrains Mono',
                      ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Map city name to approximate X position (0-1 range scaled to widget).
  double _longitudeToX(String loc) {
    const cityX = <String, double>{
      'Oslo': 0.52,
      'Stockholm': 0.54,
      'Frankfurt': 0.50,
      'Amsterdam': 0.49,
      'London': 0.47,
      'Zurich': 0.50,
      'New York': 0.28,
      'Los Angeles': 0.14,
      'Tokyo': 0.86,
      'Singapore': 0.78,
      'Sydney': 0.90,
      'Toronto': 0.26,
      'Reykjavik': 0.40,
      'Helsinki': 0.56,
      'Bucharest': 0.56,
      'Warsaw': 0.54,
      'Prague': 0.52,
      'Mumbai': 0.72,
    };
    for (final entry in cityX.entries) {
      if (loc.contains(entry.key)) return entry.value * 280;
    }
    return 140; // center fallback
  }

  /// Map city name to approximate Y position.
  double _latitudeToY(String loc) {
    const cityY = <String, double>{
      'Oslo': 0.22,
      'Stockholm': 0.22,
      'Frankfurt': 0.30,
      'Amsterdam': 0.28,
      'London': 0.28,
      'Zurich': 0.30,
      'New York': 0.35,
      'Los Angeles': 0.38,
      'Tokyo': 0.38,
      'Singapore': 0.58,
      'Sydney': 0.78,
      'Toronto': 0.33,
      'Reykjavik': 0.18,
      'Helsinki': 0.20,
      'Bucharest': 0.32,
      'Warsaw': 0.28,
      'Prague': 0.30,
      'Mumbai': 0.52,
    };
    for (final entry in cityY.entries) {
      if (loc.contains(entry.key)) return entry.value * 110;
    }
    return 50; // center fallback
  }
}

/// Draws subtle grid lines for the world map.
class _GridPainter extends CustomPainter {
  final Color color;

  _GridPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 0.5;
    // Horizontal lines
    for (var i = 1; i < 5; i++) {
      final y = size.height * i / 5;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
    // Vertical lines
    for (var i = 1; i < 8; i++) {
      final x = size.width * i / 8;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Draws simplified continent dots on the world map.
class _ContinentPainter extends CustomPainter {
  final Color color;

  _ContinentPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    // Simplified continent positions as dot clusters (x%, y%)
    final continents = <List<double>>[
      // North America
      [0.18, 0.30], [0.22, 0.35], [0.15, 0.25], [0.25, 0.40],
      [0.20, 0.28], [0.12, 0.32],
      // South America
      [0.28, 0.60], [0.30, 0.65], [0.27, 0.70], [0.29, 0.75],
      // Europe
      [0.48, 0.25], [0.50, 0.28], [0.52, 0.30], [0.46, 0.22],
      [0.54, 0.26],
      // Africa
      [0.50, 0.48], [0.52, 0.55], [0.48, 0.60], [0.54, 0.50],
      // Asia
      [0.65, 0.30], [0.70, 0.35], [0.75, 0.28], [0.80, 0.38],
      [0.85, 0.35], [0.78, 0.50],
      // Australia
      [0.88, 0.72], [0.90, 0.75], [0.86, 0.70],
    ];

    for (final pos in continents) {
      canvas.drawCircle(
        Offset(size.width * pos[0], size.height * pos[1]),
        2.5,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _VpnStatusIndicator extends StatelessWidget {
  final VpnStatus status;

  const _VpnStatusIndicator({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      VpnStatus.connected => QuantumTheme.quantumGreen,
      VpnStatus.connecting ||
      VpnStatus.disconnecting =>
        QuantumTheme.quantumOrange,
      VpnStatus.error => QuantumTheme.quantumRed,
      VpnStatus.disconnected => QuantumTheme.textSecondary,
    };

    return SizedBox(
      width: 24,
      height: 24,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Animated pulse ring when connecting
          if (status == VpnStatus.connecting ||
              status == VpnStatus.disconnecting)
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: color.withValues(alpha: 0.5), width: 2),
              ),
            )
                .animate(onPlay: (c) => c.repeat())
                .scale(
                  begin: const Offset(1, 1),
                  end: const Offset(1.8, 1.8),
                  duration: 1200.ms,
                )
                .fadeOut(duration: 1200.ms),
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: color.withValues(alpha: 0.4), blurRadius: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
