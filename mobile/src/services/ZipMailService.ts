/**
 * ZipMailService -- Email orchestration service for ZipMail.
 *
 * Coordinates PiiScannerService, KmsService, and EmailCryptoService to
 * provide a single high-level API for sending, opening, and managing
 * PQC-encrypted, self-destructing email.
 *
 * @module ZipMailService
 */

import { EventEmitter } from 'events';
import {
    PiiScannerService,
    type PiiMatch,
    type PiiScanResult,
} from './PiiScannerService';
import {
    KmsService,
    KeyExpiredError,
    ReadReceiptConflictError,
    type SelfDestructMode as KmsSelfDestructMode,
} from './KmsService';
import {
    EmailCryptoService,
    type CompositePublicKey,
    type EmailEnvelope,
} from './EmailCryptoService';
import type {
    ComposeState,
    EmailMessage,
    PiiWarning,
    EncryptionLevel,
    SelfDestructMode,
} from '../types/email';

// ── Event types ─────────────────────────────────────────────────────────────

export type ZipMailEvent =
    | { type: 'pii_scan'; warnings: PiiWarning[] }
    | { type: 'send_progress'; stage: string }
    | { type: 'send_complete'; messageId: string }
    | { type: 'send_error'; error: string }
    | { type: 'decrypt_complete'; body: string; remainingTtl: number }
    | { type: 'decrypt_error'; error: string }
    | { type: 'key_expired'; messageId: string }
    | { type: 'inbox_refresh'; messages: EmailMessage[] };

type ZipMailEventType = ZipMailEvent['type'];

// ── Mock API (placeholder for real backend) ─────────────────────────────────

const MOCK_API_BASE = 'https://api.zipminator.com/v1';

// ── Service ─────────────────────────────────────────────────────────────────

export class ZipMailService extends EventEmitter {
    private piiScanner: PiiScannerService;
    private kms: KmsService;
    private emailCrypto: EmailCryptoService;
    private cachedInbox: EmailMessage[] = [];

    constructor(
        piiScanner?: PiiScannerService,
        kms?: KmsService,
        emailCrypto?: EmailCryptoService,
    ) {
        super();
        this.piiScanner = piiScanner ?? new PiiScannerService({ debounceMs: 200 });
        this.kms = kms ?? new KmsService();
        this.emailCrypto = emailCrypto ?? new EmailCryptoService();

        // Wire PII scanner results to our event emitter
        this.piiScanner.onResult((result: PiiScanResult) => {
            const warnings = this.convertPiiMatches(result.matches);
            this.emit('pii_scan', { type: 'pii_scan', warnings });
        });
    }

    // ── PII Scanning ────────────────────────────────────────────────────────

    /**
     * Trigger a PII scan on compose body text.
     * Results are delivered asynchronously via the 'pii_scan' event.
     */
    scanForPii(text: string): void {
        this.piiScanner.scan(text);
    }

    /**
     * Synchronous instant scan (Layer 1 only) for immediate feedback.
     */
    scanForPiiInstant(text: string): PiiWarning[] {
        const { scanLayer1 } = require('./PiiScannerService');
        const matches: PiiMatch[] = scanLayer1(text);
        return this.convertPiiMatches(matches);
    }

    // ── Send Email ──────────────────────────────────────────────────────────

    /**
     * Send an email through the full PQC pipeline.
     *
     * Flow: PII scan -> encrypt -> store DEK in KMS -> send via API.
     */
    async sendEmail(compose: ComposeState): Promise<string> {
        const messageId = generateMessageId();

        try {
            this.emitProgress('Scanning for sensitive information...');

            // Step 1: Final PII scan (blocking)
            const piiWarnings = this.scanForPiiInstant(compose.body);
            if (piiWarnings.some((w) => w.severity === 'CRITICAL')) {
                this.emit('pii_scan', {
                    type: 'pii_scan',
                    warnings: piiWarnings,
                });
                // Do not block send for critical PII -- the UI should have warned.
                // The user made a conscious choice to proceed.
            }

            // Step 2: Encrypt if PQC mode
            let envelope: EmailEnvelope | null = null;

            if (compose.encryption === 'pqc') {
                this.emitProgress('Looking up recipient key...');
                const recipientKeys = await this.emailCrypto.lookupKey(compose.to);

                if (recipientKeys.length === 0) {
                    throw new Error(`No PQC key found for ${compose.to}`);
                }

                const recipientKey = recipientKeys[0];

                this.emitProgress('Encrypting with ML-KEM-768...');
                const pkBytes = base64ToUint8Array(recipientKey.mlkemPk);
                const headers = `From: user@zipminator.com\r\nTo: ${compose.to}\r\nSubject: ${compose.subject}`;
                envelope = await this.emailCrypto.encryptEmail(pkBytes, compose.body, headers);
            }

            // Step 3: Store DEK in KMS for self-destruct modes
            let kmsKeyId: string | undefined;

            if (compose.selfDestructMode !== 'none' && envelope) {
                this.emitProgress('Configuring self-destruct timer...');

                const kmsMode = compose.selfDestructMode as KmsSelfDestructMode;
                const postReadTtl =
                    compose.selfDestructMode === 'after_read' || compose.selfDestructMode === 'read_once'
                        ? compose.selfDestructTtl
                        : undefined;

                kmsKeyId = await this.kms.storeKey(
                    messageId,
                    envelope.envelope, // DEK reference
                    compose.selfDestructTtl,
                    kmsMode,
                    postReadTtl,
                );
            }

            // Step 4: Send via API (mock for now)
            this.emitProgress('Sending...');
            await this.mockSendApi(messageId, compose, envelope, kmsKeyId);

            this.emit('send_complete', { type: 'send_complete', messageId });
            return messageId;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.emit('send_error', { type: 'send_error', error: message });
            throw err;
        }
    }

    // ── Open / Read Email ───────────────────────────────────────────────────

    /**
     * Open an encrypted email.
     *
     * Flow: fetch DEK from KMS -> decrypt -> send read receipt -> start timer.
     */
    async openEmail(email: EmailMessage): Promise<{ body: string; remainingTtl: number }> {
        try {
            // Non-encrypted emails are returned directly
            if (email.encryption === 'none' || email.encryption === 'tls') {
                return { body: email.body, remainingTtl: -1 };
            }

            // Fetch DEK from KMS
            let remainingTtl = -1;

            if (email.selfDestruct && email.selfDestruct.mode !== 'none') {
                const kmsKeyId = `key_${email.id}`;

                try {
                    const fetchResult = await this.kms.fetchKey(kmsKeyId);
                    remainingTtl = fetchResult.remainingTtl;
                } catch (err) {
                    if (err instanceof KeyExpiredError) {
                        this.emit('key_expired', { type: 'key_expired', messageId: email.id });
                        throw new Error('This message has expired and can no longer be read');
                    }
                    throw err;
                }

                // Send read receipt (triggers post-read TTL for after_read/read_once)
                if (
                    email.selfDestruct.mode === 'after_read' ||
                    email.selfDestruct.mode === 'read_once'
                ) {
                    try {
                        const receipt = await this.kms.sendReadReceipt(kmsKeyId);
                        remainingTtl = receipt.newTtl;
                    } catch (err) {
                        if (!(err instanceof ReadReceiptConflictError)) {
                            throw err;
                        }
                        // Read receipt already sent -- continue normally
                    }
                }
            }

            // Decrypt envelope
            const headers = `From: ${email.from}\r\nTo: ${email.to.join(', ')}\r\nSubject: ${email.subject}`;
            const body = await this.emailCrypto.decryptEmail(
                { envelope: email.body },
                headers,
            );

            this.emit('decrypt_complete', {
                type: 'decrypt_complete',
                body,
                remainingTtl,
            });

            return { body, remainingTtl };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.emit('decrypt_error', { type: 'decrypt_error', error: message });
            throw err;
        }
    }

    // ── Inbox ───────────────────────────────────────────────────────────────

    /**
     * Fetch inbox messages. Currently returns mock data; will integrate with
     * the real API in a future phase.
     */
    async getInbox(): Promise<EmailMessage[]> {
        // TODO: Replace with real API call when backend is ready
        // const response = await fetch(`${MOCK_API_BASE}/inbox`);
        // const data = await response.json();

        this.cachedInbox = MOCK_INBOX;
        this.emit('inbox_refresh', {
            type: 'inbox_refresh',
            messages: this.cachedInbox,
        });
        return this.cachedInbox;
    }

    // ── Delete ──────────────────────────────────────────────────────────────

    /**
     * Delete an email: destroy its DEK in KMS, then remove from inbox.
     */
    async deleteEmail(id: string): Promise<void> {
        // Attempt to crypto-shred the DEK
        try {
            await this.kms.destroyKey(`key_${id}`);
        } catch {
            // Key may already be expired/destroyed -- continue with local removal
        }

        this.cachedInbox = this.cachedInbox.filter((m) => m.id !== id);
        this.emit('inbox_refresh', {
            type: 'inbox_refresh',
            messages: this.cachedInbox,
        });
    }

    // ── Attachment Anonymization ────────────────────────────────────────────

    /**
     * Upload a file attachment to the anonymization endpoint and return the
     * URI (data URL) of the anonymized result.
     *
     * @param fileUri - React Native file URI (e.g. from DocumentPicker)
     * @param level   - Anonymization level 1-10
     * @returns       - Data URL of the anonymized file, suitable for sharing
     */
    async anonymizeAttachment(fileUri: string, level: number): Promise<string> {
        if (level < 1 || level > 10) {
            throw new RangeError(`Anonymization level must be 1-10, got ${level}`);
        }

        // Derive MIME type and filename from the URI
        const filename = fileUri.split('/').pop() ?? 'attachment';
        const ext = filename.split('.').pop()?.toLowerCase() ?? '';
        const mimeType =
            ext === 'csv'     ? 'text/csv' :
            ext === 'json'    ? 'application/json' :
            ext === 'xlsx'    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            ext === 'xls'     ? 'application/vnd.ms-excel' :
            ext === 'parquet' ? 'application/parquet' :
            'text/plain';

        const formData = new FormData();
        // React Native FormData accepts { uri, name, type } objects
        formData.append('file', { uri: fileUri, name: filename, type: mimeType } as unknown as Blob);

        const response = await fetch(
            `${MOCK_API_BASE}/v1/anonymize-attachment?level=${level}`,
            { method: 'POST', body: formData },
        );

        if (!response.ok) {
            const detail = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(detail.detail ?? `Anonymization failed with status ${response.status}`);
        }

        // Return as a data URL so RN can pass it to share / save
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // ── Key Management ──────────────────────────────────────────────────────

    /**
     * Refresh/lookup the composite PQC key for a recipient email address.
     */
    async refreshRecipientKey(email: string): Promise<CompositePublicKey | null> {
        const keys = await this.emailCrypto.lookupKey(email);
        return keys.length > 0 ? keys[0] : null;
    }

    /**
     * Generate and return a new composite keypair for the local user.
     */
    async generateLocalKeypair(): Promise<CompositePublicKey> {
        return this.emailCrypto.generateKeypair();
    }

    // ── Cleanup ─────────────────────────────────────────────────────────────

    destroy(): void {
        this.piiScanner.destroy();
        this.removeAllListeners();
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private convertPiiMatches(matches: PiiMatch[]): PiiWarning[] {
        return matches.map((m) => ({
            patternId: m.patternId,
            patternName: m.patternName,
            severity: m.severity,
            matchedText: m.matchedText,
            startOffset: m.start,
            endOffset: m.end,
            suggestion: suggestionForPattern(m.patternId, m.category),
        }));
    }

    private emitProgress(stage: string): void {
        this.emit('send_progress', { type: 'send_progress', stage });
    }

    /** Mock API call. Will be replaced with real fetch to backend. */
    private async mockSendApi(
        _messageId: string,
        _compose: ComposeState,
        _envelope: EmailEnvelope | null,
        _kmsKeyId?: string,
    ): Promise<void> {
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 150));
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateMessageId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 10);
    return `zm_${ts}_${rand}`;
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function suggestionForPattern(patternId: string, category: string): string {
    if (category === 'credential') {
        return 'Remove this credential before sending. Use a password manager to share secrets securely.';
    }
    if (category === 'national_id') {
        return 'Consider removing or masking this identification number.';
    }
    if (category === 'financial') {
        return 'Financial information detected. Consider redacting account numbers.';
    }
    return 'Sensitive information detected. Review before sending.';
}

// ── Mock inbox data ─────────────────────────────────────────────────────────

const now = Date.now();

const MOCK_INBOX: EmailMessage[] = [
    {
        id: 'msg_001',
        from: 'dr.chen@quantum-lab.org',
        to: ['user@zipminator.com'],
        subject: 'Quantum Lattice Research Collaboration',
        body: 'Hi, I wanted to discuss our joint paper on lattice-based key exchange performance benchmarks. The ML-KEM-768 results look promising...',
        timestamp: now - 1800_000,
        encryption: 'pqc',
        isRead: false,
        hasAttachments: false,
        fingerprint: 'a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4',
    },
    {
        id: 'msg_002',
        from: 'legal@acme-corp.com',
        to: ['user@zipminator.com'],
        cc: ['cfo@acme-corp.com'],
        subject: 'Contract: Q2 Consulting Agreement ($125,000)',
        body: 'Please review the attached consulting agreement. Total compensation: $125,000 over 6 months, payable in monthly installments...',
        timestamp: now - 7200_000,
        encryption: 'pqc',
        selfDestruct: {
            mode: 'after_send',
            expiresAt: now + 604800_000, // 7 days
        },
        isRead: false,
        hasAttachments: true,
        fingerprint: 'f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2',
    },
    {
        id: 'msg_003',
        from: 'sarah@team.zipminator.com',
        to: ['user@zipminator.com'],
        subject: 'Sprint retro notes',
        body: 'Hey! Great sprint everyone. Here are the key takeaways from the retro: 1) Faster CI pipeline, 2) More pair programming...',
        timestamp: now - 14400_000,
        encryption: 'tls',
        isRead: true,
        hasAttachments: false,
    },
    {
        id: 'msg_004',
        from: 'noreply@accounts.zipminator.com',
        to: ['user@zipminator.com'],
        subject: 'Your password reset code',
        body: 'Your password reset code is: 847291. This code expires in 15 minutes.',
        timestamp: now - 21600_000,
        encryption: 'pqc',
        selfDestruct: {
            mode: 'read_once',
        },
        isRead: false,
        hasAttachments: false,
        fingerprint: 'c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8',
    },
    {
        id: 'msg_005',
        from: 'hr@acme-corp.com',
        to: ['user@zipminator.com'],
        subject: 'Employee Records Update -- SSN Verification',
        body: 'Please confirm your SSN ending in **4589 for our annual records update. This message is under compliance hold.',
        timestamp: now - 43200_000,
        encryption: 'pqc',
        isRead: true,
        hasAttachments: true,
        fingerprint: 'b0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
        legalHold: true,
    },
    {
        id: 'msg_006',
        from: 'newsletter@quantum-weekly.com',
        to: ['user@zipminator.com'],
        subject: 'This Week in PQC: NIST finalizes ML-DSA standard',
        body: 'Top stories: NIST officially publishes ML-DSA (Dilithium) as FIPS 204. Industry adoption accelerating...',
        timestamp: now - 86400_000,
        encryption: 'tls',
        isRead: true,
        hasAttachments: false,
    },
];

// ── Singleton export ────────────────────────────────────────────────────────

export const zipMailService = new ZipMailService();
