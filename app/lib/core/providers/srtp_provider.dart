import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// Call lifecycle phases for the VoIP demo.
enum CallPhase { idle, ringing, connected, ended }

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
  });

  /// Convenience getters for backward compatibility.
  bool get inCall => phase == CallPhase.connected;
  bool get isRinging => phase == CallPhase.ringing;
  bool get isEnded => phase == CallPhase.ended;
  bool get isIdle => phase == CallPhase.idle;

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
    bool clearContact = false,
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
      );
}

/// Manages VoIP call state with PQ-SRTP key derivation and live signaling.
class VoipNotifier extends Notifier<VoipState> {
  @override
  VoipState build() => const VoipState();

  /// Transition to ringing state and send call offer through signaling.
  void startRinging(VoipContact contact) {
    state = VoipState(
      phase: CallPhase.ringing,
      contact: contact,
    );
    // Send call offer via signaling server if connected.
    ref.read(ratchetProvider.notifier).sendCallOffer(contact.id);
  }

  /// Handle an incoming call_accept signal from the peer.
  /// Called by the VoIP screen when it receives a call_accept signal.
  void onCallAccepted() {
    // The call acceptance means the peer is ready; KEM exchange
    // is handled by the screen's _callContact flow which proceeds
    // to connectCall after ringing.
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

  /// Legacy alias kept for compatibility with other code.
  Future<void> startCall(Uint8List sharedSecret) => connectCall(sharedSecret);

  void endCall() {
    // Notify peer via signaling if we have a contact.
    final contact = state.contact;
    if (contact != null) {
      ref.read(ratchetProvider.notifier).sendCallEnd(contact.id);
    }
    state = const VoipState();
  }

  void toggleMute() {
    state = state.copyWith(isMuted: !state.isMuted);
  }

  void toggleSpeaker() {
    state = state.copyWith(isSpeaker: !state.isSpeaker);
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
