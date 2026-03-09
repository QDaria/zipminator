# 15 -- Quantum Entropy Pool

> Extracted from Section 14 of the orchestration guide.
> See also: [01-project-state.md](01-project-state.md) for the entropy pool model overview.

---

## How It Works

The entropy pool is a single append-only binary file at `quantum_entropy/quantum_entropy_pool.bin`. It grows over time as harvesting jobs complete.

```
+---------------------------------------------+
|  IBM Quantum (Marrakesh 156q)               |
|  --> qBraid Provider --> Hadamard Circuit   |
|  --> Measure all qubits --> Raw bitstrings  |
|  --> Append to quantum_entropy_pool.bin     |
+---------------------------------------------+
```

## Running the Harvester

```bash
# Requires QBRAID_API_KEY in .env
python scripts/qrng_harvester.py

# Output: 50 KB per harvest cycle, appended to pool
# Backends: Tries ibm_marrakesh first, falls back to ibm_fez
# Each cycle logs a SHA-256 integrity hash
```

## Bootstrap Seed

If no pool file exists, the demo backend auto-creates a 4096-byte seed using `secrets.token_bytes()`. This ensures the app starts even without a qBraid account.

## Pool Consumers

| Consumer | How It Reads |
|----------|-------------|
| `demo/backend/server.py` | Reads sequentially, wraps around on depletion |
| `src/zipminator/crypto/quantum_random.py` | Thread-safe `QuantumEntropyPool` class, reloads on exhaustion |
| `src/zipminator/cli.py` | Reads first 32 bytes for keygen seed |
