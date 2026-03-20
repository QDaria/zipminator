import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Animated connection status indicator (small breathing-glow circle).
///
/// Color semantics:
/// - green  = connected
/// - amber  = connecting
/// - red    = error
/// - grey   = offline
class StatusOrb extends StatelessWidget {
  final bool isActive;
  final Color? color;
  final double size;

  const StatusOrb({
    super.key,
    this.isActive = true,
    this.color,
    this.size = 14,
  });

  Color get _resolvedColor {
    if (color != null) return color!;
    return isActive ? QuantumTheme.quantumGreen : QuantumTheme.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    final orbColor = _resolvedColor;

    Widget orb = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: orbColor,
        boxShadow: [
          BoxShadow(
            color: orbColor.withValues(alpha: 0.5),
            blurRadius: 8,
            spreadRadius: 1,
          ),
        ],
      ),
    );

    if (isActive) {
      orb = orb
          .animate(onPlay: (c) => c.repeat(reverse: true))
          .scaleXY(begin: 1.0, end: 1.2, duration: 1200.ms)
          .custom(
            duration: 1200.ms,
            builder: (context, value, child) {
              return Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: orbColor.withValues(alpha: 0.3 + 0.3 * value),
                      blurRadius: 8 + 8 * value,
                      spreadRadius: 1 + 2 * value,
                    ),
                  ],
                ),
                child: child,
              );
            },
          );
    }

    return SizedBox(width: size + 8, height: size + 8, child: Center(child: orb));
  }
}
