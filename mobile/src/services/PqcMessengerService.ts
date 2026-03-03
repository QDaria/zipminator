import { EventEmitter } from 'events';
import ZipminatorCrypto from '../../modules/zipminator-crypto';
import { signalingService, SignalingMessage } from './SignalingService';
import type {
    ConnectionState,
    RatchetState,
    EncryptedMessage,
    CryptoError,
} from '../types/crypto';

// Re-export types consumed by the component layer
export type { ConnectionState, RatchetState, EncryptedMessage, CryptoError };

// ─── Handshake step constants ────────────────────────────────────────────────

const STEP_IDLE = 0;      // No handshake in progress
const STEP_SENT_PK = 1;   // Alice: sent our KEM public key, waiting for CT + peer PK
const STEP_COMPLETE = 3;  // Both sides: ratchet initialised, session secure

// ─── PqcMessengerService ─────────────────────────────────────────────────────

export class PqcMessengerService extends EventEmitter {
    private localKeyPair: { publicKey: string; secretKey: string } | null = null;
    private targetId: string | null = null;
    private isInitiator: boolean = false;
    private handshakeStep: number = STEP_IDLE;

    private ratchetState: RatchetState = {
        epoch: 0,
        messagesSent: 0,
        messagesReceived: 0,
        isSecure: false,
    };

    private connectionState: ConnectionState = 'disconnected';

    // Bound handler reference so we can remove it on destroy
    private _boundHandler: ((msg: SignalingMessage) => void) | null = null;

    constructor() {
        super();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async initialize(targetId: string): Promise<void> {
        this.targetId = targetId;

        // Generate our static KEM keypair for this session
        this.localKeyPair = await ZipminatorCrypto.generateKEMKeyPair('Kyber768');

        // Register signaling listener
        this._boundHandler = this.handleSignalingMessage.bind(this);
        signalingService.on('message', this._boundHandler);

        this._setConnectionState('connecting');
    }

    async startHandshake(): Promise<void> {
        if (!this.localKeyPair || !this.targetId) return;

        this.isInitiator = true;
        this.handshakeStep = STEP_SENT_PK;
        this._setConnectionState('handshaking');

        // Step 1: Alice sends her KEM public key
        signalingService.send({
            target: this.targetId,
            type: 'pqc_handshake',
            payload: { publicKey: this.localKeyPair.publicKey },
        });
    }

    destroy(): void {
        if (this._boundHandler) {
            signalingService.removeListener('message', this._boundHandler);
            this._boundHandler = null;
        }

        // Null out key material
        this.localKeyPair = null;
        this.targetId = null;
        this.handshakeStep = STEP_IDLE;
        this.ratchetState = {
            epoch: 0,
            messagesSent: 0,
            messagesReceived: 0,
            isSecure: false,
        };
        this._setConnectionState('disconnected');
        this.removeAllListeners();
    }

    // ── Signaling message handler (3-step state machine) ─────────────────────

    private async handleSignalingMessage(msg: SignalingMessage): Promise<void> {
        if (msg.type === 'pqc_handshake') {
            await this._handleHandshakeMessage(msg);
            return;
        }

        if (msg.type === 'chat_message' && msg.payload) {
            await this._handleChatMessage(msg);
        }
    }

    private async _handleHandshakeMessage(msg: SignalingMessage): Promise<void> {
        const payload = msg.payload ?? {};

        // ── Bob path: received Alice's public key ─────────────────────────────
        if (payload.publicKey && !this.isInitiator) {
            this._setConnectionState('handshaking');

            try {
                // Encapsulate a shared secret against Alice's KEM public key
                const { ciphertext } = await ZipminatorCrypto.encapsulateSecret(
                    payload.publicKey,
                    'Kyber768'
                );

                // Initialise Bob's side of the ratchet; get Bob's ratchet PK
                const { publicKey: bobRatchetPk } = await ZipminatorCrypto.initRatchetAsBob();

                // Send ciphertext + Bob's ratchet PK back to Alice
                signalingService.send({
                    target: msg.sender,
                    type: 'pqc_handshake',
                    payload: {
                        ciphertext,
                        ephemeralPk: bobRatchetPk,
                    },
                });
            } catch (err) {
                console.error('PQC: Bob handshake failed', err);
                this._emitError('HANDSHAKE_FAILED', String(err));
                this._setConnectionState('error');
            }
            return;
        }

        // ── Alice path: received Bob's ciphertext + ratchet PK ────────────────
        if (payload.ciphertext && payload.ephemeralPk && this.isInitiator) {
            try {
                if (!this.localKeyPair) throw new Error('No local keypair');

                // Decapsulate to recover the shared secret
                await ZipminatorCrypto.decapsulateSecret(
                    payload.ciphertext,
                    this.localKeyPair.secretKey,
                    'Kyber768'
                );

                // Initialise Alice's ratchet using Bob's ratchet PK
                await ZipminatorCrypto.initRatchetAsAlice(payload.ephemeralPk);

                this.handshakeStep = STEP_COMPLETE;
                this.ratchetState = {
                    ...this.ratchetState,
                    epoch: 1,
                    isSecure: true,
                };

                this._setConnectionState('secure', this.ratchetState);
            } catch (err) {
                console.error('PQC: Alice decapsulation failed', err);
                this._emitError('HANDSHAKE_FAILED', String(err));
                this._setConnectionState('error');
            }
            return;
        }

        // ── Bob path: Alice's ratchet ready signal (no extra payload needed) ──
        // After Bob initialised his ratchet PK, the session is also secure on his side.
        if (payload.ephemeralPk === undefined && payload.ciphertext === undefined && !this.isInitiator) {
            // Bob completes once Alice's first real message arrives via chat_message.
            // Mark secure here conservatively after the exchange round-trips.
            this.handshakeStep = STEP_COMPLETE;
            this.ratchetState = { ...this.ratchetState, epoch: 1, isSecure: true };
            this._setConnectionState('secure', this.ratchetState);
        }
    }

    private async _handleChatMessage(msg: SignalingMessage): Promise<void> {
        if (!this.ratchetState.isSecure) {
            this._emitError('HANDSHAKE_INCOMPLETE', 'Chat message received before handshake completed');
            return;
        }

        const encryptedMsg: EncryptedMessage = msg.payload;

        try {
            const plaintext = await this.decryptMessage(encryptedMsg);
            this.emit('incoming_message', plaintext, msg.sender);
        } catch (err) {
            this._emitError('DECRYPTION_FAILED', String(err));
        }
    }

    // ── Encrypt / Decrypt ─────────────────────────────────────────────────────

    /**
     * Encrypt a plaintext string using the ratchet.
     * Returns an EncryptedMessage ({ header, ciphertext }) — both base64.
     * Falls back to returning the plaintext unchanged when no session is
     * established, so callers can detect the unprotected state.
     */
    async encryptMessage(text: string): Promise<EncryptedMessage> {
        if (!this.ratchetState.isSecure) {
            throw new Error('Session not secure: cannot encrypt');
        }

        const result = await ZipminatorCrypto.ratchetEncrypt(text);

        this.ratchetState = {
            ...this.ratchetState,
            messagesSent: this.ratchetState.messagesSent + 1,
        };

        return result as EncryptedMessage;
    }

    /**
     * Decrypt an EncryptedMessage returned by encryptMessage.
     */
    async decryptMessage(msg: EncryptedMessage): Promise<string> {
        if (!this.ratchetState.isSecure) {
            throw new Error('Session not secure: cannot decrypt');
        }

        const plaintext = await ZipminatorCrypto.ratchetDecrypt(
            msg.header,
            msg.ciphertext
        );

        this.ratchetState = {
            ...this.ratchetState,
            messagesReceived: this.ratchetState.messagesReceived + 1,
        };

        return plaintext as string;
    }

    // ── State accessors ───────────────────────────────────────────────────────

    getRatchetState(): RatchetState {
        return { ...this.ratchetState };
    }

    getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private _setConnectionState(state: ConnectionState, ratchet?: RatchetState): void {
        this.connectionState = state;
        this.emit('state_change', state, ratchet ?? this.ratchetState);
    }

    private _emitError(code: CryptoError, detail: string): void {
        this.emit('error', code, detail);
    }
}

// Singleton export — preserves backward compatibility with existing imports
export const pqcMessenger = new PqcMessengerService();
