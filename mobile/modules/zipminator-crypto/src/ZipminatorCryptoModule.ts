import { NativeModule, requireNativeModule } from 'expo';

import {
  ZipminatorCryptoModuleEvents,
  KEMAlgorithm,
  KEMKeyPair,
  KEMCapsule,
  RatchetEncryptedMessage,
  RatchetPublicKey,
} from './ZipminatorCrypto.types';

/**
 * ZipminatorCryptoModule — Expo Native Module declaration.
 *
 * All methods are async (AsyncFunction on the native side) to avoid blocking
 * the JS thread during KEM / ratchet operations.
 *
 * Binary data is always transported as base64-encoded strings across the
 * JS bridge. The native layer encodes before returning and decodes on receipt.
 *
 * Session state is held on the native side. Only one ratchet session is
 * active per module instance. For multi-session support, instantiate
 * separate native module instances via requireNativeModule with distinct names.
 */
declare class ZipminatorCryptoModule extends NativeModule<ZipminatorCryptoModuleEvents> {
  /**
   * Generate a Kyber768 keypair.
   *
   * @param algorithm - Must be 'Kyber768'.
   * @returns KEMKeyPair with base64-encoded publicKey and secretKey.
   *
   * @example
   * const { publicKey, secretKey } = await ZipminatorCrypto.generateKEMKeyPair('Kyber768');
   */
  generateKEMKeyPair(algorithm: KEMAlgorithm): Promise<KEMKeyPair>;

  /**
   * Encapsulate a shared secret using a recipient's Kyber768 public key.
   *
   * @param publicKey  - base64-encoded Kyber768 public key (1184 bytes).
   * @param algorithm  - Must be 'Kyber768'.
   * @returns KEMCapsule with base64-encoded ciphertext and sharedSecret.
   */
  encapsulateSecret(publicKey: string, algorithm: KEMAlgorithm): Promise<KEMCapsule>;

  /**
   * Decapsulate a shared secret using a Kyber768 ciphertext and secret key.
   *
   * @param ciphertext - base64-encoded KEM ciphertext (1088 bytes).
   * @param secretKey  - base64-encoded Kyber768 secret key (2400 bytes).
   * @param algorithm  - Must be 'Kyber768'.
   * @returns base64-encoded shared secret (32 bytes).
   */
  decapsulateSecret(
    ciphertext: string,
    secretKey: string,
    algorithm: KEMAlgorithm
  ): Promise<string>;

  /**
   * Initialise this device as the "Bob" side of a ratchet handshake.
   *
   * Bob does not need Alice's public key upfront. Bob generates a fresh
   * session, returns his public key, and waits for Alice to call
   * initRatchetAsAlice() followed by ratchetEncrypt().
   *
   * @returns RatchetPublicKey containing Bob's base64-encoded public key.
   */
  initRatchetAsBob(): Promise<RatchetPublicKey>;

  /**
   * Initialise this device as the "Alice" side of a ratchet handshake.
   *
   * Alice provides Bob's public key (returned by initRatchetAsBob on the
   * other device). The native layer performs the KEM encapsulation,
   * internally stores the ciphertext and Bob's public key, and readies
   * Alice's session for ratchetEncrypt().
   *
   * @param remotePublicKey - base64-encoded Bob's public key (1184 bytes).
   * @returns void on success; throws on crypto error.
   */
  initRatchetAsAlice(remotePublicKey: string): Promise<void>;

  /**
   * Encrypt a UTF-8 plaintext message using the active ratchet session.
   *
   * The ratchet advances one step per call (sending chain). After a
   * Diffie-Hellman ratchet step the header will include a new KEM ciphertext
   * (2281 bytes); otherwise it is 1193 bytes.
   *
   * @param message - UTF-8 plaintext string.
   * @returns RatchetEncryptedMessage with base64-encoded header and ciphertext.
   */
  ratchetEncrypt(message: string): Promise<RatchetEncryptedMessage>;

  /**
   * Decrypt a ratchet message using the active session.
   *
   * @param header     - base64-encoded message header.
   * @param ciphertext - base64-encoded ciphertext.
   * @returns UTF-8 plaintext string.
   */
  ratchetDecrypt(header: string, ciphertext: string): Promise<string>;
}

// Load the native module. On web this resolves to ZipminatorCryptoModule.web.ts.
export default requireNativeModule<ZipminatorCryptoModule>('ZipminatorCrypto');
