import 'package:flutter/material.dart';

class GradientBackground extends StatefulWidget {
  final Widget child;
  final List<Color>? colors;
  final AlignmentGeometry begin;
  final AlignmentGeometry end;
  final bool animate;

  const GradientBackground({
    super.key,
    required this.child,
    this.colors,
    this.begin = Alignment.topLeft,
    this.end = Alignment.bottomRight,
    this.animate = true,
  });

  @override
  State<GradientBackground> createState() => _GradientBackgroundState();
}

class _GradientBackgroundState extends State<GradientBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    );
    if (widget.animate) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<Color> _defaultColors(bool isDark) => isDark
      ? const [
          Color(0xFF0A0A1A),
          Color(0xFF1A0A2E),
          Color(0xFF0A1628),
        ]
      : const [
          Color(0xFFF8F9FF),
          Color(0xFFF0F0FF),
          Color(0xFFE8F4FF),
        ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColors = widget.colors ?? _defaultColors(isDark);

    if (!widget.animate || baseColors.length < 2) {
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: widget.begin,
            end: widget.end,
            colors: baseColors,
          ),
        ),
        child: widget.child,
      );
    }

    // Shifted variants: slightly lighter/darker versions for animation
    final shiftedColors = baseColors.map((c) {
      final hsl = HSLColor.fromColor(c);
      return hsl
          .withLightness((hsl.lightness + 0.03).clamp(0.0, 1.0))
          .toColor();
    }).toList();

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        final interpolated = <Color>[];
        for (var i = 0; i < baseColors.length; i++) {
          interpolated.add(Color.lerp(baseColors[i], shiftedColors[i], t)!);
        }

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: widget.begin,
              end: widget.end,
              colors: interpolated,
            ),
          ),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}
