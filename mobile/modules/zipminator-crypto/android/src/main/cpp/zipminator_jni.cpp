/**
 * zipminator_jni.cpp — Thin JNI wrapper for the Rust Kyber768 FFI.
 *
 * This file bridges the Java/Kotlin layer to libzipminator_core.so by
 * forwarding calls to the C symbols declared in RustFFI.h.
 *
 * Build system: CMakeLists.txt (in android/) links libzipminator_core.so
 * (pre-built for each ABI in jniLibs/<abi>/).
 *
 * Naming convention:
 *   Java_expo_modules_zipminatorcrypto_ZipminatorNative_<methodName>
 *
 * All binary data crosses the JNI boundary as jbyteArray (byte[]).
 * The Kotlin companion object declares the corresponding `external fun`s.
 */

#include <jni.h>
#include <string>
#include <cstring>
#include "../../../../../cpp/RustFFI.h"

extern "C" {

// ── Utilities ─────────────────────────────────────────────────────────────

/** Copy a jbyteArray into a native buffer. Returns the number of bytes copied. */
static jsize jbyteArrayToBuffer(JNIEnv* env, jbyteArray arr, uint8_t* buf, jsize cap) {
    if (!arr) return -1;
    jsize len = env->GetArrayLength(arr);
    if (len > cap) return -1;
    env->GetByteArrayRegion(arr, 0, len, reinterpret_cast<jbyte*>(buf));
    return len;
}

/** Create a jbyteArray from a native buffer. */
static jbyteArray bufferToJbyteArray(JNIEnv* env, const uint8_t* buf, int len) {
    jbyteArray result = env->NewByteArray(len);
    if (!result) return nullptr;
    env->SetByteArrayRegion(result, 0, len, reinterpret_cast<const jbyte*>(buf));
    return result;
}

// ── Session handle management ─────────────────────────────────────────────
//
// Kotlin holds session pointers as jlong (64-bit). This is safe on all
// Android ABIs (arm64-v8a, x86_64, armeabi-v7a, x86).
// The Kotlin layer must call sessionFree() before dropping the handle.

// ── generateKEMKeyPair ────────────────────────────────────────────────────

/**
 * Returns a jobjectArray of length 2: [publicKeyBytes, secretKeyBytes].
 * NOTE: The legacy FFI does not expose the secret key bytes; only the public
 * key is returned. The "secretKey" element is a copy of the public key as a
 * placeholder (the real SK lives opaquely in Rust memory).
 */
JNIEXPORT jobjectArray JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_generateKEMKeyPair(
    JNIEnv* env, jclass /* clazz */)
{
    PqcRatchet* ratchet = zipminator_ratchet_new();
    if (!ratchet) return nullptr;

    uint8_t pkBuf[ZIPMINATOR_PK_BYTES] = {};
    int rc = zipminator_ratchet_get_public_key(ratchet, pkBuf);
    zipminator_ratchet_free(ratchet);

    if (rc != ZIPMINATOR_PK_BYTES) return nullptr;

    jbyteArray pk = bufferToJbyteArray(env, pkBuf, ZIPMINATOR_PK_BYTES);
    // Placeholder: return PK bytes in both slots (SK is opaque).
    jbyteArray sk = bufferToJbyteArray(env, pkBuf, ZIPMINATOR_PK_BYTES);

    jclass bytesClass = env->FindClass("[B");
    jobjectArray result = env->NewObjectArray(2, bytesClass, nullptr);
    env->SetObjectArrayElement(result, 0, pk);
    env->SetObjectArrayElement(result, 1, sk);

    env->DeleteLocalRef(pk);
    env->DeleteLocalRef(sk);
    return result;
}

// ── encapsulateSecret ─────────────────────────────────────────────────────

/**
 * Encapsulate against alice_pk.
 * Returns jobjectArray[2]: [ciphertextBytes, sharedSecretProxyBytes].
 */
JNIEXPORT jobjectArray JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_encapsulateSecret(
    JNIEnv* env, jclass /* clazz */, jbyteArray alicePk)
{
    uint8_t pkBuf[ZIPMINATOR_PK_BYTES] = {};
    jsize pkLen = jbyteArrayToBuffer(env, alicePk, pkBuf, ZIPMINATOR_PK_BYTES);
    if (pkLen != ZIPMINATOR_PK_BYTES) return nullptr;

    uint8_t ctBuf[ZIPMINATOR_CT_BYTES] = {};
    uint8_t bobPkBuf[ZIPMINATOR_PK_BYTES] = {};

    PqRatchetSession* session = zipminator_ratchet_session_new_bob(
        pkBuf, (int)pkLen,
        ctBuf,    ZIPMINATOR_CT_BYTES,
        bobPkBuf, ZIPMINATOR_PK_BYTES
    );
    if (!session) return nullptr;
    zipminator_ratchet_session_free(session);

    jbyteArray ct = bufferToJbyteArray(env, ctBuf, ZIPMINATOR_CT_BYTES);
    // Return first 32 bytes of bob_pk as a proxy shared secret.
    jbyteArray ss = bufferToJbyteArray(env, bobPkBuf, ZIPMINATOR_SS_BYTES);

    jclass bytesClass = env->FindClass("[B");
    jobjectArray result = env->NewObjectArray(2, bytesClass, nullptr);
    env->SetObjectArrayElement(result, 0, ct);
    env->SetObjectArrayElement(result, 1, ss);

    env->DeleteLocalRef(ct);
    env->DeleteLocalRef(ss);
    return result;
}

// ── decapsulateSecret ─────────────────────────────────────────────────────

/**
 * Placeholder decapsulation — generates a fresh key and returns its PK
 * prefix as a proxy SS (the real SK is opaque in Rust).
 * Returns jbyteArray (32 bytes).
 */
JNIEXPORT jbyteArray JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_decapsulateSecret(
    JNIEnv* env, jclass /* clazz */,
    jbyteArray /* ct */, jbyteArray /* sk */)
{
    PqcRatchet* ratchet = zipminator_ratchet_new();
    if (!ratchet) return nullptr;

    uint8_t pkBuf[ZIPMINATOR_PK_BYTES] = {};
    int rc = zipminator_ratchet_get_public_key(ratchet, pkBuf);
    zipminator_ratchet_free(ratchet);
    if (rc != ZIPMINATOR_PK_BYTES) return nullptr;

    return bufferToJbyteArray(env, pkBuf, ZIPMINATOR_SS_BYTES);
}

// ── sessionNewAlice ───────────────────────────────────────────────────────

/**
 * Start an Alice-side session.
 * Returns jlong (session pointer) via a jobjectArray[2]: [pkBytes, handleLong].
 * The Kotlin layer stores the handle and uses it in subsequent calls.
 *
 * Returns jbyteArray (publicKey bytes), stores handle via out-param approach:
 * actual JNI returns jobjectArray { pkBytes:byte[], handle:long }.
 */
JNIEXPORT jlongArray JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_sessionNewAlice(
    JNIEnv* env, jclass /* clazz */, jbyteArray outPkHolder)
{
    // outPkHolder must be a pre-allocated byte[1184] from Kotlin.
    if (!outPkHolder || env->GetArrayLength(outPkHolder) < ZIPMINATOR_PK_BYTES) {
        return nullptr;
    }

    uint8_t pkBuf[ZIPMINATOR_PK_BYTES] = {};
    PqRatchetSession* session = zipminator_ratchet_session_new_alice(pkBuf, ZIPMINATOR_PK_BYTES);
    if (!session) return nullptr;

    env->SetByteArrayRegion(outPkHolder, 0, ZIPMINATOR_PK_BYTES,
                            reinterpret_cast<const jbyte*>(pkBuf));

    jlongArray result = env->NewLongArray(1);
    jlong handle = reinterpret_cast<jlong>(session);
    env->SetLongArrayRegion(result, 0, 1, &handle);
    return result;
}

// ── sessionNewBob ─────────────────────────────────────────────────────────

/**
 * Start a Bob-side session given Alice's public key.
 *
 * Returns jlongArray[1] containing the session handle.
 * Output ct and bobPk are written into pre-allocated jbyteArray parameters.
 */
JNIEXPORT jlongArray JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_sessionNewBob(
    JNIEnv* env, jclass /* clazz */,
    jbyteArray alicePk,
    jbyteArray outCt,
    jbyteArray outBobPk)
{
    uint8_t pkBuf[ZIPMINATOR_PK_BYTES] = {};
    jsize pkLen = jbyteArrayToBuffer(env, alicePk, pkBuf, ZIPMINATOR_PK_BYTES);
    if (pkLen != ZIPMINATOR_PK_BYTES) return nullptr;

    uint8_t ctBuf[ZIPMINATOR_CT_BYTES] = {};
    uint8_t bobPkBuf[ZIPMINATOR_PK_BYTES] = {};

    PqRatchetSession* session = zipminator_ratchet_session_new_bob(
        pkBuf, ZIPMINATOR_PK_BYTES,
        ctBuf, ZIPMINATOR_CT_BYTES,
        bobPkBuf, ZIPMINATOR_PK_BYTES
    );
    if (!session) return nullptr;

    env->SetByteArrayRegion(outCt,    0, ZIPMINATOR_CT_BYTES,  reinterpret_cast<const jbyte*>(ctBuf));
    env->SetByteArrayRegion(outBobPk, 0, ZIPMINATOR_PK_BYTES,  reinterpret_cast<const jbyte*>(bobPkBuf));

    jlongArray result = env->NewLongArray(1);
    jlong handle = reinterpret_cast<jlong>(session);
    env->SetLongArrayRegion(result, 0, 1, &handle);
    return result;
}

// ── sessionAliceFinish ────────────────────────────────────────────────────

JNIEXPORT jint JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_sessionAliceFinish(
    JNIEnv* env, jclass /* clazz */,
    jlong handle, jbyteArray ct, jbyteArray bobPk)
{
    PqRatchetSession* session = reinterpret_cast<PqRatchetSession*>(handle);
    if (!session) return ZIPMINATOR_ERR_NULL;

    uint8_t ctBuf[ZIPMINATOR_CT_BYTES] = {};
    jsize ctLen = jbyteArrayToBuffer(env, ct, ctBuf, ZIPMINATOR_CT_BYTES);
    if (ctLen != ZIPMINATOR_CT_BYTES) return ZIPMINATOR_ERR_NULL;

    uint8_t pkBuf[ZIPMINATOR_PK_BYTES] = {};
    jsize pkLen = jbyteArrayToBuffer(env, bobPk, pkBuf, ZIPMINATOR_PK_BYTES);
    if (pkLen != ZIPMINATOR_PK_BYTES) return ZIPMINATOR_ERR_NULL;

    return zipminator_ratchet_session_alice_finish(session, ctBuf, ctLen, pkBuf, pkLen);
}

// ── sessionEncrypt ────────────────────────────────────────────────────────

/**
 * Encrypt plaintext with a ratchet session.
 *
 * Returns jobjectArray[2]: [headerBytes, ciphertextBytes] on success, null on error.
 */
JNIEXPORT jobjectArray JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_sessionEncrypt(
    JNIEnv* env, jclass /* clazz */,
    jlong handle, jbyteArray plaintext)
{
    PqRatchetSession* session = reinterpret_cast<PqRatchetSession*>(handle);
    if (!session) return nullptr;

    jsize ptLen = env->GetArrayLength(plaintext);
    std::vector<uint8_t> pt(ptLen);
    env->GetByteArrayRegion(plaintext, 0, ptLen, reinterpret_cast<jbyte*>(pt.data()));

    const int headerCap = ZIPMINATOR_HEADER_MAX_BYTES;
    const int ctCap     = ptLen + 64;
    std::vector<uint8_t> headerBuf(headerCap);
    std::vector<uint8_t> ctBuf(ctCap);
    int headerWritten = 0;
    int ctWritten     = 0;

    int rc = zipminator_ratchet_session_encrypt(
        session,
        pt.data(), ptLen,
        headerBuf.data(), headerCap, &headerWritten,
        ctBuf.data(),     ctCap,     &ctWritten
    );
    if (rc != 0) return nullptr;

    jbyteArray jHeader = bufferToJbyteArray(env, headerBuf.data(), headerWritten);
    jbyteArray jCt     = bufferToJbyteArray(env, ctBuf.data(),     ctWritten);

    jclass bytesClass = env->FindClass("[B");
    jobjectArray result = env->NewObjectArray(2, bytesClass, nullptr);
    env->SetObjectArrayElement(result, 0, jHeader);
    env->SetObjectArrayElement(result, 1, jCt);

    env->DeleteLocalRef(jHeader);
    env->DeleteLocalRef(jCt);
    return result;
}

// ── sessionDecrypt ────────────────────────────────────────────────────────

/**
 * Decrypt a (header, ct) pair using a ratchet session.
 * Returns jbyteArray (plaintext) on success, null on error.
 */
JNIEXPORT jbyteArray JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_sessionDecrypt(
    JNIEnv* env, jclass /* clazz */,
    jlong handle, jbyteArray header, jbyteArray ct)
{
    PqRatchetSession* session = reinterpret_cast<PqRatchetSession*>(handle);
    if (!session) return nullptr;

    jsize headerLen = env->GetArrayLength(header);
    jsize ctLen     = env->GetArrayLength(ct);

    std::vector<uint8_t> headerBuf(headerLen);
    std::vector<uint8_t> ctBuf(ctLen);
    env->GetByteArrayRegion(header, 0, headerLen, reinterpret_cast<jbyte*>(headerBuf.data()));
    env->GetByteArrayRegion(ct,     0, ctLen,     reinterpret_cast<jbyte*>(ctBuf.data()));

    std::vector<uint8_t> outBuf(ctLen + 64);
    int bytesWritten = zipminator_ratchet_session_decrypt(
        session,
        headerBuf.data(), headerLen,
        ctBuf.data(),     ctLen,
        outBuf.data(),    static_cast<int>(outBuf.size())
    );
    if (bytesWritten < 0) return nullptr;

    return bufferToJbyteArray(env, outBuf.data(), bytesWritten);
}

// ── sessionFree ───────────────────────────────────────────────────────────

JNIEXPORT void JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_sessionFree(
    JNIEnv* /* env */, jclass /* clazz */, jlong handle)
{
    PqRatchetSession* session = reinterpret_cast<PqRatchetSession*>(handle);
    zipminator_ratchet_session_free(session);
}

// ── sessionGetPublicKey ───────────────────────────────────────────────────

JNIEXPORT jbyteArray JNICALL
Java_expo_modules_zipminatorcrypto_ZipminatorNative_sessionGetPublicKey(
    JNIEnv* env, jclass /* clazz */, jlong handle)
{
    const PqRatchetSession* session = reinterpret_cast<const PqRatchetSession*>(handle);
    if (!session) return nullptr;

    uint8_t pkBuf[ZIPMINATOR_PK_BYTES] = {};
    int rc = zipminator_ratchet_session_get_public_key(session, pkBuf, ZIPMINATOR_PK_BYTES);
    if (rc != ZIPMINATOR_PK_BYTES) return nullptr;

    return bufferToJbyteArray(env, pkBuf, ZIPMINATOR_PK_BYTES);
}

} // extern "C"
