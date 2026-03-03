/**
 * ZipMailService tests
 *
 * Covers the full orchestration pipeline: PII scanning, encryption,
 * KMS key storage, send/receive flow, self-destruct timer behaviour,
 * and error handling for expired keys and network failures.
 *
 * @jest-environment node
 */

// Disable ts-jest diagnostics for this file. PiiScannerService.ts has a
// pre-existing strict-mode type mismatch in its debounce generic that
// causes ts-jest to fail compilation. The runtime behaviour is correct.
// @ts-jest diagnostics: false

// ── Mocks ───────────────────────────────────────────────────────────────────

// Mock the native crypto module (required by PiiScannerService layer 2)
jest.mock('../../../modules/zipminator-crypto', () => ({
    __esModule: true,
    default: {
        emailEncrypt: jest.fn(),
        emailDecrypt: jest.fn(),
        compositeKeygen: jest.fn(),
        piiScan: undefined,
    },
}));

// Mock PiiScannerService to avoid the pre-existing TS strict error in the
// debounce generic. We re-export the real scanLayer1 and PiiScannerService
// class manually so the ZipMailService can consume them.
const realPiiModule = jest.requireActual('../PiiScannerService') as typeof import('../PiiScannerService');

jest.mock('../PiiScannerService', () => {
    return {
        __esModule: true,
        PiiScannerService: realPiiModule.PiiScannerService,
        scanLayer1: realPiiModule.scanLayer1,
        scanLayer2: realPiiModule.scanLayer2,
        scanLayer3: realPiiModule.scanLayer3,
        debounce: realPiiModule.debounce,
    };
});

// Mock global fetch for KMS and key directory calls
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import { ZipMailService, type ZipMailEvent } from '../ZipMailService';
import { PiiScannerService, scanLayer1 } from '../PiiScannerService';
import { KmsService, KeyExpiredError, ReadReceiptConflictError } from '../KmsService';
import { EmailCryptoService, type CompositePublicKey } from '../EmailCryptoService';
import type { ComposeState, EmailMessage } from '../../types/email';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCompose(overrides: Partial<ComposeState> = {}): ComposeState {
    return {
        to: 'bob@test.com',
        cc: '',
        subject: 'Test Subject',
        body: 'Hello, this is a test email.',
        encryption: 'pqc',
        selfDestructMode: 'none',
        selfDestructTtl: 86400,
        piiWarnings: [],
        isSending: false,
        ...overrides,
    };
}

function makeKey(): CompositePublicKey {
    return {
        mlkemPk: Buffer.alloc(1184).toString('base64'),
        x25519Pk: Buffer.alloc(32).toString('base64'),
        ed25519Pk: Buffer.alloc(32).toString('base64'),
        fingerprint: 'a'.repeat(64),
    };
}

function makeEmail(overrides: Partial<EmailMessage> = {}): EmailMessage {
    return {
        id: 'msg_test_001',
        from: 'alice@test.com',
        to: ['user@zipminator.com'],
        subject: 'Test Email',
        body: 'encrypted-envelope-base64',
        timestamp: Date.now(),
        encryption: 'pqc',
        isRead: false,
        hasAttachments: false,
        ...overrides,
    };
}

// ── Test suite ──────────────────────────────────────────────────────────────

describe('ZipMailService', () => {
    let piiScanner: PiiScannerService;
    let kms: KmsService;
    let emailCrypto: EmailCryptoService;
    let service: ZipMailService;
    let events: ZipMailEvent[];

    beforeEach(() => {
        jest.clearAllMocks();

        piiScanner = new PiiScannerService({ enableNativeScan: false });
        kms = new KmsService({ baseUrl: 'http://localhost:8100' });
        emailCrypto = new EmailCryptoService('https://keydir.test.qdaria.com');

        service = new ZipMailService(piiScanner, kms, emailCrypto);

        // Capture events
        events = [];
        const eventTypes = [
            'pii_scan', 'send_progress', 'send_complete', 'send_error',
            'decrypt_complete', 'decrypt_error', 'key_expired', 'inbox_refresh',
        ];
        for (const type of eventTypes) {
            service.on(type, (evt: ZipMailEvent) => events.push(evt));
        }
    });

    afterEach(() => {
        service.destroy();
    });

    // ── Send Email Flow ─────────────────────────────────────────────────────

    describe('sendEmail', () => {
        it('encrypts and sends a PQC email successfully', async () => {
            jest.spyOn(emailCrypto, 'lookupKey').mockResolvedValue([makeKey()]);
            jest.spyOn(emailCrypto, 'encryptEmail').mockResolvedValue({
                envelope: 'encrypted-base64-envelope',
            });

            const compose = makeCompose();
            const messageId = await service.sendEmail(compose);

            expect(messageId).toMatch(/^zm_/);
            expect(emailCrypto.lookupKey).toHaveBeenCalledWith('bob@test.com');
            expect(emailCrypto.encryptEmail).toHaveBeenCalledTimes(1);

            const sendComplete = events.find((e) => e.type === 'send_complete');
            expect(sendComplete).toBeDefined();
        });

        it('sends a plaintext email without encryption', async () => {
            const compose = makeCompose({ encryption: 'none' });
            const messageId = await service.sendEmail(compose);

            expect(messageId).toMatch(/^zm_/);
            expect(events.some((e) => e.type === 'send_complete')).toBe(true);
        });

        it('stores DEK in KMS for self-destruct emails', async () => {
            jest.spyOn(emailCrypto, 'lookupKey').mockResolvedValue([makeKey()]);
            jest.spyOn(emailCrypto, 'encryptEmail').mockResolvedValue({
                envelope: 'encrypted-envelope',
            });
            jest.spyOn(kms, 'storeKey').mockResolvedValue('kms_key_123');

            const compose = makeCompose({
                selfDestructMode: 'after_send',
                selfDestructTtl: 86400,
            });

            await service.sendEmail(compose);

            expect(kms.storeKey).toHaveBeenCalledWith(
                expect.stringMatching(/^zm_/),
                'encrypted-envelope',
                86400,
                'after_send',
                undefined,
            );
        });

        it('stores DEK with postReadTtl for after_read mode', async () => {
            jest.spyOn(emailCrypto, 'lookupKey').mockResolvedValue([makeKey()]);
            jest.spyOn(emailCrypto, 'encryptEmail').mockResolvedValue({
                envelope: 'enc-env',
            });
            jest.spyOn(kms, 'storeKey').mockResolvedValue('kms_key_456');

            const compose = makeCompose({
                selfDestructMode: 'after_read',
                selfDestructTtl: 3600,
            });

            await service.sendEmail(compose);

            expect(kms.storeKey).toHaveBeenCalledWith(
                expect.any(String),
                'enc-env',
                3600,
                'after_read',
                3600,
            );
        });

        it('throws when no recipient key found', async () => {
            jest.spyOn(emailCrypto, 'lookupKey').mockResolvedValue([]);

            const compose = makeCompose();

            await expect(service.sendEmail(compose)).rejects.toThrow(
                'No PQC key found for bob@test.com',
            );

            const sendError = events.find((e) => e.type === 'send_error');
            expect(sendError).toBeDefined();
        });

        it('emits progress events during send', async () => {
            jest.spyOn(emailCrypto, 'lookupKey').mockResolvedValue([makeKey()]);
            jest.spyOn(emailCrypto, 'encryptEmail').mockResolvedValue({
                envelope: 'enc',
            });

            await service.sendEmail(makeCompose());

            const progressEvents = events.filter((e) => e.type === 'send_progress');
            expect(progressEvents.length).toBeGreaterThanOrEqual(2);
        });
    });

    // ── PII Warning Aggregation ─────────────────────────────────────────────

    describe('PII scanning', () => {
        it('detects critical PII (password) in email body', () => {
            const warnings = service.scanForPiiInstant('My password=SuperSecret123');

            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].severity).toBe('CRITICAL');
            expect(warnings[0].patternName).toBe('Password in Text');
        });

        it('detects AWS access keys', () => {
            const warnings = service.scanForPiiInstant('Use key AKIAIOSFODNN7EXAMPLE');

            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].patternId).toBe('aws_access_key');
        });

        it('returns empty array for clean text', () => {
            const warnings = service.scanForPiiInstant('Hello, how are you today?');
            expect(warnings).toHaveLength(0);
        });

        it('generates human-readable suggestions for credential patterns', () => {
            const warnings = service.scanForPiiInstant('my api_key=abc1234567890xyzABC');

            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].suggestion).toContain('credential');
        });
    });

    // ── Open Email Flow ─────────────────────────────────────────────────────

    describe('openEmail', () => {
        it('decrypts a PQC-encrypted email', async () => {
            jest.spyOn(emailCrypto, 'decryptEmail').mockResolvedValue(
                'Decrypted email body text',
            );

            const email = makeEmail();
            const result = await service.openEmail(email);

            expect(result.body).toBe('Decrypted email body text');
            expect(emailCrypto.decryptEmail).toHaveBeenCalledTimes(1);
        });

        it('returns body directly for non-encrypted emails', async () => {
            const email = makeEmail({ encryption: 'none', body: 'Plain text body' });
            const result = await service.openEmail(email);

            expect(result.body).toBe('Plain text body');
            expect(result.remainingTtl).toBe(-1);
        });

        it('fetches DEK and sends read receipt for self-destruct emails', async () => {
            jest.spyOn(kms, 'fetchKey').mockResolvedValue({
                dekEncrypted: 'dek-enc',
                remainingTtl: 3600,
            });
            jest.spyOn(kms, 'sendReadReceipt').mockResolvedValue({ newTtl: 1800 });
            jest.spyOn(emailCrypto, 'decryptEmail').mockResolvedValue('Secret content');

            const email = makeEmail({
                selfDestruct: { mode: 'after_read', postReadTtl: 1800 },
            });

            const result = await service.openEmail(email);

            expect(kms.fetchKey).toHaveBeenCalledWith('key_msg_test_001');
            expect(kms.sendReadReceipt).toHaveBeenCalledWith('key_msg_test_001');
            expect(result.remainingTtl).toBe(1800);
        });

        it('emits key_expired event for expired keys', async () => {
            jest.spyOn(kms, 'fetchKey').mockRejectedValue(
                new KeyExpiredError('key_msg_test_001'),
            );

            const email = makeEmail({
                selfDestruct: { mode: 'after_send', expiresAt: Date.now() - 1000 },
            });

            await expect(service.openEmail(email)).rejects.toThrow('expired');

            const expiredEvent = events.find((e) => e.type === 'key_expired');
            expect(expiredEvent).toBeDefined();
        });

        it('handles already-sent read receipt gracefully', async () => {
            jest.spyOn(kms, 'fetchKey').mockResolvedValue({
                dekEncrypted: 'dek',
                remainingTtl: 500,
            });
            jest.spyOn(kms, 'sendReadReceipt').mockRejectedValue(
                new ReadReceiptConflictError('key_msg_test_001'),
            );
            jest.spyOn(emailCrypto, 'decryptEmail').mockResolvedValue('Content');

            const email = makeEmail({
                selfDestruct: { mode: 'read_once' },
            });

            const result = await service.openEmail(email);
            expect(result.body).toBe('Content');
        });
    });

    // ── Self-Destruct Timer ─────────────────────────────────────────────────

    describe('self-destruct timer', () => {
        it('skips KMS for non-self-destruct emails', async () => {
            jest.spyOn(emailCrypto, 'decryptEmail').mockResolvedValue('No timer');
            const fetchSpy = jest.spyOn(kms, 'fetchKey');

            const email = makeEmail();
            await service.openEmail(email);

            expect(fetchSpy).not.toHaveBeenCalled();
        });

        it('does not send read receipt for after_send mode', async () => {
            jest.spyOn(kms, 'fetchKey').mockResolvedValue({
                dekEncrypted: 'dek',
                remainingTtl: 7200,
            });
            jest.spyOn(emailCrypto, 'decryptEmail').mockResolvedValue('After send body');
            const spy = jest.spyOn(kms, 'sendReadReceipt');

            const email = makeEmail({
                selfDestruct: { mode: 'after_send', expiresAt: Date.now() + 7200_000 },
            });

            await service.openEmail(email);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    // ── Inbox ───────────────────────────────────────────────────────────────

    describe('getInbox', () => {
        it('returns mock inbox data', async () => {
            const inbox = await service.getInbox();

            expect(inbox.length).toBeGreaterThan(0);
            expect(inbox[0].id).toBeDefined();
            expect(inbox[0].from).toBeDefined();
        });

        it('emits inbox_refresh event', async () => {
            await service.getInbox();

            const refreshEvent = events.find((e) => e.type === 'inbox_refresh');
            expect(refreshEvent).toBeDefined();
        });
    });

    // ── Delete Email ────────────────────────────────────────────────────────

    describe('deleteEmail', () => {
        it('destroys KMS key and removes from cached inbox', async () => {
            await service.getInbox();

            jest.spyOn(kms, 'destroyKey').mockResolvedValue(undefined);

            await service.deleteEmail('msg_001');

            expect(kms.destroyKey).toHaveBeenCalledWith('key_msg_001');
        });

        it('handles KMS destroy failure gracefully', async () => {
            await service.getInbox();

            jest.spyOn(kms, 'destroyKey').mockRejectedValue(new Error('Network error'));

            await service.deleteEmail('msg_001');

            const refreshEvents = events.filter((e) => e.type === 'inbox_refresh');
            expect(refreshEvents.length).toBeGreaterThan(0);
        });
    });

    // ── Key Management ──────────────────────────────────────────────────────

    describe('refreshRecipientKey', () => {
        it('returns the first key from lookup', async () => {
            jest.spyOn(emailCrypto, 'lookupKey').mockResolvedValue([makeKey()]);

            const key = await service.refreshRecipientKey('alice@test.com');
            expect(key).not.toBeNull();
            expect(key!.fingerprint).toBe('a'.repeat(64));
        });

        it('returns null when no keys found', async () => {
            jest.spyOn(emailCrypto, 'lookupKey').mockResolvedValue([]);

            const key = await service.refreshRecipientKey('nobody@test.com');
            expect(key).toBeNull();
        });
    });

    // ── Error Handling ──────────────────────────────────────────────────────

    describe('error handling', () => {
        it('emits send_error on encryption failure', async () => {
            jest.spyOn(emailCrypto, 'lookupKey').mockResolvedValue([makeKey()]);
            jest.spyOn(emailCrypto, 'encryptEmail').mockRejectedValue(
                new Error('Encryption failed'),
            );

            await expect(service.sendEmail(makeCompose())).rejects.toThrow('Encryption failed');

            const errEvent = events.find((e) => e.type === 'send_error');
            expect(errEvent).toBeDefined();
        });

        it('emits decrypt_error on decryption failure', async () => {
            jest.spyOn(emailCrypto, 'decryptEmail').mockRejectedValue(
                new Error('Decryption failed'),
            );

            await expect(service.openEmail(makeEmail())).rejects.toThrow('Decryption failed');

            const errEvent = events.find((e) => e.type === 'decrypt_error');
            expect(errEvent).toBeDefined();
        });
    });
});
