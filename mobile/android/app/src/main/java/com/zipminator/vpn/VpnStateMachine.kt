package com.zipminator.vpn

enum class VpnState { DISCONNECTED, CONNECTING, CONNECTED, REKEYING, ERROR }

/**
 * Thread-safe state machine for the Zipminator VPN lifecycle.
 *
 * Valid transitions:
 *   DISCONNECTED -> CONNECTING
 *   CONNECTING   -> CONNECTED | ERROR | DISCONNECTED
 *   CONNECTED    -> REKEYING | DISCONNECTED | ERROR
 *   REKEYING     -> CONNECTED | ERROR | DISCONNECTED
 *   ERROR        -> CONNECTING | DISCONNECTED
 */
class VpnStateMachine {

    @Volatile
    var state: VpnState = VpnState.DISCONNECTED
        private set

    /** Callback invoked on the calling thread whenever state changes. */
    var listener: ((VpnState) -> Unit)? = null

    private val validTransitions: Map<VpnState, Set<VpnState>> = mapOf(
        VpnState.DISCONNECTED to setOf(VpnState.CONNECTING),
        VpnState.CONNECTING to setOf(VpnState.CONNECTED, VpnState.ERROR, VpnState.DISCONNECTED),
        VpnState.CONNECTED to setOf(VpnState.REKEYING, VpnState.DISCONNECTED, VpnState.ERROR),
        VpnState.REKEYING to setOf(VpnState.CONNECTED, VpnState.ERROR, VpnState.DISCONNECTED),
        VpnState.ERROR to setOf(VpnState.CONNECTING, VpnState.DISCONNECTED)
    )

    /**
     * Attempt a state transition.
     * @return true if the transition was accepted, false if it was invalid.
     */
    @Synchronized
    fun transition(to: VpnState): Boolean {
        val allowed = validTransitions[state] ?: return false
        if (to !in allowed) return false
        state = to
        listener?.invoke(to)
        return true
    }

    /** Force-reset to DISCONNECTED (use only in teardown / tests). */
    @Synchronized
    fun reset() {
        state = VpnState.DISCONNECTED
        listener?.invoke(VpnState.DISCONNECTED)
    }

    override fun toString(): String = "VpnStateMachine(state=$state)"
}
