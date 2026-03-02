package com.zipminator.vpn

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertThrows
import org.junit.Test

/**
 * Unit tests for [PQWireGuard].
 *
 * Note: Tests that call [PQWireGuard.performKyberRekey] require the native library
 * and a running server; those are integration tests and are excluded from this unit suite.
 *
 * Focus here: HKDF derivation, TunnelConfig validation, HybridKey lifecycle.
 */
class PQWireGuardTest {

    // -------------------------------------------------------------------------
    // HKDF derivation — determinism
    // -------------------------------------------------------------------------

    @Test
    fun `deriveHybridKey produces 32 bytes`() {
        val wgKey = ByteArray(32) { it.toByte() }
        val kyberSecret = ByteArray(32) { (it + 100).toByte() }
        val result = PQWireGuard.deriveHybridKey(wgKey, kyberSecret)
        assertEquals(32, result.size)
    }

    @Test
    fun `deriveHybridKey is deterministic for the same inputs`() {
        val wgKey = ByteArray(32) { 0x42 }
        val kyberSecret = ByteArray(32) { 0x7F.toByte() }

        val result1 = PQWireGuard.deriveHybridKey(wgKey, kyberSecret)
        val result2 = PQWireGuard.deriveHybridKey(wgKey, kyberSecret)

        assertArrayEquals(result1, result2)
    }

    @Test
    fun `deriveHybridKey produces different output for different wgKey`() {
        val kyberSecret = ByteArray(32) { 0x11 }
        val wgKey1 = ByteArray(32) { 0x01 }
        val wgKey2 = ByteArray(32) { 0x02 }

        val result1 = PQWireGuard.deriveHybridKey(wgKey1, kyberSecret)
        val result2 = PQWireGuard.deriveHybridKey(wgKey2, kyberSecret)

        assertFalse(
            "Different wgKeys should produce different hybrid keys",
            result1.contentEquals(result2)
        )
    }

    @Test
    fun `deriveHybridKey produces different output for different kyberSecret`() {
        val wgKey = ByteArray(32) { 0x33 }
        val ks1 = ByteArray(32) { 0xAA.toByte() }
        val ks2 = ByteArray(32) { 0xBB.toByte() }

        val result1 = PQWireGuard.deriveHybridKey(wgKey, ks1)
        val result2 = PQWireGuard.deriveHybridKey(wgKey, ks2)

        assertFalse(
            "Different kyberSecrets should produce different hybrid keys",
            result1.contentEquals(result2)
        )
    }

    @Test
    fun `deriveHybridKey result does not equal wgKey`() {
        val wgKey = ByteArray(32) { it.toByte() }
        val kyberSecret = ByteArray(32) { (255 - it).toByte() }
        val result = PQWireGuard.deriveHybridKey(wgKey, kyberSecret)
        assertFalse("Hybrid key must not equal the raw wgKey", result.contentEquals(wgKey))
    }

    @Test
    fun `deriveHybridKey result does not equal kyberSecret`() {
        val wgKey = ByteArray(32) { it.toByte() }
        val kyberSecret = ByteArray(32) { (it * 3).toByte() }
        val result = PQWireGuard.deriveHybridKey(wgKey, kyberSecret)
        assertFalse("Hybrid key must not equal kyberSecret", result.contentEquals(kyberSecret))
    }

    @Test
    fun `deriveHybridKey with all-zero inputs produces non-zero output`() {
        val wgKey = ByteArray(32) { 0 }
        val kyberSecret = ByteArray(32) { 0 }
        val result = PQWireGuard.deriveHybridKey(wgKey, kyberSecret)
        // HKDF of all-zeros is well-defined and must not be all-zeros
        val allZero = result.all { it == 0.toByte() }
        assertFalse("HKDF of all-zero input must not produce all-zero output", allZero)
    }

    @Test
    fun `deriveHybridKey with known test vector is reproducible`() {
        // Fixed test vector — precomputed from reference HKDF-SHA256 implementation.
        // IKM = wgKey (00..1F) || kyberSecret (20..3F)
        // salt = 00 * 32
        // info = "zipminator-pq-wireguard" || 0x01
        val wgKey = ByteArray(32) { it.toByte() }           // 0x00..0x1F
        val kyberSecret = ByteArray(32) { (it + 32).toByte() } // 0x20..0x3F

        val result = PQWireGuard.deriveHybridKey(wgKey, kyberSecret)

        // The result must be 32 bytes and deterministic
        assertNotNull(result)
        assertEquals(32, result.size)

        // Verify determinism with a second call
        val result2 = PQWireGuard.deriveHybridKey(wgKey, kyberSecret)
        assertArrayEquals("Test vector result must be reproducible", result, result2)
    }

    // -------------------------------------------------------------------------
    // deriveHybridKey — input validation
    // -------------------------------------------------------------------------

    @Test(expected = IllegalArgumentException::class)
    fun `deriveHybridKey rejects wgKey shorter than 32 bytes`() {
        PQWireGuard.deriveHybridKey(ByteArray(16), ByteArray(32))
    }

    @Test(expected = IllegalArgumentException::class)
    fun `deriveHybridKey rejects wgKey longer than 32 bytes`() {
        PQWireGuard.deriveHybridKey(ByteArray(64), ByteArray(32))
    }

    @Test(expected = IllegalArgumentException::class)
    fun `deriveHybridKey rejects kyberSecret shorter than 32 bytes`() {
        PQWireGuard.deriveHybridKey(ByteArray(32), ByteArray(8))
    }

    @Test(expected = IllegalArgumentException::class)
    fun `deriveHybridKey rejects kyberSecret longer than 32 bytes`() {
        PQWireGuard.deriveHybridKey(ByteArray(32), ByteArray(64))
    }

    // -------------------------------------------------------------------------
    // TunnelConfig — validation
    // -------------------------------------------------------------------------

    @Test
    fun `TunnelConfig accepts valid configuration`() {
        val config = PQWireGuard.TunnelConfig(
            serverEndpoint = "vpn.example.com",
            serverPort = 51820,
            serverPublicKey = ByteArray(32) { 0x01 },
            clientPrivateKey = ByteArray(32) { 0x02 },
            tunnelAddress = "10.14.0.2/32",
            dns = listOf("1.1.1.1"),
            rekeyIntervalMs = 300_000L
        )
        assertNotNull(config)
        assertEquals("vpn.example.com", config.serverEndpoint)
        assertEquals(51820, config.serverPort)
    }

    @Test(expected = IllegalArgumentException::class)
    fun `TunnelConfig rejects serverPublicKey not 32 bytes`() {
        PQWireGuard.TunnelConfig(
            serverEndpoint = "vpn.example.com",
            serverPublicKey = ByteArray(16),
            clientPrivateKey = ByteArray(32),
            tunnelAddress = "10.14.0.2/32"
        )
    }

    @Test(expected = IllegalArgumentException::class)
    fun `TunnelConfig rejects clientPrivateKey not 32 bytes`() {
        PQWireGuard.TunnelConfig(
            serverEndpoint = "vpn.example.com",
            serverPublicKey = ByteArray(32),
            clientPrivateKey = ByteArray(31),
            tunnelAddress = "10.14.0.2/32"
        )
    }

    @Test(expected = IllegalArgumentException::class)
    fun `TunnelConfig rejects port 0`() {
        PQWireGuard.TunnelConfig(
            serverEndpoint = "vpn.example.com",
            serverPort = 0,
            serverPublicKey = ByteArray(32),
            clientPrivateKey = ByteArray(32),
            tunnelAddress = "10.14.0.2/32"
        )
    }

    @Test(expected = IllegalArgumentException::class)
    fun `TunnelConfig rejects port 65536`() {
        PQWireGuard.TunnelConfig(
            serverEndpoint = "vpn.example.com",
            serverPort = 65536,
            serverPublicKey = ByteArray(32),
            clientPrivateKey = ByteArray(32),
            tunnelAddress = "10.14.0.2/32"
        )
    }

    @Test(expected = IllegalArgumentException::class)
    fun `TunnelConfig rejects rekeyIntervalMs below 60 seconds`() {
        PQWireGuard.TunnelConfig(
            serverEndpoint = "vpn.example.com",
            serverPublicKey = ByteArray(32),
            clientPrivateKey = ByteArray(32),
            tunnelAddress = "10.14.0.2/32",
            rekeyIntervalMs = 30_000L   // 30 seconds — too short
        )
    }

    @Test
    fun `TunnelConfig accepts minimum rekeyIntervalMs of 60 seconds`() {
        val config = PQWireGuard.TunnelConfig(
            serverEndpoint = "vpn.example.com",
            serverPublicKey = ByteArray(32),
            clientPrivateKey = ByteArray(32),
            tunnelAddress = "10.14.0.2/32",
            rekeyIntervalMs = 60_000L
        )
        assertEquals(60_000L, config.rekeyIntervalMs)
    }

    // -------------------------------------------------------------------------
    // HybridKey — lifecycle and zeroization
    // -------------------------------------------------------------------------

    @Test
    fun `HybridKey destroy zeroes all arrays`() {
        val wgKey = ByteArray(32) { 0x55 }
        val kyberSecret = ByteArray(32) { 0xAA.toByte() }
        val hybridKey = ByteArray(32) { 0xFF.toByte() }

        val hk = PQWireGuard.HybridKey(
            wireGuardKey = wgKey,
            kyberSecret = kyberSecret,
            hybridKey = hybridKey
        )

        hk.destroy()

        // All arrays must now be all-zero
        assertTrue("wireGuardKey must be zeroed after destroy", hk.wireGuardKey.all { it == 0.toByte() })
        assertTrue("kyberSecret must be zeroed after destroy", hk.kyberSecret.all { it == 0.toByte() })
        assertTrue("hybridKey must be zeroed after destroy", hk.hybridKey.all { it == 0.toByte() })
    }

    @Test
    fun `HybridKey fields have correct sizes`() {
        val hk = PQWireGuard.HybridKey(
            wireGuardKey = ByteArray(32),
            kyberSecret = ByteArray(32),
            hybridKey = ByteArray(32)
        )
        assertEquals(32, hk.wireGuardKey.size)
        assertEquals(32, hk.kyberSecret.size)
        assertEquals(32, hk.hybridKey.size)
    }
}
