package com.zipminator.vpn

import java.util.Arrays

/**
 * JNI bridge to the Rust ML-KEM-768 (Kyber768) implementation in libzipminator_core.
 *
 * Key sizes (per NIST FIPS 203 / ML-KEM-768):
 *   Public key  : 1184 bytes
 *   Secret key  : 2400 bytes
 *   Ciphertext  : 1088 bytes
 *   Shared secret:  32 bytes
 */
object KyberJNI {

    // Public key length in bytes
    const val PK_SIZE: Int = 1184

    // Secret key length in bytes
    const val SK_SIZE: Int = 2400

    // Ciphertext length in bytes
    const val CT_SIZE: Int = 1088

    // Shared secret length in bytes
    const val SS_SIZE: Int = 32

    init {
        System.loadLibrary("zipminator_core")
    }

    // -------------------------------------------------------------------------
    // Native declarations (implemented in crates/zipminator-core/src/ffi.rs)
    // -------------------------------------------------------------------------

    /** Generate a Kyber768 key pair. Returns [pk (1184 bytes) || sk (2400 bytes)]. */
    private external fun nativeKeygen(): ByteArray

    /**
     * Encapsulate a shared secret under the given public key.
     * @param publicKey 1184-byte public key
     * @return [ciphertext (1088 bytes) || sharedSecret (32 bytes)]
     */
    private external fun nativeEncapsulate(publicKey: ByteArray): ByteArray

    /**
     * Decapsulate a ciphertext to recover the shared secret.
     * @param ciphertext 1088-byte ciphertext
     * @param secretKey  2400-byte secret key
     * @return 32-byte shared secret
     */
    private external fun nativeDecapsulate(ciphertext: ByteArray, secretKey: ByteArray): ByteArray

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Generate a fresh Kyber768 key pair.
     * Caller must call [Keypair.destroy] when finished to zeroize memory.
     */
    fun generateKeypair(): Keypair {
        val raw = nativeKeygen()
        require(raw.size == PK_SIZE + SK_SIZE) {
            "keygen returned ${raw.size} bytes, expected ${PK_SIZE + SK_SIZE}"
        }
        val pk = raw.copyOfRange(0, PK_SIZE)
        val sk = raw.copyOfRange(PK_SIZE, PK_SIZE + SK_SIZE)
        Arrays.fill(raw, 0)
        return Keypair(pk, sk)
    }

    /**
     * Encapsulate a shared secret under the given public key.
     * Caller must call [Encapsulation.destroy] when finished.
     */
    fun encapsulate(publicKey: ByteArray): Encapsulation {
        require(publicKey.size == PK_SIZE) {
            "publicKey must be $PK_SIZE bytes, got ${publicKey.size}"
        }
        val raw = nativeEncapsulate(publicKey)
        require(raw.size == CT_SIZE + SS_SIZE) {
            "encapsulate returned ${raw.size} bytes, expected ${CT_SIZE + SS_SIZE}"
        }
        val ct = raw.copyOfRange(0, CT_SIZE)
        val ss = raw.copyOfRange(CT_SIZE, CT_SIZE + SS_SIZE)
        Arrays.fill(raw, 0)
        return Encapsulation(ct, ss)
    }

    /**
     * Decapsulate a ciphertext to recover the 32-byte shared secret.
     * Caller is responsible for zeroizing the returned array when done.
     */
    fun decapsulate(ciphertext: ByteArray, secretKey: ByteArray): ByteArray {
        require(ciphertext.size == CT_SIZE) {
            "ciphertext must be $CT_SIZE bytes, got ${ciphertext.size}"
        }
        require(secretKey.size == SK_SIZE) {
            "secretKey must be $SK_SIZE bytes, got ${secretKey.size}"
        }
        val ss = nativeDecapsulate(ciphertext, secretKey)
        require(ss.size == SS_SIZE) {
            "decapsulate returned ${ss.size} bytes, expected $SS_SIZE"
        }
        return ss
    }

    // -------------------------------------------------------------------------
    // Data classes
    // -------------------------------------------------------------------------

    /**
     * A Kyber768 key pair.
     * Both arrays are zeroed on [destroy] to prevent key material lingering in memory.
     */
    data class Keypair(
        val publicKey: ByteArray,   // 1184 bytes
        val secretKey: ByteArray    // 2400 bytes
    ) {
        /** Zeroize both keys. This instance must not be used after calling destroy(). */
        fun destroy() {
            Arrays.fill(publicKey, 0)
            Arrays.fill(secretKey, 0)
        }

        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other !is Keypair) return false
            return publicKey.contentEquals(other.publicKey) &&
                   secretKey.contentEquals(other.secretKey)
        }

        override fun hashCode(): Int = 31 * publicKey.contentHashCode() + secretKey.contentHashCode()
    }

    /**
     * The result of a Kyber768 encapsulation.
     * Both arrays are zeroed on [destroy] to prevent key material lingering in memory.
     */
    data class Encapsulation(
        val ciphertext: ByteArray,    // 1088 bytes
        val sharedSecret: ByteArray   // 32 bytes
    ) {
        /** Zeroize both arrays. This instance must not be used after calling destroy(). */
        fun destroy() {
            Arrays.fill(ciphertext, 0)
            Arrays.fill(sharedSecret, 0)
        }

        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other !is Encapsulation) return false
            return ciphertext.contentEquals(other.ciphertext) &&
                   sharedSecret.contentEquals(other.sharedSecret)
        }

        override fun hashCode(): Int =
            31 * ciphertext.contentHashCode() + sharedSecret.contentHashCode()
    }
}
