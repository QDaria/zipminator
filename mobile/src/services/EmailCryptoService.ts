/**
 * EmailCryptoService -- TypeScript wrapper for PQC email encryption via FFI.
 *
 * Wraps the native zipminator-crypto module's email encryption FFI to provide
 * a high-level API for encrypting/decrypting email bodies with ML-KEM-768
 * composite keys and managing key publication/lookup against the key directory.
 */

import ZipminatorCrypto from '../../modules/zipminator-crypto';

// ── Types ────────────────────────────────────────────────────────────────────

/** Serialized email envelope (all fields base64-encoded) */
export interface EmailEnvelope {
    /** Base64-encoded serialized envelope bytes */
    envelope: string;
}

/** Composite public key (ML-KEM-768 + X25519) */
export interface CompositePublicKey {
    /** Base64-encoded ML-KEM-768 public key (1184 bytes) */
    mlkemPk: string;
    /** Base64-encoded X25519 public key (32 bytes) */
    x25519Pk: string;
    /** Base64-encoded Ed25519 signing public key (32 bytes) */
    ed25519Pk: string;
    /** Hex-encoded SHA-256 fingerprint */
    fingerprint: string;
}

/** Key directory entry returned from the API */
export interface KeyDirectoryEntry {
    email: string;
    mlkem_pk: string;
    x25519_pk: string;
    ed25519_pk: string;
    fingerprint: string;
    created_at: string;
    expires_at: string | null;
}

/** Key directory lookup response */
export interface KeyLookupResponse {
    keys: KeyDirectoryEntry[];
    count: number;
}

// ── Configuration ────────────────────────────────────────────────────────────

const DEFAULT_KEYDIR_URL = 'https://keydir.qdaria.com';

// ── Service ──────────────────────────────────────────────────────────────────

export class EmailCryptoService {
    private keyDirUrl: string;

    constructor(keyDirUrl: string = DEFAULT_KEYDIR_URL) {
        this.keyDirUrl = keyDirUrl.replace(/\/$/, '');
    }

    // ── Encryption ───────────────────────────────────────────────────────────

    /**
     * Encrypt an email body for a recipient's ML-KEM-768 public key.
     *
     * @param recipientPk  Base64-encoded recipient ML-KEM-768 public key (1184 bytes)
     * @param plaintext    Email body as UTF-8 string
     * @param headers      Email headers for AAD (authenticated but not encrypted)
     * @returns EmailEnvelope with base64-encoded serialized envelope
     */
    async encryptEmail(
        recipientPk: Uint8Array,
        plaintext: string,
        headers: string,
    ): Promise<EmailEnvelope> {
        const pkBase64 = uint8ArrayToBase64(recipientPk);
        const plaintextBase64 = stringToBase64(plaintext);
        const headersBase64 = stringToBase64(headers);

        const result = await ZipminatorCrypto.emailEncrypt(
            pkBase64,
            plaintextBase64,
            headersBase64,
        );

        return { envelope: result as string };
    }

    /**
     * Decrypt an email envelope using the local secret key.
     *
     * @param envelope  The encrypted email envelope (base64 serialized bytes)
     * @param headers   Email headers AAD (must match what was used during encryption)
     * @returns Decrypted plaintext as UTF-8 string
     */
    async decryptEmail(envelope: EmailEnvelope, headers: string): Promise<string> {
        const headersBase64 = stringToBase64(headers);

        const result = await ZipminatorCrypto.emailDecrypt(
            envelope.envelope,
            headersBase64,
        );

        return base64ToString(result as string);
    }

    // ── Key Management ───────────────────────────────────────────────────────

    /**
     * Generate a new composite encryption keypair (ML-KEM-768 + X25519).
     *
     * The secret key is stored locally in the native module's secure storage.
     * Only the public key components are returned.
     *
     * @returns CompositePublicKey containing all public key components
     */
    async generateKeypair(): Promise<CompositePublicKey> {
        const result = await ZipminatorCrypto.compositeKeygen();

        return result as unknown as CompositePublicKey;
    }

    // ── Key Directory ────────────────────────────────────────────────────────

    /**
     * Publish a composite public key to the key directory.
     *
     * @param email     Owner's email address
     * @param key       The composite public key to publish
     * @param authToken Bearer token for key directory authentication
     */
    async publishKey(
        email: string,
        key: CompositePublicKey,
        authToken: string,
    ): Promise<void> {
        const response = await fetch(`${this.keyDirUrl}/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                email,
                mlkem_pk: key.mlkemPk,
                x25519_pk: key.x25519Pk,
                ed25519_pk: key.ed25519Pk,
                fingerprint: key.fingerprint,
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(
                `Key publication failed (${response.status}): ${body}`,
            );
        }
    }

    /**
     * Look up composite public keys for an email address.
     *
     * @param email  The email address to look up
     * @returns Array of composite public keys registered for this address
     */
    async lookupKey(email: string): Promise<CompositePublicKey[]> {
        const response = await fetch(
            `${this.keyDirUrl}/keys/${encodeURIComponent(email)}`,
            { method: 'GET' },
        );

        if (!response.ok) {
            throw new Error(`Key lookup failed (${response.status})`);
        }

        const data: KeyLookupResponse = await response.json();
        return data.keys.map((entry) => ({
            mlkemPk: entry.mlkem_pk,
            x25519Pk: entry.x25519_pk,
            ed25519Pk: entry.ed25519_pk,
            fingerprint: entry.fingerprint,
        }));
    }

    /**
     * Look up a key by fingerprint.
     *
     * @param fingerprint  Hex-encoded SHA-256 fingerprint
     * @returns The matching key, or null if not found
     */
    async lookupByFingerprint(
        fingerprint: string,
    ): Promise<CompositePublicKey | null> {
        const response = await fetch(
            `${this.keyDirUrl}/keys/fingerprint/${fingerprint}`,
            { method: 'GET' },
        );

        if (!response.ok) {
            throw new Error(`Fingerprint lookup failed (${response.status})`);
        }

        const data: KeyLookupResponse = await response.json();
        if (data.count === 0) return null;

        const entry = data.keys[0];
        return {
            mlkemPk: entry.mlkem_pk,
            x25519Pk: entry.x25519_pk,
            ed25519Pk: entry.ed25519_pk,
            fingerprint: entry.fingerprint,
        };
    }
}

// ── Utility functions ────────────────────────────────────────────────────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function stringToBase64(str: string): string {
    // TextEncoder handles UTF-8 encoding properly
    const encoder = new TextEncoder();
    return uint8ArrayToBase64(encoder.encode(str));
}

function base64ToString(base64: string): string {
    const bytes = base64ToUint8Array(base64);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

// ── Singleton export ─────────────────────────────────────────────────────────

export const emailCryptoService = new EmailCryptoService();
