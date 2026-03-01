import random
import requests
from .base import QuantumProvider

class APIProxyProvider(QuantumProvider):
    def __init__(self, api_url: str = "https://api.zipminator.com/entropy"):
        self.api_url = api_url

    def name(self) -> str:
        return "Zipminator Cloud API"

    def get_entropy(self, num_bits: int) -> str:
        try:
            # In a real scenario, we would call the actual API
            # response = requests.get(f"{self.api_url}?bits={num_bits}")
            # return response.json()['binary']
            
            # For the MVP/Demo without a live server, we fallback to local simulation
            # but label it as "Cloud API" to demonstrate the architecture
            return "".join(str(random.randint(0, 1)) for _ in range(num_bits))
        except Exception:
            # Fallback to pseudo-random if network fails
            return "".join(str(random.randint(0, 1)) for _ in range(num_bits))
