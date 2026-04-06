import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// A glassmorphic card with an animated glowing border that cycles
/// between two colors (defaults to quantum cyan and purple).
class GlowingCard extends StatelessWidget {
  final Widget child;
  final List<Color> glowColors;
  final double intensity;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  const GlowingCard({
    super.key,
    required this.child,
    this.glowColors = const [QuantumTheme.quantumCyan, QuantumTheme.quantumPurple],
    this.intensity = 1.0,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 16,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return _AnimatedGlowBorder(
      colors: glowColors,
      intensity: intensity,
      borderRadius: borderRadius,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: QuantumTheme.glassBlur,
            sigmaY: QuantumTheme.glassBlur,
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              color: isDark
                  ? Colors.white.withValues(alpha: QuantumTheme.glassOpacity)
                  : Colors.white.withValues(alpha: 0.7),
            ),
            padding: padding,
            child: child,
          ),
        ),
      ),
    );
  }
}

class _AnimatedGlowBorder extends StatefulWidget {
  final Widget child;
  final List<Color> colors;
  final double intensity;
  final double borderRadius;

  const _AnimatedGlowBorder({
    required this.child,
    required this.colors,
    required this.intensity,
    required this.borderRadius,
  });

  @override
  State<_AnimatedGlowBorder> createState() => _AnimatedGlowBorderState();
}

class _AnimatedGlowBorderState extends State<_AnimatedGlowBorder>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c1 = widget.colors.isNotEmpty ? widget.colors[0] : QuantumTheme.quantumCyan;
    final c2 = widget.colors.length > 1 ? widget.colors[1] : QuantumTheme.quantumPurple;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        final currentColor = Color.lerp(c1, c2, t)!;
        final glowAlpha = 0.15 + (0.25 * widget.intensity * t);

        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            border: Border.all(
              color: currentColor.withValues(alpha: 0.4 * widget.intensity),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: currentColor.withValues(alpha: glowAlpha),
                blurRadius: 24 * widget.intensity,
                spreadRadius: -4,
              ),
              BoxShadow(
                color: currentColor.withValues(alpha: glowAlpha * 0.5),
                blurRadius: 48 * widget.intensity,
                spreadRadius: -8,
              ),
            ],
          ),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}
