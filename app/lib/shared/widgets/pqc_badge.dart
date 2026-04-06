import 'package:flutter/material.dart';

class PqcBadge extends StatelessWidget {
  final String label;
  final Color? color;
  final bool isActive;

  const PqcBadge({
    super.key,
    required this.label,
    this.color,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    final badgeColor = color ?? Theme.of(context).colorScheme.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: badgeColor.withValues(alpha: isActive ? 0.2 : 0.1),
        border: Border.all(
          color: badgeColor.withValues(alpha: isActive ? 0.6 : 0.3),
          width: 1,
        ),
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: badgeColor.withValues(alpha: 0.3),
                  blurRadius: 8,
                  spreadRadius: -2,
                ),
              ]
            : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: badgeColor,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
