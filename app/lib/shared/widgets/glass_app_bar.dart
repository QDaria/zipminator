import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';

/// A transparent app bar with BackdropFilter blur, matching the
/// glassmorphic design language.
class GlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final Widget? titleWidget;
  final List<Widget>? actions;
  final Widget? leading;
  final bool centerTitle;
  final double height;

  const GlassAppBar({
    super.key,
    this.title,
    this.titleWidget,
    this.actions,
    this.leading,
    this.centerTitle = true,
    this.height = kToolbarHeight,
  });

  @override
  Size get preferredSize => Size.fromHeight(height);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: QuantumTheme.glassBlur,
          sigmaY: QuantumTheme.glassBlur,
        ),
        child: Container(
          color: isDark
              ? QuantumTheme.surfaceDark.withValues(alpha: 0.7)
              : Colors.white.withValues(alpha: 0.7),
          child: SafeArea(
            bottom: false,
            child: SizedBox(
              height: height,
              child: NavigationToolbar(
                leading: leading ??
                    (Navigator.canPop(context)
                        ? IconButton(
                            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                            onPressed: () => Navigator.maybePop(context),
                          )
                        : null),
                middle: titleWidget ??
                    (title != null
                        ? Text(
                            title!,
                            style: Theme.of(context).textTheme.titleLarge,
                          )
                        : null),
                trailing: actions != null
                    ? Row(mainAxisSize: MainAxisSize.min, children: actions!)
                    : null,
                centerMiddle: centerTitle,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
