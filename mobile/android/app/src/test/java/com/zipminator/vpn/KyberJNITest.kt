package com.zipminator.vpn

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests for [KyberJNI] data classes and constant correctness.
 *
 * Note: Tests that call the native JNI functions (generateKeypair, encapsulate, decapsulate)
 * require the native library (libzipminator_core.so) to be loaded, which is available only
 * on a device or emulator. Those tests are tagged with @Integration and excluded from the
 * standard local JVM test run via a custom test category or @Ignore.
 *
 * Tests in this file exercise:
 *   - Size constants match the NIST ML-KEM-768 specification
 *   - Keypair.destroy() zeroes both byte arrays
 *   - Encapsulation.destroy() zeroes both byte arrays
 *   - Data class equals/hashCode correctness
 */
class KyberJNITest {

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    @Test
    fun `PK_SIZE is 1184`() {
        assertEquals(1184, KyberJNI.PK_SIZE)
    }

    @Test
    fun `SK_SIZE is 2400`() {
        assertEquals(2400, KyberJNI.SK_SIZE)
    }

    @Test
    fun `CT_SIZE is 1088`() {
        assertEquals(1088, KyberJNI.CT_SIZE)
    }

    @Test
    fun `SS_SIZE is 32`() {
        assertEquals(32, KyberJNI.SS_SIZE)
    }

    // -------------------------------------------------------------------------
    // Keypair data class
    // -------------------------------------------------------------------------

    @Test
    fun `Keypair stores correct byte arrays`() {
        val pk = ByteArray(KyberJNI.PK_SIZE) { 0x01 }
        val sk = ByteArray(KyberJNI.SK_SIZE) { 0x02 }
        val kp = KyberJNI.Keypair(pk, sk)
        assertEquals(KyberJNI.PK_SIZE, kp.publicKey.size)
        assertEquals(KyberJNI.SK_SIZE, kp.secretKey.size)
        assertTrue(kp.publicKey.contentEquals(pk))
        assertTrue(kp.secretKey.contentEquals(sk))
    }

    @Test
    fun `Keypair destroy zeroes publicKey`() {
        val pk = ByteArray(KyberJNI.PK_SIZE) { 0xFF.toByte() }
        val sk = ByteArray(KyberJNI.SK_SIZE) { 0xAA.toByte() }
        val kp = KyberJNI.Keypair(pk, sk)

        kp.destroy()

        assertTrue(
            "publicKey must be all-zero after destroy",
            kp.publicKey.all { it == 0.toByte() }
        )
    }

    @Test
    fun `Keypair destroy zeroes secretKey`() {
        val pk = ByteArray(KyberJNI.PK_SIZE) { 0xFF.toByte() }
        val sk = ByteArray(KyberJNI.SK_SIZE) { 0xAA.toByte() }
        val kp = KyberJNI.Keypair(pk, sk)

        kp.destroy()

        assertTrue(
            "secretKey must be all-zero after destroy",
            kp.secretKey.all { it == 0.toByte() }
        )
    }

    @Test
    fun `Keypair destroy zeroes both arrays independently`() {
        val pk = ByteArray(KyberJNI.PK_SIZE) { it.toByte() }
        val sk = ByteArray(KyberJNI.SK_SIZE) { (255 - it % 256).toByte() }
        val kp = KyberJNI.Keypair(pk, sk)

        kp.destroy()

        val pkAllZero = kp.publicKey.all { it == 0.toByte() }
        val skAllZero = kp.secretKey.all { it == 0.toByte() }
        assertTrue("publicKey must be zeroed", pkAllZero)
        assertTrue("secretKey must be zeroed", skAllZero)
    }

    @Test
    fun `Keypair equals is content-based`() {
        val pk = ByteArray(KyberJNI.PK_SIZE) { 0x33 }
        val sk = ByteArray(KyberJNI.SK_SIZE) { 0x44 }
        val kp1 = KyberJNI.Keypair(pk.copyOf(), sk.copyOf())
        val kp2 = KyberJNI.Keypair(pk.copyOf(), sk.copyOf())
        assertEquals(kp1, kp2)
    }

    @Test
    fun `Keypair hashCode is consistent`() {
        val pk = ByteArray(KyberJNI.PK_SIZE) { 0x55 }
        val sk = ByteArray(KyberJNI.SK_SIZE) { 0x66 }
        val kp = KyberJNI.Keypair(pk, sk)
        assertEquals(kp.hashCode(), kp.hashCode())
    }

    @Test
    fun `Keypair with different keys are not equal`() {
        val pk1 = ByteArray(KyberJNI.PK_SIZE) { 0x01 }
        val pk2 = ByteArray(KyberJNI.PK_SIZE) { 0x02 }
        val sk = ByteArray(KyberJNI.SK_SIZE) { 0x00 }
        val kp1 = KyberJNI.Keypair(pk1, sk.copyOf())
        val kp2 = KyberJNI.Keypair(pk2, sk.copyOf())
        assertFalse(kp1 == kp2)
    }

    // -------------------------------------------------------------------------
    // Encapsulation data class
    // -------------------------------------------------------------------------

    @Test
    fun `Encapsulation stores correct byte arrays`() {
        val ct = ByteArray(KyberJNI.CT_SIZE) { 0x10 }
        val ss = ByteArray(KyberJNI.SS_SIZE) { 0x20 }
        val enc = KyberJNI.Encapsulation(ct, ss)
        assertEquals(KyberJNI.CT_SIZE, enc.ciphertext.size)
        assertEquals(KyberJNI.SS_SIZE, enc.sharedSecret.size)
        assertTrue(enc.ciphertext.contentEquals(ct))
        assertTrue(enc.sharedSecret.contentEquals(ss))
    }

    @Test
    fun `Encapsulation destroy zeroes ciphertext`() {
        val ct = ByteArray(KyberJNI.CT_SIZE) { 0xCC.toByte() }
        val ss = ByteArray(KyberJNI.SS_SIZE) { 0xDD.toByte() }
        val enc = KyberJNI.Encapsulation(ct, ss)

        enc.destroy()

        assertTrue(
            "ciphertext must be all-zero after destroy",
            enc.ciphertext.all { it == 0.toByte() }
        )
    }

    @Test
    fun `Encapsulation destroy zeroes sharedSecret`() {
        val ct = ByteArray(KyberJNI.CT_SIZE) { 0xEE.toByte() }
        val ss = ByteArray(KyberJNI.SS_SIZE) { 0xFF.toByte() }
        val enc = KyberJNI.Encapsulation(ct, ss)

        enc.destroy()

        assertTrue(
            "sharedSecret must be all-zero after destroy",
            enc.sharedSecret.all { it == 0.toByte() }
        )
    }

    @Test
    fun `Encapsulation destroy zeroes both arrays`() {
        val ct = ByteArray(KyberJNI.CT_SIZE) { it.toByte() }
        val ss = ByteArray(KyberJNI.SS_SIZE) { (it + 128).toByte() }
        val enc = KyberJNI.Encapsulation(ct, ss)

        enc.destroy()

        val ctAllZero = enc.ciphertext.all { it == 0.toByte() }
        val ssAllZero = enc.sharedSecret.all { it == 0.toByte() }
        assertTrue("ciphertext must be zeroed", ctAllZero)
        assertTrue("sharedSecret must be zeroed", ssAllZero)
    }

    @Test
    fun `Encapsulation equals is content-based`() {
        val ct = ByteArray(KyberJNI.CT_SIZE) { 0x77 }
        val ss = ByteArray(KyberJNI.SS_SIZE) { 0x88.toByte() }
        val enc1 = KyberJNI.Encapsulation(ct.copyOf(), ss.copyOf())
        val enc2 = KyberJNI.Encapsulation(ct.copyOf(), ss.copyOf())
        assertEquals(enc1, enc2)
    }

    @Test
    fun `Encapsulation hashCode is stable`() {
        val ct = ByteArray(KyberJNI.CT_SIZE) { 0x99.toByte() }
        val ss = ByteArray(KyberJNI.SS_SIZE) { 0xAB.toByte() }
        val enc = KyberJNI.Encapsulation(ct, ss)
        assertEquals(enc.hashCode(), enc.hashCode())
    }

    @Test
    fun `Encapsulation with different ciphertexts are not equal`() {
        val ct1 = ByteArray(KyberJNI.CT_SIZE) { 0x01 }
        val ct2 = ByteArray(KyberJNI.CT_SIZE) { 0x02 }
        val ss = ByteArray(KyberJNI.SS_SIZE) { 0x00 }
        val enc1 = KyberJNI.Encapsulation(ct1, ss.copyOf())
        val enc2 = KyberJNI.Encapsulation(ct2, ss.copyOf())
        assertFalse(enc1 == enc2)
    }

    // -------------------------------------------------------------------------
    // Destroy idempotency
    // -------------------------------------------------------------------------

    @Test
    fun `Keypair destroy can be called multiple times without exception`() {
        val kp = KyberJNI.Keypair(
            ByteArray(KyberJNI.PK_SIZE) { 0x01 },
            ByteArray(KyberJNI.SK_SIZE) { 0x02 }
        )
        kp.destroy()
        kp.destroy()   // Second call must not throw
    }

    @Test
    fun `Encapsulation destroy can be called multiple times without exception`() {
        val enc = KyberJNI.Encapsulation(
            ByteArray(KyberJNI.CT_SIZE) { 0x03 },
            ByteArray(KyberJNI.SS_SIZE) { 0x04 }
        )
        enc.destroy()
        enc.destroy()  // Second call must not throw
    }
}
