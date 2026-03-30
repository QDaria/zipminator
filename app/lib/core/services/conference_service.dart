import 'dart:async';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'webrtc_service.dart';

/// Callback for sending signaling messages to a specific peer.
typedef SendSignal = void Function(String target, String type, Map<String, dynamic> payload);

/// Manages a multi-peer WebRTC mesh for conference calls.
///
/// Each peer gets its own [WebRtcService]. The local media stream
/// is shared across all connections. Supports up to ~6 peers
/// (mesh topology; beyond that use an SFU).
class ConferenceService {
  final SendSignal _sendSignal;
  final Map<String, WebRtcService> _peers = {};
  MediaStream? _localStream;

  /// Remote streams keyed by peer ID.
  final _remoteStreams = <String, MediaStream>{};
  final _remoteStreamController =
      StreamController<Map<String, MediaStream>>.broadcast();

  /// Emits the current set of remote streams whenever a peer joins/leaves.
  Stream<Map<String, MediaStream>> get remoteStreams =>
      _remoteStreamController.stream;

  /// Current remote streams snapshot.
  Map<String, MediaStream> get currentRemoteStreams =>
      Map.unmodifiable(_remoteStreams);

  /// The local camera/mic stream.
  MediaStream? get localStream => _localStream;

  /// Connected peer IDs.
  List<String> get peerIds => _peers.keys.toList();

  ConferenceService({required SendSignal sendSignal})
      : _sendSignal = sendSignal;

  /// Start the local media capture.
  Future<void> startLocalMedia({bool video = true, bool audio = true}) async {
    _localStream = await getLocalMediaStream(video: video, audio: audio);
  }

  /// A new peer joined the room — create a connection and send an offer.
  Future<void> onPeerJoined(String peerId) async {
    if (_peers.containsKey(peerId) || _localStream == null) return;

    final service = WebRtcService(
      onIceCandidate: (candidate) {
        _sendSignal(peerId, 'ice-candidate', {
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        });
      },
      onTrack: (stream) {
        _remoteStreams[peerId] = stream;
        _remoteStreamController.add(Map.from(_remoteStreams));
      },
    );

    await service.init(_localStream!);
    _peers[peerId] = service;

    // Create and send offer.
    final sdp = await service.createOffer();
    _sendSignal(peerId, 'offer', {'sdp': sdp});
  }

  /// A peer left the room — close that connection.
  Future<void> onPeerLeft(String peerId) async {
    final service = _peers.remove(peerId);
    await service?.dispose();
    _remoteStreams.remove(peerId);
    _remoteStreamController.add(Map.from(_remoteStreams));
  }

  /// Handle an incoming signaling message from a peer.
  Future<void> handleSignal(
    String fromPeerId,
    String type,
    Map<String, dynamic> payload,
  ) async {
    switch (type) {
      case 'offer':
        await _handleOffer(fromPeerId, payload['sdp'] as String);
      case 'answer':
        final service = _peers[fromPeerId];
        if (service != null) {
          await service.handleAnswer(payload['sdp'] as String);
        }
      case 'ice-candidate':
        final service = _peers[fromPeerId];
        if (service != null) {
          await service.addIceCandidate(RTCIceCandidate(
            payload['candidate'] as String?,
            payload['sdpMid'] as String?,
            payload['sdpMLineIndex'] as int?,
          ));
        }
    }
  }

  Future<void> _handleOffer(String fromPeerId, String sdp) async {
    if (_localStream == null) return;

    // Create a new connection for this peer if we don't have one.
    var service = _peers[fromPeerId];
    if (service == null) {
      service = WebRtcService(
        onIceCandidate: (candidate) {
          _sendSignal(fromPeerId, 'ice-candidate', {
            'candidate': candidate.candidate,
            'sdpMid': candidate.sdpMid,
            'sdpMLineIndex': candidate.sdpMLineIndex,
          });
        },
        onTrack: (stream) {
          _remoteStreams[fromPeerId] = stream;
          _remoteStreamController.add(Map.from(_remoteStreams));
        },
      );
      await service.init(_localStream!);
      _peers[fromPeerId] = service;
    }

    // Create answer and send it back.
    final answerSdp = await service.handleOffer(sdp);
    _sendSignal(fromPeerId, 'answer', {'sdp': answerSdp});
  }

  /// Toggle mute on the local audio track.
  void toggleMute() {
    final audioTracks = _localStream?.getAudioTracks();
    if (audioTracks != null && audioTracks.isNotEmpty) {
      audioTracks.first.enabled = !audioTracks.first.enabled;
    }
  }

  /// Whether local audio is muted.
  bool get isMuted {
    final audioTracks = _localStream?.getAudioTracks();
    if (audioTracks != null && audioTracks.isNotEmpty) {
      return !audioTracks.first.enabled;
    }
    return true;
  }

  /// Toggle local video on/off.
  void toggleVideo() {
    final videoTracks = _localStream?.getVideoTracks();
    if (videoTracks != null && videoTracks.isNotEmpty) {
      videoTracks.first.enabled = !videoTracks.first.enabled;
    }
  }

  /// Whether local video is disabled.
  bool get isVideoOff {
    final videoTracks = _localStream?.getVideoTracks();
    if (videoTracks != null && videoTracks.isNotEmpty) {
      return !videoTracks.first.enabled;
    }
    return true;
  }

  /// Close all connections and release media.
  Future<void> dispose() async {
    for (final service in _peers.values) {
      await service.dispose();
    }
    _peers.clear();
    _remoteStreams.clear();
    _localStream?.getTracks().forEach((t) => t.stop());
    _localStream?.dispose();
    _localStream = null;
    _remoteStreamController.close();
  }
}
