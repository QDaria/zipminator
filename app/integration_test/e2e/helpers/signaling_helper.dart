import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'test_config.dart';

/// Manages the local signaling server process lifecycle for E2E tests.
///
/// Starts the Python signaling server if it is not already running,
/// waits for the /health endpoint to return ok, and provides a [stop]
/// method for teardown.
class SignalingServerHelper {
  Process? _process;

  /// Start the signaling server. Returns immediately if already healthy.
  Future<void> start() async {
    if (await _isHealthy()) return;

    _process = await Process.start(
      'python',
      [
        '-m',
        'zipminator.messenger.signaling_server',
        '--port',
        E2eConfig.signalingPort.toString(),
        '--log-level',
        'warning',
      ],
      environment: {'PATH': Platform.environment['PATH'] ?? ''},
      workingDirectory: _projectRoot,
    );

    // Forward stderr for debugging
    _process!.stderr.transform(utf8.decoder).listen((line) {
      if (line.trim().isNotEmpty) {
        // ignore: avoid_print
        print('[signaling] $line');
      }
    });

    // Wait for server to be healthy (max 15s, polling every 500ms)
    for (var i = 0; i < 30; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 500));
      if (await _isHealthy()) return;
    }
    throw StateError('Signaling server failed to start within 15s');
  }

  /// Stop the signaling server process.
  Future<void> stop() async {
    _process?.kill(ProcessSignal.sigterm);
    await _process?.exitCode.timeout(
      const Duration(seconds: 5),
      onTimeout: () {
        _process?.kill(ProcessSignal.sigkill);
        return -1;
      },
    );
    _process = null;
  }

  /// Check server health via HTTP GET /health.
  Future<bool> _isHealthy() async {
    try {
      final client = HttpClient();
      final request = await client.getUrl(
        Uri.parse('${E2eConfig.signalingHttpUrl}/health'),
      );
      final response = await request.close().timeout(
        const Duration(seconds: 2),
      );
      final body = await response.transform(utf8.decoder).join();
      client.close();
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['status'] == 'ok';
    } catch (_) {
      return false;
    }
  }

  /// Project root directory. When running integration tests the CWD
  /// is typically the app/ directory, so we go one level up.
  String get _projectRoot {
    final appDir = Directory.current.path;
    if (appDir.endsWith('/app')) {
      return Directory(appDir).parent.path;
    }
    return appDir;
  }
}
