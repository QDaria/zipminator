import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/services/conference_service.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// Call lifecycle phases.
enum CallPhase { idle, ringing, connected, conferencing, ended }

/// A VoIP contact (reuses the same demo cast as the messenger).
class VoipContact {
  final String id;
  final String name;
  final String email;
  final bool isOnline;

  const VoipContact({
    required this.id,
    required this.name,
    required this.email,
    required this.isOnline,
  });

  /// Create a VoIP contact from a Messenger contact.
  factory VoipContact.fromContact(Contact contact) => VoipContact(
        id: contact.id,
        name: contact.name,
        email: contact.email,
        isOnline: contact.isOnline,
      );
}

/// Provider that exposes the shared contacts from ratchet_provider as VoipContacts.
final voipContactsProvider = Provider<List<VoipContact>>((ref) {
  final ratchetState = ref.watch(ratchetProvider);
  return ratchetState.contacts
      .map((c) => VoipContact.fromContact(c))
      .toList();
});

/// State for a VoIP call with PQ-SRTP.
class VoipState {
  final CallPhase phase;
  final VoipContact? contact;
  final bool isPqSecured;
  final Uint8List? srtpMasterKey;
  final Uint8List? srtpMasterSalt;
  final Duration callDuration;
  final bool isMuted;
  final bool isSpeaker;
  final String? error;

  /// Conference room ID (null for 1:1 calls).
  final String? roomId;

  /// Peer usernames currently in the conference.
  final List<String> participants;

  const VoipState({
    this.phase = CallPhase.idle,
    this.contact,
    this.isPqSecured = false,
    this.srtpMasterKey,
    this.srtpMasterSalt,
    this.callDuration = Duration.zero,
    this.isMuted = false,
    this.isSpeaker = false,
    this.error,
    this.roomId,
    this.participants = const [],
  });

  /// Convenience getters for backward compatibility.
  bool get inCall =>
      phase == CallPhase.connected || phase == CallPhase.conferencing;
  bool get isRinging => phase == CallPhase.ringing;
  bool get isEnded => phase == CallPhase.ended;
  bool get isIdle => phase == CallPhase.idle;
  bool get isConference => phase == CallPhase.conferencing;

  VoipState copyWith({
    CallPhase? phase,
    VoipContact? contact,
    bool? isPqSecured,
    Uint8List? srtpMasterKey,
    Uint8List? srtpMasterSalt,
    Duration? callDuration,
    bool? isMuted,
    bool? isSpeaker,
    String? error,
    String? roomId,
    List<String>? participants,
    bool clearContact = false,
    bool clearRoom = false,
  }) =>
      VoipState(
        phase: phase ?? this.phase,
        contact: clearContact ? null : (contact ?? this.contact),
        isPqSecured: isPqSecured ?? this.isPqSecured,
        srtpMasterKey: srtpMasterKey ?? this.srtpMasterKey,
        srtpMasterSalt: srtpMasterSalt ?? this.srtpMasterSalt,
        callDuration: callDuration ?? this.callDuration,
        isMuted: isMuted ?? this.isMuted,
        isSpeaker: isSpeaker ?? this.isSpeaker,
        error: error,
        roomId: clearRoom ? null : (roomId ?? this.roomId),
        participants: participants ?? this.participants,
      );
}

/// Manages VoIP call state with PQ-SRTP key derivation, live signaling,
/// and WebRTC conference support.
class VoipNotifier extends Notifier<VoipState> {
  ConferenceService? _conference;
  StreamSubscription<Map<String, dynamic>>? _signalSub;

  @override
  VoipState build() {
    ref.onDispose(() {
      _signalSub?.cancel();
      _conference?.dispose();
    });
    return const VoipState();
  }

  // ── 1:1 calls ─────────────────────────────────────────────────────

  /// Transition to ringing state and send call offer through signaling.
  void startRinging(VoipContact contact) {
    state = VoipState(
      phase: CallPhase.ringing,
      contact: contact,
    );
    ref.read(ratchetProvider.notifier).sendCallOffer(contact.id);
  }

  /// Derive SRTP keys from a Kyber shared secret and move to connected.
  Future<void> connectCall(Uint8List sharedSecret) async {
    try {
      final keys = await rust.deriveSrtpKeys(sharedSecret: sharedSecret);
      state = state.copyWith(
        phase: CallPhase.connected,
        isPqSecured: true,
        srtpMasterKey: Uint8List.fromList(keys.masterKey),
        srtpMasterSalt: Uint8List.fromList(keys.masterSalt),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> startCall(Uint8List sharedSecret) => connectCall(sharedSecret);

  void endCall() {
    final contact = state.contact;
    if (contact != null) {
      ref.read(ratchetProvider.notifier).sendCallEnd(contact.id);
    }
    if (state.roomId != null) {
      ref.read(ratchetProvider.notifier).leaveRoom();
    }
    _signalSub?.cancel();
    _conference?.dispose();
    _conference = null;
    state = const VoipState();
  }

  // ── Conference calls ──────────────────────────────────────────────

  /// Create a conference room and start local media.
  Future<void> createConference(String roomId) async {
    final ratchet = ref.read(ratchetProvider.notifier);
    _conference = ConferenceService(
      sendSignal: (target, type, payload) {
        ratchet.sendWebRtcSignal(target, type, payload);
      },
    );

    await _conference!.startLocalMedia();
    ratchet.createRoom(roomId);
    ratchet.joinRoom(roomId);
    _listenToSignals();

    state = state.copyWith(
      phase: CallPhase.conferencing,
      roomId: roomId,
      isPqSecured: true,
    );
  }

  /// Join an existing conference room.
  Future<void> joinConference(String roomId) async {
    final ratchet = ref.read(ratchetProvider.notifier);
    _conference = ConferenceService(
      sendSignal: (target, type, payload) {
        ratchet.sendWebRtcSignal(target, type, payload);
      },
    );

    await _conference!.startLocalMedia();
    ratchet.joinRoom(roomId);
    _listenToSignals();

    state = state.copyWith(
      phase: CallPhase.conferencing,
      roomId: roomId,
      isPqSecured: true,
    );
  }

  void _listenToSignals() {
    _signalSub?.cancel();
    _signalSub =
        ref.read(ratchetProvider.notifier).callSignals.listen((msg) {
      final from = msg['from'] as String? ?? '';
      final type = msg['type'] as String? ?? '';

      if (type == 'peer_joined') {
        final peerId = msg['peer_id'] as String? ?? '';
        if (peerId.isNotEmpty) {
          _conference?.onPeerJoined(peerId);
          final updated = [...state.participants, peerId];
          state = state.copyWith(participants: updated);
        }
      } else if (type == 'peer_left') {
        final peerId = msg['peer_id'] as String? ?? '';
        if (peerId.isNotEmpty) {
          _conference?.onPeerLeft(peerId);
          final updated = state.participants.where((p) => p != peerId).toList();
          state = state.copyWith(participants: updated);
        }
      } else if (['offer', 'answer', 'ice-candidate'].contains(type)) {
        _conference?.handleSignal(from, type, msg);
      }
    });
  }

  /// The conference service (for accessing local/remote streams in UI).
  ConferenceService? get conference => _conference;

  // ── Controls ──────────────────────────────────────────────────────

  void toggleMute() {
    _conference?.toggleMute();
    state = state.copyWith(isMuted: !state.isMuted);
  }

  void toggleSpeaker() {
    state = state.copyWith(isSpeaker: !state.isSpeaker);
  }

  void toggleVideo() {
    _conference?.toggleVideo();
  }

  void updateCallDuration(Duration duration) {
    state = state.copyWith(callDuration: duration);
  }
}

final voipProvider =
    NotifierProvider<VoipNotifier, VoipState>(VoipNotifier.new);

/// A single entry in the call history list.
class CallHistoryEntry {
  final String contactName;
  final Duration duration;
  final DateTime timestamp;

  const CallHistoryEntry({
    required this.contactName,
    required this.duration,
    required this.timestamp,
  });
}

/// Manages the in-memory list of recent simulated calls.
class CallHistoryNotifier extends Notifier<List<CallHistoryEntry>> {
  @override
  List<CallHistoryEntry> build() => [];

  void addEntry(CallHistoryEntry entry) {
    // Keep the 10 most recent calls, newest first.
    state = [entry, ...state].take(10).toList();
  }
}

final callHistoryProvider =
    NotifierProvider<CallHistoryNotifier, List<CallHistoryEntry>>(
  CallHistoryNotifier.new,
);
