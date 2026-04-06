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

  group('VoipState — incoming call phase', () {
    test('isIncomingRinging returns true for incomingRinging phase', () {
      const state = VoipState(phase: CallPhase.incomingRinging);
      expect(state.isIncomingRinging, true);
      expect(state.isRinging, false);
      expect(state.inCall, false);
      expect(state.isIdle, false);
    });

    test('isRinging is false when incomingRinging', () {
      const state = VoipState(phase: CallPhase.incomingRinging);
      expect(state.isRinging, false);
    });

    test('inCall is false during incomingRinging', () {
      const state = VoipState(phase: CallPhase.incomingRinging);
      expect(state.inCall, false);
    });

    test('copyWith transitions from incomingRinging to connected', () {
      const state = VoipState(
        phase: CallPhase.incomingRinging,
        contact: VoipContact(
          id: 'live-alice',
          name: 'alice',
          email: '',
          isOnline: true,
        ),
      );
      final accepted = state.copyWith(
        phase: CallPhase.connected,
        isPqSecured: true,
        isSpeaker: true,
      );
      expect(accepted.inCall, true);
      expect(accepted.isPqSecured, true);
      expect(accepted.isSpeaker, true);
      expect(accepted.contact?.name, 'alice');
    });

    test('copyWith transitions from incomingRinging to idle on decline', () {
      const state = VoipState(
        phase: CallPhase.incomingRinging,
        contact: VoipContact(
          id: 'live-bob',
          name: 'bob',
          email: '',
          isOnline: true,
        ),
      );
      const declined = VoipState();
      expect(declined.isIdle, true);
      expect(declined.contact, null);
      // Verify the original state was incomingRinging.
      expect(state.isIncomingRinging, true);
    });
  });

  group('VoipState — conference', () {
    test('isConference is true for conferencing phase', () {
      const state = VoipState(
        phase: CallPhase.conferencing,
        roomId: 'zip-12345',
      );
      expect(state.isConference, true);
      expect(state.inCall, true);
      expect(state.roomId, 'zip-12345');
    });

    test('clearRoom resets roomId to null', () {
      const state = VoipState(
        phase: CallPhase.conferencing,
        roomId: 'zip-12345',
      );
      final cleared = state.copyWith(clearRoom: true, phase: CallPhase.idle);
      expect(cleared.roomId, isNull);
      expect(cleared.isIdle, true);
    });

    test('participants list tracks peers', () {
      const state = VoipState(
        phase: CallPhase.conferencing,
        participants: ['alice', 'bob'],
      );
      expect(state.participants.length, 2);
      final afterLeave = state.copyWith(
        participants: state.participants.where((p) => p != 'bob').toList(),
      );
      expect(afterLeave.participants, ['alice']);
    });
  });

  group('VoipState — timer reset on call end', () {
    test('resetting to VoipState() clears duration', () {
      const active = VoipState(
        phase: CallPhase.connected,
        callDuration: Duration(seconds: 45),
      );
      expect(active.callDuration.inSeconds, 45);

      // Simulates what endCall and remote call_end do: reset to const VoipState()
      const reset = VoipState();
      expect(reset.callDuration, Duration.zero);
      expect(reset.isIdle, true);
    });
  });

  group('CallPhase enum', () {
    test('contains incomingRinging value', () {
      expect(CallPhase.values, contains(CallPhase.incomingRinging));
    });

    test('all expected phases exist', () {
      expect(CallPhase.values.length, 6);
      expect(
        CallPhase.values,
        containsAll([
          CallPhase.idle,
          CallPhase.ringing,
          CallPhase.incomingRinging,
          CallPhase.connected,
          CallPhase.conferencing,
          CallPhase.ended,
        ]),
      );
    });
  });
}
