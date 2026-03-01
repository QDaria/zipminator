import pytest
import sys
import json
from pathlib import Path
from fastapi.testclient import TestClient

# Add src to path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

from zipminator.messenger.signaling import app

def test_signaling_root():
    client = TestClient(app)
    # Just checking if the app loads; FastAPI doesn't have a default route here
    response = client.get("/")
    assert response.status_code == 404

def test_websocket_signaling():
    client = TestClient(app)
    with client.websocket_connect("/ws/user1") as ws1:
        with client.websocket_connect("/ws/user2") as ws2:
            signal = {"target": "user2", "type": "offer", "sdp": "v=0..."}
            ws1.send_text(json.dumps(signal))
            data = ws2.receive_text()
            assert json.loads(data) == signal
