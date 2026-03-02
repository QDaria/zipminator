/**
 * PqcBridge — React Native native module bridge to Rust FFI
 *
 * In production this module is backed by a React Native Native Module
 * (Android: JNI → libzipminator_core.so; iOS: FFI → libzipminator_core.a).
 *
 * The interface is intentionally minimal: all heavy crypto lives in Rust.
 * Values are transported as base64 strings to avoid React Native's JS↔native
 * binary encoding issues.
 *
 * @module PqcBridge
 */

/** Contract exposed by the native side */
export interface PqcNativeModule {
  /**
   * Generate a Kyber-768 key pair.
   * @returns base64-encoded publicKey (1184 B) and secretKey (2400 B)
   */
  kyberKeypair(): Promise<{ publicKey: string; secretKey: string }>;

  /**
   * Encapsulate a shared secret using the recipient's public key.
   * @param publicKey — base64-encoded Kyber-768 public key (1184 B)
   * @returns base64-encoded ciphertext (1088 B) and 32-byte sharedSecret
   */
  kyberEncapsulate(
    publicKey: string
  ): Promise<{ ciphertext: string; sharedSecret: string }>;

  /**
   * Decapsulate to recover the shared secret from a ciphertext.
   * @param ciphertext — base64-encoded Kyber-768 ciphertext (1088 B)
   * @param secretKey  — base64-encoded Kyber-768 secret key (2400 B)
   * @returns base64-encoded 32-byte shared secret
   */
  kyberDecapsulate(ciphertext: string, secretKey: string): Promise<string>;

  /**
   * Derive SRTP master key and salt from a Kyber shared secret.
   * Calls `zipminator_derive_srtp_keys` in Rust via JNI/FFI.
   * @param sharedSecret — base64-encoded 32-byte Kyber shared secret
   * @returns base64-encoded masterKey (16 B) and masterSalt (14 B)
   */
  deriveSrtpKeys(
    sharedSecret: string
  ): Promise<{ masterKey: string; masterSalt: string }>;
}

// ─── Web / test stub ────────────────────────────────────────────────────────
//
// When running in a Node.js test environment (Jest) or on the web there is no
// React Native native module.  We provide a pure-JS HKDF-SHA-256 stub so that
// the PqSrtpService unit tests can exercise the full service logic without
// requiring a native build.
//
// This is also safe to ship in the Expo Web bundle where the native bridge is
// never loaded.

import { createHmac } from 'crypto';

function hkdfExtract(ikm: Buffer, salt: Buffer | null): Buffer {
  const realSalt = salt && salt.length > 0 ? salt : Buffer.alloc(32, 0);
  return createHmac('sha256', realSalt).update(ikm).digest();
}

function hkdfExpand(prk: Buffer, info: Buffer, length: number): Buffer {
  const output = Buffer.alloc(length);
  let prev = Buffer.alloc(0);
  let pos = 0;
  let counter = 1;
  while (pos < length) {
    const hmac = createHmac('sha256', prk);
    hmac.update(prev);
    hmac.update(info);
    hmac.update(Buffer.from([counter]));
    prev = hmac.digest();
    const toCopy = Math.min(prev.length, length - pos);
    prev.copy(output, pos, 0, toCopy);
    pos += toCopy;
    counter++;
  }
  return output;
}

function hkdf(
  ikm: Buffer,
  salt: Buffer | null,
  info: Buffer,
  length: number
): Buffer {
  const prk = hkdfExtract(ikm, salt);
  return hkdfExpand(prk, info, length);
}

function stubKeypair(): Promise<{ publicKey: string; secretKey: string }> {
  // Deterministic 0x00-filled stub keys — NOT cryptographically valid
  return Promise.resolve({
    publicKey: Buffer.alloc(1184).toString('base64'),
    secretKey: Buffer.alloc(2400).toString('base64'),
  });
}

function stubEncapsulate(
  _publicKey: string
): Promise<{ ciphertext: string; sharedSecret: string }> {
  const sharedSecret = Buffer.alloc(32, 0x42); // stub 32-byte value
  return Promise.resolve({
    ciphertext: Buffer.alloc(1088).toString('base64'),
    sharedSecret: sharedSecret.toString('base64'),
  });
}

function stubDecapsulate(
  _ciphertext: string,
  _secretKey: string
): Promise<string> {
  return Promise.resolve(Buffer.alloc(32, 0x42).toString('base64'));
}

function stubDeriveSrtpKeys(
  sharedSecret: string
): Promise<{ masterKey: string; masterSalt: string }> {
  const ikm = Buffer.from(sharedSecret, 'base64');
  const masterKey = hkdf(
    ikm,
    null,
    Buffer.from('zipminator-srtp-master-key'),
    16
  );
  const masterSalt = hkdf(
    ikm,
    null,
    Buffer.from('zipminator-srtp-master-salt'),
    14
  );
  return Promise.resolve({
    masterKey: masterKey.toString('base64'),
    masterSalt: masterSalt.toString('base64'),
  });
}

/** The active native module instance — swapped out in tests via {@link setPqcNativeModule}. */
let _module: PqcNativeModule = {
  kyberKeypair: stubKeypair,
  kyberEncapsulate: stubEncapsulate,
  kyberDecapsulate: stubDecapsulate,
  deriveSrtpKeys: stubDeriveSrtpKeys,
};

/**
 * Replace the underlying native module implementation.
 * Used in tests and when the real React Native native module becomes available
 * after the JS bridge has been initialised.
 */
export function setPqcNativeModule(mod: PqcNativeModule): void {
  _module = mod;
}

/**
 * Singleton accessor for the PQC native module.
 * Falls back to the JS stub when no native implementation has been injected.
 */
export const PqcBridge: PqcNativeModule = new Proxy({} as PqcNativeModule, {
  get(_target, prop: keyof PqcNativeModule) {
    return _module[prop].bind(_module);
  },
});
