import 'package:flutter/material.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

enum PillarStatus { ready, demo, comingSoon }

/// A dismissable banner showing plain-English description and status pill.
class PillarStatusBanner extends StatefulWidget {
  final String description;
  final PillarStatus status;

  const PillarStatusBanner({
    super.key,
    required this.description,
    required this.status,
  });

  @override
  State<PillarStatusBanner> createState() => _PillarStatusBannerState();
}

class _PillarStatusBannerState extends State<PillarStatusBanner> {
  bool _dismissed = false;

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final (label, color) = switch (widget.status) {
      PillarStatus.ready => ('Ready', QuantumTheme.quantumGreen),
      PillarStatus.demo => ('Demo', QuantumTheme.quantumOrange),
      PillarStatus.comingSoon => ('Coming Soon', QuantumTheme.textSecondary),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, size: 18, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              widget.description,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: () => setState(() => _dismissed = true),
            child: Icon(Icons.close, size: 16, color: QuantumTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}
