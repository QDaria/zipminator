import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 9: Q-Mesh — Quantum-secured mesh networking via WiFi CSI.
class MeshScreen extends StatefulWidget {
  const MeshScreen({super.key});

  @override
  State<MeshScreen> createState() => _MeshScreenState();
}

class _MeshScreenState extends State<MeshScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  bool _scanning = false;
  List<_MeshNode> _discoveredNodes = [];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _scanForDevices() async {
    setState(() {
      _scanning = true;
      _discoveredNodes = [];
    });
    HapticFeedback.lightImpact();

    // Simulate staggered discovery of 3 ESP32-S3 nodes
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() {
      _discoveredNodes.add(_MeshNode(
        name: 'ESP32-S3 Kitchen',
        ip: '192.168.4.11',
        rssi: -42,
      ));
    });

    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() {
      _discoveredNodes.add(_MeshNode(
        name: 'ESP32-S3 Hallway',
        ip: '192.168.4.23',
        rssi: -58,
      ));
    });

    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    setState(() {
      _discoveredNodes.add(_MeshNode(
        name: 'ESP32-S3 Office',
        ip: '192.168.4.37',
        rssi: -65,
      ));
      _scanning = false;
    });
    HapticFeedback.mediumImpact();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Q-Mesh')),
      body: GradientBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PillarStatusBanner(
                description: 'Quantum-secured mesh networking',
                status: PillarStatus.ready,
              ),

              PillarHeader(
                icon: Icons.hub_outlined,
                title: 'Q-Mesh',
                subtitle: 'WiFi CSI Mesh Network',
                iconColor: QuantumTheme.quantumCyan,
                badges: [
                  PqcBadge(
                    label: 'QRNG Entropy',
                    color: QuantumTheme.quantumCyan,
                    isActive: true,
                  ),
                ],
              ),

              // ── Mesh Visualization ────────────────────────────────
              QuantumCard(
                glowColor: QuantumTheme.quantumCyan,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.hub, color: QuantumTheme.quantumCyan),
                        const SizedBox(width: 8),
                        Text('Mesh Topology',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 200,
                      child: AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return CustomPaint(
                            size: Size.infinite,
                            painter: _MeshPainter(
                              pulse: _pulseController.value,
                              nodeCount:
                                  5 + _discoveredNodes.length,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

              const SizedBox(height: 16),

              // ── Scan for Devices ──────────────────────────────────
              QuantumCard(
                glowColor: QuantumTheme.quantumBlue,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.wifi_find,
                            color: QuantumTheme.quantumBlue),
                        const SizedBox(width: 8),
                        Text('Device Discovery',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _scanning ? null : _scanForDevices,
                        icon: _scanning
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.radar, size: 18),
                        label: Text(
                            _scanning ? 'Scanning...' : 'Scan for Devices'),
                      ),
                    ),
                    if (_discoveredNodes.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      for (final node in _discoveredNodes)
                        _NodeTile(node: node),
                    ],
                    if (!_scanning && _discoveredNodes.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'Tap scan to discover nearby ESP32-S3 mesh nodes.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: QuantumTheme.textSecondary,
                              ),
                        ),
                      ),
                  ],
                ),
              ).animate().fadeIn(delay: 100.ms, duration: 400.ms),

              const SizedBox(height: 16),

              // ── WiFi Sensing ──────────────────────────────────────
              QuantumCard(
                glowColor: QuantumTheme.quantumGreen,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.sensors,
                            color: QuantumTheme.quantumGreen),
                        const SizedBox(width: 8),
                        Text('WiFi Sensing',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Detect presence, breathing, heartbeat through walls '
                      '-- no cameras needed.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 12),
                    _SensingCapability(
                      icon: Icons.person_search,
                      label: 'Presence Detection',
                      detail: 'Room occupancy via CSI amplitude shifts',
                    ),
                    _SensingCapability(
                      icon: Icons.air,
                      label: 'Respiratory Monitoring',
                      detail: 'Breathing rate from subcarrier phase variation',
                    ),
                    _SensingCapability(
                      icon: Icons.favorite,
                      label: 'Heartbeat Sensing',
                      detail: 'Heart rate via micro-Doppler extraction',
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

              const SizedBox(height: 16),

              // ── Quantum Authentication ────────────────────────────
              QuantumCard(
                glowColor: QuantumTheme.quantumPurple,
                animateGlow: true,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.fingerprint,
                            color: QuantumTheme.quantumPurple),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text('Quantum Authentication',
                              style:
                                  Theme.of(context).textTheme.titleMedium),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: QuantumTheme.quantumOrange
                                .withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Patent pending',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: QuantumTheme.quantumOrange,
                                  fontSize: 10,
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "Your body's unique RF signature replaces passwords. "
                      'Powered by Gaussian Splatting WiFi CSI reconstruction.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _AuthStep(
                            step: '1', label: 'CSI\nCapture', isActive: true),
                        _AuthArrow(),
                        _AuthStep(
                            step: '2',
                            label: '3D Gauss\nSplat',
                            isActive: true),
                        _AuthArrow(),
                        _AuthStep(
                            step: '3',
                            label: 'RF\nSignature',
                            isActive: true),
                        _AuthArrow(),
                        _AuthStep(
                            step: '4',
                            label: 'PQC\nVerify',
                            isActive: true),
                      ],
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 300.ms, duration: 400.ms),

              const SizedBox(height: 16),

              // ── Entropy Flow ──────────────────────────────────────
              QuantumCard(
                glowColor: QuantumTheme.quantumCyan,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.shuffle,
                            color: QuantumTheme.quantumCyan),
                        const SizedBox(width: 8),
                        Text('Entropy Flow',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 60,
                      child: AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return CustomPaint(
                            size: Size.infinite,
                            painter: _EntropyFlowPainter(
                                phase: _pulseController.value),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _FlowLabel(
                          label: 'QRNG Pool',
                          color: QuantumTheme.quantumCyan,
                        ),
                        _FlowLabel(
                          label: 'Key Derivation',
                          color: QuantumTheme.quantumPurple,
                        ),
                        _FlowLabel(
                          label: 'Mesh Key',
                          color: QuantumTheme.quantumGreen,
                        ),
                      ],
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 400.ms, duration: 400.ms),

              const SizedBox(height: 16),

              // ── How it works ──────────────────────────────────────
              QuantumCard(
                glowColor: QuantumTheme.quantumPurple,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('How it works',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    _StepTile(
                      step: '1',
                      title: 'Discover',
                      description:
                          'Scan for nearby devices using WiFi CSI fingerprints.',
                    ),
                    _StepTile(
                      step: '2',
                      title: 'Key Exchange',
                      description:
                          'Establish PQC session keys via ML-KEM-768 encapsulation.',
                    ),
                    _StepTile(
                      step: '3',
                      title: 'Mesh',
                      description:
                          'Form encrypted mesh network with quantum-safe tunnels.',
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 500.ms, duration: 400.ms),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Mesh Topology Painter — 5+ nodes with pulsing glow connections
// ═══════════════════════════════════════════════════════════════════════════

class _MeshPainter extends CustomPainter {
  final double pulse;
  final int nodeCount;

  _MeshPainter({required this.pulse, required this.nodeCount});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final radius = min(cx, cy) * 0.7;

    // Compute node positions: center node + ring nodes
    final nodes = <Offset>[Offset(cx, cy)];
    final ringCount = min(nodeCount - 1, 7);
    for (int i = 0; i < ringCount; i++) {
      final angle = (2 * pi * i / ringCount) - pi / 2;
      nodes.add(Offset(
        cx + radius * cos(angle),
        cy + radius * sin(angle),
      ));
    }

    // Draw connections
    final linePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    for (int i = 0; i < nodes.length; i++) {
      for (int j = i + 1; j < nodes.length; j++) {
        final alpha = (0.15 + 0.15 * sin(pulse * 2 * pi + i * 0.7))
            .clamp(0.05, 0.4);
        linePaint.color =
            const Color(0xFF00E5FF).withValues(alpha: alpha);
        canvas.drawLine(nodes[i], nodes[j], linePaint);
      }
    }

    // Draw nodes
    for (int i = 0; i < nodes.length; i++) {
      final isCenter = i == 0;
      final nodeRadius = isCenter ? 10.0 : 7.0;
      final glowRadius = nodeRadius + 8 + 4 * sin(pulse * 2 * pi + i);

      // Glow
      final glowPaint = Paint()
        ..color = const Color(0xFF00E5FF)
            .withValues(alpha: 0.15 + 0.1 * sin(pulse * 2 * pi + i))
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
      canvas.drawCircle(nodes[i], glowRadius, glowPaint);

      // Fill
      final fillPaint = Paint()
        ..color = isCenter
            ? const Color(0xFF00E5FF)
            : const Color(0xFF7C4DFF);
      canvas.drawCircle(nodes[i], nodeRadius, fillPaint);

      // Border
      final borderPaint = Paint()
        ..color = Colors.white.withValues(alpha: 0.6)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;
      canvas.drawCircle(nodes[i], nodeRadius, borderPaint);
    }
  }

  @override
  bool shouldRepaint(_MeshPainter oldDelegate) =>
      oldDelegate.pulse != pulse || oldDelegate.nodeCount != nodeCount;
}

// ═══════════════════════════════════════════════════════════════════════════
// Entropy Flow Painter — bits flowing left-to-right
// ═══════════════════════════════════════════════════════════════════════════

class _EntropyFlowPainter extends CustomPainter {
  final double phase;

  _EntropyFlowPainter({required this.phase});

  @override
  void paint(Canvas canvas, Size size) {
    final rng = Random(42);
    final cy = size.height / 2;

    // Draw flow path
    final pathPaint = Paint()
      ..color = const Color(0xFF00E5FF).withValues(alpha: 0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 24
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(20, cy),
      Offset(size.width - 20, cy),
      pathPaint,
    );

    // Draw flowing bits
    const bitCount = 12;
    for (int i = 0; i < bitCount; i++) {
      final t = ((phase + i / bitCount) % 1.0);
      final x = 20 + t * (size.width - 40);
      final yOff = sin(t * pi * 3 + i) * 8;
      final alpha = sin(t * pi).clamp(0.0, 1.0);

      // Color transitions from cyan -> purple -> green along the path
      final Color color;
      if (t < 0.4) {
        color = const Color(0xFF00E5FF);
      } else if (t < 0.7) {
        color = const Color(0xFF7C4DFF);
      } else {
        color = const Color(0xFF00E676);
      }

      final bitPaint = Paint()
        ..color = color.withValues(alpha: alpha * 0.8)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);

      final bitSize = 3.0 + rng.nextDouble() * 2;
      canvas.drawCircle(Offset(x, cy + yOff), bitSize, bitPaint);
    }

    // Source and destination markers
    final markerPaint = Paint()..style = PaintingStyle.fill;

    markerPaint.color = const Color(0xFF00E5FF);
    canvas.drawCircle(Offset(20, cy), 5, markerPaint);

    markerPaint.color = const Color(0xFF7C4DFF);
    canvas.drawCircle(Offset(size.width / 2, cy), 5, markerPaint);

    markerPaint.color = const Color(0xFF00E676);
    canvas.drawCircle(Offset(size.width - 20, cy), 5, markerPaint);
  }

  @override
  bool shouldRepaint(_EntropyFlowPainter oldDelegate) =>
      oldDelegate.phase != phase;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper widgets
// ═══════════════════════════════════════════════════════════════════════════

class _MeshNode {
  final String name;
  final String ip;
  final int rssi;

  const _MeshNode({
    required this.name,
    required this.ip,
    required this.rssi,
  });
}

class _NodeTile extends StatelessWidget {
  final _MeshNode node;

  const _NodeTile({required this.node});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: QuantumTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: QuantumTheme.quantumCyan.withValues(alpha: 0.15),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: QuantumTheme.quantumGreen,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(node.name,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  Text(node.ip,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontFamily: 'JetBrains Mono',
                            color: QuantumTheme.textSecondary,
                            fontSize: 11,
                          )),
                ],
              ),
            ),
            Text('${node.rssi} dBm',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: QuantumTheme.quantumCyan,
                    )),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideX(begin: 0.05);
  }
}

class _SensingCapability extends StatelessWidget {
  final IconData icon;
  final String label;
  final String detail;

  const _SensingCapability({
    required this.icon,
    required this.label,
    required this.detail,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: QuantumTheme.quantumGreen),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                Text(detail,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: QuantumTheme.textSecondary,
                        )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthStep extends StatelessWidget {
  final String step;
  final String label;
  final bool isActive;

  const _AuthStep({
    required this.step,
    required this.label,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: isActive
                ? QuantumTheme.quantumPurple.withValues(alpha: 0.2)
                : QuantumTheme.surfaceElevated,
            child: Text(step,
                style: TextStyle(
                  color: isActive
                      ? QuantumTheme.quantumPurple
                      : QuantumTheme.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                )),
          ),
          const SizedBox(height: 4),
          Text(label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: QuantumTheme.textSecondary,
                    fontSize: 9,
                    height: 1.2,
                  )),
        ],
      ),
    );
  }
}

class _AuthArrow extends StatelessWidget {
  const _AuthArrow();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Icon(
        Icons.chevron_right,
        size: 16,
        color: QuantumTheme.quantumPurple.withValues(alpha: 0.5),
      ),
    );
  }
}

class _FlowLabel extends StatelessWidget {
  final String label;
  final Color color;

  const _FlowLabel({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: QuantumTheme.textSecondary,
                  fontSize: 10,
                )),
      ],
    );
  }
}

class _StepTile extends StatelessWidget {
  final String step;
  final String title;
  final String description;

  const _StepTile({
    required this.step,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor:
                QuantumTheme.quantumCyan.withValues(alpha: 0.2),
            child: Text(step,
                style: const TextStyle(
                    color: QuantumTheme.quantumCyan,
                    fontSize: 12,
                    fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                Text(description,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
