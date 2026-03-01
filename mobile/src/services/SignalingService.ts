import { EventEmitter } from 'events';

export type SignalingMessage = {
    target: string;
    sender: string;
    type: 'offer' | 'answer' | 'candidate' | 'pqc_handshake';
    sdp?: string;
    candidate?: any;
    payload?: any;
};

class SignalingService extends EventEmitter {
    private socket: WebSocket | null = null;
    private clientId: string | null = null;
    private baseUrl: string = 'ws://localhost:8000/ws'; // In prod, use secure backend URL

    constructor() {
        super();
    }

    connect(clientId: string) {
        this.clientId = clientId;
        this.socket = new WebSocket(`${this.baseUrl}/${clientId}`);

        this.socket.onopen = () => {
            console.log('Signaling: Connected as', clientId);
            this.emit('connected');
        };

        this.socket.onmessage = (event) => {
            const message: SignalingMessage = JSON.parse(event.data);
            console.log('Signaling: Received', message.type, 'from', message.sender);
            this.emit('message', message);
        };

        this.socket.onclose = () => {
            console.log('Signaling: Disconnected');
            this.emit('disconnected');
        };

        this.socket.onerror = (error) => {
            console.error('Signaling: Error', error);
            this.emit('error', error);
        };
    }

    send(message: Omit<SignalingMessage, 'sender'>) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const fullMessage = { ...message, sender: this.clientId };
            this.socket.send(JSON.stringify(fullMessage));
        } else {
            console.warn('Signaling: Socket not open, message not sent');
        }
    }

    disconnect() {
        this.socket?.close();
        this.socket = null;
    }
}

export const signalingService = new SignalingService();
