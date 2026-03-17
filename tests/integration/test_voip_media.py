"""Integration tests for PQC-encrypted voicemail (Pillar 3: Quantum VoIP)."""

from __future__ import annotations

import os
import tempfile

import pytest


class TestVoicemailRecordAndPlay:
    """Round-trip encryption/decryption of voicemail files."""

    def test_basic_record_and_play(self):
        from zipminator.voip.voicemail import play_voicemail, record_voicemail

        frames = [bytes([i] * 160) for i in range(10)]
        secret = bytes(range(32))
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pqvm") as f:
            path = f.name
        try:
            record_voicemail(path, frames, secret)
            assert os.path.exists(path)

            # Verify magic bytes
            with open(path, "rb") as f:
                assert f.read(4) == b"PQVM"

            audio = play_voicemail(path, secret)
            assert audio == b"".join(frames)
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_empty_frames(self):
        from zipminator.voip.voicemail import play_voicemail, record_voicemail

        secret = os.urandom(32)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pqvm") as f:
            path = f.name
        try:
            record_voicemail(path, [], secret)
            audio = play_voicemail(path, secret)
            assert audio == b""
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_wrong_key_fails(self):
        from cryptography.exceptions import InvalidTag

        from zipminator.voip.voicemail import play_voicemail, record_voicemail

        frames = [b"secret audio data"]
        key1 = bytes([1] * 32)
        key2 = bytes([2] * 32)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pqvm") as f:
            path = f.name
        try:
            record_voicemail(path, frames, key1)
            with pytest.raises(InvalidTag):
                play_voicemail(path, key2)
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_bad_magic_raises(self):
        from zipminator.voip.voicemail import play_voicemail

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pqvm") as f:
            f.write(b"BAAD" + b"\x00" * 28)
            path = f.name
        try:
            with pytest.raises(ValueError, match="Not a PQC voicemail"):
                play_voicemail(path, bytes(32))
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_short_secret_raises(self):
        from zipminator.voip.voicemail import record_voicemail

        with pytest.raises(ValueError, match="at least 32 bytes"):
            record_voicemail("/tmp/test.pqvm", [b"data"], bytes(16))

    def test_large_voicemail(self):
        """Simulate a 30-second recording at 50 frames/sec, 160 bytes/frame."""
        from zipminator.voip.voicemail import play_voicemail, record_voicemail

        frames = [os.urandom(160) for _ in range(1500)]
        secret = os.urandom(32)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pqvm") as f:
            path = f.name
        try:
            record_voicemail(path, frames, secret)
            audio = play_voicemail(path, secret)
            assert audio == b"".join(frames)
        finally:
            if os.path.exists(path):
                os.unlink(path)
