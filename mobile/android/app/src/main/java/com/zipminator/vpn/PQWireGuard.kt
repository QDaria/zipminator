package com.zipminator.vpn

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetSocketAddress
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Arrays
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Hybrid PQ-WireGuard protocol layer.
 *
 * Architecture:
 *   1. Classical WireGuard tunnel established externally (Curve25519 + ChaCha20-Poly1305).
 *   2. Inside the tunnel, perform Kyber768 key exchange to derive a 32-byte post-quantum secret.
 *   3. Combine WireGuard preshared key with Kyber secret via HKDF-SHA256 to produce the
 *      final hybrid preshared key applied to the WireGuard session.
 *   4. Rekey every 5 minutes (configurable).
 *
 * Wire protocol for Kyber messages (runs inside the WireGuard UDP tunnel):
 *   [type: 1 byte][length: 2 bytes big-endian][payload: length bytes]
 *
 *   MSG_TYPE_PK = 0x01  — initiator sends public key  (1184 bytes payload)
 *   MSG_TYPE_CT = 0x02  — responder sends ciphertext  (1088 bytes payload)
 */
object PQWireGuard {

    // Wire protocol message types
    private const val MSG_TYPE_PK: Byte = 0x01
    private const val MSG_TYPE_CT: Byte = 0x02

    // HKDF info string for hybrid key derivation
    private const val HKDF_INFO = "zipminator-pq-wireguard"

    // Maximum datagram size for Kyber messages (header 3 bytes + max payload 1184 bytes)
    private const val MAX_DGRAM_SIZE = 4096

    // Socket read timeout in milliseconds
    private const val SOCKET_TIMEOUT_MS = 10_000

    // -------------------------------------------------------------------------
    // Data classes
    // -------------------------------------------------------------------------

    /**
     * WireGuard tunnel configuration.
     *
     * @param serverEndpoint     IP address or hostname of the WireGuard server
     * @param serverPort         UDP port of the WireGuard server (default 51820)
     * @param serverPublicKey    Server's Curve25519 public key (32 bytes)
     * @param clientPrivateKey   Client's Curve25519 private key (32 bytes)
     * @param tunnelAddress      CIDR address assigned to the tun interface (e.g. "10.14.0.2/32")
     * @param dns                DNS servers to push into the tunnel
     * @param rekeyIntervalMs    Milliseconds between PQ rekeys (default 5 minutes)
     */
    data class TunnelConfig(
        val serverEndpoint: String,
        val serverPort: Int = 51820,
        val serverPublicKey: ByteArray,        // 32 bytes (Curve25519)
        val clientPrivateKey: ByteArray,       // 32 bytes (Curve25519)
        val tunnelAddress: String = "10.14.0.2/32",
        val dns: List<String> = listOf("1.1.1.1", "1.0.0.1"),
        val rekeyIntervalMs: Long = 5 * 60 * 1000L
    ) {
        init {
            require(serverPublicKey.size == 32) {
                "serverPublicKey must be 32 bytes, got ${serverPublicKey.size}"
            }
            require(clientPrivateKey.size == 32) {
                "clientPrivateKey must be 32 bytes, got ${clientPrivateKey.size}"
            }
            require(serverPort in 1..65535) {
                "serverPort must be in 1..65535, got $serverPort"
            }
            require(rekeyIntervalMs >= 60_000L) {
                "rekeyIntervalMs must be >= 60000 (1 minute), got $rekeyIntervalMs"
            }
        }

        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other !is TunnelConfig) return false
            return serverEndpoint == other.serverEndpoint &&
                   serverPort == other.serverPort &&
                   serverPublicKey.contentEquals(other.serverPublicKey) &&
                   clientPrivateKey.contentEquals(other.clientPrivateKey) &&
                   tunnelAddress == other.tunnelAddress &&
                   dns == other.dns &&
                   rekeyIntervalMs == other.rekeyIntervalMs
        }

        override fun hashCode(): Int {
            var result = serverEndpoint.hashCode()
            result = 31 * result + serverPort
            result = 31 * result + serverPublicKey.contentHashCode()
            result = 31 * result + clientPrivateKey.contentHashCode()
            result = 31 * result + tunnelAddress.hashCode()
            result = 31 * result + dns.hashCode()
            result = 31 * result + rekeyIntervalMs.hashCode()
            return result
        }

        /** Zeroize key material. */
        fun destroy() {
            Arrays.fill(serverPublicKey, 0)
            Arrays.fill(clientPrivateKey, 0)
        }
    }

    /**
     * The result of a successful PQ rekey.
     *
     * @param wireGuardKey  Original 32-byte WireGuard preshared key input
     * @param kyberSecret   32-byte Kyber768 shared secret
     * @param hybridKey     HKDF-derived 32-byte preshared key to apply to WireGuard
     */
    data class HybridKey(
        val wireGuardKey: ByteArray,   // 32 bytes
        val kyberSecret: ByteArray,    // 32 bytes
        val hybridKey: ByteArray       // 32 bytes — the value to use as WireGuard PSK
    ) {
        fun destroy() {
            Arrays.fill(wireGuardKey, 0)
            Arrays.fill(kyberSecret, 0)
            Arrays.fill(hybridKey, 0)
        }

        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other !is HybridKey) return false
            return wireGuardKey.contentEquals(other.wireGuardKey) &&
                   kyberSecret.contentEquals(other.kyberSecret) &&
                   hybridKey.contentEquals(other.hybridKey)
        }

        override fun hashCode(): Int {
            var result = wireGuardKey.contentHashCode()
            result = 31 * result + kyberSecret.contentHashCode()
            result = 31 * result + hybridKey.contentHashCode()
            return result
        }
    }

    // -------------------------------------------------------------------------
    // HKDF-SHA256 implementation (no BouncyCastle dependency required)
    // -------------------------------------------------------------------------

    /**
     * HKDF extract step: PRK = HMAC-SHA256(salt, IKM)
     *
     * @param salt  Salt value (use 32 zero bytes if absent)
     * @param ikm   Input key material
     * @return 32-byte pseudo-random key
     */
    private fun hkdfExtract(salt: ByteArray, ikm: ByteArray): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(salt, "HmacSHA256"))
        return mac.doFinal(ikm)
    }

    /**
     * HKDF expand step: OKM = T(1) = HMAC-SHA256(PRK, info || 0x01)
     *
     * This single-round expand is sufficient for 32-byte output.
     *
     * @param prk    32-byte pseudo-random key from extract step
     * @param info   Context/application-specific info string
     * @param length Desired output length in bytes (max 32 for single round)
     * @return [length]-byte output key material
     */
    private fun hkdfExpand(prk: ByteArray, info: ByteArray, length: Int): ByteArray {
        require(length <= 32) { "Single-round HKDF expand supports at most 32 bytes" }
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(prk, "HmacSHA256"))
        mac.update(info)
        mac.update(0x01.toByte())
        return mac.doFinal().copyOf(length)
    }

    /**
     * Derive a 32-byte hybrid preshared key from WireGuard key and Kyber shared secret.
     *
     * Algorithm:
     *   IKM  = wgKey (32 bytes) || kyberSecret (32 bytes)
     *   salt = 0x00 * 32
     *   PRK  = HMAC-SHA256(salt, IKM)
     *   OKM  = HMAC-SHA256(PRK, "zipminator-pq-wireguard" || 0x01)[0:32]
     *
     * @param wireGuardKey  32-byte WireGuard preshared key (or zero key for initial derivation)
     * @param kyberSecret   32-byte Kyber768 shared secret
     * @return 32-byte hybrid key to use as the new WireGuard preshared key
     */
    fun deriveHybridKey(wireGuardKey: ByteArray, kyberSecret: ByteArray): ByteArray {
        require(wireGuardKey.size == 32) { "wireGuardKey must be 32 bytes" }
        require(kyberSecret.size == 32) { "kyberSecret must be 32 bytes" }

        // IKM = wgKey || kyberSecret
        val ikm = ByteArray(64)
        System.arraycopy(wireGuardKey, 0, ikm, 0, 32)
        System.arraycopy(kyberSecret, 0, ikm, 32, 32)

        val salt = ByteArray(32) { 0 }  // 32 zero bytes
        val info = HKDF_INFO.toByteArray(Charsets.UTF_8)

        val prk = hkdfExtract(salt, ikm)
        val okm = hkdfExpand(prk, info, 32)

        Arrays.fill(ikm, 0)
        Arrays.fill(prk, 0)

        return okm
    }

    // -------------------------------------------------------------------------
    // Wire framing helpers
    // -------------------------------------------------------------------------

    /**
     * Build a framed Kyber message.
     * Frame: [type:1][length:2 big-endian][payload:N]
     */
    private fun buildFrame(type: Byte, payload: ByteArray): ByteArray {
        val buf = ByteBuffer.allocate(3 + payload.size).order(ByteOrder.BIG_ENDIAN)
        buf.put(type)
        buf.putShort(payload.size.toShort())
        buf.put(payload)
        return buf.array()
    }

    /**
     * Parse a framed message received over the tunnel.
     * @return Pair(type, payload) or null if frame is malformed.
     */
    private fun parseFrame(data: ByteArray, length: Int): Pair<Byte, ByteArray>? {
        if (length < 3) return null
        val buf = ByteBuffer.wrap(data, 0, length).order(ByteOrder.BIG_ENDIAN)
        val type = buf.get()
        val payloadLen = buf.short.toInt() and 0xFFFF
        if (payloadLen > length - 3) return null
        val payload = ByteArray(payloadLen)
        buf.get(payload)
        return Pair(type, payload)
    }

    // -------------------------------------------------------------------------
    // Kyber rekey over tunnel
    // -------------------------------------------------------------------------

    /**
     * Perform a Kyber768 key exchange as the initiator over an already-established WireGuard
     * tunnel represented by [tunnel] (a UDP socket connected to the server).
     *
     * Protocol (initiator side):
     *   1. Generate Kyber keypair
     *   2. Send MSG_TYPE_PK frame containing public key
     *   3. Receive MSG_TYPE_CT frame containing ciphertext from responder
     *   4. Decapsulate to get shared secret
     *   5. Derive hybrid key via HKDF
     *   6. Zeroize all intermediate key material
     *
     * @param tunnel   Connected UDP socket over the WireGuard tunnel (already established)
     * @param currentWgPsk  Current 32-byte WireGuard preshared key (may be all-zero for first rekey)
     * @return [HybridKey] — caller must call [HybridKey.destroy] when done
     */
    fun performKyberRekey(tunnel: DatagramSocket, currentWgPsk: ByteArray = ByteArray(32)): HybridKey {
        require(currentWgPsk.size == 32) { "currentWgPsk must be 32 bytes" }

        tunnel.soTimeout = SOCKET_TIMEOUT_MS

        // Step 1: Generate Kyber keypair
        val keypair = KyberJNI.generateKeypair()

        try {
            // Step 2: Send public key to responder
            val pkFrame = buildFrame(MSG_TYPE_PK, keypair.publicKey)
            tunnel.send(DatagramPacket(pkFrame, pkFrame.size))

            // Step 3: Receive ciphertext from responder
            val recvBuf = ByteArray(MAX_DGRAM_SIZE)
            val recvPacket = DatagramPacket(recvBuf, recvBuf.size)
            tunnel.receive(recvPacket)

            val frame = parseFrame(recvBuf, recvPacket.length)
                ?: throw IllegalStateException("Received malformed frame from server")

            val (type, payload) = frame
            if (type != MSG_TYPE_CT) {
                throw IllegalStateException(
                    "Expected MSG_TYPE_CT (0x02), got 0x${type.toInt().and(0xFF).toString(16)}"
                )
            }

            // Step 4: Decapsulate to recover shared secret
            val kyberSecret = KyberJNI.decapsulate(payload, keypair.secretKey)

            // Step 5: Derive hybrid key
            val hybridKeyBytes = deriveHybridKey(currentWgPsk, kyberSecret)

            val result = HybridKey(
                wireGuardKey = currentWgPsk.copyOf(),
                kyberSecret = kyberSecret,
                hybridKey = hybridKeyBytes
            )

            // Step 6: Zeroize intermediates
            Arrays.fill(kyberSecret, 0)

            return result

        } finally {
            keypair.destroy()
        }
    }
}
