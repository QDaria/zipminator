export type ConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'handshaking'
    | 'secure'
    | 'error';

export type RatchetState = {
    epoch: number;
    messagesSent: number;
    messagesReceived: number;
    isSecure: boolean;
};

export type EncryptedMessage = {
    header: string;      // base64
    ciphertext: string;  // base64
};

export type HandshakeMessage = {
    publicKey?: string;
    ciphertext?: string;
    ephemeralPk?: string;
};

export type CryptoError =
    | 'HANDSHAKE_FAILED'
    | 'DECRYPTION_FAILED'
    | 'REPLAY_DETECTED'
    | 'KEY_EXHAUSTED';

export type MessageEntry = {
    id: number;
    text: string;
    sender: string;
    encrypted: boolean;
    error: boolean;
    timestamp: number;
};
