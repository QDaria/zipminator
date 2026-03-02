/**
 * PqSrtpService tests
 *
 * Covers:
 *  - PQC handshake flow: exchange Kyber public keys → encapsulate → derive SRTP keys
 *  - Event-driven integration: listens for 'pqc_handshake_needed' from VoipService pattern
 *  - SRTP key injection into RTCPeerConnection (mock)
 *  - Key rotation on periodic timer
 *  - Native bridge injection via setPqcNativeModule
 */

import { EventEmitter } from 'events';

// ── Mock SignalingService ────────────────────────────────────────────────────
//
// jest.mock is hoisted before const declarations, so the factory cannot close
// over test-file variables.  We use a shared module-level object instead; each
// test clears state in beforeEach.

const _signaling = {
  send: jest.fn() as jest.Mock,
  emitter: new EventEmitter(),
};

jest.mock('../SignalingService', () => ({
  signalingService: {
    send: (...args: unknown[]) => _signaling.send(...args),
    on: (event: string, listener: (...args: unknown[]) => void) =>
      _signaling.emitter.on(event, listener),
    off: (event: string, listener: (...args: unknown[]) => void) =>
      _signaling.emitter.off(event, listener),
    emit: (event: string, ...args: unknown[]) =>
      _signaling.emitter.emit(event, ...args),
  },
}));

import { PqSrtpService, SrtpKeyMaterial, RTCPeerConnectionLike } from '../PqSrtpService';
import { setPqcNativeModule, PqcNativeModule } from '../../bridges/PqcBridge';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeHandshakeMessage(sender: string, payload: Record<string, unknown>) {
  return { type: 'pqc_handshake', sender, target: 'local', payload };
}

/** Emit a signaling message from a named sender */
function emitSignal(sender: string, payload: Record<string, unknown>) {
  _signaling.emitter.emit('message', makeHandshakeMessage(sender, payload));
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('PqSrtpService', () => {
  let service: PqSrtpService;

  beforeEach(() => {
    _signaling.send.mockReset();
    _signaling.emitter.removeAllListeners();
    service = new PqSrtpService();
  });

  afterEach(() => {
    // destroy() stops timers AND removes the signaling listener so no
    // cross-test message leakage occurs.
    service.destroy();
  });

  // ── SRTP key derivation ─────────────────────────────────────────────────

  describe('SRTP key derivation', () => {
    it('derives a 16-byte master key', async () => {
      const ss = Buffer.alloc(32, 0x01).toString('base64');
      const keys = await service._deriveSrtpKeys(ss);
      expect(keys.masterKey).toBeInstanceOf(Uint8Array);
      expect(keys.masterKey.byteLength).toBe(16);
    });

    it('derives a 14-byte master salt', async () => {
      const ss = Buffer.alloc(32, 0x01).toString('base64');
      const keys = await service._deriveSrtpKeys(ss);
      expect(keys.masterSalt).toBeInstanceOf(Uint8Array);
      expect(keys.masterSalt.byteLength).toBe(14);
    });

    it('is deterministic for the same shared secret', async () => {
      const ss = Buffer.alloc(32, 0xab).toString('base64');
      const km1 = await service._deriveSrtpKeys(ss);
      const km2 = await service._deriveSrtpKeys(ss);
      expect(Buffer.from(km1.masterKey)).toEqual(Buffer.from(km2.masterKey));
      expect(Buffer.from(km1.masterSalt)).toEqual(Buffer.from(km2.masterSalt));
    });

    it('produces different keys for different shared secrets', async () => {
      const km1 = await service._deriveSrtpKeys(Buffer.alloc(32, 0x00).toString('base64'));
      const km2 = await service._deriveSrtpKeys(Buffer.alloc(32, 0xff).toString('base64'));
      expect(Buffer.from(km1.masterKey)).not.toEqual(Buffer.from(km2.masterKey));
      expect(Buffer.from(km1.masterSalt)).not.toEqual(Buffer.from(km2.masterSalt));
    });
  });

  // ── PQC handshake flow ──────────────────────────────────────────────────

  describe('performHandshake (initiator)', () => {
    it('sends a pqc_handshake offer via SignalingService', async () => {
      const promise = service.performHandshake('peer-bob');

      // performHandshake is async: it awaits kyberKeypair() before sending.
      // Flush the microtask queue so the send has occurred.
      await Promise.resolve();

      expect(_signaling.send).toHaveBeenCalledWith(
        expect.objectContaining({
          target: 'peer-bob',
          type: 'pqc_handshake',
          payload: expect.objectContaining({ phase: 'offer' }),
        })
      );

      // Simulate the answer arriving from the remote peer
      emitSignal('peer-bob', {
        phase: 'answer',
        publicKey: Buffer.alloc(1184).toString('base64'),
        ciphertext: Buffer.alloc(1088).toString('base64'),
      });

      const keys = await promise;
      expect(keys.masterKey.byteLength).toBe(16);
      expect(keys.masterSalt.byteLength).toBe(14);
    });

    it('resolves with correct key shapes after full handshake', async () => {
      const promise = service.performHandshake('peer-carol');

      // Flush microtasks so the offer is sent and pendingHandshakes is populated
      await Promise.resolve();

      emitSignal('peer-carol', {
        phase: 'answer',
        publicKey: Buffer.alloc(1184).toString('base64'),
        ciphertext: Buffer.alloc(1088).toString('base64'),
      });

      const keys = await promise;
      expect(keys).toMatchObject({
        masterKey: expect.any(Uint8Array),
        masterSalt: expect.any(Uint8Array),
      });
    });

    it('rejects when a peer error is emitted for the same peer', async () => {
      const promise = service.performHandshake('peer-dave');

      // Flush so the offer is sent and _peer_error listener is registered
      await Promise.resolve();

      // Directly emit the internal _peer_error event
      service.emit('_peer_error', { peerId: 'peer-dave', error: new Error('test error') });

      await expect(promise).rejects.toThrow('test error');
    });
  });

  describe('handshake responder (inbound offer)', () => {
    it('emits keys_ready when receiving an offer', (done) => {
      service.once('keys_ready', ({ peerId, keys }: { peerId: string; keys: SrtpKeyMaterial }) => {
        expect(peerId).toBe('peer-eve');
        expect(keys.masterKey.byteLength).toBe(16);
        expect(keys.masterSalt.byteLength).toBe(14);
        done();
      });

      emitSignal('peer-eve', {
        phase: 'offer',
        publicKey: Buffer.alloc(1184).toString('base64'),
      });
    });

    it('sends an answer with ciphertext back via SignalingService', (done) => {
      service.once('keys_ready', () => {
        expect(_signaling.send).toHaveBeenCalledWith(
          expect.objectContaining({
            target: 'peer-frank',
            type: 'pqc_handshake',
            payload: expect.objectContaining({
              phase: 'answer',
              ciphertext: expect.any(String),
              publicKey: expect.any(String),
            }),
          })
        );
        done();
      });

      emitSignal('peer-frank', {
        phase: 'offer',
        publicKey: Buffer.alloc(1184).toString('base64'),
      });
    });
  });

  // ── Event integration with VoipService pattern ──────────────────────────

  describe('VoipService event integration', () => {
    it('performs handshake when VoipService emits pqc_handshake_needed', async () => {
      const voipEmitter = new EventEmitter();
      const keysReceived: SrtpKeyMaterial[] = [];

      voipEmitter.on('pqc_handshake_needed', async ({ peerId }: { peerId: string }) => {
        const promise = service.performHandshake(peerId);
        // After microtask flush the offer is sent and pendingHandshakes is set
        setImmediate(async () => {
          await Promise.resolve(); // flush kyberKeypair promise
          emitSignal(peerId, {
            phase: 'answer',
            publicKey: Buffer.alloc(1184).toString('base64'),
            ciphertext: Buffer.alloc(1088).toString('base64'),
          });
        });
        keysReceived.push(await promise);
      });

      voipEmitter.emit('pqc_handshake_needed', { peerId: 'peer-grace' });
      await new Promise<void>((resolve) => setTimeout(resolve, 100));

      expect(keysReceived).toHaveLength(1);
      expect(keysReceived[0].masterKey.byteLength).toBe(16);
    });
  });

  // ── SRTP key injection ──────────────────────────────────────────────────

  describe('injectKeys', () => {
    it('attaches _pqSrtpKeys to the peer connection object', () => {
      const pc: RTCPeerConnectionLike = {};
      const keys: SrtpKeyMaterial = {
        masterKey: new Uint8Array(16).fill(0xaa),
        masterSalt: new Uint8Array(14).fill(0xbb),
      };
      service.injectKeys(pc, keys);
      expect((pc as Record<string, unknown>)._pqSrtpKeys).toBe(keys);
    });

    it('can be called multiple times to update keys', () => {
      const pc: RTCPeerConnectionLike = {};
      const keys1: SrtpKeyMaterial = {
        masterKey: new Uint8Array(16).fill(0x01),
        masterSalt: new Uint8Array(14).fill(0x01),
      };
      const keys2: SrtpKeyMaterial = {
        masterKey: new Uint8Array(16).fill(0x02),
        masterSalt: new Uint8Array(14).fill(0x02),
      };
      service.injectKeys(pc, keys1);
      service.injectKeys(pc, keys2);
      expect((pc as Record<string, unknown>)._pqSrtpKeys).toBe(keys2);
    });
  });

  // ── Key rotation ────────────────────────────────────────────────────────

  describe('startKeyRotation / stopKeyRotation', () => {
    it('emits keys_ready on rotation ticks for active peers', async () => {
      // Establish a handshake so there is an active peer in currentKeys
      const promise = service.performHandshake('peer-henry');
      await Promise.resolve(); // flush keypair generation
      emitSignal('peer-henry', {
        phase: 'answer',
        publicKey: Buffer.alloc(1184).toString('base64'),
        ciphertext: Buffer.alloc(1088).toString('base64'),
      });
      await promise;

      const rotationEvents: string[] = [];
      service.on('keys_ready', ({ peerId }: { peerId: string }) =>
        rotationEvents.push(peerId)
      );

      jest.useFakeTimers();
      service.startKeyRotation(1000);
      jest.advanceTimersByTime(3000);
      jest.useRealTimers();

      // Let the promises spawned by setInterval callbacks resolve
      await new Promise<void>((r) => setTimeout(r, 50));

      expect(rotationEvents.length).toBeGreaterThanOrEqual(1);
    });

    it('stopKeyRotation prevents further events', async () => {
      const promise = service.performHandshake('peer-iris');
      await Promise.resolve();
      emitSignal('peer-iris', {
        phase: 'answer',
        publicKey: Buffer.alloc(1184).toString('base64'),
        ciphertext: Buffer.alloc(1088).toString('base64'),
      });
      await promise;

      jest.useFakeTimers();
      service.startKeyRotation(500);
      service.stopKeyRotation();

      const events: unknown[] = [];
      service.on('keys_ready', (e: unknown) => events.push(e));

      jest.advanceTimersByTime(5000);
      jest.useRealTimers();
      await Promise.resolve();

      expect(events).toHaveLength(0);
    });
  });

  // ── Native bridge injection ─────────────────────────────────────────────

  describe('setPqcNativeModule', () => {
    let svc: PqSrtpService;

    afterEach(() => {
      svc?.destroy();
    });

    it('allows injecting a custom native module and routes calls through it', async () => {
      const customMasterKey = Buffer.alloc(16, 0xde);
      const customMasterSalt = Buffer.alloc(14, 0xad);

      const customModule: PqcNativeModule = {
        kyberKeypair: () =>
          Promise.resolve({
            publicKey: Buffer.alloc(1184).toString('base64'),
            secretKey: Buffer.alloc(2400).toString('base64'),
          }),
        kyberEncapsulate: () =>
          Promise.resolve({
            ciphertext: Buffer.alloc(1088).toString('base64'),
            sharedSecret: Buffer.alloc(32, 0x01).toString('base64'),
          }),
        kyberDecapsulate: () =>
          Promise.resolve(Buffer.alloc(32, 0x01).toString('base64')),
        deriveSrtpKeys: () =>
          Promise.resolve({
            masterKey: customMasterKey.toString('base64'),
            masterSalt: customMasterSalt.toString('base64'),
          }),
      };

      setPqcNativeModule(customModule);
      svc = new PqSrtpService();

      const promise = svc.performHandshake('peer-jack');
      await Promise.resolve(); // flush keypair generation
      emitSignal('peer-jack', {
        phase: 'answer',
        publicKey: Buffer.alloc(1184).toString('base64'),
        ciphertext: Buffer.alloc(1088).toString('base64'),
      });

      const keys = await promise;
      expect(Buffer.from(keys.masterKey)).toEqual(customMasterKey);
      expect(Buffer.from(keys.masterSalt)).toEqual(customMasterSalt);
    });
  });
});
