"""Tests for the full offline queue flow.

Simulates: user A sends to offline user B, B reconnects and drains queued messages.
"""

import pytest

from api.src.db.message_store import MessageStore


@pytest.fixture
def store():
    s = MessageStore(db_path=":memory:")
    yield s
    s.close()


class TestOfflineQueueFlow:
    def test_full_offline_send_reconnect_flow(self, store: MessageStore):
        """User A sends while B is offline. B reconnects and gets messages."""
        # A sends 3 messages to offline B
        store.store("conv-ab", "alice", "bob", b"hey bob 1")
        store.store("conv-ab", "alice", "bob", b"hey bob 2")
        store.store("conv-ab", "alice", "bob", b"hey bob 3")

        # B has no active connection; messages queue up
        queued = store.get_undelivered("bob")
        assert len(queued) == 3

        # B reconnects: drain queue
        for msg in queued:
            store.mark_delivered(msg["id"])

        # Queue is now empty
        assert store.get_undelivered("bob") == []

        # But the conversation history is still intact
        history = store.get_messages("conv-ab")
        assert len(history) == 3

    def test_multiple_senders_queued(self, store: MessageStore):
        """Multiple users send to offline bob."""
        store.store("conv-ab", "alice", "bob", b"from alice")
        store.store("conv-cb", "charlie", "bob", b"from charlie")
        store.store("conv-db", "dave", "bob", b"from dave")

        queued = store.get_undelivered("bob")
        assert len(queued) == 3
        senders = {m["sender_id"] for m in queued}
        assert senders == {"alice", "charlie", "dave"}

    def test_queued_messages_in_chronological_order(self, store: MessageStore):
        """Queued messages must be delivered in send order."""
        for i in range(5):
            store.store("conv-ab", "alice", "bob", f"msg-{i}".encode())

        queued = store.get_undelivered("bob")
        payloads = [m["ciphertext"] for m in queued]
        assert payloads == [f"msg-{i}".encode() for i in range(5)]

    def test_delivered_messages_not_requeued(self, store: MessageStore):
        """Once marked delivered, messages don't reappear in the queue."""
        msg_id = store.store("conv-ab", "alice", "bob", b"one-time")
        store.mark_delivered(msg_id)

        # Send another
        store.store("conv-ab", "alice", "bob", b"new msg")

        queued = store.get_undelivered("bob")
        assert len(queued) == 1
        assert queued[0]["ciphertext"] == b"new msg"

    def test_mark_delivered_idempotent(self, store: MessageStore):
        """Marking an already-delivered message should not raise."""
        msg_id = store.store("conv-ab", "alice", "bob", b"data")
        store.mark_delivered(msg_id)
        store.mark_delivered(msg_id)  # Should not raise
        assert store.get_undelivered("bob") == []

    def test_partial_drain(self, store: MessageStore):
        """Drain only some messages, rest remain queued."""
        ids = []
        for i in range(4):
            ids.append(store.store("conv-ab", "alice", "bob", f"m{i}".encode()))

        # Deliver first two only
        store.mark_delivered(ids[0])
        store.mark_delivered(ids[1])

        remaining = store.get_undelivered("bob")
        assert len(remaining) == 2
        assert remaining[0]["ciphertext"] == b"m2"
        assert remaining[1]["ciphertext"] == b"m3"
