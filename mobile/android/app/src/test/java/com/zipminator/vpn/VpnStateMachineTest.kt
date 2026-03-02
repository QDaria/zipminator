package com.zipminator.vpn

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

class VpnStateMachineTest {

    private lateinit var sm: VpnStateMachine

    @Before
    fun setUp() {
        sm = VpnStateMachine()
    }

    // -------------------------------------------------------------------------
    // Initial state
    // -------------------------------------------------------------------------

    @Test
    fun `initial state is DISCONNECTED`() {
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    // -------------------------------------------------------------------------
    // Valid transitions
    // -------------------------------------------------------------------------

    @Test
    fun `DISCONNECTED to CONNECTING is valid`() {
        assertTrue(sm.transition(VpnState.CONNECTING))
        assertEquals(VpnState.CONNECTING, sm.state)
    }

    @Test
    fun `CONNECTING to CONNECTED is valid`() {
        sm.transition(VpnState.CONNECTING)
        assertTrue(sm.transition(VpnState.CONNECTED))
        assertEquals(VpnState.CONNECTED, sm.state)
    }

    @Test
    fun `CONNECTING to ERROR is valid`() {
        sm.transition(VpnState.CONNECTING)
        assertTrue(sm.transition(VpnState.ERROR))
        assertEquals(VpnState.ERROR, sm.state)
    }

    @Test
    fun `CONNECTING to DISCONNECTED is valid`() {
        sm.transition(VpnState.CONNECTING)
        assertTrue(sm.transition(VpnState.DISCONNECTED))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `CONNECTED to REKEYING is valid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        assertTrue(sm.transition(VpnState.REKEYING))
        assertEquals(VpnState.REKEYING, sm.state)
    }

    @Test
    fun `CONNECTED to DISCONNECTED is valid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        assertTrue(sm.transition(VpnState.DISCONNECTED))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `CONNECTED to ERROR is valid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        assertTrue(sm.transition(VpnState.ERROR))
        assertEquals(VpnState.ERROR, sm.state)
    }

    @Test
    fun `REKEYING to CONNECTED is valid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.transition(VpnState.REKEYING)
        assertTrue(sm.transition(VpnState.CONNECTED))
        assertEquals(VpnState.CONNECTED, sm.state)
    }

    @Test
    fun `REKEYING to ERROR is valid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.transition(VpnState.REKEYING)
        assertTrue(sm.transition(VpnState.ERROR))
        assertEquals(VpnState.ERROR, sm.state)
    }

    @Test
    fun `REKEYING to DISCONNECTED is valid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.transition(VpnState.REKEYING)
        assertTrue(sm.transition(VpnState.DISCONNECTED))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `ERROR to CONNECTING is valid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.ERROR)
        assertTrue(sm.transition(VpnState.CONNECTING))
        assertEquals(VpnState.CONNECTING, sm.state)
    }

    @Test
    fun `ERROR to DISCONNECTED is valid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.ERROR)
        assertTrue(sm.transition(VpnState.DISCONNECTED))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    // -------------------------------------------------------------------------
    // Invalid transitions
    // -------------------------------------------------------------------------

    @Test
    fun `DISCONNECTED to CONNECTED is invalid`() {
        assertFalse(sm.transition(VpnState.CONNECTED))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `DISCONNECTED to REKEYING is invalid`() {
        assertFalse(sm.transition(VpnState.REKEYING))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `DISCONNECTED to ERROR is invalid`() {
        assertFalse(sm.transition(VpnState.ERROR))
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `CONNECTING to REKEYING is invalid`() {
        sm.transition(VpnState.CONNECTING)
        assertFalse(sm.transition(VpnState.REKEYING))
        assertEquals(VpnState.CONNECTING, sm.state)
    }

    @Test
    fun `CONNECTED to CONNECTING is invalid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        assertFalse(sm.transition(VpnState.CONNECTING))
        assertEquals(VpnState.CONNECTED, sm.state)
    }

    @Test
    fun `REKEYING to CONNECTING is invalid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.transition(VpnState.REKEYING)
        assertFalse(sm.transition(VpnState.CONNECTING))
        assertEquals(VpnState.REKEYING, sm.state)
    }

    @Test
    fun `ERROR to CONNECTED is invalid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.ERROR)
        assertFalse(sm.transition(VpnState.CONNECTED))
        assertEquals(VpnState.ERROR, sm.state)
    }

    @Test
    fun `ERROR to REKEYING is invalid`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.ERROR)
        assertFalse(sm.transition(VpnState.REKEYING))
        assertEquals(VpnState.ERROR, sm.state)
    }

    @Test
    fun `self-transition is invalid for CONNECTED`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        assertFalse(sm.transition(VpnState.CONNECTED))
        assertEquals(VpnState.CONNECTED, sm.state)
    }

    // -------------------------------------------------------------------------
    // Listener
    // -------------------------------------------------------------------------

    @Test
    fun `listener is invoked on valid transition`() {
        val captured = AtomicReference<VpnState>()
        sm.listener = { captured.set(it) }

        sm.transition(VpnState.CONNECTING)
        assertEquals(VpnState.CONNECTING, captured.get())
    }

    @Test
    fun `listener is NOT invoked on invalid transition`() {
        val callCount = AtomicInteger(0)
        sm.listener = { callCount.incrementAndGet() }

        sm.transition(VpnState.CONNECTED)  // invalid from DISCONNECTED
        assertEquals(0, callCount.get())
    }

    @Test
    fun `listener receives correct sequence of states`() {
        val states = mutableListOf<VpnState>()
        sm.listener = { states.add(it) }

        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.transition(VpnState.REKEYING)
        sm.transition(VpnState.CONNECTED)
        sm.transition(VpnState.DISCONNECTED)

        assertEquals(
            listOf(
                VpnState.CONNECTING,
                VpnState.CONNECTED,
                VpnState.REKEYING,
                VpnState.CONNECTED,
                VpnState.DISCONNECTED
            ),
            states
        )
    }

    // -------------------------------------------------------------------------
    // Reset
    // -------------------------------------------------------------------------

    @Test
    fun `reset returns state to DISCONNECTED`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.reset()
        assertEquals(VpnState.DISCONNECTED, sm.state)
    }

    @Test
    fun `reset notifies listener`() {
        val captured = AtomicReference<VpnState>()
        sm.listener = { captured.set(it) }

        sm.transition(VpnState.CONNECTING)
        sm.reset()

        assertEquals(VpnState.DISCONNECTED, captured.get())
    }

    @Test
    fun `after reset, normal transitions work`() {
        sm.transition(VpnState.CONNECTING)
        sm.transition(VpnState.CONNECTED)
        sm.reset()
        assertTrue(sm.transition(VpnState.CONNECTING))
        assertEquals(VpnState.CONNECTING, sm.state)
    }

    // -------------------------------------------------------------------------
    // Thread safety
    // -------------------------------------------------------------------------

    @Test
    fun `concurrent transitions are thread-safe`() {
        val threadCount = 20
        val executor = Executors.newFixedThreadPool(threadCount)
        val latch = CountDownLatch(threadCount)
        val exceptionCount = AtomicInteger(0)

        repeat(threadCount) {
            executor.submit {
                try {
                    // All threads race to transition; most will be rejected — no exception expected
                    sm.transition(VpnState.CONNECTING)
                } catch (e: Exception) {
                    exceptionCount.incrementAndGet()
                } finally {
                    latch.countDown()
                }
            }
        }

        assertTrue("Threads did not finish in time", latch.await(5, TimeUnit.SECONDS))
        executor.shutdown()

        // No exceptions should have been thrown
        assertEquals(0, exceptionCount.get())

        // State must be one of the valid states (not corrupted)
        assertTrue(sm.state in VpnState.values())
    }

    @Test
    fun `listener receives state updates without throwing in multithreaded scenario`() {
        val callCount = AtomicInteger(0)
        sm.listener = { callCount.incrementAndGet() }

        val threadCount = 10
        val executor = Executors.newFixedThreadPool(threadCount)
        val latch = CountDownLatch(threadCount)

        repeat(threadCount) {
            executor.submit {
                try {
                    sm.transition(VpnState.CONNECTING)
                    sm.transition(VpnState.CONNECTED)
                } finally {
                    latch.countDown()
                }
            }
        }

        latch.await(5, TimeUnit.SECONDS)
        executor.shutdown()

        // At minimum one CONNECTING transition must have succeeded
        assertTrue(callCount.get() > 0)
    }
}
