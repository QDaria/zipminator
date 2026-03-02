export type CallState = 'idle' | 'offering' | 'connecting' | 'connected' | 'ended';

export interface CallEvent {
    state: CallState;
    peerId: string;
}

export interface MediaConfig {
    audio: boolean;
    video: boolean;
}

export interface PqcHandshakePayload {
    dtlsFingerprint: string;
    peerId: string;
}
