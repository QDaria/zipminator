import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// Branded footer for pillar screens.
/// Row 1: Zipminator logo + "By" + QDaria logo
/// Row 2: QDaria wordmark + pillar name
class PillarFooter extends StatelessWidget {
  final String pillarName;

  const PillarFooter({super.key, required this.pillarName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: QuantumTheme.quantumCyan.withValues(alpha: 0.1),
          ),
        ),
      ),
      child: Column(
        children: [
          // Row 1: Zipminator + By + QDaria
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SvgPicture.asset(
                'assets/logos/Zipminator_0_light.svg',
                width: 140,
                colorFilter: const ColorFilter.mode(
                  Colors.white,
                  BlendMode.srcIn,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  'By',
                  style: TextStyle(
                    color: QuantumTheme.textSecondary,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
              Image.asset(
                'assets/logos/QDaria_logo_teal.png',
                width: 80,
                fit: BoxFit.contain,
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Row 2: QDaria wordmark + pillar name
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SvgPicture.asset(
                'assets/logos/QDwordmark2.svg',
                width: 90,
              ),
              const SizedBox(width: 8),
              Text(
                pillarName,
                style: TextStyle(
                  color: QuantumTheme.quantumCyan,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
