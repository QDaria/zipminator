import { EventEmitter } from 'events';

export type SignalingMessage = {
    target: string;
    sender: string;
    type: 'offer' | 'answer' | 'candidate' | 'pqc_handshake' | 'chat_message' | 'ratchet_rekey';
    sdp?: string;
    candidate?: any;
    payload?: any;
};

type QueuedMessage = Omit<SignalingMessage, 'sender'>;

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;
const RECONNECT_MAX_ATTEMPTS = 5;

class SignalingService extends EventEmitter {
    private socket: WebSocket | null = null;
    private clientId: string | null = null;
    private baseUrl: string = 'wss://localhost:8000/ws';
    private messageQueue: Array<QueuedMessage> = [];
    private reconnectAttempts: number = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalDisconnect: boolean = false;

    constructor() {
        super();
        // Prevent "Unhandled error" throw when no external listener is attached
        this.on('error', () => {});
    }

    connect(clientId: string) {
        if (!this.baseUrl.startsWith('wss://') && typeof __DEV__ !== 'undefined' && !__DEV__) {
            throw new Error('Insecure WebSocket not allowed in production');
        }
        this.clientId = clientId;
        this.intentionalDisconnect = false;
        this._openSocket();
    }

    private _openSocket() {
        if (!this.clientId) return;

        this.socket = new WebSocket(`${this.baseUrl}/${this.clientId}`);

        this.socket.onopen = () => {
            console.log('Signaling: Connected as', this.clientId);
            this.reconnectAttempts = 0;
            this.emit('connected');
            this._flushQueue();
        };

        this.socket.onmessage = (event) => {
            let message: SignalingMessage;
            try {
                message = JSON.parse(event.data);
            } catch {
                return;
            }
            this.emit('message', message);
        };

        this.socket.onclose = () => {
            console.log('Signaling: Disconnected');
            this.emit('disconnected');

            if (!this.intentionalDisconnect) {
                this._scheduleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error('Signaling: Error', error);
            this.emit('error', error);
        };
    }

    private _scheduleReconnect() {
        if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
            console.warn('Signaling: Max reconnection attempts reached');
            this.emit('reconnect_failed');
            return;
        }

        const delay = Math.min(
            RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts),
            RECONNECT_MAX_DELAY_MS
        );

        this.reconnectAttempts += 1;
        console.log(`Signaling: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this._openSocket();
        }, delay);
    }

    private _flushQueue() {
        if (this.messageQueue.length === 0) return;

        console.log(`Signaling: Flushing ${this.messageQueue.length} queued messages`);
        const queued = [...this.messageQueue];
        this.messageQueue = [];

        for (const msg of queued) {
            this.send(msg);
        }
    }

    send(message: QueuedMessage) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const fullMessage = { ...message, sender: this.clientId };
            this.socket.send(JSON.stringify(fullMessage));
        } else {
            console.warn('Signaling: Socket not open, queuing message');
            this.messageQueue.push(message);
        }
    }

    disconnect() {
        this.intentionalDisconnect = true;

        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.socket?.close();
        this.socket = null;
        this.messageQueue = [];
    }
}

export const signalingService = new SignalingService();
