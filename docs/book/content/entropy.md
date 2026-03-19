# Quantum Entropy

Zipminator harvests real quantum entropy from IBM Quantum hardware (156-qubit Eagle r3 processors) via qBraid. The entropy feeds into key generation, noise injection, and random number generation throughout the SDK.

## Architecture

The entropy system has four layers:

1. **Pool file** -- A binary file on disk that grows without limit as entropy is harvested
2. **Scheduler** -- A daemon or cron job that periodically harvests from quantum backends
3. **Quota manager** -- Per-user monthly tracking with tier-based limits
4. **Provider chain** -- Priority-ordered fallback: Pool > qBraid > IBM > Rigetti > OS

```
Pool File (quantum_entropy/quantum_entropy_pool.bin)
    ^
    | writes
Scheduler (daemon or cron)
    |
    v reads from
Provider Chain: qBraid -> IBM Quantum -> Rigetti -> OS Fallback
```

## Pool File

The entropy pool is a binary file at `quantum_entropy/quantum_entropy_pool.bin`. It grows as the scheduler appends new entropy. Consumers read from it dynamically.

If the pool file does not exist, a 4096-byte seed is auto-created using `secrets.token_bytes()` (cryptographically secure but classical).

The pool file is gitignored (`quantum_entropy/*.bin` in `.gitignore`).

## Scheduler

The scheduler harvests entropy on a configurable interval.

### Daemon Mode

Runs continuously, harvesting at the specified interval (default: 3600 seconds = 1 hour):

```bash
python -m zipminator.entropy.scheduler --daemon --interval 3600
```

### One-Shot Mode (for cron)

Harvests once and exits. Suitable for cron jobs:

```bash
python -m zipminator.entropy.scheduler --once
```

### Pool Statistics

Check the current pool size and harvest history:

```bash
python -m zipminator.entropy.scheduler --stats
```

### Cron Setup

To harvest every 6 hours:

```bash
# Edit crontab
crontab -e

# Add this line:
0 */6 * * * /path/to/python -m zipminator.entropy.scheduler --once
```

## Harvest Log

Every harvest cycle is logged to `quantum_entropy/harvest_log.jsonl` (append-only JSONL):

```json
{"timestamp": "2026-03-17T10:00:00Z", "provider": "qbraid", "bytes": 51200, "pool_size": 204800}
```

## Provider Priority Chain

The scheduler tries providers in order and falls back if one is unavailable:

| Priority | Provider | Backend | Env Var |
|---------:|----------|---------|---------|
| 1 | Pool | Local file (if sufficient) | -- |
| 2 | qBraid | IBM Fez / Marrakesh (156-qubit Eagle r3) | `QBRAID_API_KEY` |
| 3 | IBM Quantum | Qiskit Runtime | `IBM_QUANTUM_TOKEN` |
| 4 | Rigetti | QCS (pyQuil) | `RIGETTI_API_KEY` |
| 5 | OS Fallback | `getrandom` / `os.urandom` | -- |

Configure provider credentials in `.env`:

```bash
QBRAID_API_KEY=your_qbraid_key
IBM_QUANTUM_TOKEN=your_ibm_token
RIGETTI_API_KEY=your_rigetti_key
```

## Quota Management

Entropy consumption is tracked per user per month, with limits based on subscription tier.

| Tier | Monthly Entropy | Overage Rate |
|------|----------------:|:------------:|
| Free | 1 MB | $0.01/KB |
| Developer | 10 MB | $0.01/KB |
| Pro | 100 MB | $0.01/KB |
| Enterprise | Unlimited | -- |

### Programmatic Quota Check

```python
from zipminator.entropy.quota import EntropyQuotaManager

manager = EntropyQuotaManager(tier="developer")

# Check remaining quota
remaining = manager.get_remaining_bytes()
print(f"Remaining this month: {remaining / 1024:.1f} KB")

# Record consumption
manager.record_usage(bytes_consumed=32768)
```

## Quantum Random Module

The `QuantumRandom` class is a drop-in replacement for Python's `random` module. When quantum entropy is available (pool file exists), it uses quantum-seeded randomness. Otherwise, it falls back to `os.urandom`.

```python
from zipminator.crypto.quantum_random import QuantumRandom

qr = QuantumRandom()

qr.random()              # float in [0.0, 1.0)
qr.randint(1, 100)       # inclusive range
qr.randbytes(32)         # 32 cryptographic bytes
qr.choice(["a", "b"])    # random selection
qr.shuffle(my_list)      # Fisher-Yates shuffle
```

## Self-Destruct

Zipminator includes a DoD 5220.22-M compliant 3-pass overwrite for secure data destruction:

1. **Pass 1**: Overwrite with zeros
2. **Pass 2**: Overwrite with ones
3. **Pass 3**: Overwrite with random bytes

The self-destruct module supports timer-based auto-destruct with audit logging, useful for ephemeral keys and temporary data.
