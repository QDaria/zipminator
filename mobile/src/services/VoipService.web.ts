/**
 * VoipService — Web platform stub.
 *
 * On web, react-native-webrtc cannot be imported (it uses requireNativeComponent
 * which doesn't exist in React Native Web). This stub exports the same API
 * surface using browser-native WebRTC APIs.
 *
 * Metro automatically resolves .web.ts over .ts for the web platform.
 */

import { EventEmitter } from 'events';
import { signalingService, SignalingMessage } from './SignalingService';
import type { CallState, CallEvent, MediaConfig, PqcHandshakePayload } from './VoipService.types';

// ── Constants ────────────────────────────────────────────────────────────────

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const DEFAULT_MEDIA_CONFIG: MediaConfig = { audio: true, video: true };

const DTLS_FINGERPRINT_FROM_SDP = 'sdp-derived';

// ── VoipService (Web) ────────────────────────────────────────────────────────

export class VoipService extends EventEmitter {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private targetPeerId: string | null = null;
    private callState: CallState = 'idle';
    private muted = false;
    private cameraOff = false;

    async startCall(targetId: string, config: MediaConfig = DEFAULT_MEDIA_CONFIG): Promise<void> {
        if (this.callState !== 'idle') return;

        this.targetPeerId = targetId;
        this._setState('offering');

        try {
            await this._acquireMedia(config);
            this._createPeerConnection();

            const offer = await this.pc!.createOffer();
            await this.pc!.setLocalDescription(offer);

            signalingService.send({
                type: 'offer',
                target: targetId,
                sdp: offer.sdp,
            });
        } catch (err) {
            console.error('VoipService(web): startCall failed', err);
            this._teardown();
        }
    }

    async answerCall(msg: Pick<SignalingMessage, 'type' | 'sender' | 'sdp'>): Promise<void> {
        this.targetPeerId = msg.sender;
        this._setState('connecting');

        try {
            await this._acquireMedia(DEFAULT_MEDIA_CONFIG);
            this._createPeerConnection();

            await this.pc!.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: msg.sdp ?? '' })
            );

            const answer = await this.pc!.createAnswer();
            await this.pc!.setLocalDescription(answer);

            signalingService.send({
                type: 'answer',
                target: msg.sender,
                sdp: answer.sdp,
            });
        } catch (err) {
            console.error('VoipService(web): answerCall failed', err);
            this._teardown();
        }
    }

    async handleSignalingMessage(msg: SignalingMessage): Promise<void> {
        switch (msg.type) {
            case 'offer':
                await this.answerCall(msg);
                break;
            case 'answer':
                if (!this.pc) return;
                await this.pc.setRemoteDescription(
                    new RTCSessionDescription({ type: 'answer', sdp: msg.sdp ?? '' })
                );
                break;
            case 'candidate':
                await this._addIceCandidate(msg.candidate);
                break;
            default:
                break;
        }
    }

    endCall(): void {
        this._teardown('ended');
    }

    toggleMute(): boolean {
        this.muted = !this.muted;
        this._applyAudioEnabled(!this.muted);
        return this.muted;
    }

    toggleCamera(): boolean {
        this.cameraOff = !this.cameraOff;
        this._applyVideoEnabled(!this.cameraOff);
        return this.cameraOff;
    }

    getPeerConnection(): RTCPeerConnection | null {
        return this.pc;
    }

    getCallState(): CallState {
        return this.callState;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private _setState(next: CallState): void {
        this.callState = next;
        const event: CallEvent = { state: next, peerId: this.targetPeerId ?? '' };
        this.emit('state_change', event);
    }

    private async _acquireMedia(config: MediaConfig): Promise<void> {
        this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: config.audio,
            video: config.video,
        });
    }

    private _createPeerConnection(): void {
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this.pc!.addTrack(track, this.localStream!);
            });
        }

        this.pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            signalingService.send({
                type: 'candidate',
                target: this.targetPeerId!,
                candidate: event.candidate,
            });
        };

        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc?.iceConnectionState;
            if (state === 'connected' || state === 'completed') {
                this._setState('connected');
                this._emitPqcHandshakeNeeded();
            } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                this._teardown('ended');
            }
        };
    }

    private async _addIceCandidate(candidate: any): Promise<void> {
        if (!this.pc) return;
        try {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.warn('VoipService(web): addIceCandidate error', err);
        }
    }

    private _emitPqcHandshakeNeeded(): void {
        const payload: PqcHandshakePayload = {
            dtlsFingerprint: DTLS_FINGERPRINT_FROM_SDP,
            peerId: this.targetPeerId ?? '',
        };
        this.emit('pqc_handshake_needed', payload);
    }

    private _applyAudioEnabled(enabled: boolean): void {
        if (!this.localStream) return;
        this.localStream.getTracks()
            .filter((t) => t.kind === 'audio')
            .forEach((t) => { t.enabled = enabled; });
    }

    private _applyVideoEnabled(enabled: boolean): void {
        if (!this.localStream) return;
        this.localStream.getTracks()
            .filter((t) => t.kind === 'video')
            .forEach((t) => { t.enabled = enabled; });
    }

    private _teardown(finalState?: CallState): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach((t) => t.stop());
            this.localStream = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this.targetPeerId = null;
        this.muted = false;
        this.cameraOff = false;
        if (finalState) {
            this._setState(finalState);
        }
        this.callState = 'idle';
    }
}

export const voipService = new VoipService();
