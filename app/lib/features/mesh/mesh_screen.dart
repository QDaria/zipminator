import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 9: Q-Mesh — WiFi CSI biometric authentication and presence sensing.
class MeshScreen extends StatefulWidget {
  const MeshScreen({super.key});

  @override
  State<MeshScreen> createState() => _MeshScreenState();
}

class _MeshScreenState extends State<MeshScreen>
    with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final AnimationController _heartbeatController;
  late final AnimationController _glowController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
    _heartbeatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 833), // ~72 bpm
    )..repeat();
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _heartbeatController.dispose();
    _glowController.dispose();
    super.dispose();
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
                description: 'Biometric authentication via WiFi sensing',
                status: PillarStatus.ready,
              ),

              PillarHeader(
                icon: Icons.wifi_tethering,
                title: 'Q-Mesh',
                subtitle: 'WiFi CSI Biometric Authentication',
                iconColor: QuantumTheme.quantumCyan,
                badges: [
                  PqcBadge(
                    label: 'QRNG Entropy',
                    color: QuantumTheme.quantumCyan,
                    isActive: true,
                  ),
                  PqcBadge(
                    label: 'WiFi CSI',
                    color: QuantumTheme.quantumGreen,
                    isActive: true,
                  ),
                ],
              ),

              // 1. Room Presence View
              _buildRoomPresenceCard(context),
              const SizedBox(height: 16),

              // 2. Biometric Auth Card
              _buildBiometricAuthCard(context),
              const SizedBox(height: 16),

              // 3. Real-Time Vitals
              _buildVitalsCard(context),
              const SizedBox(height: 16),

              // 4. Sensor Network
              _buildSensorNetworkCard(context),
              const SizedBox(height: 16),

              // 5. Gaussian Splatting
              _buildGaussianSplattingCard(context),
              const SizedBox(height: 16),

              // 6. Entropy Flow
              _buildEntropyFlowCard(context),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  // ── 1. Room Presence View ──────────────────────────────────────────────

  Widget _buildRoomPresenceCard(BuildContext context) {
    return QuantumCard(
      glowColor: QuantumTheme.quantumCyan,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.people_outline, color: QuantumTheme.quantumCyan),
              const SizedBox(width: 8),
              Text(
                '2 people detected',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: QuantumTheme.quantumGreen.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'LIVE',
                  style: TextStyle(
                    color: QuantumTheme.quantumGreen,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 220,
            child: AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) {
                return CustomPaint(
                  size: Size.infinite,
                  painter: _RoomPresencePainter(
                    pulse: _pulseController.value,
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _PersonLabel(
                name: 'Mo',
                role: 'Owner',
                position: 'Standing',
                room: 'Living Room',
                color: QuantumTheme.quantumGreen,
              ),
              const SizedBox(width: 16),
              _PersonLabel(
                name: 'Unknown',
                role: 'Guest',
                position: 'Sitting',
                room: 'Kitchen',
                color: QuantumTheme.quantumOrange,
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1);
  }

  // ── 2. Biometric Auth Card ─────────────────────────────────────────────

  Widget _buildBiometricAuthCard(BuildContext context) {
    return QuantumCard(
      glowColor: QuantumTheme.quantumPurple,
      animateGlow: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.shield_outlined,
                  color: QuantumTheme.quantumPurple, size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Quantum Biometric Authentication',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color:
                      QuantumTheme.quantumOrange.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Patent pending',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: QuantumTheme.quantumOrange,
                        fontSize: 10,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            "Your body's unique RF signature replaces passwords.",
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          // Auth status
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: QuantumTheme.quantumGreen.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: QuantumTheme.quantumGreen.withValues(alpha: 0.25),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.verified_user,
                    color: QuantumTheme.quantumGreen, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Owner verified',
                        style: TextStyle(
                          color: QuantumTheme.quantumGreen,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Unauthorized users cannot access Zipminator',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: QuantumTheme.textSecondary,
                                ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Auth pipeline steps
          Row(
            children: [
              _AuthPipelineStep(
                icon: Icons.wifi,
                label: 'CSI\nCapture',
                isActive: true,
              ),
              _PipelineArrow(),
              _AuthPipelineStep(
                icon: Icons.view_in_ar,
                label: '3D Gauss\nSplat',
                isActive: true,
              ),
              _PipelineArrow(),
              _AuthPipelineStep(
                icon: Icons.fingerprint,
                label: 'RF\nSignature',
                isActive: true,
              ),
              _PipelineArrow(),
              _AuthPipelineStep(
                icon: Icons.lock_outline,
                label: 'PQC\nVerify',
                isActive: true,
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms, duration: 400.ms);
  }

  // ── 3. Real-Time Vitals ────────────────────────────────────────────────

  Widget _buildVitalsCard(BuildContext context) {
    return QuantumCard(
      glowColor: QuantumTheme.quantumGreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.monitor_heart_outlined,
                  color: QuantumTheme.quantumGreen),
              const SizedBox(width: 8),
              Text(
                'Real-Time Vitals',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Mo's vitals
          _VitalsRow(
            name: 'Mo',
            nameColor: QuantumTheme.quantumGreen,
            heartRate: 72,
            breathing: 16,
            position: 'Standing',
            confidence: 98.2,
            heartbeatController: _heartbeatController,
          ),
          const SizedBox(height: 12),
          Divider(
            color: QuantumTheme.quantumCyan.withValues(alpha: 0.1),
            height: 1,
          ),
          const SizedBox(height: 12),
          // Guest vitals
          _VitalsRow(
            name: 'Unknown',
            nameColor: QuantumTheme.quantumOrange,
            heartRate: 68,
            breathing: 14,
            position: 'Sitting',
            confidence: 91.7,
            heartbeatController: _heartbeatController,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms, duration: 400.ms);
  }

  // ── 4. Sensor Network ─────────────────────────────────────────────────

  Widget _buildSensorNetworkCard(BuildContext context) {
    return QuantumCard(
      glowColor: QuantumTheme.quantumBlue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.sensors, color: QuantumTheme.quantumBlue),
              const SizedBox(width: 8),
              Text(
                'Sensor Network',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _SensorTile(
            name: 'Living Room Sensor',
            signalStrength: 4,
            isActive: true,
          ),
          const SizedBox(height: 8),
          _SensorTile(
            name: 'Hallway Sensor',
            signalStrength: 3,
            isActive: true,
          ),
          const SizedBox(height: 8),
          _SensorTile(
            name: 'Bedroom Sensor',
            signalStrength: 2,
            isActive: true,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms, duration: 400.ms);
  }

  // ── 5. Gaussian Splatting ──────────────────────────────────────────────

  Widget _buildGaussianSplattingCard(BuildContext context) {
    return QuantumCard(
      glowColor: QuantumTheme.quantumPurple,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.view_in_ar,
                  color: QuantumTheme.quantumPurple),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'WiFi CSI \u2192 3D Body Reconstruction',
                  style:
                      Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 280,
            child: AnimatedBuilder(
              animation: _glowController,
              builder: (context, child) {
                return CustomPaint(
                  size: Size.infinite,
                  painter: _GaussianSplatPainter(
                    glow: _glowController.value,
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Reconstructed from WiFi signal reflections \u2014 no cameras needed.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: QuantumTheme.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms, duration: 400.ms);
  }

  // ── 6. Entropy Flow ────────────────────────────────────────────────────

  Widget _buildEntropyFlowCard(BuildContext context) {
    return QuantumCard(
      glowColor: QuantumTheme.quantumCyan,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.shuffle, color: QuantumTheme.quantumCyan),
              const SizedBox(width: 8),
              Text(
                'QRNG \u2192 Mesh Key Rotation',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
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
                    phase: _pulseController.value,
                  ),
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
    ).animate().fadeIn(delay: 500.ms, duration: 400.ms);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Room Presence Painter — two body silhouettes in a room floor plan
// ═══════════════════════════════════════════════════════════════════════════

class _RoomPresencePainter extends CustomPainter {
  final double pulse;

  _RoomPresencePainter({required this.pulse});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Room divider line
    final dividerPaint = Paint()
      ..color = const Color(0xFF00E5FF).withValues(alpha: 0.12)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
      Offset(w * 0.5, h * 0.05),
      Offset(w * 0.5, h * 0.95),
      dividerPaint,
    );

    // Room labels
    _drawRoomLabel(canvas, 'Living Room', Offset(w * 0.25, h * 0.06));
    _drawRoomLabel(canvas, 'Kitchen', Offset(w * 0.75, h * 0.06));

    // WiFi wave rings (pulsing)
    final wavePaint = Paint()
      ..color = const Color(0xFF00E5FF).withValues(alpha: 0.06)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    for (int i = 0; i < 3; i++) {
      final r = 30.0 + (pulse + i * 0.33) % 1.0 * 60;
      final alpha = (1.0 - ((pulse + i * 0.33) % 1.0)) * 0.08;
      wavePaint.color = const Color(0xFF00E5FF).withValues(alpha: alpha);
      canvas.drawCircle(Offset(w * 0.25, h * 0.5), r, wavePaint);
      canvas.drawCircle(Offset(w * 0.75, h * 0.55), r * 0.8, wavePaint);
    }

    // Person 1 — standing, green (owner)
    _drawBodySilhouette(
      canvas,
      center: Offset(w * 0.25, h * 0.52),
      height: h * 0.7,
      color: const Color(0xFF00E676),
      isStanding: true,
      pulse: pulse,
    );

    // Person 2 — sitting, amber (guest)
    _drawBodySilhouette(
      canvas,
      center: Offset(w * 0.75, h * 0.58),
      height: h * 0.5,
      color: const Color(0xFFFF9100),
      isStanding: false,
      pulse: pulse,
    );
  }

  void _drawRoomLabel(Canvas canvas, String text, Offset position) {
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: const TextStyle(
          color: Color(0xFF9E9E9E),
          fontSize: 10,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.5,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(
      canvas,
      Offset(position.dx - painter.width / 2, position.dy),
    );
  }

  void _drawBodySilhouette(
    Canvas canvas, {
    required Offset center,
    required double height,
    required Color color,
    required bool isStanding,
    required double pulse,
  }) {
    final scale = height / 160;

    // Glow aura
    final glowAlpha = 0.08 + 0.04 * sin(pulse * 2 * pi);
    final glowPaint = Paint()
      ..color = color.withValues(alpha: glowAlpha)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20);
    canvas.drawOval(
      Rect.fromCenter(
        center: center,
        width: 60 * scale,
        height: height * 0.9,
      ),
      glowPaint,
    );

    final bodyPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5 * scale
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Gradient-like effect: draw twice with different opacity
    for (final alpha in [0.6, 0.35]) {
      bodyPaint.color = color.withValues(alpha: alpha);
      if (alpha < 0.5) {
        bodyPaint.strokeWidth = 4 * scale;
        bodyPaint.maskFilter =
            const MaskFilter.blur(BlurStyle.normal, 3);
      } else {
        bodyPaint.maskFilter = null;
      }

      final path = Path();

      if (isStanding) {
        // Head
        final headY = center.dy - height * 0.38;
        path.addOval(Rect.fromCircle(
          center: Offset(center.dx, headY),
          radius: 10 * scale,
        ));
        // Neck
        path.moveTo(center.dx, headY + 10 * scale);
        path.lineTo(center.dx, headY + 18 * scale);
        // Shoulders
        final shoulderY = headY + 18 * scale;
        path.moveTo(center.dx - 22 * scale, shoulderY);
        path.lineTo(center.dx + 22 * scale, shoulderY);
        // Torso
        path.moveTo(center.dx, shoulderY);
        path.lineTo(center.dx, shoulderY + 40 * scale);
        // Arms
        path.moveTo(center.dx - 22 * scale, shoulderY);
        path.lineTo(center.dx - 28 * scale, shoulderY + 35 * scale);
        path.moveTo(center.dx + 22 * scale, shoulderY);
        path.lineTo(center.dx + 28 * scale, shoulderY + 35 * scale);
        // Hips
        final hipY = shoulderY + 40 * scale;
        path.moveTo(center.dx - 14 * scale, hipY);
        path.lineTo(center.dx + 14 * scale, hipY);
        // Legs
        path.moveTo(center.dx - 14 * scale, hipY);
        path.lineTo(center.dx - 16 * scale, hipY + 42 * scale);
        path.moveTo(center.dx + 14 * scale, hipY);
        path.lineTo(center.dx + 16 * scale, hipY + 42 * scale);
      } else {
        // Sitting figure
        final headY = center.dy - height * 0.35;
        // Head
        path.addOval(Rect.fromCircle(
          center: Offset(center.dx, headY),
          radius: 10 * scale,
        ));
        // Neck
        path.moveTo(center.dx, headY + 10 * scale);
        path.lineTo(center.dx, headY + 18 * scale);
        // Shoulders
        final shoulderY = headY + 18 * scale;
        path.moveTo(center.dx - 20 * scale, shoulderY);
        path.lineTo(center.dx + 20 * scale, shoulderY);
        // Torso (slightly leaned)
        path.moveTo(center.dx, shoulderY);
        path.lineTo(center.dx + 2 * scale, shoulderY + 32 * scale);
        // Arms on lap
        path.moveTo(center.dx - 20 * scale, shoulderY);
        path.lineTo(center.dx - 18 * scale, shoulderY + 28 * scale);
        path.moveTo(center.dx + 20 * scale, shoulderY);
        path.lineTo(center.dx + 18 * scale, shoulderY + 28 * scale);
        // Hips / seat
        final seatY = shoulderY + 32 * scale;
        path.moveTo(center.dx - 14 * scale, seatY);
        path.lineTo(center.dx + 14 * scale, seatY);
        // Legs (bent forward)
        path.moveTo(center.dx - 14 * scale, seatY);
        path.lineTo(center.dx - 24 * scale, seatY + 20 * scale);
        path.lineTo(center.dx - 22 * scale, seatY + 38 * scale);
        path.moveTo(center.dx + 14 * scale, seatY);
        path.lineTo(center.dx + 24 * scale, seatY + 20 * scale);
        path.lineTo(center.dx + 22 * scale, seatY + 38 * scale);
      }

      canvas.drawPath(path, bodyPaint);
    }

    // Fill head with solid color
    final headFill = Paint()..color = color.withValues(alpha: 0.25);
    final headY = isStanding
        ? center.dy - height * 0.38
        : center.dy - height * 0.35;
    canvas.drawCircle(
      Offset(center.dx, headY),
      10 * scale,
      headFill,
    );
  }

  @override
  bool shouldRepaint(_RoomPresencePainter oldDelegate) =>
      oldDelegate.pulse != pulse;
}

// ═══════════════════════════════════════════════════════════════════════════
// Gaussian Splatting 3D Body Painter — detailed body with gradient contours
// ═══════════════════════════════════════════════════════════════════════════

class _GaussianSplatPainter extends CustomPainter {
  final double glow;

  _GaussianSplatPainter({required this.glow});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final scale = size.height / 280;

    // Background grid lines (subtle)
    final gridPaint = Paint()
      ..color = const Color(0xFF7C4DFF).withValues(alpha: 0.04)
      ..strokeWidth = 0.5;
    for (double x = 0; x < size.width; x += 20) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += 20) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Outer glow aura (animated)
    final auraAlpha = 0.06 + 0.04 * sin(glow * 2 * pi);
    for (int ring = 3; ring >= 0; ring--) {
      final auraPaint = Paint()
        ..color = const Color(0xFF7C4DFF)
            .withValues(alpha: auraAlpha * (1.0 - ring * 0.2))
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, 16 + ring * 8.0);
      canvas.drawOval(
        Rect.fromCenter(
          center: Offset(cx, cy),
          width: (80 + ring * 20) * scale,
          height: (220 + ring * 15) * scale,
        ),
        auraPaint,
      );
    }

    // Contour rings (pulsing outward)
    final contourPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    for (int i = 0; i < 5; i++) {
      final t = (glow + i * 0.2) % 1.0;
      final alpha = (1.0 - t) * 0.15;
      contourPaint.color =
          const Color(0xFF00E5FF).withValues(alpha: alpha);
      canvas.drawOval(
        Rect.fromCenter(
          center: Offset(cx, cy),
          width: (70 + t * 50) * scale,
          height: (200 + t * 40) * scale,
        ),
        contourPaint,
      );
    }

    // Body silhouette (detailed)
    final bodyPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5 * scale
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = const Color(0xFF7C4DFF).withValues(alpha: 0.8);

    final fillPaint = Paint()
      ..style = PaintingStyle.fill
      ..color = const Color(0xFF7C4DFF).withValues(alpha: 0.08);

    // Head
    final headY = cy - 100 * scale;
    final headR = 16 * scale;
    canvas.drawCircle(Offset(cx, headY), headR, bodyPaint);
    canvas.drawCircle(
      Offset(cx, headY),
      headR,
      fillPaint,
    );

    // Neck
    final neckTop = headY + headR;
    final neckBottom = neckTop + 10 * scale;
    canvas.drawLine(
      Offset(cx - 5 * scale, neckTop),
      Offset(cx - 6 * scale, neckBottom),
      bodyPaint,
    );
    canvas.drawLine(
      Offset(cx + 5 * scale, neckTop),
      Offset(cx + 6 * scale, neckBottom),
      bodyPaint,
    );

    // Shoulders (curved)
    final shoulderY = neckBottom;
    final shoulderPath = Path()
      ..moveTo(cx - 6 * scale, shoulderY)
      ..quadraticBezierTo(
        cx - 20 * scale,
        shoulderY - 2 * scale,
        cx - 36 * scale,
        shoulderY + 8 * scale,
      );
    canvas.drawPath(shoulderPath, bodyPaint);
    final shoulderPathR = Path()
      ..moveTo(cx + 6 * scale, shoulderY)
      ..quadraticBezierTo(
        cx + 20 * scale,
        shoulderY - 2 * scale,
        cx + 36 * scale,
        shoulderY + 8 * scale,
      );
    canvas.drawPath(shoulderPathR, bodyPaint);

    // Torso outline
    final torsoPath = Path()
      ..moveTo(cx - 30 * scale, shoulderY + 10 * scale)
      ..lineTo(cx - 26 * scale, shoulderY + 60 * scale) // waist
      ..lineTo(cx - 30 * scale, shoulderY + 75 * scale) // hip
      ..moveTo(cx + 30 * scale, shoulderY + 10 * scale)
      ..lineTo(cx + 26 * scale, shoulderY + 60 * scale)
      ..lineTo(cx + 30 * scale, shoulderY + 75 * scale);
    canvas.drawPath(torsoPath, bodyPaint);

    // Torso fill
    final torsoFillPath = Path()
      ..moveTo(cx - 30 * scale, shoulderY + 10 * scale)
      ..lineTo(cx - 26 * scale, shoulderY + 60 * scale)
      ..lineTo(cx - 30 * scale, shoulderY + 75 * scale)
      ..lineTo(cx + 30 * scale, shoulderY + 75 * scale)
      ..lineTo(cx + 26 * scale, shoulderY + 60 * scale)
      ..lineTo(cx + 30 * scale, shoulderY + 10 * scale)
      ..close();
    canvas.drawPath(torsoFillPath, fillPaint);

    // Arms
    final armPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2 * scale
      ..strokeCap = StrokeCap.round
      ..color = const Color(0xFF7C4DFF).withValues(alpha: 0.7);

    // Left arm
    final leftArmPath = Path()
      ..moveTo(cx - 36 * scale, shoulderY + 8 * scale)
      ..quadraticBezierTo(
        cx - 42 * scale,
        shoulderY + 40 * scale,
        cx - 38 * scale,
        shoulderY + 65 * scale,
      );
    canvas.drawPath(leftArmPath, armPaint);

    // Right arm
    final rightArmPath = Path()
      ..moveTo(cx + 36 * scale, shoulderY + 8 * scale)
      ..quadraticBezierTo(
        cx + 42 * scale,
        shoulderY + 40 * scale,
        cx + 38 * scale,
        shoulderY + 65 * scale,
      );
    canvas.drawPath(rightArmPath, armPaint);

    // Legs
    final hipY = shoulderY + 75 * scale;
    // Left leg
    canvas.drawLine(
      Offset(cx - 16 * scale, hipY),
      Offset(cx - 20 * scale, hipY + 70 * scale),
      bodyPaint,
    );
    // Right leg
    canvas.drawLine(
      Offset(cx + 16 * scale, hipY),
      Offset(cx + 20 * scale, hipY + 70 * scale),
      bodyPaint,
    );

    // Data point markers along the body (Gaussian splat points)
    final dotPaint = Paint()..style = PaintingStyle.fill;
    final rng = Random(42);
    final bodyPoints = [
      Offset(cx, headY),
      Offset(cx - 6 * scale, neckBottom),
      Offset(cx + 6 * scale, neckBottom),
      Offset(cx - 28 * scale, shoulderY + 20 * scale),
      Offset(cx + 28 * scale, shoulderY + 20 * scale),
      Offset(cx - 24 * scale, shoulderY + 40 * scale),
      Offset(cx + 24 * scale, shoulderY + 40 * scale),
      Offset(cx, shoulderY + 30 * scale),
      Offset(cx, shoulderY + 50 * scale),
      Offset(cx - 18 * scale, hipY + 20 * scale),
      Offset(cx + 18 * scale, hipY + 20 * scale),
      Offset(cx - 19 * scale, hipY + 45 * scale),
      Offset(cx + 19 * scale, hipY + 45 * scale),
    ];

    for (final pt in bodyPoints) {
      final phase = rng.nextDouble();
      final alpha = 0.3 + 0.3 * sin(glow * 2 * pi + phase * 6);
      dotPaint.color =
          const Color(0xFF00E5FF).withValues(alpha: alpha);
      canvas.drawCircle(pt, 3 * scale, dotPaint);
      // Glow halo
      dotPaint.color =
          const Color(0xFF00E5FF).withValues(alpha: alpha * 0.3);
      dotPaint.maskFilter =
          const MaskFilter.blur(BlurStyle.normal, 4);
      canvas.drawCircle(pt, 5 * scale, dotPaint);
      dotPaint.maskFilter = null;
    }

    // Label
    _drawLabel(
      canvas,
      'Gaussian Splatting',
      Offset(cx, size.height - 12 * scale),
    );
  }

  void _drawLabel(Canvas canvas, String text, Offset position) {
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: const TextStyle(
          color: Color(0xFF9E9E9E),
          fontSize: 10,
          fontWeight: FontWeight.w400,
          letterSpacing: 0.8,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(
      canvas,
      Offset(position.dx - painter.width / 2, position.dy),
    );
  }

  @override
  bool shouldRepaint(_GaussianSplatPainter oldDelegate) =>
      oldDelegate.glow != glow;
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

    // Flow path
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

    // Flowing bits
    const bitCount = 12;
    for (int i = 0; i < bitCount; i++) {
      final t = ((phase + i / bitCount) % 1.0);
      final x = 20 + t * (size.width - 40);
      final yOff = sin(t * pi * 3 + i) * 8;
      final alpha = sin(t * pi).clamp(0.0, 1.0);

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

    // Markers
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

class _PersonLabel extends StatelessWidget {
  final String name;
  final String role;
  final String position;
  final String room;
  final Color color;

  const _PersonLabel({
    required this.name,
    required this.role,
    required this.position,
    required this.room,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$name ($role)',
                    style: TextStyle(
                      color: color,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '$position \u2014 $room',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: QuantumTheme.textSecondary,
                          fontSize: 10,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VitalsRow extends StatelessWidget {
  final String name;
  final Color nameColor;
  final int heartRate;
  final int breathing;
  final String position;
  final double confidence;
  final AnimationController heartbeatController;

  const _VitalsRow({
    required this.name,
    required this.nameColor,
    required this.heartRate,
    required this.breathing,
    required this.position,
    required this.confidence,
    required this.heartbeatController,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: nameColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              name,
              style: TextStyle(
                color: nameColor,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: nameColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '$confidence%',
                style: TextStyle(
                  color: nameColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'JetBrains Mono',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            // Heart rate with pulsing icon
            Expanded(
              child: _VitalMetric(
                icon: Icons.favorite,
                iconColor: QuantumTheme.quantumRed,
                value: '$heartRate',
                unit: 'bpm',
                animationController: heartbeatController,
                pulsing: true,
              ),
            ),
            const SizedBox(width: 8),
            // Breathing
            Expanded(
              child: _VitalMetric(
                icon: Icons.air,
                iconColor: QuantumTheme.quantumCyan,
                value: '$breathing',
                unit: 'br/min',
              ),
            ),
            const SizedBox(width: 8),
            // Position
            Expanded(
              child: _VitalMetric(
                icon: position == 'Standing'
                    ? Icons.person
                    : Icons.event_seat,
                iconColor: QuantumTheme.quantumPurple,
                value: position,
                unit: '',
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _VitalMetric extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String value;
  final String unit;
  final AnimationController? animationController;
  final bool pulsing;

  const _VitalMetric({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.unit,
    this.animationController,
    this.pulsing = false,
  });

  @override
  Widget build(BuildContext context) {
    Widget iconWidget = Icon(icon, size: 16, color: iconColor);

    if (pulsing && animationController != null) {
      iconWidget = AnimatedBuilder(
        animation: animationController!,
        builder: (context, child) {
          // Create heartbeat-like pulse: quick expand then relax
          final t = animationController!.value;
          final beat = t < 0.15
              ? 1.0 + 0.3 * (t / 0.15)
              : t < 0.3
                  ? 1.3 - 0.3 * ((t - 0.15) / 0.15)
                  : 1.0;
          return Transform.scale(scale: beat, child: child);
        },
        child: iconWidget,
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: QuantumTheme.surfaceElevated,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          iconWidget,
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              unit.isNotEmpty ? '$value $unit' : value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _SensorTile extends StatelessWidget {
  final String name;
  final int signalStrength; // 1-4 bars
  final bool isActive;

  const _SensorTile({
    required this.name,
    required this.signalStrength,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: QuantumTheme.surfaceElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: QuantumTheme.quantumBlue.withValues(alpha: 0.15),
        ),
      ),
      child: Row(
        children: [
          // Active status dot
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isActive
                  ? QuantumTheme.quantumGreen
                  : QuantumTheme.textSecondary,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              name,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
          // Signal bars
          _SignalBars(strength: signalStrength),
        ],
      ),
    );
  }
}

class _SignalBars extends StatelessWidget {
  final int strength; // 1-4

  const _SignalBars({required this.strength});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(4, (i) {
        final isLit = i < strength;
        final barHeight = 6.0 + i * 4.0;
        return Padding(
          padding: const EdgeInsets.only(left: 2),
          child: Container(
            width: 4,
            height: barHeight,
            decoration: BoxDecoration(
              color: isLit
                  ? QuantumTheme.quantumCyan
                  : QuantumTheme.quantumCyan.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
    );
  }
}

class _AuthPipelineStep extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;

  const _AuthPipelineStep({
    required this.icon,
    required this.label,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive
                  ? QuantumTheme.quantumPurple.withValues(alpha: 0.2)
                  : QuantumTheme.surfaceElevated,
              border: Border.all(
                color: isActive
                    ? QuantumTheme.quantumPurple.withValues(alpha: 0.5)
                    : QuantumTheme.quantumPurple.withValues(alpha: 0.15),
              ),
            ),
            child: Icon(
              icon,
              size: 16,
              color: isActive
                  ? QuantumTheme.quantumPurple
                  : QuantumTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: QuantumTheme.textSecondary,
                  fontSize: 9,
                  height: 1.2,
                ),
          ),
        ],
      ),
    );
  }
}

class _PipelineArrow extends StatelessWidget {
  const _PipelineArrow();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
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
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: QuantumTheme.textSecondary,
                fontSize: 10,
              ),
        ),
      ],
    );
  }
}
