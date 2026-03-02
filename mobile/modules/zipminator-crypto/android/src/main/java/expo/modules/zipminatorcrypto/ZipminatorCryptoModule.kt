package expo.modules.zipminatorcrypto

import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * ZipminatorCryptoModule — Expo native module for Android.
 *
 * Bridges JavaScript to the Rust Kyber768 / PQ Double Ratchet library via JNI.
 *
 * All binary data crosses the JS bridge as base64-encoded strings.
 * Session state is held as native pointers (Long) on the Kotlin side and freed
 * via finalizers + explicit free calls.
 *
 * Only one Alice session and one Bob session are active at a time.
 * Call initRatchetAsBob / initRatchetAsAlice to (re-)establish sessions.
 */
class ZipminatorCryptoModule : Module() {

  companion object {
    private const val PK_BYTES  = 1184
    private const val CT_BYTES  = 1088
    private const val SS_BYTES  = 32

    init {
      // Load the JNI shim (zipminator_crypto_jni) which in turn depends on
      // libzipminator_core.so (the pre-built Rust library).
      System.loadLibrary("zipminator_crypto_jni")
    }
  }

  // ── Session handles (native pointers held as Long) ───────────────────────
  // Access is serialised because Expo AsyncFunctions run on the module's
  // serial queue. Marked @Volatile for visibility across thread boundaries.

  @Volatile private var aliceHandle: Long = 0L
  @Volatile private var bobHandle:   Long = 0L

  override fun onDestroy() {
    freeAliceSession()
    freeBobSession()
  }

  // ── Module definition ────────────────────────────────────────────────────

  override fun definition() = ModuleDefinition {
    Name("ZipminatorCrypto")

    // ── 1. generateKEMKeyPair ───────────────────────────────────────────
    AsyncFunction("generateKEMKeyPair") { algorithm: String ->
      check(algorithm == "Kyber768") { "Unsupported algorithm '$algorithm'. Only 'Kyber768' is supported." }

      val pair = ZipminatorNative.generateKEMKeyPair()
          ?: throw RuntimeException("Native allocation failed in generateKEMKeyPair")

      val pk = pair[0]  // byte[]
      val sk = pair[1]  // byte[] — placeholder (real SK is opaque in Rust)

      mapOf(
        "publicKey" to Base64.encodeToString(pk, Base64.NO_WRAP),
        "secretKey" to Base64.encodeToString(sk, Base64.NO_WRAP),
      )
    }

    // ── 2. encapsulateSecret ────────────────────────────────────────────
    AsyncFunction("encapsulateSecret") { publicKey: String, algorithm: String ->
      check(algorithm == "Kyber768") { "Unsupported algorithm '$algorithm'. Only 'Kyber768' is supported." }

      val pkBytes = Base64.decode(publicKey, Base64.NO_WRAP)
      check(pkBytes.size == PK_BYTES) {
        "publicKey must be $PK_BYTES bytes, got ${pkBytes.size}"
      }

      val result = ZipminatorNative.encapsulateSecret(pkBytes)
          ?: throw RuntimeException("Native encapsulation failed")

      val ct = result[0]  // byte[] — KEM ciphertext
      val ss = result[1]  // byte[] — shared secret proxy

      mapOf(
        "ciphertext"   to Base64.encodeToString(ct, Base64.NO_WRAP),
        "sharedSecret" to Base64.encodeToString(ss, Base64.NO_WRAP),
      )
    }

    // ── 3. decapsulateSecret ────────────────────────────────────────────
    AsyncFunction("decapsulateSecret") { ciphertext: String, secretKey: String, algorithm: String ->
      check(algorithm == "Kyber768") { "Unsupported algorithm '$algorithm'. Only 'Kyber768' is supported." }

      val ctBytes = Base64.decode(ciphertext, Base64.NO_WRAP)
      val skBytes = Base64.decode(secretKey,  Base64.NO_WRAP)

      val ss = ZipminatorNative.decapsulateSecret(ctBytes, skBytes)
          ?: throw RuntimeException("Native decapsulation failed")

      Base64.encodeToString(ss, Base64.NO_WRAP)
    }

    // ── 4. initRatchetAsBob ─────────────────────────────────────────────
    AsyncFunction("initRatchetAsBob") {
      freeBobSession()

      val pkHolder = ByteArray(PK_BYTES)
      val handleArr = ZipminatorNative.sessionNewAlice(pkHolder)
          ?: throw RuntimeException("Native sessionNewAlice failed")

      bobHandle = handleArr[0]

      mapOf("publicKey" to Base64.encodeToString(pkHolder, Base64.NO_WRAP))
    }

    // ── 5. initRatchetAsAlice ───────────────────────────────────────────
    AsyncFunction("initRatchetAsAlice") { remotePublicKey: String ->
      val remotePkBytes = Base64.decode(remotePublicKey, Base64.NO_WRAP)
      check(remotePkBytes.size == PK_BYTES) {
        "remotePublicKey must be $PK_BYTES bytes, got ${remotePkBytes.size}"
      }

      freeAliceSession()

      // Start Alice's session.
      val alicePkHolder = ByteArray(PK_BYTES)
      val aliceHandleArr = ZipminatorNative.sessionNewAlice(alicePkHolder)
          ?: throw RuntimeException("Native sessionNewAlice (Alice) failed")
      aliceHandle = aliceHandleArr[0]

      // Use Bob's (remote) public key to create a transient Bob session,
      // extracting (ct, bobPk) for alice_finish_handshake.
      val ctHolder    = ByteArray(CT_BYTES)
      val bobPkHolder = ByteArray(PK_BYTES)
      val ephBobHandleArr = ZipminatorNative.sessionNewBob(remotePkBytes, ctHolder, bobPkHolder)
      if (ephBobHandleArr == null) {
        freeAliceSession()
        throw RuntimeException("Native sessionNewBob (ephemeral) failed")
      }
      // Free the ephemeral Bob session immediately — we only needed ct + bobPk.
      ZipminatorNative.sessionFree(ephBobHandleArr[0])

      val rc = ZipminatorNative.sessionAliceFinish(aliceHandle, ctHolder, bobPkHolder)
      if (rc != 0) {
        freeAliceSession()
        throw RuntimeException("sessionAliceFinish returned $rc")
      }
    }

    // ── 6. ratchetEncrypt ───────────────────────────────────────────────
    AsyncFunction("ratchetEncrypt") { message: String ->
      check(aliceHandle != 0L) {
        "Alice session not initialised; call initRatchetAsAlice first."
      }

      val ptBytes = message.toByteArray(Charsets.UTF_8)
      val result = ZipminatorNative.sessionEncrypt(aliceHandle, ptBytes)
          ?: throw RuntimeException("Native sessionEncrypt failed")

      val header = result[0]
      val ct     = result[1]

      mapOf(
        "header"     to Base64.encodeToString(header, Base64.NO_WRAP),
        "ciphertext" to Base64.encodeToString(ct,     Base64.NO_WRAP),
      )
    }

    // ── 7. ratchetDecrypt ───────────────────────────────────────────────
    AsyncFunction("ratchetDecrypt") { header: String, ciphertext: String ->
      check(bobHandle != 0L) {
        "Bob session not initialised; call initRatchetAsBob first."
      }

      val headerBytes = Base64.decode(header,     Base64.NO_WRAP)
      val ctBytes     = Base64.decode(ciphertext, Base64.NO_WRAP)

      val plaintext = ZipminatorNative.sessionDecrypt(bobHandle, headerBytes, ctBytes)
          ?: throw RuntimeException("Native sessionDecrypt failed (bad crypto or null result)")

      String(plaintext, Charsets.UTF_8)
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private fun freeAliceSession() {
    val h = aliceHandle
    if (h != 0L) {
      ZipminatorNative.sessionFree(h)
      aliceHandle = 0L
    }
  }

  private fun freeBobSession() {
    val h = bobHandle
    if (h != 0L) {
      ZipminatorNative.sessionFree(h)
      bobHandle = 0L
    }
  }
}

/**
 * ZipminatorNative — JNI declarations for the native zipminator_crypto_jni library.
 *
 * All external functions are implemented in android/src/main/cpp/zipminator_jni.cpp.
 * Do NOT call these from the JS thread; always call via the AsyncFunction wrappers above.
 */
object ZipminatorNative {
  /**
   * Generate a Kyber768 keypair.
   * Returns Array[2]: [publicKey: ByteArray, secretKey: ByteArray (placeholder)].
   */
  external fun generateKEMKeyPair(): Array<ByteArray>?

  /**
   * Encapsulate against alicePk.
   * Returns Array[2]: [ciphertext: ByteArray, sharedSecret: ByteArray].
   */
  external fun encapsulateSecret(alicePk: ByteArray): Array<ByteArray>?

  /**
   * Placeholder decapsulation. Returns 32-byte proxy shared secret.
   */
  external fun decapsulateSecret(ct: ByteArray, sk: ByteArray): ByteArray?

  /**
   * Create an Alice-side session. Writes PK into outPkHolder (must be ByteArray(1184)).
   * Returns LongArray[1] containing the opaque session handle.
   */
  external fun sessionNewAlice(outPkHolder: ByteArray): LongArray?

  /**
   * Create a Bob-side session given Alice's PK.
   * Writes ct into outCt (ByteArray(1088)) and bobPk into outBobPk (ByteArray(1184)).
   * Returns LongArray[1] containing the opaque session handle.
   */
  external fun sessionNewBob(alicePk: ByteArray, outCt: ByteArray, outBobPk: ByteArray): LongArray?

  /**
   * Alice completes the handshake using Bob's ct and pk.
   * Returns 0 on success, negative on error.
   */
  external fun sessionAliceFinish(handle: Long, ct: ByteArray, bobPk: ByteArray): Int

  /**
   * Encrypt plaintext with the session.
   * Returns Array[2]: [headerBytes, ciphertextBytes] or null on failure.
   */
  external fun sessionEncrypt(handle: Long, plaintext: ByteArray): Array<ByteArray>?

  /**
   * Decrypt (header, ct) with the session.
   * Returns plaintext ByteArray or null on failure.
   */
  external fun sessionDecrypt(handle: Long, header: ByteArray, ct: ByteArray): ByteArray?

  /**
   * Free a session. Must be called exactly once per handle. Safe with handle=0.
   */
  external fun sessionFree(handle: Long)

  /**
   * Get the current ratchet public key from a session.
   * Returns 1184-byte ByteArray or null on failure.
   */
  external fun sessionGetPublicKey(handle: Long): ByteArray?
}
