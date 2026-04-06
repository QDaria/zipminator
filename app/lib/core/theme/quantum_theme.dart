import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Quantum Design System — dark-first theme matching web/ tokens.
class QuantumTheme {
  QuantumTheme._();

  // ── Brand Colors ──────────────────────────────────────────────────────
  static const Color quantumCyan = Color(0xFF00E5FF);
  static const Color quantumBlue = Color(0xFF2979FF);
  static const Color quantumPurple = Color(0xFF7C4DFF);
  static const Color quantumGreen = Color(0xFF00E676);
  static const Color quantumOrange = Color(0xFFFF9100);
  static const Color quantumRed = Color(0xFFFF5252);

  // ── Glassmorphic Constants ─────────────────────────────────────────────
  static const double glassBlur = 12.0;
  static const double glassOpacity = 0.08;
  static const double glassBorderOpacity = 0.3;
  static const double glassBorderRadius = 16.0;

  /// Two-layer glow shadow preset, tinted by pillar color.
  static List<BoxShadow> pillarGlow(Color color) => [
    BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 24, spreadRadius: -4),
    BoxShadow(color: color.withValues(alpha: 0.1), blurRadius: 48, spreadRadius: -8),
  ];

  // ── Surface Colors ────────────────────────────────────────────────────
  static const Color surfaceDark = Color(0xFF0A0A1A);
  static const Color surfaceCard = Color(0xFF111128);
  static const Color surfaceElevated = Color(0xFF1A1A3E);
  static const Color surfaceLight = Color(0xFFF5F5F5);

  // ── Text Colors ───────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFE0E0E0);
  static const Color textSecondary = Color(0xFF9E9E9E);
  static const Color textDarkPrimary = Color(0xFF1A1A1A);

  // ── Typography ────────────────────────────────────────────────────────
  static TextTheme _textTheme(Color bodyColor) => TextTheme(
    displayLarge: GoogleFonts.outfit(
      fontSize: 57,
      fontWeight: FontWeight.w700,
      color: bodyColor,
    ),
    displayMedium: GoogleFonts.outfit(
      fontSize: 45,
      fontWeight: FontWeight.w600,
      color: bodyColor,
    ),
    displaySmall: GoogleFonts.outfit(
      fontSize: 36,
      fontWeight: FontWeight.w600,
      color: bodyColor,
    ),
    headlineLarge: GoogleFonts.outfit(
      fontSize: 32,
      fontWeight: FontWeight.w600,
      color: bodyColor,
    ),
    headlineMedium: GoogleFonts.outfit(
      fontSize: 28,
      fontWeight: FontWeight.w500,
      color: bodyColor,
    ),
    headlineSmall: GoogleFonts.outfit(
      fontSize: 24,
      fontWeight: FontWeight.w500,
      color: bodyColor,
    ),
    titleLarge: GoogleFonts.inter(
      fontSize: 22,
      fontWeight: FontWeight.w600,
      color: bodyColor,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w500,
      color: bodyColor,
    ),
    titleSmall: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      color: bodyColor,
    ),
    bodyLarge: GoogleFonts.inter(fontSize: 16, color: bodyColor),
    bodyMedium: GoogleFonts.inter(fontSize: 14, color: bodyColor),
    bodySmall: GoogleFonts.inter(fontSize: 12, color: bodyColor),
    labelLarge: GoogleFonts.jetBrainsMono(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      color: bodyColor,
    ),
    labelMedium: GoogleFonts.jetBrainsMono(fontSize: 12, color: bodyColor),
    labelSmall: GoogleFonts.jetBrainsMono(fontSize: 11, color: bodyColor),
  );

  // ── Gradient Helpers ──────────────────────────────────────────────────
  static LinearGradient cyanPurpleGradient({
    AlignmentGeometry begin = Alignment.topLeft,
    AlignmentGeometry end = Alignment.bottomRight,
  }) =>
      LinearGradient(
        begin: begin,
        end: end,
        colors: const [quantumCyan, quantumPurple],
      );

  static List<BoxShadow> glowShadow(Color color, {double blur = 20}) => [
    BoxShadow(
      color: color.withValues(alpha: 0.3),
      blurRadius: blur,
      spreadRadius: -4,
    ),
  ];

  // ── Page Transitions ────────────────────────────────────────────────
  static const _pageTransitions = PageTransitionsTheme(
    builders: {
      TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      TargetPlatform.macOS: FadeUpwardsPageTransitionsBuilder(),
      TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
      TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
    },
  );

  // ── Dark Theme ────────────────────────────────────────────────────────
  static ThemeData dark() => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: surfaceDark,
    pageTransitionsTheme: _pageTransitions,
    colorScheme: const ColorScheme.dark(
      primary: quantumCyan,
      secondary: quantumPurple,
      tertiary: quantumGreen,
      surface: surfaceCard,
      error: quantumRed,
      onPrimary: surfaceDark,
      onSecondary: Colors.white,
      onSurface: textPrimary,
      onError: Colors.white,
    ),
    textTheme: _textTheme(textPrimary),
    appBarTheme: AppBarTheme(
      backgroundColor: surfaceDark,
      foregroundColor: textPrimary,
      elevation: 0,
      titleTextStyle: GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textPrimary,
      ),
    ),
    cardTheme: CardThemeData(
      color: surfaceCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: quantumCyan.withValues(alpha: 0.1)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: surfaceCard,
      indicatorColor: quantumCyan.withValues(alpha: 0.2),
      labelTextStyle: WidgetStatePropertyAll(GoogleFonts.inter(fontSize: 12)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: quantumCyan,
        foregroundColor: surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surfaceElevated,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: quantumCyan),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: surfaceCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: surfaceCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: surfaceElevated,
      selectedColor: quantumCyan.withValues(alpha: 0.2),
      labelStyle: GoogleFonts.inter(fontSize: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      side: BorderSide(color: quantumCyan.withValues(alpha: 0.2)),
    ),
  );

  // ── Light Theme ───────────────────────────────────────────────────────
  static ThemeData light() => ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: surfaceLight,
    pageTransitionsTheme: _pageTransitions,
    colorScheme: const ColorScheme.light(
      primary: quantumBlue,
      secondary: quantumPurple,
      tertiary: quantumGreen,
      surface: Colors.white,
      error: quantumRed,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: textDarkPrimary,
      onError: Colors.white,
    ),
    textTheme: _textTheme(textDarkPrimary),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: textDarkPrimary,
      elevation: 0,
      titleTextStyle: GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textDarkPrimary,
      ),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );
}
