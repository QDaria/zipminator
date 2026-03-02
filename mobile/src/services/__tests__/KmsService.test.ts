/**
 * Tests for KmsService TypeScript client.
 *
 * Uses mocked fetch to avoid requiring a running KMS backend.
 */

import {
  KmsService,
  KmsError,
  KeyExpiredError,
  ReadReceiptConflictError,
  type SelfDestructMode,
} from '../KmsService';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function mockJsonResponse(status: number, body: Record<string, unknown>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('KmsService', () => {
  let kms: KmsService;

  beforeEach(() => {
    mockFetch.mockReset();
    kms = new KmsService({ baseUrl: 'http://localhost:8100' });
  });

  // ── storeKey ────────────────────────────────────────────────────────────

  describe('storeKey', () => {
    it('stores a key and returns key_id', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(201, { key_id: 'abc-123' }),
      );

      const keyId = await kms.storeKey(
        'msg-001',
        'base64-dek',
        3600,
        'after_send',
      );
      expect(keyId).toBe('abc-123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8100/keys');
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body);
      expect(body.message_id).toBe('msg-001');
      expect(body.dek_encrypted).toBe('base64-dek');
      expect(body.ttl_seconds).toBe(3600);
      expect(body.mode).toBe('after_send');
      expect(body.post_read_ttl_seconds).toBeUndefined();
    });

    it('includes post_read_ttl_seconds for after_read mode', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(201, { key_id: 'abc-456' }),
      );

      await kms.storeKey('msg-002', 'dek', 3600, 'after_read', 120);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.post_read_ttl_seconds).toBe(120);
    });

    it('sends correct payload for read_once mode', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(201, { key_id: 'once-key' }),
      );

      const keyId = await kms.storeKey('msg-003', 'dek', 60, 'read_once');
      expect(keyId).toBe('once-key');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.mode).toBe('read_once');
    });
  });

  // ── fetchKey ────────────────────────────────────────────────────────────

  describe('fetchKey', () => {
    it('fetches a key successfully', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(200, {
          dek_encrypted: 'base64-dek',
          remaining_ttl: 3500,
        }),
      );

      const result = await kms.fetchKey('abc-123');
      expect(result.dekEncrypted).toBe('base64-dek');
      expect(result.remainingTtl).toBe(3500);
    });

    it('throws KeyExpiredError for 404', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(404, { detail: 'Key not found or expired' }),
      );

      await expect(kms.fetchKey('expired-key')).rejects.toThrow(
        KeyExpiredError,
      );
    });
  });

  // ── sendReadReceipt ───────────────────────────────────────────────────

  describe('sendReadReceipt', () => {
    it('sends a read receipt and returns new TTL', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(200, { new_ttl: 120 }),
      );

      const result = await kms.sendReadReceipt('abc-123');
      expect(result.newTtl).toBe(120);

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8100/keys/abc-123/read-receipt');
      expect(init.method).toBe('POST');
    });

    it('throws ReadReceiptConflictError for 409', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(409, { detail: 'Read receipt already applied' }),
      );

      await expect(kms.sendReadReceipt('abc-123')).rejects.toThrow(
        ReadReceiptConflictError,
      );
    });

    it('throws KeyExpiredError for 404', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(404, { detail: 'Key not found or expired' }),
      );

      await expect(kms.sendReadReceipt('gone-key')).rejects.toThrow(
        KeyExpiredError,
      );
    });
  });

  // ── destroyKey ────────────────────────────────────────────────────────

  describe('destroyKey', () => {
    it('destroys a key', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(200, { destroyed: true }),
      );

      await expect(kms.destroyKey('abc-123')).resolves.toBeUndefined();

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8100/keys/abc-123');
      expect(init.method).toBe('DELETE');
    });

    it('throws KeyExpiredError for 404', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(404, { detail: 'Key not found or already destroyed' }),
      );

      await expect(kms.destroyKey('gone-key')).rejects.toThrow(
        KeyExpiredError,
      );
    });
  });

  // ── Error handling ────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws KmsError for unexpected status codes', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(500, { detail: 'Internal server error' }),
      );

      await expect(kms.fetchKey('any-key')).rejects.toThrow(KmsError);
    });

    it('handles non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.reject(new Error('not json')),
      });

      await expect(kms.fetchKey('any-key')).rejects.toThrow(KmsError);
    });
  });

  // ── Configuration ─────────────────────────────────────────────────────

  describe('configuration', () => {
    it('uses default base URL', () => {
      const defaultKms = new KmsService();
      // Store a key to verify the URL used
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(201, { key_id: 'id' }),
      );
      defaultKms.storeKey('m', 'd', 60, 'after_send');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('http://127.0.0.1:8100/keys');
    });

    it('strips trailing slash from base URL', () => {
      const slashKms = new KmsService({ baseUrl: 'http://example.com/' });
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(201, { key_id: 'id' }),
      );
      slashKms.storeKey('m', 'd', 60, 'after_send');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('http://example.com/keys');
    });

    it('sends custom headers', async () => {
      const customKms = new KmsService({
        headers: { Authorization: 'Bearer token' },
      });
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(201, { key_id: 'id' }),
      );
      await customKms.storeKey('m', 'd', 60, 'after_send');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer token');
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
