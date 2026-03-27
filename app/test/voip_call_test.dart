import 'package:flutter_test/flutter_test.dart';
import 'package:zipminator/core/providers/srtp_provider.dart';

void main() {
  group('VoipState', () {
    test('initial state is not in call', () {
      const state = VoipState();
      expect(state.inCall, false);
      expect(state.isPqSecured, false);
      expect(state.isMuted, false);
      expect(state.isSpeaker, false);
      expect(state.callDuration, Duration.zero);
    });

    test('copyWith toggles mute', () {
      const state = VoipState(phase: CallPhase.connected, isMuted: false);
      final toggled = state.copyWith(isMuted: true);
      expect(toggled.isMuted, true);
      expect(toggled.inCall, true);
    });

    test('copyWith toggles speaker', () {
      const state = VoipState(phase: CallPhase.connected, isSpeaker: false);
      final toggled = state.copyWith(isSpeaker: true);
      expect(toggled.isSpeaker, true);
    });

    test('copyWith updates call duration', () {
      const state = VoipState(phase: CallPhase.connected);
      final updated =
          state.copyWith(callDuration: const Duration(seconds: 30));
      expect(updated.callDuration.inSeconds, 30);
    });
  });
}
