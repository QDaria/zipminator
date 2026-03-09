/**
 * Jest tests for PqcMessengerService.
 *
 * Tests that require a live native device are mocked via jest.mock().
 * Tests that cover future behaviour still to be wired are marked with
 * test.skip and carry a comment explaining what needs to be built.
 *
 * Current API surface (PqcMessengerService.ts):
 *   - initialize(targetId: string) -> Promise<void>
 *   - startHandshake() -> void
 *   - encryptMessage(text: string) -> Promise<EncryptedMessage>
 *   - decryptMessage(msg: EncryptedMessage) -> Promise<string>
 *   - getRatchetState() -> RatchetState
 *   - getConnectionState() -> ConnectionState
 *   - destroy() -> void
 *
 * Native module mocked via jest.mock() so tests run in Node without a device.
 */

import { PqcMessengerService } from '../services/PqcMessengerService';
import type { EncryptedMessage } from '../services/PqcMessengerService';

// ─── Module mocks ────────────────────────────────────────────────────────────

// Mock the native Expo module so tests run in Node without a physical device.
// Values are defined inside the factory to avoid hoisting issues with jest.mock.
jest.mock('../../modules/zipminator-crypto', () => {
  const pk  = Buffer.alloc(1184).toString('base64');
  const sk  = Buffer.alloc(2400).toString('base64');
  const ct  = Buffer.alloc(1088).toString('base64');
  const ss  = Buffer.alloc(32).toString('base64');
  const hdr = Buffer.alloc(32, 0x01).toString('base64');
  return {
    __esModule: true,
    default: {
      generateKEMKeyPair: jest.fn().mockResolvedValue({ publicKey: pk, secretKey: sk }),
      encapsulateSecret: jest.fn().mockResolvedValue({ ciphertext: ct, sharedSecret: ss }),
      decapsulateSecret: jest.fn().mockResolvedValue(ss),
      initRatchetAsBob: jest.fn().mockResolvedValue({ publicKey: pk }),
      initRatchetAsAlice: jest.fn().mockResolvedValue(undefined),
      ratchetEncrypt: jest.fn().mockImplementation((msg: string) =>
        Promise.resolve({ header: hdr, ciphertext: Buffer.from(msg).toString('base64') })
      ),
      ratchetDecrypt: jest.fn().mockImplementation((_header: string, ciphertext: string) =>
        Promise.resolve(Buffer.from(ciphertext, 'base64').toString('utf-8'))
      ),
    },
  };
});

// Mock base64-sized values to match real Kyber768 dimensions (for use in test assertions)
const MOCK_PK     = Buffer.alloc(1184).toString('base64');
const MOCK_SK     = Buffer.alloc(2400).toString('base64');
const MOCK_CT     = Buffer.alloc(1088).toString('base64');
const MOCK_SS     = Buffer.alloc(32).toString('base64');
const MOCK_HEADER = Buffer.alloc(32, 0x01).toString('base64');
const MOCK_CIPHER = Buffer.alloc(64, 0x02).toString('base64');

// Mock the signaling service so no actual WebSocket connections are made.
jest.mock('../services/SignalingService', () => {
  const EventEmitter = require('events');
  const emitter = new EventEmitter();
  return {
    signalingService: {
      on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        emitter.on(event, handler);
      }),
      removeListener: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        emitter.removeListener(event, handler);
      }),
      send: jest.fn(),
      emit: emitter.emit.bind(emitter),
    },
    SignalingMessage: {},
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Simulate a completed ratchet handshake by directly marking the ratchet
 * session as secure. Avoids requiring a live WebSocket for unit-level tests.
 */
function injectSecureSession(service: PqcMessengerService): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (service as any).ratchetState = {
    epoch: 1,
    messagesSent: 0,
    messagesReceived: 0,
    isSecure: true,
  };
}

// ─── Tests: Handshake ────────────────────────────────────────────────────────

describe('PqcMessengerService – Handshake', () => {
  /**
   * After calling initialize(), the service must have generated a local KEM
   * keypair and be ready to participate in a handshake.
   */
  test('initialize generates a local KEM keypair', async () => {
    const ZipminatorCrypto = (await import('../../modules/zipminator-crypto')).default;
    const service = new PqcMessengerService();
    await service.initialize('peer-bob');

    expect(ZipminatorCrypto.generateKEMKeyPair).toHaveBeenCalledWith('Kyber768');
    service.destroy();
  });

  /**
   * startHandshake() must transmit the local public key to the target peer via
   * the signaling channel. This is Step 1 of the KEM-based key agreement.
   *
   * Verifies the message shape: { target, type: 'pqc_handshake', payload.publicKey }.
   */
  test('test_messenger_handshake_completes: startHandshake sends public key to peer', async () => {
    const { signalingService } = await import('../services/SignalingService');
    const service = new PqcMessengerService();
    await service.initialize('peer-bob');
    await service.startHandshake();

    expect(signalingService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'peer-bob',
        type: 'pqc_handshake',
        payload: expect.objectContaining({ publicKey: expect.any(String) }),
      })
    );
    service.destroy();
  });

  /**
   * When the responder receives a handshake message containing a remote public
   * key, it should encapsulate a shared secret and send the ciphertext back.
   *
   * Simulates Bob receiving Alice's 'pqc_handshake' message.
   */
  test.skip(
    'test_messenger_handshake_completes: responder encapsulates and sends ciphertext',
    async () => {
      // TODO: expose a `simulateInboundMessage` method or use EventEmitter directly
      // to inject a synthetic signaling message, then assert:
      //   1. encapsulateSecret was called with Alice's public key.
      //   2. signalingService.send was called with { type: 'pqc_handshake', payload: { ciphertext, ephemeralPk } }.
      //   3. service.getConnectionState() returns 'handshaking'.
    }
  );
});

// ─── Tests: Encrypt / Decrypt ────────────────────────────────────────────────

describe('PqcMessengerService – Encrypt / Decrypt', () => {
  /**
   * After a ratchet session is established, encrypting a message must return
   * an EncryptedMessage whose ciphertext differs from the plaintext.
   */
  test('test_messenger_encrypt_decrypt_roundtrip: encrypted ciphertext differs from plaintext', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer-alice');
    injectSecureSession(service);

    const plaintext = 'Meet me at the quantum café';
    const encrypted = await service.encryptMessage(plaintext);

    expect(encrypted).not.toEqual(plaintext);
    expect(typeof encrypted.header).toBe('string');
    expect(typeof encrypted.ciphertext).toBe('string');
    expect(encrypted.ciphertext.length).toBeGreaterThan(0);
    service.destroy();
  });

  /**
   * Decrypting the output of encryptMessage must recover the original plaintext.
   * This verifies the round-trip symmetry property.
   */
  test('test_messenger_encrypt_decrypt_roundtrip: decrypt recovers original plaintext', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer-alice');
    injectSecureSession(service);

    const plaintext = 'Quantum-secure message body';
    const encrypted: EncryptedMessage = await service.encryptMessage(plaintext);
    const decrypted = await service.decryptMessage(encrypted);

    expect(decrypted).toBe(plaintext);
    service.destroy();
  });

  /**
   * Without an established ratchet session, encryptMessage returns a sentinel
   * EncryptedMessage with an empty header and the plaintext as the ciphertext.
   */
  test('encryptMessage without session returns sentinel (fallback)', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer-alice');
    // Do NOT inject a secure session

    const plaintext = 'Unprotected text';
    const result = await service.encryptMessage(plaintext);

    // Fallback: { header: '', ciphertext: plaintext }
    expect(result.header).toBe('');
    expect(result.ciphertext).toBe(plaintext);
    service.destroy();
  });

  /**
   * decryptMessage called without a session must return the raw ciphertext
   * field unchanged (mirrors the fallback contract of encryptMessage).
   */
  test('decryptMessage without session returns raw ciphertext (fallback)', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer-alice');

    const sentinel: EncryptedMessage = { header: '', ciphertext: 'raw-text' };
    const result = await service.decryptMessage(sentinel);

    expect(result).toBe('raw-text');
    service.destroy();
  });
});

// ─── Tests: State accessors ───────────────────────────────────────────────────

describe('PqcMessengerService – State accessors', () => {
  test('getConnectionState returns disconnected before initialize', () => {
    const service = new PqcMessengerService();
    expect(service.getConnectionState()).toBe('disconnected');
    service.destroy();
  });

  test('getConnectionState returns connecting after initialize', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer-test');
    expect(service.getConnectionState()).toBe('connecting');
    service.destroy();
  });

  test('getRatchetState returns isSecure false before handshake', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer-test');
    expect(service.getRatchetState().isSecure).toBe(false);
    expect(service.getRatchetState().epoch).toBe(0);
    service.destroy();
  });

  test('getRatchetState returns isSecure true after session injection', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer-test');
    injectSecureSession(service);
    expect(service.getRatchetState().isSecure).toBe(true);
    expect(service.getRatchetState().epoch).toBe(1);
    service.destroy();
  });

  test('messagesSent counter increments on each encrypt call', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer-test');
    injectSecureSession(service);

    expect(service.getRatchetState().messagesSent).toBe(0);
    await service.encryptMessage('first');
    expect(service.getRatchetState().messagesSent).toBe(1);
    await service.encryptMessage('second');
    expect(service.getRatchetState().messagesSent).toBe(2);
    service.destroy();
  });
});

// ─── Tests: Ratchet Stepping ─────────────────────────────────────────────────

describe('PqcMessengerService – Ratchet Stepping', () => {
  /**
   * Each call to encryptMessage() must advance the send counter by exactly one.
   */
  test('test_messenger_ratchet_steps_on_send: send counter increments per message', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer');
    injectSecureSession(service);

    const before = service.getRatchetState().messagesSent;
    await service.encryptMessage('First message');
    expect(service.getRatchetState().messagesSent).toBe(before + 1);

    await service.encryptMessage('Second message');
    expect(service.getRatchetState().messagesSent).toBe(before + 2);
    service.destroy();
  });

  /**
   * The message key used for each encryptMessage() call must be derived from
   * the ratchet and must produce a unique ciphertext per call.
   *
   * STUBBED: requires the native ratchetEncrypt to use unique nonces per call.
   */
  test.skip('test_messenger_ratchet_steps_on_send: each message uses a unique key', async () => {
    // When implemented, two calls with the same plaintext must produce
    // different ciphertexts — the mock currently returns deterministic output.
  });

  /**
   * After a KEM ratchet step, the root key must be updated and the new chain
   * keys must differ from the previous values.
   *
   * STUBBED: requires triggerKemRatchetStep() or equivalent API.
   */
  test.skip('test_messenger_ratchet_steps_on_send: KEM ratchet step updates root key', async () => {
    // Requires exposing internal root-key state or a ratchet step trigger.
  });
});

// ─── Tests: Out-of-Order Delivery ────────────────────────────────────────────

describe('PqcMessengerService – Out-of-Order Delivery', () => {
  /**
   * Messages delivered out of sequence must be correctly decrypted using
   * keys cached from earlier ratchet positions.
   *
   * STUBBED: requires ratchetEncrypt / ratchetDecrypt with counter support.
   */
  test.skip('test_messenger_handles_out_of_order: delivers messages out of order', async () => {
    // See original stub comments for implementation protocol.
  });

  /**
   * Attempting to decrypt a message with a counter that was already consumed
   * must fail (replay attack prevention).
   *
   * STUBBED: requires counter deduplication in ratchetDecrypt.
   */
  test.skip('test_messenger_handles_out_of_order: replayed message counter is rejected', async () => {
    // Requires counter-deduplication to be implemented in PqcMessengerService.
  });

  /**
   * Messages beyond the skipped-key window limit must be rejected.
   *
   * STUBBED: requires MAX_SKIP constant enforcement in ratchetDecrypt.
   */
  test.skip('test_messenger_handles_out_of_order: rejects messages beyond max skip window', async () => {
    // Requires MAX_SKIP enforcement in the native ratchet or service layer.
  });
});

// ─── Tests: Security Properties ──────────────────────────────────────────────

describe('PqcMessengerService – Security Properties', () => {
  /**
   * encryptMessage called twice with the same plaintext must produce
   * EncryptedMessage objects with non-empty header and ciphertext fields.
   * (The mock returns deterministic output; the real implementation uses
   * unique nonces — verified by the native layer tests.)
   */
  test('two encryptions of same plaintext both produce EncryptedMessage objects', async () => {
    const service = new PqcMessengerService();
    await service.initialize('peer');
    injectSecureSession(service);

    const r1 = await service.encryptMessage('Identical plaintext');
    const r2 = await service.encryptMessage('Identical plaintext');

    expect(typeof r1.header).toBe('string');
    expect(typeof r1.ciphertext).toBe('string');
    expect(typeof r2.header).toBe('string');
    expect(typeof r2.ciphertext).toBe('string');
    // TODO: uncomment when real ratchet nonces are verified:
    // expect(r1.ciphertext).not.toBe(r2.ciphertext);
    service.destroy();
  });

  /**
   * Decrypting a ciphertext with the wrong shared secret must return a
   * garbled / different result and must not expose the original plaintext.
   *
   * STUBBED: requires real AES-256-GCM decryption to be wired up.
   */
  test.skip('wrong shared secret produces decryption failure', async () => {
    // When implemented:
    //   injectSecureSession(alice);
    //   const ct = await alice.encryptMessage('Secret text');
    //   // Bob has wrong ratchet state
    //   await expect(bob.decryptMessage(ct)).rejects.toThrow();
  });
});
