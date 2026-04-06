import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/app.dart';
import 'package:zipminator/core/services/supabase_service.dart';
import 'package:zipminator/src/rust/frb_generated.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await RustLib.init();
  } catch (e) {
    debugPrint('RustLib.init() failed: $e');
    // App continues without Rust bridge — crypto features show errors gracefully
  }
  try {
    await SupabaseService.initialize();
  } catch (e) {
    debugPrint('Supabase init failed: $e');
    // App continues without Supabase — auth features degrade gracefully
  }
  runApp(
    const ProviderScope(
      child: ZipminatorApp(),
    ),
  );
}
