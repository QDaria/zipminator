import random
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
        return "".join(str(random.randint(0, 1)) for _ in range(num_bits))
