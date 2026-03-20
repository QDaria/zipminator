import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

class QuantumCard extends StatelessWidget {
  final Widget child;
  final Color? glowColor;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final bool animateGlow;
  final double? gradientOpacity;

  const QuantumCard({
    super.key,
    required this.child,
    this.glowColor,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 16,
    this.animateGlow = false,
    this.gradientOpacity,
  });

  @override
  Widget build(BuildContext context) {
    final color = glowColor ?? Theme.of(context).colorScheme.primary;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Widget card = ClipRRect(
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
            border: Border.all(
              color: color.withValues(alpha: QuantumTheme.glassBorderOpacity),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.1),
                blurRadius: 20,
                spreadRadius: -5,
              ),
            ],
            gradient: gradientOpacity != null
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      color.withValues(alpha: gradientOpacity!),
                      Colors.transparent,
                    ],
                  )
                : null,
          ),
          padding: padding,
          child: child,
        ),
      ),
    );

    if (animateGlow) {
      card = card
          .animate(onPlay: (c) => c.repeat(reverse: true))
          .custom(
            duration: 2000.ms,
            builder: (context, value, child) {
              return Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(borderRadius),
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.1 + 0.15 * value),
                      blurRadius: 20 + 12 * value,
                      spreadRadius: -5 + 3 * value,
                    ),
                  ],
                ),
                child: child,
              );
            },
          );
    }

    return card;
  }
}
