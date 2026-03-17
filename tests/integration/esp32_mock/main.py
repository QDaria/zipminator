"""Mock ESP32-S3 mesh node for Q-Mesh integration testing."""
from fastapi import FastAPI
from pydantic import BaseModel
import hmac
import hashlib
import struct

app = FastAPI(title="ESP32 Mesh Mock")

class BeaconRequest(BaseModel):
    mesh_key_hex: str
    payload: bytes | str
    nonce: int

class BeaconResponse(BaseModel):
    wire_format: str
    nonce: int
    hmac_tag: str
    valid: bool

@app.post("/beacon/auth")
def beacon_auth(req: BeaconRequest) -> BeaconResponse:
    """Generate ADR-032 authenticated beacon."""
    mesh_key = bytes.fromhex(req.mesh_key_hex)
    payload = req.payload.encode() if isinstance(req.payload, str) else req.payload
    nonce_bytes = struct.pack("<I", req.nonce)
    mac = hmac.new(mesh_key, payload + nonce_bytes, hashlib.sha256).digest()[:8]
    wire = nonce_bytes + mac + payload
    return BeaconResponse(
        wire_format=wire.hex(),
        nonce=req.nonce,
        hmac_tag=mac.hex(),
        valid=True,
    )

@app.get("/beacon/verify")
def beacon_verify(mesh_key_hex: str, wire_hex: str) -> dict:
    """Verify ADR-032 beacon authenticity."""
    wire = bytes.fromhex(wire_hex)
    mesh_key = bytes.fromhex(mesh_key_hex)
    nonce = struct.unpack("<I", wire[:4])[0]
    tag = wire[4:12]
    payload = wire[12:]
    expected = hmac.new(mesh_key, payload + wire[:4], hashlib.sha256).digest()[:8]
    return {"valid": hmac.compare_digest(tag, expected), "nonce": nonce, "payload": payload.hex()}

@app.get("/health")
def health():
    return {"status": "ok", "node_type": "esp32-s3-mock"}
