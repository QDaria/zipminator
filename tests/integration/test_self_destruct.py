"""Test self-destruct wipe roundtrip."""
import os
import tempfile
import time

import pytest


def test_self_destruct_3pass_wipe():
    """Create temp file, invoke self-destruct, verify wiped."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".vault") as f:
        f.write(b"SENSITIVE_DATA" * 100)
        path = f.name

    assert os.path.exists(path)

    from zipminator.crypto.self_destruct import secure_delete

    secure_delete(path, passes=3)
    assert not os.path.exists(path), "File should be deleted after 3-pass wipe"


def test_self_destruct_timer_expiry():
    """Verify timer-based auto-destruct."""
    from zipminator.crypto.self_destruct import SelfDestructScheduler

    scheduler = SelfDestructScheduler()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".vault") as f:
        f.write(b"TIMED_SECRET")
        path = f.name

    scheduler.schedule(path, delay_seconds=1, method="overwrite_3pass")
    time.sleep(2)
    scheduler.check_expired()
    assert not os.path.exists(path), "File should be auto-destroyed after timer expiry"


def test_self_destruct_scheduler_not_yet_expired():
    """Verify scheduler does NOT delete files before expiry."""
    from zipminator.crypto.self_destruct import SelfDestructScheduler

    scheduler = SelfDestructScheduler()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".vault") as f:
        f.write(b"NOT_YET")
        path = f.name

    try:
        scheduler.schedule(path, delay_seconds=3600, method="overwrite_3pass")
        scheduler.check_expired()
        assert os.path.exists(path), "File should still exist before expiry"
    finally:
        # Cleanup
        if os.path.exists(path):
            os.unlink(path)


def test_self_destruct_already_deleted():
    """secure_delete on missing file should raise FileNotFoundError."""
    from zipminator.crypto.self_destruct import secure_delete

    with pytest.raises(FileNotFoundError):
        secure_delete("/tmp/nonexistent_vault_file_12345.vault", passes=3)
