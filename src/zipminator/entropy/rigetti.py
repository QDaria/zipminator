import secrets
from typing import Optional
from .base import QuantumProvider

class RigettiProvider(QuantumProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def name(self) -> str:
        return "Rigetti Computing"

    def get_entropy(self, num_bits: int) -> str:
        # Mocking Rigetti entropy for now
        # In production, this would use pyquil or Rigetti's QCS API
        print("Connecting to Rigetti QCS...")
        return bin(int.from_bytes(secrets.token_bytes((num_bits + 7) // 8), 'big'))[2:].zfill(num_bits)[:num_bits]
