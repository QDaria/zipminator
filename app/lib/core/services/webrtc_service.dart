import 'dart:async';
import 'package:flutter_webrtc/flutter_webrtc.dart';

/// ICE server configuration for WebRTC peer connections.
const _iceServers = <Map<String, dynamic>>[
  {'urls': 'stun:stun.l.google.com:19302'},
  {'urls': 'stun:stun1.l.google.com:19302'},
];

/// Callback types for signaling integration.
typedef OnIceCandidate = void Function(RTCIceCandidate candidate);
typedef OnTrack = void Function(MediaStream stream);
typedef OnConnectionState = void Function(RTCPeerConnectionState state);

/// Manages a single RTCPeerConnection to one remote peer.
///
/// Each peer in a conference gets its own [WebRtcService] instance.
/// The local media stream is shared across all instances.
class WebRtcService {
  RTCPeerConnection? _pc;
  MediaStream? _remoteStream;

  final OnIceCandidate onIceCandidate;
  final OnTrack onTrack;
  final OnConnectionState? onConnectionState;

  WebRtcService({
    required this.onIceCandidate,
    required this.onTrack,
    this.onConnectionState,
  });

  bool get isConnected =>
      _pc?.connectionState == RTCPeerConnectionState.RTCPeerConnectionStateConnected;

  /// Initialize the peer connection and add the local stream.
  Future<void> init(MediaStream localStream) async {
    _pc = await createPeerConnection({
      'iceServers': _iceServers,
      'sdpSemantics': 'unified-plan',
    });

    // Add local tracks to the connection.
    for (final track in localStream.getTracks()) {
      await _pc!.addTrack(track, localStream);
    }

    _pc!.onIceCandidate = (candidate) {
      onIceCandidate(candidate);
    };

    _pc!.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        _remoteStream = event.streams.first;
        onTrack(_remoteStream!);
      }
    };

    _pc!.onConnectionState = (state) {
      onConnectionState?.call(state);
    };
  }

  /// Create an SDP offer (caller side).
  Future<String> createOffer() async {
    final offer = await _pc!.createOffer();
    await _pc!.setLocalDescription(offer);
    return offer.sdp!;
  }

  /// Handle a received SDP offer and return an answer (callee side).
  Future<String> handleOffer(String sdp) async {
    await _pc!.setRemoteDescription(
      RTCSessionDescription(sdp, 'offer'),
    );
    final answer = await _pc!.createAnswer();
    await _pc!.setLocalDescription(answer);
    return answer.sdp!;
  }

  /// Handle a received SDP answer (caller side).
  Future<void> handleAnswer(String sdp) async {
    await _pc!.setRemoteDescription(
      RTCSessionDescription(sdp, 'answer'),
    );
  }

  /// Add a received ICE candidate.
  Future<void> addIceCandidate(RTCIceCandidate candidate) async {
    await _pc!.addCandidate(candidate);
  }

  /// Close the connection and release resources.
  Future<void> dispose() async {
    _remoteStream?.getTracks().forEach((t) => t.stop());
    await _pc?.close();
    _pc = null;
    _remoteStream = null;
  }
}

/// Configure the audio session for VoIP (critical on iOS for audibility).
/// Must be called AFTER getUserMedia so iOS doesn't reset the audio route.
Future<void> configureVoipAudioSession({bool speakerphone = true}) async {
  await Helper.setSpeakerphoneOn(speakerphone);
}

/// Capture local camera + microphone with VoIP-optimized audio constraints.
Future<MediaStream> getLocalMediaStream({
  bool video = true,
  bool audio = true,
}) async {
  final stream = await navigator.mediaDevices.getUserMedia({
    'audio': audio
        ? {
            'echoCancellation': true,
            'autoGainControl': true,
            'noiseSuppression': true,
            'sampleRate': 48000,
            'channelCount': 1,
            // iOS: force voice processing audio unit for clear VoIP audio
            'googEchoCancellation': true,
            'googAutoGainControl': true,
            'googNoiseSuppression': true,
            'googHighpassFilter': true,
          }
        : false,
    'video': video
        ? {
            'facingMode': 'user',
            'width': {'ideal': 640},
            'height': {'ideal': 480},
          }
        : false,
  });

  // Ensure audio tracks are enabled and volume is up.
  for (final track in stream.getAudioTracks()) {
    track.enabled = true;
  }

  return stream;
}
