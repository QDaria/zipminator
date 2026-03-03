/**
 * EmailCryptoService tests
 *
 * Covers:
 *  - Email encryption/decryption round-trip (via mocked native module)
 *  - Composite keypair generation
 *  - Key directory publish and lookup (via mocked fetch)
 */

// ── Mock ZipminatorCrypto native module ──────────────────────────────────────

const mockEmailEncrypt = jest.fn();
const mockEmailDecrypt = jest.fn();
const mockCompositeKeygen = jest.fn();

jest.mock('../../../modules/zipminator-crypto', () => ({
    __esModule: true,
    default: {
        emailEncrypt: (...args: unknown[]) => mockEmailEncrypt(...args),
        emailDecrypt: (...args: unknown[]) => mockEmailDecrypt(...args),
        compositeKeygen: (...args: unknown[]) => mockCompositeKeygen(...args),
    },
}));

// ── Mock global fetch ────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import {
    EmailCryptoService,
    EmailEnvelope,
    CompositePublicKey,
} from '../EmailCryptoService';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeKey(): CompositePublicKey {
    return {
        mlkemPk: Buffer.alloc(1184).toString('base64'),
        x25519Pk: Buffer.alloc(32).toString('base64'),
        ed25519Pk: Buffer.alloc(32).toString('base64'),
        fingerprint: 'a'.repeat(64),
    };
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('EmailCryptoService', () => {
    let service: EmailCryptoService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new EmailCryptoService('https://keydir.test.qdaria.com');
    });

    // ── Encryption ───────────────────────────────────────────────────────────

    describe('encryptEmail', () => {
        it('calls native emailEncrypt with base64-encoded inputs', async () => {
            mockEmailEncrypt.mockResolvedValue('mock-envelope-base64');

            const pk = new Uint8Array(1184).fill(0x01);
            const result = await service.encryptEmail(pk, 'Hello!', 'From: a@b.com');

            expect(mockEmailEncrypt).toHaveBeenCalledTimes(1);
            expect(mockEmailEncrypt).toHaveBeenCalledWith(
                expect.any(String), // pk base64
                expect.any(String), // plaintext base64
                expect.any(String), // headers base64
            );
            expect(result.envelope).toBe('mock-envelope-base64');
        });

        it('handles empty plaintext', async () => {
            mockEmailEncrypt.mockResolvedValue('empty-envelope');

            const pk = new Uint8Array(1184);
            const result = await service.encryptEmail(pk, '', '');
            expect(result.envelope).toBe('empty-envelope');
        });
    });

    describe('decryptEmail', () => {
        it('calls native emailDecrypt and returns decoded plaintext', async () => {
            // "Hello!" base64-encoded
            const expectedBase64 = Buffer.from('Hello!').toString('base64');
            mockEmailDecrypt.mockResolvedValue(expectedBase64);

            const envelope: EmailEnvelope = { envelope: 'mock-envelope' };
            const result = await service.decryptEmail(envelope, 'From: a@b.com');

            expect(mockEmailDecrypt).toHaveBeenCalledTimes(1);
            expect(result).toBe('Hello!');
        });
    });

    // ── Key generation ───────────────────────────────────────────────────────

    describe('generateKeypair', () => {
        it('returns a CompositePublicKey from native module', async () => {
            const mockKey = makeKey();
            mockCompositeKeygen.mockResolvedValue(mockKey);

            const result = await service.generateKeypair();
            expect(mockCompositeKeygen).toHaveBeenCalledTimes(1);
            expect(result.fingerprint).toBe('a'.repeat(64));
            expect(result.mlkemPk).toBeDefined();
            expect(result.x25519Pk).toBeDefined();
        });
    });

    // ── Key directory publish ────────────────────────────────────────────────

    describe('publishKey', () => {
        it('sends POST to /keys with auth header', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            const key = makeKey();
            await service.publishKey('alice@qdaria.com', key, 'my-token');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://keydir.test.qdaria.com/keys',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer my-token',
                        'Content-Type': 'application/json',
                    }),
                }),
            );

            const body = JSON.parse(
                (mockFetch.mock.calls[0][1] as RequestInit).body as string,
            );
            expect(body.email).toBe('alice@qdaria.com');
            expect(body.fingerprint).toBe('a'.repeat(64));
        });

        it('throws on non-OK response', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 409,
                text: () => Promise.resolve('Conflict'),
            });

            const key = makeKey();
            await expect(
                service.publishKey('alice@qdaria.com', key, 'token'),
            ).rejects.toThrow('Key publication failed (409)');
        });
    });

    // ── Key directory lookup ─────────────────────────────────────────────────

    describe('lookupKey', () => {
        it('returns array of CompositePublicKey on success', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        keys: [
                            {
                                email: 'bob@qdaria.com',
                                mlkem_pk: 'pk1',
                                x25519_pk: 'x1',
                                ed25519_pk: 'e1',
                                fingerprint: 'b'.repeat(64),
                                created_at: '2026-01-01T00:00:00Z',
                                expires_at: null,
                            },
                        ],
                        count: 1,
                    }),
            });

            const keys = await service.lookupKey('bob@qdaria.com');
            expect(keys).toHaveLength(1);
            expect(keys[0].fingerprint).toBe('b'.repeat(64));
            expect(keys[0].mlkemPk).toBe('pk1');
        });

        it('returns empty array when no keys found', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ keys: [], count: 0 }),
            });

            const keys = await service.lookupKey('nobody@example.com');
            expect(keys).toHaveLength(0);
        });

        it('throws on server error', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
            });

            await expect(service.lookupKey('fail@example.com')).rejects.toThrow(
                'Key lookup failed (500)',
            );
        });
    });

    // ── Fingerprint lookup ───────────────────────────────────────────────────

    describe('lookupByFingerprint', () => {
        it('returns key when found', async () => {
            const fp = 'c'.repeat(64);
            mockFetch.mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        keys: [
                            {
                                email: 'carol@qdaria.com',
                                mlkem_pk: 'pk2',
                                x25519_pk: 'x2',
                                ed25519_pk: 'e2',
                                fingerprint: fp,
                                created_at: '2026-01-01T00:00:00Z',
                                expires_at: null,
                            },
                        ],
                        count: 1,
                    }),
            });

            const key = await service.lookupByFingerprint(fp);
            expect(key).not.toBeNull();
            expect(key!.fingerprint).toBe(fp);
        });

        it('returns null when not found', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ keys: [], count: 0 }),
            });

            const key = await service.lookupByFingerprint('d'.repeat(64));
            expect(key).toBeNull();
        });
    });
});
