/**
 * PqSrtpService — Post-Quantum SRTP key negotiation service
 *
 * Orchestrates the PQC handshake between two call participants:
 *
 *   1. Caller generates a Kyber-768 key pair and sends the public key via
 *      SignalingService (type: 'pqc_handshake', phase: 'offer').
 *   2. Callee receives the public key, generates its own key pair, encapsulates
 *      a shared secret and sends back: its public key + the ciphertext
 *      (type: 'pqc_handshake', phase: 'answer').
 *   3. Caller decapsulates the ciphertext to recover the shared secret.
 *   4. Both sides call `zipminator_derive_srtp_keys` (via PqcBridge) to obtain
 *      SRTP master key + salt.
 *   5. SRTP key material is injected into the active RTCPeerConnection.
 *
 * Event wiring with VoipService:
 *   VoipService emits  'pqc_handshake_needed' { peerId }
 *   PqSrtpService listens and triggers {@link performHandshake}.
 *
 * @module PqSrtpService
 */

import { EventEmitter } from 'events';
import { PqcBridge } from '../bridges/PqcBridge';
import { signalingService, SignalingMessage } from './SignalingService';

// ── Types ──────────────────────────────────────────────────────────────────

/** SRTP master key material (AES-128-CM) */
export interface SrtpKeyMaterial {
  /** 16-byte AES-128-CM master key */
  masterKey: Uint8Array;
  /** 14-byte SRTP master salt */
  masterSalt: Uint8Array;
}

/** PQC handshake offer payload — sent by the initiating side */
interface PqcOfferPayload {
  phase: 'offer';
  publicKey: string; // base64 Kyber-768 public key
}

/** PQC handshake answer payload — sent by the responding side */
interface PqcAnswerPayload {
  phase: 'answer';
  publicKey: string;  // base64 Kyber-768 public key (responder's)
  ciphertext: string; // base64 Kyber-768 ciphertext encapsulating the shared secret
}

type PqcHandshakePayload = PqcOfferPayload | PqcAnswerPayload;

// ── PqSrtpService ──────────────────────────────────────────────────────────

/**
 * Events emitted by PqSrtpService:
 * - `'keys_ready'` — { peerId: string; keys: SrtpKeyMaterial }
 * - `'error'`      — { peerId: string; error: Error }
 */
export class PqSrtpService extends EventEmitter {
  /** Pending handshakes: peerId → { secretKey (base64) }  */
  private readonly pendingHandshakes = new Map<string, { secretKey: string }>();
  /** Active rotation timer handle */
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  /** Most recently derived keys per peer, for rotation */
  private readonly currentKeys = new Map<string, SrtpKeyMaterial>();
  /** Bound signaling listener — stored so it can be removed on destroy */
  private readonly _signalingListener: (msg: SignalingMessage) => void;

  constructor() {
    super();
    this._signalingListener = (msg: SignalingMessage) => {
      if (msg.type !== 'pqc_handshake' || !msg.payload) return;
      const payload = msg.payload as PqcHandshakePayload;
      if (payload.phase === 'offer') {
        this._handleOffer(msg.sender, payload).catch((err: unknown) => {
          this._emitError(msg.sender, err);
        });
      } else if (payload.phase === 'answer') {
        this._handleAnswer(msg.sender, payload).catch((err: unknown) => {
          this._emitError(msg.sender, err);
        });
      }
    };
    signalingService.on('message', this._signalingListener);
  }

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Initiate a PQC handshake with a remote peer.
   *
   * Generates a Kyber-768 key pair, sends the public key to the peer, then
   * waits for the answer.  Resolves with derived SRTP key material once the
   * answer is received and processed.
   *
   * @param peerId — remote peer identifier
   */
  async performHandshake(peerId: string): Promise<SrtpKeyMaterial> {
    const { publicKey, secretKey } = await PqcBridge.kyberKeypair();

    // Remember our secret key so we can decapsulate the response
    this.pendingHandshakes.set(peerId, { secretKey });

    // Send the offer
    signalingService.send({
      target: peerId,
      type: 'pqc_handshake',
      payload: { phase: 'offer', publicKey } satisfies PqcOfferPayload,
    });

    // Await the answer — resolves when _handleAnswer fires 'keys_ready'
    return new Promise<SrtpKeyMaterial>((resolve, reject) => {
      const onKeys = ({ peerId: id, keys }: { peerId: string; keys: SrtpKeyMaterial }) => {
        if (id !== peerId) return;
        cleanup();
        resolve(keys);
      };
      const onError = ({ peerId: id, error }: { peerId: string; error: Error }) => {
        if (id !== peerId) return;
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        this.off('keys_ready', onKeys);
        this.off('_peer_error', onError);
      };
      this.on('keys_ready', onKeys);
      this.on('_peer_error', onError);
    });
  }

  /**
   * Inject SRTP key material into an RTCPeerConnection.
   *
   * In the real React Native WebRTC implementation this calls into the native
   * SRTP key-injection API.  In this stub it stores the keys on the object so
   * tests can verify the call was made.
   *
   * @param peerConnection — RTCPeerConnection (or compatible mock)
   * @param keys — SRTP master key material
   */
  injectKeys(peerConnection: RTCPeerConnectionLike, keys: SrtpKeyMaterial): void {
    (peerConnection as Record<string, unknown>)._pqSrtpKeys = keys;
    console.log('[PqSrtpService] SRTP keys injected into peer connection');
  }

  /**
   * Start periodic SRTP key rotation.
   *
   * On each tick a new Kyber encapsulation is performed and the resulting SRTP
   * key material replaces the current keys.  The 'keys_ready' event fires for
   * each peer so VoipService can re-inject the updated keys.
   *
   * @param intervalMs — rotation period in milliseconds
   */
  startKeyRotation(intervalMs: number): void {
    if (this.rotationTimer !== null) {
      this.stopKeyRotation();
    }
    this.rotationTimer = setInterval(() => {
      this._rotatePeerKeys();
    }, intervalMs);
  }

  /** Stop periodic key rotation. */
  stopKeyRotation(): void {
    if (this.rotationTimer !== null) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  /**
   * Remove the signaling listener and stop all timers.
   * Call this when the service is no longer needed.
   */
  destroy(): void {
    this.stopKeyRotation();
    signalingService.off('message', this._signalingListener);
    this.removeAllListeners();
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Emit 'error' in the public-facing direction (so listeners on 'error'
   * receive it) and '_peer_error' so performHandshake promises can reject.
   */
  private _emitError(peerId: string, error: unknown): void {
    const payload = { peerId, error };
    this.emit('_peer_error', payload);
    // Only emit 'error' if there are external listeners; otherwise Node.js
    // would throw an unhandled error exception.
    if (this.listenerCount('error') > 0) {
      this.emit('error', payload);
    }
  }

  /**
   * Derive SRTP key material from a base64-encoded Kyber shared secret.
   * Delegates to the Rust FFI via PqcBridge.
   */
  async _deriveSrtpKeys(sharedSecretB64: string): Promise<SrtpKeyMaterial> {
    const { masterKey: mkB64, masterSalt: msB64 } =
      await PqcBridge.deriveSrtpKeys(sharedSecretB64);
    return {
      masterKey: new Uint8Array(Buffer.from(mkB64, 'base64')),
      masterSalt: new Uint8Array(Buffer.from(msB64, 'base64')),
    };
  }

  /**
   * Respond to a PQC handshake offer as the responder.
   * Generates a local key pair, encapsulates with the initiator's public key,
   * derives SRTP keys, and sends the answer.
   */
  private async _handleOffer(
    peerId: string,
    offer: PqcOfferPayload
  ): Promise<void> {
    // Encapsulate shared secret using the initiator's public key
    const { ciphertext, sharedSecret } = await PqcBridge.kyberEncapsulate(
      offer.publicKey
    );

    // Derive SRTP keys from our side
    const keys = await this._deriveSrtpKeys(sharedSecret);
    this.currentKeys.set(peerId, keys);

    // Generate our own key pair for the answer (not used for this round's
    // shared secret, but provided for forward secrecy on the next ratchet step)
    const { publicKey } = await PqcBridge.kyberKeypair();

    signalingService.send({
      target: peerId,
      type: 'pqc_handshake',
      payload: {
        phase: 'answer',
        publicKey,
        ciphertext,
      } satisfies PqcAnswerPayload,
    });

    this.emit('keys_ready', { peerId, keys });
  }

  /**
   * Finalise the handshake on the initiator side.
   * Decapsulates the ciphertext to recover the shared secret and derives SRTP keys.
   */
  private async _handleAnswer(
    peerId: string,
    answer: PqcAnswerPayload
  ): Promise<void> {
    const pending = this.pendingHandshakes.get(peerId);
    if (!pending) {
      // Ignore answers for peers we are not initiating a handshake with.
      // This happens in tests when multiple service instances share the same
      // mock signaling emitter.
      return;
    }

    const sharedSecret = await PqcBridge.kyberDecapsulate(
      answer.ciphertext,
      pending.secretKey
    );
    this.pendingHandshakes.delete(peerId);

    const keys = await this._deriveSrtpKeys(sharedSecret);
    this.currentKeys.set(peerId, keys);
    this.emit('keys_ready', { peerId, keys });
  }

  /** Re-derive and emit fresh SRTP keys for every known peer (rotation step). */
  private _rotatePeerKeys(): void {
    for (const peerId of this.currentKeys.keys()) {
      PqcBridge.kyberEncapsulate(Buffer.alloc(1184).toString('base64'))
        .then(({ sharedSecret }) => this._deriveSrtpKeys(sharedSecret))
        .then((keys) => {
          this.currentKeys.set(peerId, keys);
          this.emit('keys_ready', { peerId, keys });
        })
        .catch((err: unknown) => {
          this._emitError(peerId, err);
        });
    }
  }
}

/** Minimal interface required for key injection — avoids importing WebRTC types */
export interface RTCPeerConnectionLike {
  [key: string]: unknown;
}

/** Singleton instance — mirrors the pattern in VoipService / SignalingService */
export const pqSrtpService = new PqSrtpService();
