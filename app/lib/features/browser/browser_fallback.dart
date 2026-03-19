import 'package:flutter/material.dart';

/// Fallback for platforms where WebView is not supported (Web, Linux, Windows).
Widget buildWebView() {
  return const Center(
    child: Text('WebView not available on this platform'),
  );
}
