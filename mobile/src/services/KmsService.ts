/**
 * KMS Client -- TypeScript SDK for the Zipminator Email KMS.
 *
 * Communicates with the FastAPI KMS service to store, fetch, and destroy
 * per-message Data Encryption Keys (DEKs) used for self-destructing email.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type SelfDestructMode = 'after_send' | 'after_read' | 'read_once';

export interface KeyMetadata {
  keyId: string;
  messageId: string;
  mode: SelfDestructMode;
  ttlSeconds: number;
}

export interface FetchKeyResult {
  dekEncrypted: string;
  remainingTtl: number;
}

export interface ReadReceiptResult {
  newTtl: number;
}

export interface DestructionEvent {
  keyId: string;
  eventType: string;
  timestampUtc: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

// ── Errors ──────────────────────────────────────────────────────────────────

export class KmsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'KmsError';
  }
}

export class KeyExpiredError extends KmsError {
  constructor(keyId: string) {
    super(`Key ${keyId} not found or expired`, 404, 'Key not found or expired');
    this.name = 'KeyExpiredError';
  }
}

export class ReadReceiptConflictError extends KmsError {
  constructor(keyId: string) {
    super(
      `Read receipt already applied for key ${keyId}`,
      409,
      'Read receipt already applied',
    );
    this.name = 'ReadReceiptConflictError';
  }
}

// ── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'http://127.0.0.1:8100';

interface KmsClientOptions {
  baseUrl?: string;
  /** Extra headers to include with every request. */
  headers?: Record<string, string>;
}

// ── Helper ──────────────────────────────────────────────────────────────────

async function kmsRequest<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    const detail = body?.detail ?? response.statusText;

    if (response.status === 404) {
      throw new KeyExpiredError(url);
    }
    if (response.status === 409) {
      throw new ReadReceiptConflictError(url);
    }

    throw new KmsError(
      `KMS request failed: ${detail}`,
      response.status,
      detail,
    );
  }

  return response.json() as Promise<T>;
}

// ── Service ─────────────────────────────────────────────────────────────────

export class KmsService {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(options: KmsClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };
  }

  /**
   * Store an encrypted DEK with a self-destruct timer.
   *
   * @returns The server-assigned key ID.
   */
  async storeKey(
    messageId: string,
    dekEncrypted: string,
    ttlSeconds: number,
    mode: SelfDestructMode,
    postReadTtlSeconds?: number,
  ): Promise<string> {
    const body: Record<string, unknown> = {
      message_id: messageId,
      dek_encrypted: dekEncrypted,
      ttl_seconds: ttlSeconds,
      mode,
    };
    if (postReadTtlSeconds !== undefined) {
      body.post_read_ttl_seconds = postReadTtlSeconds;
    }

    const result = await kmsRequest<{ key_id: string }>(
      `${this.baseUrl}/keys`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      },
    );
    return result.key_id;
  }

  /**
   * Fetch the encrypted DEK for a key. For `read_once` keys, this is the
   * only time the DEK will be available.
   */
  async fetchKey(keyId: string): Promise<FetchKeyResult> {
    const result = await kmsRequest<{
      dek_encrypted: string;
      remaining_ttl: number;
    }>(`${this.baseUrl}/keys/${keyId}`, {
      method: 'GET',
      headers: this.headers,
    });
    return {
      dekEncrypted: result.dek_encrypted,
      remainingTtl: result.remaining_ttl,
    };
  }

  /**
   * Send a read receipt to trigger the post-read TTL countdown.
   *
   * @throws {ReadReceiptConflictError} if the receipt was already sent.
   */
  async sendReadReceipt(keyId: string): Promise<ReadReceiptResult> {
    const result = await kmsRequest<{ new_ttl: number }>(
      `${this.baseUrl}/keys/${keyId}/read-receipt`,
      {
        method: 'POST',
        headers: this.headers,
      },
    );
    return { newTtl: result.new_ttl };
  }

  /**
   * Immediately destroy a DEK (crypto-shred).
   */
  async destroyKey(keyId: string): Promise<void> {
    await kmsRequest<{ destroyed: boolean }>(
      `${this.baseUrl}/keys/${keyId}`,
      {
        method: 'DELETE',
        headers: this.headers,
      },
    );
  }
}

// Default singleton for convenience
export const kmsService = new KmsService();
