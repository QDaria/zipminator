import 'package:flutter/material.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// A gradient button with ripple effect, subtle glow shadow, and optional
/// loading state.
class QuantumButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final List<Color> gradientColors;
  final double borderRadius;

  const QuantumButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.gradientColors = const [QuantumTheme.quantumCyan, QuantumTheme.quantumPurple],
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || isLoading;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        gradient: LinearGradient(
          colors: disabled
              ? gradientColors.map((c) => c.withValues(alpha: 0.4)).toList()
              : gradientColors,
        ),
        boxShadow: disabled
            ? null
            : [
                BoxShadow(
                  color: gradientColors.first.withValues(alpha: 0.3),
                  blurRadius: 16,
                  spreadRadius: -4,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: disabled ? null : onPressed,
          borderRadius: BorderRadius.circular(borderRadius),
          splashColor: Colors.white.withValues(alpha: 0.2),
          highlightColor: Colors.white.withValues(alpha: 0.1),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading) ...[
                  const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                ] else if (icon != null) ...[
                  Icon(icon, size: 20, color: Colors.white),
                  const SizedBox(width: 8),
                ],
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
