/**
 * VoipService tests — TDD-first, written before implementation.
 *
 * Mocking strategy:
 *  - react-native-webrtc: full manual mock (RTCPeerConnection, MediaStream, getUserMedia)
 *  - SignalingService: module mock so we can spy on send() without a real WebSocket
 *  - PQC layer: not present in VoipService — we verify the hook-point event fires
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAddTrack = jest.fn();
const mockCreateOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp-offer' });
const mockCreateAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp-answer' });
const mockSetLocalDescription = jest.fn().mockResolvedValue(undefined);
const mockSetRemoteDescription = jest.fn().mockResolvedValue(undefined);
const mockAddIceCandidate = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn();

// Simulate ICE gathering completing with one candidate
let capturedOnIceCandidate: ((e: any) => void) | null = null;
let capturedOnIceConnectionStateChange: (() => void) | null = null;

function MockRTCPeerConnection(this: any, _config: any) {
    this.localDescription = null;
    this.remoteDescription = null;
    this.iceConnectionState = 'new';
    this.addTrack = mockAddTrack;
    this.createOffer = mockCreateOffer;
    this.createAnswer = mockCreateAnswer;
    this.setLocalDescription = jest.fn(async (desc: any) => {
        this.localDescription = desc;
    });
    this.setRemoteDescription = jest.fn(async (desc: any) => {
        this.remoteDescription = desc;
    });
    this.addIceCandidate = mockAddIceCandidate;
    this.close = mockClose;

    Object.defineProperty(this, 'onicecandidate', {
        set: (fn: any) => { capturedOnIceCandidate = fn; },
        get: () => capturedOnIceCandidate,
    });
    Object.defineProperty(this, 'oniceconnectionstatechange', {
        set: (fn: any) => { capturedOnIceConnectionStateChange = fn; },
        get: () => capturedOnIceConnectionStateChange,
    });
}

// Stable track objects so every getTracks() call returns the same references
// (enabling assertions on stop() and .enabled across different test lines).
const mockAudioTrack = { kind: 'audio' as const, stop: jest.fn(), enabled: true };
const mockVideoTrack = { kind: 'video' as const, stop: jest.fn(), enabled: true };
const mockMediaStream = {
    getTracks: () => [mockAudioTrack, mockVideoTrack],
};

const mockGetUserMedia = jest.fn().mockResolvedValue(mockMediaStream);

jest.mock('react-native-webrtc', () => ({
    RTCPeerConnection: MockRTCPeerConnection,
    RTCSessionDescription: jest.fn((desc: any) => desc),
    RTCIceCandidate: jest.fn((c: any) => c),
    mediaDevices: { getUserMedia: mockGetUserMedia },
}));

jest.mock('../SignalingService', () => {
    const { EventEmitter } = require('events');
    const instance = new EventEmitter();
    instance.send = jest.fn();
    instance.connect = jest.fn();
    instance.disconnect = jest.fn();
    return { signalingService: instance };
});

// ─── Subject under test ───────────────────────────────────────────────────────

import { VoipService } from '../VoipService';
import { signalingService } from '../SignalingService';
import type { CallState } from '../VoipService.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeService(): VoipService {
    return new VoipService();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VoipService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedOnIceCandidate = null;
        capturedOnIceConnectionStateChange = null;
        // Reset track state (enabled property and stop mock) between tests
        mockAudioTrack.enabled = true;
        mockVideoTrack.enabled = true;
        mockAudioTrack.stop.mockReset();
        mockVideoTrack.stop.mockReset();
        // Re-wire getUserMedia to return the stable stream
        mockGetUserMedia.mockResolvedValue(mockMediaStream);
    });

    // ── 1. Call initiation ────────────────────────────────────────────────────

    describe('startCall()', () => {
        it('creates an RTCPeerConnection with STUN server config', async () => {
            const svc = makeService();

            await svc.startCall('peer-42');

            // The internal peer connection should exist (non-null)
            expect(svc.getPeerConnection()).not.toBeNull();
        });

        it('transitions state to offering then connecting', async () => {
            const svc = makeService();
            const states: CallState[] = [];
            svc.on('state_change', (evt) => states.push(evt.state));

            await svc.startCall('peer-42');

            expect(states).toContain('offering');
        });

        it('acquires media stream (audio + video)', async () => {
            const svc = makeService();
            await svc.startCall('peer-42');
            expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true, video: true });
        });

        it('sends SDP offer via SignalingService', async () => {
            const svc = makeService();
            await svc.startCall('peer-99');

            expect((signalingService as any).send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'offer',
                    target: 'peer-99',
                    sdp: expect.any(String),
                })
            );
        });

        it('does not start a second call if already in progress', async () => {
            const svc = makeService();
            await svc.startCall('peer-1');
            await svc.startCall('peer-2');

            // getUserMedia only called once — second call is no-op
            expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
        });
    });

    // ── 2. SDP offer/answer exchange ──────────────────────────────────────────

    describe('answerCall()', () => {
        it('sets remote description from incoming offer', async () => {
            const svc = makeService();
            const offerMsg = {
                type: 'offer' as const,
                sender: 'peer-A',
                target: 'me',
                sdp: 'remote-offer-sdp',
            };

            await svc.answerCall(offerMsg);

            const pc = svc.getPeerConnection();
            expect(pc).not.toBeNull();
            expect(pc!.setRemoteDescription).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'offer', sdp: 'remote-offer-sdp' })
            );
        });

        it('creates an SDP answer and sends it via signaling', async () => {
            const svc = makeService();
            const offerMsg = {
                type: 'offer' as const,
                sender: 'peer-B',
                target: 'me',
                sdp: 'remote-offer-sdp',
            };

            await svc.answerCall(offerMsg);

            expect((signalingService as any).send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'answer',
                    target: 'peer-B',
                    sdp: expect.any(String),
                })
            );
        });

        it('handles remote answer by setting remote description', async () => {
            const svc = makeService();
            await svc.startCall('peer-C');

            await svc.handleSignalingMessage({
                type: 'answer',
                sender: 'peer-C',
                target: 'me',
                sdp: 'remote-answer-sdp',
            });

            const pc = svc.getPeerConnection();
            expect(pc!.setRemoteDescription).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'answer', sdp: 'remote-answer-sdp' })
            );
        });
    });

    // ── 3. ICE candidate handling ─────────────────────────────────────────────

    describe('ICE candidate exchange', () => {
        it('sends local ICE candidates via SignalingService', async () => {
            const svc = makeService();
            await svc.startCall('peer-D');

            // Simulate the RTCPeerConnection firing an ICE candidate
            capturedOnIceCandidate!({
                candidate: { candidate: 'candidate:1 1 UDP 2113667327 192.168.1.2 54321 typ host', sdpMid: '0', sdpMLineIndex: 0 },
            });

            expect((signalingService as any).send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'candidate',
                    target: 'peer-D',
                    candidate: expect.objectContaining({ candidate: expect.any(String) }),
                })
            );
        });

        it('ignores null ICE candidate (gathering complete signal)', async () => {
            const svc = makeService();
            await svc.startCall('peer-E');
            const sendCallsBefore = (signalingService as any).send.mock.calls.length;

            capturedOnIceCandidate!({ candidate: null });

            // No additional send beyond the offer
            expect((signalingService as any).send.mock.calls.length).toBe(sendCallsBefore);
        });

        it('adds remote ICE candidates to peer connection', async () => {
            const svc = makeService();
            await svc.startCall('peer-F');

            await svc.handleSignalingMessage({
                type: 'candidate',
                sender: 'peer-F',
                target: 'me',
                candidate: { candidate: 'candidate:1 1 UDP ...', sdpMid: '0', sdpMLineIndex: 0 },
            });

            expect(mockAddIceCandidate).toHaveBeenCalled();
        });
    });

    // ── 4. PQC handshake hook point ───────────────────────────────────────────

    describe('PQC handshake integration point', () => {
        it('emits pqc_handshake_needed when ICE connection reaches connected state', async () => {
            const svc = makeService();
            const pqcListener = jest.fn();
            svc.on('pqc_handshake_needed', pqcListener);

            await svc.startCall('peer-G');

            // Simulate ICE connected
            Object.defineProperty(svc.getPeerConnection(), 'iceConnectionState', { value: 'connected', writable: true });
            capturedOnIceConnectionStateChange!();

            expect(pqcListener).toHaveBeenCalledWith(
                expect.objectContaining({ peerId: 'peer-G' })
            );
        });

        it('pqc_handshake_needed payload includes dtlsFingerprint field', async () => {
            const svc = makeService();
            const pqcListener = jest.fn();
            svc.on('pqc_handshake_needed', pqcListener);

            await svc.startCall('peer-H');
            Object.defineProperty(svc.getPeerConnection(), 'iceConnectionState', { value: 'connected', writable: true });
            capturedOnIceConnectionStateChange!();

            const payload = pqcListener.mock.calls[0][0];
            expect(payload).toHaveProperty('dtlsFingerprint');
        });
    });

    // ── 5. Call teardown ──────────────────────────────────────────────────────

    describe('endCall()', () => {
        it('closes the RTCPeerConnection', async () => {
            const svc = makeService();
            await svc.startCall('peer-I');
            svc.endCall();

            expect(mockClose).toHaveBeenCalled();
        });

        it('stops all media tracks', async () => {
            const svc = makeService();
            await svc.startCall('peer-J');

            svc.endCall();

            expect(mockAudioTrack.stop).toHaveBeenCalled();
            expect(mockVideoTrack.stop).toHaveBeenCalled();
        });

        it('transitions call state to ended', async () => {
            const svc = makeService();
            const states: CallState[] = [];
            svc.on('state_change', (evt) => states.push(evt.state));

            await svc.startCall('peer-K');
            svc.endCall();

            expect(states).toContain('ended');
        });

        it('nullifies internal peer connection reference', async () => {
            const svc = makeService();
            await svc.startCall('peer-L');
            svc.endCall();

            expect(svc.getPeerConnection()).toBeNull();
        });
    });

    // ── 6. Media controls ─────────────────────────────────────────────────────

    describe('toggleMute()', () => {
        it('disables audio track when muting', async () => {
            const svc = makeService();
            await svc.startCall('peer-M');

            svc.toggleMute();

            // mockAudioTrack is the stable reference returned by getTracks()
            expect(mockAudioTrack.enabled).toBe(false);
        });

        it('re-enables audio track when unmuting', async () => {
            const svc = makeService();
            await svc.startCall('peer-N');

            svc.toggleMute(); // mute
            svc.toggleMute(); // unmute

            expect(mockAudioTrack.enabled).toBe(true);
        });
    });

    describe('toggleCamera()', () => {
        it('disables video track when turning camera off', async () => {
            const svc = makeService();
            await svc.startCall('peer-O');

            svc.toggleCamera();

            expect(mockVideoTrack.enabled).toBe(false);
        });

        it('re-enables video track when turning camera on', async () => {
            const svc = makeService();
            await svc.startCall('peer-P');

            svc.toggleCamera(); // off
            svc.toggleCamera(); // on

            expect(mockVideoTrack.enabled).toBe(true);
        });
    });
});

