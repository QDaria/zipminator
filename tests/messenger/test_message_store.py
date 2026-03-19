"""Tests for MessageStore — SQLite-backed encrypted message persistence.

All messages are stored as ciphertext (bytes). The store never sees plaintext.
Uses in-memory SQLite so no external DB is needed.
"""

import time
import pytest

from api.src.db.message_store import MessageStore


@pytest.fixture
def store():
    """Fresh in-memory MessageStore for each test."""
    s = MessageStore(db_path=":memory:")
    yield s
    s.close()


# ── Basic storage ────────────────────────────────────────────────────────────

class TestStoreMessage:
    def test_store_returns_message_id(self, store: MessageStore):
        ciphertext = b"\x00\x01\x02\x03encrypted_payload"
        msg_id = store.store("conv-1", "alice", "bob", ciphertext)
        assert isinstance(msg_id, str)
        assert len(msg_id) > 0

    def test_stored_ciphertext_is_bytes(self, store: MessageStore):
        ciphertext = b"\xde\xad\xbe\xef" * 64
        store.store("conv-1", "alice", "bob", ciphertext)
        messages = store.get_messages("conv-1")
        assert len(messages) == 1
        assert messages[0]["ciphertext"] == ciphertext
        assert isinstance(messages[0]["ciphertext"], bytes)

    def test_store_never_stores_plaintext(self, store: MessageStore):
        """The store only accepts bytes; it cannot accidentally store a string."""
        with pytest.raises(TypeError):
            store.store("conv-1", "alice", "bob", "this is plaintext, not bytes")  # type: ignore

    def test_store_with_custom_ttl(self, store: MessageStore):
        ciphertext = b"\x01\x02\x03"
        msg_id = store.store("conv-1", "alice", "bob", ciphertext, ttl_seconds=3600)
        messages = store.get_messages("conv-1")
        assert len(messages) == 1
        assert messages[0]["id"] == msg_id


# ── Retrieval ────────────────────────────────────────────────────────────────

class TestGetMessages:
    def test_get_messages_by_conversation(self, store: MessageStore):
        store.store("conv-1", "alice", "bob", b"msg1")
        store.store("conv-1", "alice", "bob", b"msg2")
        store.store("conv-2", "alice", "charlie", b"msg3")

        conv1 = store.get_messages("conv-1")
        assert len(conv1) == 2

        conv2 = store.get_messages("conv-2")
        assert len(conv2) == 1

    def test_get_messages_chronological_order(self, store: MessageStore):
        store.store("conv-1", "alice", "bob", b"first")
        store.store("conv-1", "alice", "bob", b"second")
        store.store("conv-1", "alice", "bob", b"third")

        messages = store.get_messages("conv-1")
        assert [m["ciphertext"] for m in messages] == [b"first", b"second", b"third"]

    def test_get_messages_with_limit_and_offset(self, store: MessageStore):
        for i in range(10):
            store.store("conv-1", "alice", "bob", f"msg{i}".encode())

        page1 = store.get_messages("conv-1", limit=3, offset=0)
        assert len(page1) == 3
        assert page1[0]["ciphertext"] == b"msg0"

        page2 = store.get_messages("conv-1", limit=3, offset=3)
        assert len(page2) == 3
        assert page2[0]["ciphertext"] == b"msg3"

    def test_get_messages_empty_conversation(self, store: MessageStore):
        messages = store.get_messages("nonexistent")
        assert messages == []

    def test_message_fields_present(self, store: MessageStore):
        store.store("conv-1", "alice", "bob", b"\x01\x02")
        msg = store.get_messages("conv-1")[0]
        assert "id" in msg
        assert "conversation_id" in msg
        assert "sender_id" in msg
        assert "recipient_id" in msg
        assert "ciphertext" in msg
        assert "timestamp" in msg
        assert "delivered" in msg


# ── Offline queue ────────────────────────────────────────────────────────────

class TestOfflineQueue:
    def test_undelivered_messages(self, store: MessageStore):
        store.store("conv-1", "alice", "bob", b"hello_offline")
        undelivered = store.get_undelivered("bob")
        assert len(undelivered) == 1
        assert undelivered[0]["ciphertext"] == b"hello_offline"

    def test_mark_delivered(self, store: MessageStore):
        msg_id = store.store("conv-1", "alice", "bob", b"deliver_me")
        assert len(store.get_undelivered("bob")) == 1

        store.mark_delivered(msg_id)
        assert len(store.get_undelivered("bob")) == 0

    def test_undelivered_only_for_recipient(self, store: MessageStore):
        store.store("conv-1", "alice", "bob", b"for_bob")
        store.store("conv-2", "alice", "charlie", b"for_charlie")

        bob_msgs = store.get_undelivered("bob")
        assert len(bob_msgs) == 1
        assert bob_msgs[0]["recipient_id"] == "bob"

        charlie_msgs = store.get_undelivered("charlie")
        assert len(charlie_msgs) == 1
        assert charlie_msgs[0]["recipient_id"] == "charlie"

    def test_undelivered_returns_chronological_order(self, store: MessageStore):
        store.store("conv-1", "alice", "bob", b"first")
        store.store("conv-1", "alice", "bob", b"second")
        store.store("conv-1", "alice", "bob", b"third")

        undelivered = store.get_undelivered("bob")
        assert [m["ciphertext"] for m in undelivered] == [b"first", b"second", b"third"]


# ── TTL cleanup ──────────────────────────────────────────────────────────────

class TestTTLCleanup:
    def test_cleanup_expired_messages(self, store: MessageStore):
        # Store with 1-second TTL
        store.store("conv-1", "alice", "bob", b"ephemeral", ttl_seconds=1)
        store.store("conv-1", "alice", "bob", b"permanent", ttl_seconds=86400)

        # Not expired yet
        assert store.cleanup_expired() == 0
        assert len(store.get_messages("conv-1")) == 2

        # Wait for expiry
        time.sleep(1.1)

        purged = store.cleanup_expired()
        assert purged == 1

        remaining = store.get_messages("conv-1")
        assert len(remaining) == 1
        assert remaining[0]["ciphertext"] == b"permanent"

    def test_cleanup_returns_purge_count(self, store: MessageStore):
        for i in range(5):
            store.store("conv-1", "alice", "bob", f"msg{i}".encode(), ttl_seconds=1)

        time.sleep(1.1)
        assert store.cleanup_expired() == 5

    def test_cleanup_no_expired(self, store: MessageStore):
        store.store("conv-1", "alice", "bob", b"fresh", ttl_seconds=86400)
        assert store.cleanup_expired() == 0


# ── Group fanout ─────────────────────────────────────────────────────────────

class TestGroupFanout:
    def test_fanout_stores_for_each_recipient(self, store: MessageStore):
        recipients = ["bob", "charlie", "dave"]
        msg_ids = store.group_fanout("group-1", "alice", recipients, b"group_msg")
        assert len(msg_ids) == 3

        for recipient in recipients:
            undelivered = store.get_undelivered(recipient)
            assert len(undelivered) == 1
            assert undelivered[0]["ciphertext"] == b"group_msg"
            assert undelivered[0]["sender_id"] == "alice"

    def test_fanout_returns_unique_ids(self, store: MessageStore):
        msg_ids = store.group_fanout("group-1", "alice", ["bob", "charlie"], b"msg")
        assert len(set(msg_ids)) == 2

    def test_fanout_empty_recipients(self, store: MessageStore):
        msg_ids = store.group_fanout("group-1", "alice", [], b"msg")
        assert msg_ids == []


# ── Persistence across reconnect ─────────────────────────────────────────────

class TestPersistenceAcrossReconnect:
    def test_messages_survive_close_and_reopen(self, tmp_path):
        db_file = str(tmp_path / "test.db")

        # Session 1: store messages
        store1 = MessageStore(db_path=db_file)
        store1.store("conv-1", "alice", "bob", b"persistent_msg")
        store1.close()

        # Session 2: reopen and verify
        store2 = MessageStore(db_path=db_file)
        messages = store2.get_messages("conv-1")
        assert len(messages) == 1
        assert messages[0]["ciphertext"] == b"persistent_msg"
        store2.close()

    def test_offline_queue_survives_restart(self, tmp_path):
        db_file = str(tmp_path / "test.db")

        store1 = MessageStore(db_path=db_file)
        store1.store("conv-1", "alice", "bob", b"queued_msg")
        store1.close()

        store2 = MessageStore(db_path=db_file)
        undelivered = store2.get_undelivered("bob")
        assert len(undelivered) == 1
        assert undelivered[0]["ciphertext"] == b"queued_msg"
        store2.close()
