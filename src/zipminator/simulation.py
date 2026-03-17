import math
import os
import struct
import random
from typing import List, Tuple, Optional


class FinancialSimulator:
    """
    Simulates financial scenarios using Geometric Brownian Motion (GBM).
    Supports both Pseudo-Random (PRNG) and Quantum Random (QRNG) sources.
    """

    def __init__(self, entropy_file: Optional[str] = None):
        self.entropy_file = entropy_file
        self.entropy_pool = b""
        self.pool_index = 0

        if self.entropy_file and os.path.exists(self.entropy_file):
            with open(self.entropy_file, "rb") as f:
                self.entropy_pool = f.read()

    def _get_random_float(self, use_qrng: bool) -> float:
        """
        Returns a uniform random float in [0, 1).
        """
        if not use_qrng or not self.entropy_pool:
            return random.random()

        # Use 4 bytes from pool to generate a float
        if self.pool_index + 4 > len(self.entropy_pool):
            # Loop back to start if pool exhausted (for demo purposes)
            self.pool_index = 0

        chunk = self.entropy_pool[self.pool_index: self.pool_index + 4]
        self.pool_index += 4

        # Convert bytes to int, then to float [0, 1)
        # 0xFFFFFFFF is 4294967295
        int_val = struct.unpack(">I", chunk)[0]
        return int_val / 4294967296.0

    def _box_muller(self, use_qrng: bool) -> float:
        """
        Generates a standard normal random variable Z ~ N(0, 1) using Box-Muller transform.
        """
        u1 = self._get_random_float(use_qrng)
        u2 = self._get_random_float(use_qrng)

        # Avoid log(0)
        if u1 <= 0:
            u1 = 0.000000001

        z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
        return z0

    def run_simulation(
        self,
        initial_price: float,
        days: int,
        mu: float,
        sigma: float,
        use_qrng: bool
    ) -> List[float]:
        """
        Runs a single simulation path for stock price.

        S_t = S_{t-1} * exp((mu - 0.5 * sigma^2) * dt + sigma * sqrt(dt) * Z)

        :param initial_price: Starting stock price
        :param days: Number of days to simulate
        :param mu: Expected return (annualized)
        :param sigma: Volatility (annualized)
        :param use_qrng: Whether to use Quantum Entropy
        :return: List of prices for each day
        """
        dt = 1.0 / 252.0  # Daily time step (assuming 252 trading days)
        prices = [initial_price]
        current_price = initial_price

        drift = (mu - 0.5 * sigma**2) * dt
        volatility = sigma * math.sqrt(dt)

        for _ in range(days):
            z = self._box_muller(use_qrng)
            # Calculate daily return
            daily_return = math.exp(drift + volatility * z)
            current_price *= daily_return
            prices.append(current_price)

        return prices
