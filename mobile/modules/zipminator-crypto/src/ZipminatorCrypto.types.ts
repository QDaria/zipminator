import type { StyleProp, ViewStyle } from 'react-native';

/* ── View types (kept for backward compatibility) ─────────────────────── */

export type OnLoadEventPayload = {
  url: string;
};

export type ZipminatorCryptoModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type ZipminatorCryptoViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};

/* ── Kyber768 / PQ Ratchet types ──────────────────────────────────────── */

/**
 * Supported KEM algorithms. Only 'Kyber768' is currently implemented.
 * Kept as a string-union for forward-compatibility without a breaking change.
 */
export type KEMAlgorithm = 'Kyber768';

/**
 * A Kyber768 keypair. Both fields are base64-encoded byte strings.
 *
 * WARNING: secretKey must never be logged or persisted in plaintext.
 */
export type KEMKeyPair = {
  /** base64-encoded Kyber768 public key (1184 bytes) */
  publicKey: string;
  /** base64-encoded Kyber768 secret key (2400 bytes) */
  secretKey: string;
};

/**
 * The result of KEM encapsulation.
 * Both fields are base64-encoded byte strings.
 */
export type KEMCapsule = {
  /** base64-encoded KEM ciphertext (1088 bytes) */
  ciphertext: string;
  /** base64-encoded shared secret (32 bytes) */
  sharedSecret: string;
};

/**
 * An encrypted ratchet message.
 * Both fields are base64-encoded byte strings.
 */
export type RatchetEncryptedMessage = {
  /** base64-encoded message header (1193–2281 bytes depending on ratchet step) */
  header: string;
  /** base64-encoded ciphertext */
  ciphertext: string;
};

/**
 * The public key of a ratchet session participant.
 */
export type RatchetPublicKey = {
  /** base64-encoded Kyber768 public key (1184 bytes) */
  publicKey: string;
};
