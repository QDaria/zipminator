package com.zipminator.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.VpnService
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import java.net.DatagramSocket
import java.net.InetSocketAddress
import java.util.Arrays
import java.util.concurrent.atomic.AtomicBoolean

/**
 * ZipVpnService — Android VpnService implementation for Zipminator PQ-WireGuard.
 *
 * Lifecycle:
 *   onStartCommand  -> parse config, start foreground, call connect()
 *   connect()       -> establishTunnel(), startRekeyScheduler(), register network callback
 *   onDestroy       -> teardown(), zeroize keys
 *
 * Key zeroization: all ByteArrays holding key material are zeroed with Arrays.fill before
 * the service exits.
 */
class ZipVpnService : VpnService() {

    companion object {
        private const val TAG = "ZipVpnService"
        private const val NOTIFICATION_ID = 1337
        private const val CHANNEL_ID = "zipminator_vpn"
        private const val CHANNEL_NAME = "Zipminator Q-VPN"

        // Intent extras
        const val EXTRA_SERVER_ENDPOINT = "server_endpoint"
        const val EXTRA_SERVER_PORT = "server_port"
        const val EXTRA_SERVER_PUBLIC_KEY = "server_public_key"
        const val EXTRA_CLIENT_PRIVATE_KEY = "client_private_key"
        const val EXTRA_TUNNEL_ADDRESS = "tunnel_address"
        const val EXTRA_DNS = "dns"
        const val EXTRA_REKEY_INTERVAL_MS = "rekey_interval_ms"
        const val EXTRA_INITIAL_PSK = "initial_psk"

        // Actions
        const val ACTION_CONNECT = "com.zipminator.vpn.CONNECT"
        const val ACTION_DISCONNECT = "com.zipminator.vpn.DISCONNECT"
    }

    private val stateMachine = VpnStateMachine()
    private var tunInterface: ParcelFileDescriptor? = null
    private var tunnelConfig: PQWireGuard.TunnelConfig? = null
    private var currentPsk: ByteArray = ByteArray(32)
    private var currentHybridKey: PQWireGuard.HybridKey? = null
    private var rekeySocket: DatagramSocket? = null

    private val mainHandler = Handler(Looper.getMainLooper())
    private val rekeyRunning = AtomicBoolean(false)
    private var rekeyIntervalMs: Long = 5 * 60 * 1000L

    private var connectivityManager: ConnectivityManager? = null
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            Log.d(TAG, "Network available: $network — triggering rekey")
            // Rebind socket to new network and schedule an immediate rekey
            bindSocket(network)
            scheduleRekey(delayMs = 0L)
        }

        override fun onLost(network: Network) {
            Log.w(TAG, "Network lost: $network")
            if (stateMachine.state == VpnState.CONNECTED || stateMachine.state == VpnState.REKEYING) {
                stateMachine.transition(VpnState.ERROR)
            }
        }
    }

    // -------------------------------------------------------------------------
    // Service lifecycle
    // -------------------------------------------------------------------------

    override fun onBind(intent: Intent?): IBinder? = super.onBind(intent)

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_CONNECT

        return when (action) {
            ACTION_DISCONNECT -> {
                teardown()
                START_NOT_STICKY
            }
            else -> {
                val config = buildConfigFromIntent(intent)
                if (config != null) {
                    startForeground(NOTIFICATION_ID, buildNotification("Connecting…"))
                    connect(config)
                } else {
                    Log.e(TAG, "onStartCommand: invalid or missing config in intent")
                    stopSelf()
                }
                START_STICKY
            }
        }
    }

    override fun onDestroy() {
        Log.d(TAG, "onDestroy — tearing down VPN")
        teardown()
        super.onDestroy()
    }

    // -------------------------------------------------------------------------
    // Connection management
    // -------------------------------------------------------------------------

    private fun connect(config: PQWireGuard.TunnelConfig) {
        if (!stateMachine.transition(VpnState.CONNECTING)) {
            Log.w(TAG, "connect() called in state ${stateMachine.state}, ignoring")
            return
        }

        stateMachine.listener = { newState ->
            updateNotification(newState)
        }

        tunnelConfig = config
        rekeyIntervalMs = config.rekeyIntervalMs

        try {
            val fd = establishTunnel(config)
            tunInterface = fd

            stateMachine.transition(VpnState.CONNECTED)

            registerNetworkCallback()
            scheduleRekey(delayMs = config.rekeyIntervalMs)

            Log.i(TAG, "VPN connected — tunnel fd=${fd.fd}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to establish tunnel", e)
            stateMachine.transition(VpnState.ERROR)
            teardown()
        }
    }

    /**
     * Build the tun interface using Android's VpnService.Builder.
     */
    private fun establishTunnel(config: PQWireGuard.TunnelConfig): ParcelFileDescriptor {
        val builder = Builder()
            .setSession(CHANNEL_NAME)
            .setMtu(1280)   // Conservative MTU for PQ-encapsulated packets

        // Parse tunnel address (supports "10.14.0.2/32" or "10.14.0.2")
        val (addr, prefix) = parseCidr(config.tunnelAddress)
        builder.addAddress(addr, prefix)
        builder.addRoute("0.0.0.0", 0)   // Route all traffic through VPN
        builder.addRoute("::", 0)         // IPv6

        config.dns.forEach { builder.addDnsServer(it) }

        // Prevent VPN traffic from looping back into itself
        builder.addDisallowedApplication(packageName)

        return builder.establish()
            ?: throw IllegalStateException("VpnService.Builder.establish() returned null — permission not granted")
    }

    // -------------------------------------------------------------------------
    // Rekey scheduler
    // -------------------------------------------------------------------------

    private val rekeyTask = object : Runnable {
        override fun run() {
            if (stateMachine.state != VpnState.CONNECTED) return

            Log.d(TAG, "Scheduled PQ rekey triggered")
            performRekey()

            // Reschedule
            if (rekeyRunning.get()) {
                mainHandler.postDelayed(this, rekeyIntervalMs)
            }
        }
    }

    private fun scheduleRekey(delayMs: Long = rekeyIntervalMs) {
        mainHandler.removeCallbacks(rekeyTask)
        rekeyRunning.set(true)
        mainHandler.postDelayed(rekeyTask, delayMs)
    }

    private fun performRekey() {
        val config = tunnelConfig ?: return

        if (!stateMachine.transition(VpnState.REKEYING)) {
            Log.w(TAG, "Cannot rekey in state ${stateMachine.state}")
            return
        }

        Thread {
            try {
                val socket = getOrCreateRekeySocket(config)
                val newHybridKey = PQWireGuard.performKyberRekey(socket, currentPsk)

                // Zeroize old key material
                currentHybridKey?.destroy()
                Arrays.fill(currentPsk, 0)

                currentHybridKey = newHybridKey
                currentPsk = newHybridKey.hybridKey.copyOf()

                Log.i(TAG, "PQ rekey successful — new hybrid PSK derived")
                stateMachine.transition(VpnState.CONNECTED)

            } catch (e: Exception) {
                Log.e(TAG, "PQ rekey failed", e)
                stateMachine.transition(VpnState.ERROR)
            }
        }.apply {
            name = "zipminator-rekey"
            isDaemon = true
            start()
        }
    }

    private fun getOrCreateRekeySocket(config: PQWireGuard.TunnelConfig): DatagramSocket {
        rekeySocket?.let { if (!it.isClosed) return it }
        val socket = DatagramSocket()
        protect(socket)  // Bypass VPN for the rekey socket itself
        socket.connect(InetSocketAddress(config.serverEndpoint, config.serverPort))
        rekeySocket = socket
        return socket
    }

    private fun bindSocket(network: Network) {
        rekeySocket?.let { socket ->
            try {
                network.bindSocket(socket)
                Log.d(TAG, "Rekey socket rebound to network $network")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to rebind socket to network $network", e)
                // Close and recreate on next rekey
                socket.close()
                rekeySocket = null
            }
        }
    }

    // -------------------------------------------------------------------------
    // Connectivity monitoring
    // -------------------------------------------------------------------------

    private fun registerNetworkCallback() {
        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager?.registerNetworkCallback(request, networkCallback)
    }

    private fun unregisterNetworkCallback() {
        try {
            connectivityManager?.unregisterNetworkCallback(networkCallback)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to unregister network callback", e)
        }
        connectivityManager = null
    }

    // -------------------------------------------------------------------------
    // Teardown and key zeroization
    // -------------------------------------------------------------------------

    private fun teardown() {
        Log.d(TAG, "teardown() called — zeroizing keys and closing interfaces")

        // Stop rekey scheduler
        rekeyRunning.set(false)
        mainHandler.removeCallbacks(rekeyTask)

        // Unregister network callback
        unregisterNetworkCallback()

        // Close rekey socket
        try { rekeySocket?.close() } catch (e: Exception) { /* ignore */ }
        rekeySocket = null

        // Zeroize key material — CRITICAL: must happen before closing file descriptors
        currentHybridKey?.destroy()
        currentHybridKey = null
        Arrays.fill(currentPsk, 0)

        // Zeroize tunnel config keys
        tunnelConfig?.destroy()
        tunnelConfig = null

        // Close tun interface
        try {
            tunInterface?.close()
        } catch (e: Exception) {
            Log.w(TAG, "Error closing tun interface", e)
        }
        tunInterface = null

        // Transition to disconnected
        stateMachine.transition(VpnState.DISCONNECTED)

        stopForeground(true)
        stopSelf()
    }

    // -------------------------------------------------------------------------
    // Notification
    // -------------------------------------------------------------------------

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Zipminator post-quantum VPN status"
                setShowBadge(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(statusText: String): Notification {
        val disconnectIntent = Intent(this, ZipVpnService::class.java).apply {
            action = ACTION_DISCONNECT
        }
        val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val disconnectPi = PendingIntent.getService(this, 0, disconnectIntent, pendingFlags)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Zipminator Q-VPN")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Disconnect", disconnectPi)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(state: VpnState) {
        val text = when (state) {
            VpnState.DISCONNECTED -> "Disconnected"
            VpnState.CONNECTING -> "Connecting…"
            VpnState.CONNECTED -> "Protected with PQ-WireGuard"
            VpnState.REKEYING -> "Re-keying…"
            VpnState.ERROR -> "Connection error"
        }
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIFICATION_ID, buildNotification(text))
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private fun buildConfigFromIntent(intent: Intent?): PQWireGuard.TunnelConfig? {
        if (intent == null) return null
        return try {
            val serverEndpoint = intent.getStringExtra(EXTRA_SERVER_ENDPOINT) ?: return null
            val serverPort = intent.getIntExtra(EXTRA_SERVER_PORT, 51820)
            val serverPkHex = intent.getStringExtra(EXTRA_SERVER_PUBLIC_KEY) ?: return null
            val clientSkHex = intent.getStringExtra(EXTRA_CLIENT_PRIVATE_KEY) ?: return null
            val tunnelAddr = intent.getStringExtra(EXTRA_TUNNEL_ADDRESS) ?: "10.14.0.2/32"
            val dns = intent.getStringArrayListExtra(EXTRA_DNS) ?: arrayListOf("1.1.1.1")
            val rekeyMs = intent.getLongExtra(EXTRA_REKEY_INTERVAL_MS, 5 * 60 * 1000L)
            val initialPskHex = intent.getStringExtra(EXTRA_INITIAL_PSK)

            val initialPsk = if (initialPskHex != null) hexToBytes(initialPskHex) else ByteArray(32)
            currentPsk = initialPsk.copyOf()

            PQWireGuard.TunnelConfig(
                serverEndpoint = serverEndpoint,
                serverPort = serverPort,
                serverPublicKey = hexToBytes(serverPkHex),
                clientPrivateKey = hexToBytes(clientSkHex),
                tunnelAddress = tunnelAddr,
                dns = dns,
                rekeyIntervalMs = rekeyMs
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse config from intent", e)
            null
        }
    }

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
