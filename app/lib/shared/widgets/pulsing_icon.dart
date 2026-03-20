import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// An icon widget with a repeating scale + opacity pulse animation.
class PulsingIcon extends StatelessWidget {
  final IconData icon;
  final Color? color;
  final double size;
  final Duration duration;

  const PulsingIcon({
    super.key,
    required this.icon,
    this.color,
    this.size = 24,
    this.duration = const Duration(milliseconds: 1500),
  });

  @override
  Widget build(BuildContext context) {
    final iconColor = color ?? QuantumTheme.quantumCyan;

    return Icon(icon, color: iconColor, size: size)
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .scaleXY(begin: 1.0, end: 1.15, duration: duration)
        .fadeIn(begin: 0.7, duration: duration);
  }
}
