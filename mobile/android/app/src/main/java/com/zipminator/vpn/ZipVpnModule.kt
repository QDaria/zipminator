package com.zipminator.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * ZipVpnModule — React Native NativeModule bridging JavaScript to [ZipVpnService].
 *
 * JavaScript usage:
 * ```js
 * import { NativeModules } from 'react-native';
 * const { ZipVPN } = NativeModules;
 *
 * await ZipVPN.connect({ serverEndpoint: '…', serverPublicKey: '…', clientPrivateKey: '…' });
 * await ZipVPN.disconnect();
 * const status = await ZipVPN.getStatus();    // { state: 'CONNECTED' }
 * const stats  = await ZipVPN.getStatistics(); // { bytesIn, bytesOut, connectedSince, … }
 * ```
 *
 * Events emitted to JS:
 *   "VpnStateChanged" — { state: VpnState string }
 */
class ZipVpnModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "ZipVpnModule"
        private const val VPN_PERMISSION_REQUEST_CODE = 0x5A50   // "ZP" in hex
        private const val EVENT_STATE_CHANGED = "VpnStateChanged"
    }

    // Promise to resolve/reject after VPN permission dialog
    private var pendingConnectPromise: Promise? = null
    private var pendingConnectConfig: ReadableMap? = null

    // Connected timestamp for statistics
    private var connectedSince: Long = 0L
    private var bytesIn: Long = 0L
    private var bytesOut: Long = 0L

    private val activityEventListener: ActivityEventListener =
        object : BaseActivityEventListener() {
            override fun onActivityResult(
                activity: Activity?,
                requestCode: Int,
                resultCode: Int,
                data: Intent?
            ) {
                if (requestCode == VPN_PERMISSION_REQUEST_CODE) {
                    handleVpnPermissionResult(resultCode)
                }
            }
        }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = "ZipVPN"

    // -------------------------------------------------------------------------
    // React Methods
    // -------------------------------------------------------------------------

    /**
     * Connect to VPN with the given configuration map.
     *
     * Expected keys in [config]:
     *   serverEndpoint   (String, required)
     *   serverPort       (Int, default 51820)
     *   serverPublicKey  (String hex, required, 64 chars)
     *   clientPrivateKey (String hex, required, 64 chars)
     *   tunnelAddress    (String, default "10.14.0.2/32")
     *   dns              (Array<String>, default ["1.1.1.1"])
     *   rekeyIntervalMs  (Double, default 300000)
     *   initialPsk       (String hex, optional, 64 chars)
     */
    @ReactMethod
    fun connect(config: ReadableMap, promise: Promise) {
        try {
            validateConfig(config)
        } catch (e: IllegalArgumentException) {
            promise.reject("INVALID_CONFIG", e.message, e)
            return
        }

        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No foreground activity — cannot request VPN permission")
            return
        }

        // Check if VPN permission is already granted
        val vpnIntent = VpnService.prepare(reactContext)
        if (vpnIntent == null) {
            // Permission already granted — start service immediately
            startVpnService(config, promise)
        } else {
            // Need to show the Android VPN permission dialog
            pendingConnectPromise = promise
            pendingConnectConfig = config
            activity.startActivityForResult(vpnIntent, VPN_PERMISSION_REQUEST_CODE)
        }
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            val intent = Intent(reactContext, ZipVpnService::class.java).apply {
                action = ZipVpnService.ACTION_DISCONNECT
            }
            reactContext.startService(intent)
            emitStateChange("DISCONNECTED")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "disconnect() failed", e)
            promise.reject("DISCONNECT_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            // In a full implementation, query the running service via a bound connection.
            // For now, return the module-level cached state.
            val result = Arguments.createMap().apply {
                putString("state", currentVpnState())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("STATUS_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun getStatistics(promise: Promise) {
        try {
            val now = System.currentTimeMillis()
            val uptime = if (connectedSince > 0) now - connectedSince else 0L

            val result = Arguments.createMap().apply {
                putDouble("bytesIn", bytesIn.toDouble())
                putDouble("bytesOut", bytesOut.toDouble())
                putDouble("connectedSince", connectedSince.toDouble())
                putDouble("uptimeMs", uptime.toDouble())
                putString("state", currentVpnState())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("STATS_FAILED", e.message, e)
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private fun handleVpnPermissionResult(resultCode: Int) {
        val promise = pendingConnectPromise
        val config = pendingConnectConfig

        pendingConnectPromise = null
        pendingConnectConfig = null

        if (resultCode == Activity.RESULT_OK) {
            if (promise != null && config != null) {
                startVpnService(config, promise)
            } else {
                Log.w(TAG, "VPN permission granted but no pending promise/config")
            }
        } else {
            promise?.reject(
                "PERMISSION_DENIED",
                "User denied VPN permission request"
            )
        }
    }

    private fun startVpnService(config: ReadableMap, promise: Promise) {
        try {
            val intent = buildServiceIntent(config)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            connectedSince = System.currentTimeMillis()
            emitStateChange("CONNECTING")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start VPN service", e)
            promise.reject("START_FAILED", e.message, e)
        }
    }

    private fun buildServiceIntent(config: ReadableMap): Intent {
        return Intent(reactContext, ZipVpnService::class.java).apply {
            action = ZipVpnService.ACTION_CONNECT
            putExtra(ZipVpnService.EXTRA_SERVER_ENDPOINT,
                config.getString("serverEndpoint"))
            putExtra(ZipVpnService.EXTRA_SERVER_PORT,
                if (config.hasKey("serverPort")) config.getInt("serverPort") else 51820)
            putExtra(ZipVpnService.EXTRA_SERVER_PUBLIC_KEY,
                config.getString("serverPublicKey"))
            putExtra(ZipVpnService.EXTRA_CLIENT_PRIVATE_KEY,
                config.getString("clientPrivateKey"))
            putExtra(ZipVpnService.EXTRA_TUNNEL_ADDRESS,
                if (config.hasKey("tunnelAddress")) config.getString("tunnelAddress") else "10.14.0.2/32")
            putExtra(ZipVpnService.EXTRA_REKEY_INTERVAL_MS,
                if (config.hasKey("rekeyIntervalMs"))
                    config.getDouble("rekeyIntervalMs").toLong()
                else
                    5 * 60 * 1000L)
            if (config.hasKey("initialPsk")) {
                putExtra(ZipVpnService.EXTRA_INITIAL_PSK, config.getString("initialPsk"))
            }

            // DNS array
            val dnsList = if (config.hasKey("dns")) {
                val arr = config.getArray("dns")
                ArrayList<String>().also { list ->
                    if (arr != null) {
                        for (i in 0 until arr.size()) list.add(arr.getString(i))
                    }
                }
            } else {
                arrayListOf("1.1.1.1")
            }
            putStringArrayListExtra(ZipVpnService.EXTRA_DNS, dnsList)
        }
    }

    private fun validateConfig(config: ReadableMap) {
        val serverEndpoint = config.getString("serverEndpoint")
        require(!serverEndpoint.isNullOrBlank()) { "serverEndpoint is required" }

        val serverPk = config.getString("serverPublicKey")
        require(!serverPk.isNullOrBlank() && serverPk.length == 64) {
            "serverPublicKey must be a 64-character hex string (32 bytes)"
        }
        require(serverPk.matches(Regex("[0-9a-fA-F]+"))) {
            "serverPublicKey must contain only hex characters"
        }

        val clientSk = config.getString("clientPrivateKey")
        require(!clientSk.isNullOrBlank() && clientSk.length == 64) {
            "clientPrivateKey must be a 64-character hex string (32 bytes)"
        }
        require(clientSk.matches(Regex("[0-9a-fA-F]+"))) {
            "clientPrivateKey must contain only hex characters"
        }

        if (config.hasKey("serverPort")) {
            val port = config.getInt("serverPort")
            require(port in 1..65535) { "serverPort must be in range 1–65535, got $port" }
        }

        if (config.hasKey("rekeyIntervalMs")) {
            val rekey = config.getDouble("rekeyIntervalMs").toLong()
            require(rekey >= 60_000L) {
                "rekeyIntervalMs must be >= 60000 (1 minute), got $rekey"
            }
        }

        if (config.hasKey("initialPsk")) {
            val psk = config.getString("initialPsk")
            require(psk != null && psk.length == 64) {
                "initialPsk must be a 64-character hex string (32 bytes)"
            }
        }
    }

    private fun currentVpnState(): String {
        // In a production implementation this would query the bound service.
        // Simplified: return based on connectedSince
        return if (connectedSince > 0) "CONNECTED" else "DISCONNECTED"
    }

    private fun emitStateChange(state: String) {
        if (reactContext.hasActiveCatalystInstance()) {
            val params = Arguments.createMap().apply {
                putString("state", state)
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_STATE_CHANGED, params)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in event emitter — no-op
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in event emitter — no-op
    }
}
