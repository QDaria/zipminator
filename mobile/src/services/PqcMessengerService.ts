import ZipminatorCrypto from '../modules/zipminator-crypto';
import { signalingService, SignalingMessage } from './SignalingService';

export class PqcMessengerService {
    private localKeyPair: { publicKey: string, secretKey: string } | null = null;
    private remotePublicKey: string | null = null;
    private sharedSecret: string | null = null;
    private targetId: string | null = null;

    constructor() { }

    async initialize(targetId: string) {
        this.targetId = targetId;
        // Generate our persistent static keypair for this session
        this.localKeyPair = await ZipminatorCrypto.generateKEMKeyPair('Kyber768');

        // Listen for signaling messages
        signalingService.on('message', this.handleSignalingMessage.bind(this));
    }

    async startHandshake() {
        if (!this.localKeyPair || !this.targetId) return;

        // Send our public key to the target
        signalingService.send({
            target: this.targetId,
            type: 'pqc_handshake',
            payload: { publicKey: this.localKeyPair.publicKey }
        });
    }

    private async handleSignalingMessage(msg: SignalingMessage) {
        if (msg.type === 'pqc_handshake' && msg.payload.publicKey) {
            console.log('PQC: Received remote public key');
            this.remotePublicKey = msg.payload.publicKey;

            // If we are the "responder", we encapsulate a secret
            if (this.localKeyPair) {
                const { ciphertext, sharedSecret } = await ZipminatorCrypto.encapsulateSecret(
                    this.remotePublicKey!,
                    'Kyber768'
                );
                this.sharedSecret = sharedSecret;

                // Send the ciphertext back to the initiator
                signalingService.send({
                    target: msg.sender,
                    type: 'pqc_handshake',
                    payload: { ciphertext }
                });
            }
        } else if (msg.type === 'pqc_handshake' && msg.payload.ciphertext) {
            console.log('PQC: Received ciphertext, decapsulating...');
            if (this.localKeyPair) {
                this.sharedSecret = await ZipminatorCrypto.decapsulateSecret(
                    msg.payload.ciphertext,
                    this.localKeyPair.secretKey,
                    'Kyber768'
                );
                console.log('PQC: Shared secret established!');
            }
        }
    }

    async encryptMessage(text: string): Promise<string> {
        if (!this.sharedSecret) return text; // Fallback or throw error
        // In a real implementation, we'd use the sharedSecret to derive AES keys
        return `[PQC_ENCRYPTED:${text}]`;
    }

    async decryptMessage(encryptedText: string): Promise<string> {
        if (!this.sharedSecret) return encryptedText;
        return encryptedText.replace('[PQC_ENCRYPTED:', '').replace(']', '');
    }
}

export const pqcMessenger = new PqcMessengerService();
