import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// State for a VoIP call with PQ-SRTP.
class VoipState {
  final bool inCall;
  final bool isPqSecured;
  final Uint8List? srtpMasterKey;
  final Uint8List? srtpMasterSalt;
  final Duration callDuration;
  final String? error;

  const VoipState({
    this.inCall = false,
    this.isPqSecured = false,
    this.srtpMasterKey,
    this.srtpMasterSalt,
    this.callDuration = Duration.zero,
    this.error,
  });

  VoipState copyWith({
    bool? inCall,
    bool? isPqSecured,
    Uint8List? srtpMasterKey,
    Uint8List? srtpMasterSalt,
    Duration? callDuration,
    String? error,
  }) =>
      VoipState(
        inCall: inCall ?? this.inCall,
        isPqSecured: isPqSecured ?? this.isPqSecured,
        srtpMasterKey: srtpMasterKey ?? this.srtpMasterKey,
        srtpMasterSalt: srtpMasterSalt ?? this.srtpMasterSalt,
        callDuration: callDuration ?? this.callDuration,
        error: error,
      );
}

/// Manages VoIP call state with PQ-SRTP key derivation.
class VoipNotifier extends Notifier<VoipState> {
  @override
  VoipState build() => const VoipState();

  /// Derive SRTP keys from a Kyber shared secret and start a call.
  Future<void> startCall(Uint8List sharedSecret) async {
    try {
      final keys = await rust.deriveSrtpKeys(sharedSecret: sharedSecret);
      state = VoipState(
        inCall: true,
        isPqSecured: true,
        srtpMasterKey: Uint8List.fromList(keys.masterKey),
        srtpMasterSalt: Uint8List.fromList(keys.masterSalt),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void endCall() {
    state = const VoipState();
  }
}

final voipProvider =
    NotifierProvider<VoipNotifier, VoipState>(VoipNotifier.new);
