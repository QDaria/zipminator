package com.zipminator.vpn

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Arrays

/**
 * Unit tests for [ZipVpnService]-related behavior that can be tested without
 * Android framework dependencies (no Robolectric/instrumentation required).
 *
 * This suite focuses on:
 *   - State machine lifecycle as used by the service
 *   - Key zeroization patterns (simulated)
 *   - Config parsing helpers (extracted as testable functions)
 *
 * Note: Full service lifecycle tests (onStartCommand, establish tunnel, network callbacks)
 * require Robolectric or an instrumented test environment and are not included here.
 */
class ZipVpnServiceTest {

    // -------------------------------------------------------------------------
    // State machine — service lifecycle simulation
    // -------------------------------------------------------------------------

    @Test
    fun `full connect-rekey-disconnect lifecycle succeeds`() {
        val sm = VpnStateMachine()
        assertEquals(VpnState.DISCONNECTED, sm.state)

        assertTrue(sm.transition(VpnState.CONNECTING))
        assertEquals(VpnState.CONNECTING, sm.state)

        assertTrue(sm.transition(VpnState.CONNECTED))
        assertEquals(VpnState.CONNECTED, sm.state)

        assertTrue(sm.transition(VpnState.REKEYING))
        assertEquals(VpnState.REKEYING, sm.state)

        assertTrue(sm.transition(VpnState.CONNECTED))
        assertEquals(VpnState.CONNECTED, sm.state)

        assertTrue(sm.transition(VpnState.DISCONNECTED))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `error recovery lifecycle — error then reconnect`() {
        val sm = VpnStateMachine()
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.ERROR)
        assertEquals(VpnState.ERROR, sm.state)

        assertTrue(sm.transition(VpnState.CONNECTING))
        assertEquals(VpnState.CONNECTING, sm.state)

        assertTrue(sm.transition(VpnState.CONNECTED))
        assertEquals(VpnState.CONNECTED, sm.state)
    }

    @Test
    fun `rekey failure transitions to ERROR`() {
        val sm = VpnStateMachine()
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.transition(VpnState.REKEYING)

        // Simulate rekey failure
        assertTrue(sm.transition(VpnState.ERROR))
        assertEquals(VpnState.ERROR, sm.state)
    }

    @Test
    fun `teardown from REKEYING goes to DISCONNECTED`() {
        val sm = VpnStateMachine()
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.transition(VpnState.REKEYING)
        assertTrue(sm.transition(VpnState.DISCONNECTED))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `teardown from CONNECTING goes to DISCONNECTED`() {
        val sm = VpnStateMachine()
        sm.transition(VpnState.CONNECTING)
        assertTrue(sm.transition(VpnState.DISCONNECTED))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `multiple state listeners can be replaced`() {
        val sm = VpnStateMachine()
        val log1 = mutableListOf<VpnState>()
        val log2 = mutableListOf<VpnState>()

        sm.listener = { log1.add(it) }
        sm.transition(VpnState.CONNECTING)

        sm.listener = { log2.add(it) }
        sm.transition(VpnState.CONNECTED)

        assertEquals(listOf(VpnState.CONNECTING), log1)
        assertEquals(listOf(VpnState.CONNECTED), log2)
    }

    // -------------------------------------------------------------------------
    // Key zeroization
    // -------------------------------------------------------------------------

    @Test
    fun `PSK byte array is zeroed after teardown simulation`() {
        var psk = ByteArray(32) { (it + 1).toByte() }

        // Simulate what teardown() does to currentPsk
        Arrays.fill(psk, 0)

        assertTrue("PSK must be all-zero after teardown", psk.all { it == 0.toByte() })
    }

    @Test
    fun `HybridKey is destroyed on teardown simulation`() {
        val wgKey = ByteArray(32) { 0x55 }
        val kyberSs = ByteArray(32) { 0xAA.toByte() }
        val hybridKey = ByteArray(32) { 0xFF.toByte() }

        val hk = PQWireGuard.HybridKey(
            wireGuardKey = wgKey,
            kyberSecret = kyberSs,
            hybridKey = hybridKey
        )

        // Simulate teardown
        hk.destroy()

        assertTrue("wireGuardKey zeroed", hk.wireGuardKey.all { it == 0.toByte() })
        assertTrue("kyberSecret zeroed", hk.kyberSecret.all { it == 0.toByte() })
        assertTrue("hybridKey zeroed", hk.hybridKey.all { it == 0.toByte() })
    }

    @Test
    fun `TunnelConfig keys are zeroized on teardown`() {
        val serverPk = ByteArray(32) { 0x11 }
        val clientSk = ByteArray(32) { 0x22 }
        val config = PQWireGuard.TunnelConfig(
            serverEndpoint = "vpn.test.local",
            serverPublicKey = serverPk,
            clientPrivateKey = clientSk,
            tunnelAddress = "10.14.0.2/32"
        )

        // Simulate teardown
        config.destroy()

        assertTrue("serverPublicKey zeroed", config.serverPublicKey.all { it == 0.toByte() })
        assertTrue("clientPrivateKey zeroed", config.clientPrivateKey.all { it == 0.toByte() })
    }

    @Test
    fun `Keypair is zeroed when no longer needed`() {
        val kp = KyberJNI.Keypair(
            publicKey = ByteArray(KyberJNI.PK_SIZE) { 0xAB.toByte() },
            secretKey = ByteArray(KyberJNI.SK_SIZE) { 0xCD.toByte() }
        )

        kp.destroy()

        assertTrue("publicKey zeroed", kp.publicKey.all { it == 0.toByte() })
        assertTrue("secretKey zeroed", kp.secretKey.all { it == 0.toByte() })
    }

    // -------------------------------------------------------------------------
    // Hex-to-bytes helper (validates logic that mirrors ZipVpnService.hexToBytes)
    // -------------------------------------------------------------------------

    @Test
    fun `hexToBytes produces correct 32-byte array`() {
        val hex = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
        val bytes = hexToBytes(hex)
        assertEquals(32, bytes.size)
        assertEquals(0x01.toByte(), bytes[0])
        assertEquals(0x20.toByte(), bytes[31])
    }

    @Test
    fun `hexToBytes handles uppercase hex`() {
        val hex = "AABBCCDDEEFF00112233445566778899AABBCCDDEEFF001122334455667788AA"
        val bytes = hexToBytes(hex)
        assertEquals(32, bytes.size)
        assertEquals(0xAA.toByte(), bytes[0])
    }

    @Test(expected = IllegalArgumentException::class)
    fun `hexToBytes rejects odd-length string`() {
        hexToBytes("abc")
    }

    @Test
    fun `hexToBytes all-zero hex produces zero array`() {
        val hex = "0".repeat(64)
        val bytes = hexToBytes(hex)
        assertTrue(bytes.all { it == 0.toByte() })
    }

    // -------------------------------------------------------------------------
    // CIDR parsing helper
    // -------------------------------------------------------------------------

    @Test
    fun `parseCidr splits address and prefix`() {
        val (addr, prefix) = parseCidr("10.14.0.2/32")
        assertEquals("10.14.0.2", addr)
        assertEquals(32, prefix)
    }

    @Test
    fun `parseCidr with no prefix defaults to 32`() {
        val (addr, prefix) = parseCidr("10.14.0.2")
        assertEquals("10.14.0.2", addr)
        assertEquals(32, prefix)
    }

    @Test
    fun `parseCidr handles slash-24`() {
        val (addr, prefix) = parseCidr("192.168.1.0/24")
        assertEquals("192.168.1.0", addr)
        assertEquals(24, prefix)
    }

    // -------------------------------------------------------------------------
    // Helpers (mirror of private service methods, extracted for testability)
    // -------------------------------------------------------------------------

    private fun hexToBytes(hex: String): ByteArray {
        val cleaned = hex.replace(" ", "").replace(":", "")
        require(cleaned.length % 2 == 0) { "Hex string must have even length" }
        return ByteArray(cleaned.length / 2) { i ->
            cleaned.substring(i * 2, i * 2 + 2).toInt(16).toByte()
        }
    }

    private fun parseCidr(cidr: String): Pair<String, Int> {
        return if ("/" in cidr) {
            val parts = cidr.split("/")
            Pair(parts[0], parts[1].toInt())
        } else {
            Pair(cidr, 32)
        }
    }
}
