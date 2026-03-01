import abc


class QuantumProvider(abc.ABC):
    @abc.abstractmethod
    def get_entropy(self, num_bits: int) -> str:
        """Return a binary string of length num_bits."""
        pass

    @abc.abstractmethod
    def name(self) -> str:
        """Return provider name."""
        pass


# Alias for the public API
QuantumEntropyProvider = QuantumProvider
