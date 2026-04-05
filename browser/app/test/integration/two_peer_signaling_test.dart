// ignore_for_file: avoid_print
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:test/test.dart';

/// Integration test: two peers connect to the LIVE signaling server,
/// exchange messages, and run a call offer/accept/end flow.
///
/// Signaling server: wss://zipminator-signaling.fly.dev
/// This test hits the real server (Fly.io auto-wakes from idle).
const _signalingUrl = 'wss://zipminator-signaling.fly.dev';

/// Lightweight WebSocket client for testing (no Flutter dependency).
class TestPeer {
  final String username;
  WebSocket? _ws;
  final messages = <Map<String, dynamic>>[];
  final _msgController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get onMessage => _msgController.stream;
  bool get isConnected => _ws?.readyState == WebSocket.open;

  TestPeer(this.username);

  Future<void> connect() async {
    _ws = await WebSocket.connect('$_signalingUrl/ws/$username');
    _ws!.pingInterval = const Duration(seconds: 5);
    _ws!.listen((data) {
      if (data is! String || data == 'pong') return;
      try {
        final msg = jsonDecode(data) as Map<String, dynamic>;
        if (msg['type'] == 'pong') return;
        messages.add(msg);
        _msgController.add(msg);
        print('  [$username] received: ${msg['type'] ?? msg['action'] ?? 'unknown'}');
      } catch (_) {}
    });
  }

  void sendMessage(String target, String text) {
    _send({'action': 'message', 'target': target, 'ciphertext': text});
  }

  void sendSignal(String target, String type, [Map<String, dynamic>? payload]) {
    _send({
      'action': 'signal',
      'target': target,
      'type': type,
      ...?payload,
    });
  }

  void createRoom(String roomId) => _send({'action': 'create_room', 'room_id': roomId});
  void joinRoom(String roomId) => _send({'action': 'join', 'room_id': roomId});
  void leaveRoom() => _send({'action': 'leave'});

  void _send(Map<String, dynamic> msg) {
    if (_ws != null && _ws!.readyState == WebSocket.open) {
      _ws!.add(jsonEncode(msg));
    }
  }

  Future<Map<String, dynamic>> waitForType(String type, {Duration timeout = const Duration(seconds: 10)}) {
    // Check existing messages first.
    for (final m in messages) {
      if (m['type'] == type) return Future.value(m);
    }
    return onMessage
        .where((m) => m['type'] == type)
        .first
        .timeout(timeout, onTimeout: () => throw TimeoutException('No $type received by $username'));
  }

  Future<void> dispose() async {
    await _ws?.close();
    await _msgController.close();
  }
}

void main() {
  late TestPeer alice;
  late TestPeer bob;

  setUp(() async {
    // Unique usernames per test run to avoid collisions.
    final ts = DateTime.now().millisecondsSinceEpoch % 100000;
    alice = TestPeer('test-alice-$ts');
    bob = TestPeer('test-bob-$ts');
  });

  tearDown(() async {
    await alice.dispose();
    await bob.dispose();
  });

  test('Both peers connect to live signaling server', () async {
    print('Connecting alice...');
    await alice.connect();
    print('Connecting bob...');
    await bob.connect();

    // Give the server a moment to register both.
    await Future.delayed(const Duration(seconds: 1));

    expect(alice.isConnected, isTrue, reason: 'Alice should be connected');
    expect(bob.isConnected, isTrue, reason: 'Bob should be connected');
    print('PASS: Both peers connected');
  });

  test('Peer-to-peer message exchange', () async {
    await alice.connect();
    await bob.connect();
    await Future.delayed(const Duration(seconds: 1));

    // Alice sends a message to Bob.
    print('Alice -> Bob: "Hello from PQC mesh"');
    alice.sendMessage(bob.username, 'Hello from PQC mesh');

    final received = await bob.waitForType('message');
    expect(received['ciphertext'], equals('Hello from PQC mesh'));
    expect(received['from'], equals(alice.username));
    print('PASS: Bob received message from Alice');

    // Bob replies.
    print('Bob -> Alice: "Quantum channel confirmed"');
    bob.sendMessage(alice.username, 'Quantum channel confirmed');

    final reply = await alice.waitForType('message');
    expect(reply['ciphertext'], equals('Quantum channel confirmed'));
    expect(reply['from'], equals(bob.username));
    print('PASS: Alice received reply from Bob');
  });

  test('VoIP call offer -> accept -> end flow', () async {
    await alice.connect();
    await bob.connect();
    await Future.delayed(const Duration(seconds: 1));

    // Alice calls Bob.
    print('Alice sends call_offer to Bob');
    alice.sendSignal(bob.username, 'call_offer');

    final offer = await bob.waitForType('call_offer');
    expect(offer['from'], equals(alice.username));
    print('PASS: Bob received call_offer');

    // Bob accepts.
    print('Bob sends call_accept to Alice');
    bob.sendSignal(alice.username, 'call_accept');

    final accept = await alice.waitForType('call_accept');
    expect(accept['from'], equals(bob.username));
    print('PASS: Alice received call_accept');

    // Simulate WebRTC offer/answer exchange.
    print('Alice sends WebRTC offer');
    alice.sendSignal(bob.username, 'offer', {'sdp': 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'});

    final rtcOffer = await bob.waitForType('offer');
    expect(rtcOffer['sdp'], isNotNull);
    print('PASS: Bob received WebRTC offer');

    print('Bob sends WebRTC answer');
    bob.sendSignal(alice.username, 'answer', {'sdp': 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'});

    final rtcAnswer = await alice.waitForType('answer');
    expect(rtcAnswer['sdp'], isNotNull);
    print('PASS: Alice received WebRTC answer');

    // ICE candidate exchange.
    print('Alice sends ICE candidate');
    alice.sendSignal(bob.username, 'ice-candidate', {
      'candidate': 'candidate:1 1 udp 2130706431 192.168.1.1 50000 typ host',
      'sdpMid': '0',
      'sdpMLineIndex': 0,
    });

    final ice = await bob.waitForType('ice-candidate');
    expect(ice['candidate'], isNotNull);
    print('PASS: Bob received ICE candidate');

    // End call.
    print('Alice sends call_end');
    alice.sendSignal(bob.username, 'call_end');

    final end = await bob.waitForType('call_end');
    expect(end['from'], equals(alice.username));
    print('PASS: Bob received call_end');
  });

  test('Conference room: create, join, peer signals', () async {
    await alice.connect();
    await bob.connect();
    await Future.delayed(const Duration(seconds: 1));

    final roomId = 'zip-test-${DateTime.now().millisecondsSinceEpoch % 100000}';

    // Alice creates and joins a room.
    print('Alice creates room: $roomId');
    alice.createRoom(roomId);
    alice.joinRoom(roomId);
    await Future.delayed(const Duration(milliseconds: 500));

    // Bob joins the same room.
    print('Bob joins room: $roomId');
    bob.joinRoom(roomId);

    // Alice should receive a peer_joined for Bob.
    final peerJoined = await alice.waitForType('peer_joined');
    expect(peerJoined['peer_id'], equals(bob.username));
    print('PASS: Alice notified that Bob joined');

    // Bob leaves.
    print('Bob leaves room');
    bob.leaveRoom();

    final peerLeft = await alice.waitForType('peer_left');
    expect(peerLeft['peer_id'], equals(bob.username));
    print('PASS: Alice notified that Bob left');
  });

  test('Offline peer gets error on message send', () async {
    await alice.connect();
    await Future.delayed(const Duration(seconds: 1));

    // Alice sends message to a peer that doesn't exist.
    print('Alice sends message to nonexistent peer');
    alice.sendMessage('nonexistent-peer-999', 'Are you there?');

    // Expect an error back (server returns user_not_found).
    final err = await alice.waitForType('error', timeout: const Duration(seconds: 5));
    print('Received error: ${err['detail']}');
    expect(err['type'], equals('error'));
    print('PASS: Got error for offline peer');
  });
}
