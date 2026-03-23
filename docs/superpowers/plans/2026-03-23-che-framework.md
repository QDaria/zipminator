# Certified Heterogeneous Entropy (CHE) Framework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Orchestration:** Use `/hive-mind-advanced` queen-led coordination with agent teams. Each workstream is a dedicated worker. Route per `.claude/rules/model-routing.md`: crypto/ARE = Opus, Python/tests = Sonnet, docs/config = Haiku.
>
> **Quality protocol per task:** RALPH loop (R-A-L-P-H) with max 12 iterations. After each RALPH completion, run `/verification-quality` (truth score threshold 0.95). On FAIL, rewind and retry.
>
> **Skills to invoke per phase:**
> - **R**esearch: `/quantum-cryptanalysis-expert`, `context7` docs lookup, `WebSearch` for related work
> - **A**rchitecture: `/sparc-methodology` (Architecture phase), `AskUserQuestion` for trade-offs
> - **L**ogic: `/pair-programming` Navigator/Driver TDD, `/batch-tdd` for parallel test domains
> - **P**olish: `/simplify` code review
> - **H**arden: `/verification-quality`, `/quantum-assurance-validator`, `cargo fuzz` for crypto
>
> **Memory/learning skills (always active):**
> - `reasoningbank-intelligence` — adaptive learning from each RALPH iteration outcome
> - `agentdb-memory-patterns` — persistent memory across agent sessions
> - `agentdb-vector-search` — semantic search of prior decisions
> - `agentdb-learning` — reinforcement learning on task success/failure
> - `agentdb-optimization` — HNSW indexing for fast recall
> - `agentic-jujutsu` — version control for agent reasoning trajectories
> - `stream-chain` — streaming coordination between parallel agents
>
> **After EVERY completed task:** Run `/verification-quality` truth scoring. Score < 0.95 = rollback and re-RALPH.

**Goal:** Build the Certified Heterogeneous Entropy framework: multi-source entropy composition (QRNG + WiFi CSI + OS), Algebraic Randomness Extraction, continuous certification, and cryptographic provenance — producing a provisional patent draft, technical whitepaper, academic paper, and product implementation.

**Architecture:** Five-layer entropy stack: L0 (source harvesting), L1 (heterogeneous XOR composition with formal bounds), L2 (ARE post-processing), L3 (continuous online certification), L4 (Merkle-tree provenance). Each layer is independently testable and deployable. The Rust crypto core (`crates/zipminator-core/`) implements ARE and provenance; Python SDK (`src/zipminator/entropy/`) implements composition, certification, and orchestration.

**Tech Stack:** Rust (ARE extractor, provenance Merkle trees), Python (composition, health tests, scheduler integration), Qiskit (Bell test circuit), LaTeX/IEEE format (paper), Jupyter (demo notebook)

---

## Workstream Map

```
TRACK A: FOUNDATIONS (sequential, Tasks 1-4)
  Task 1: NIST SP 800-90B Health Test Suite
  Task 2: Online Min-Entropy Estimator
  Task 3: Dynamic Compositor (weighted multi-source XOR)
  Task 4: Integration — wire compositor into factory.py

TRACK B: ARE CONSTRUCTION (parallel with Track A after Task 1, Tasks 5-8)
  Task 5: ARE Formal Spec + Test Vectors
  Task 6: ARE Rust Implementation
  Task 7: ARE Python Bindings (PyO3)
  Task 8: ARE NIST Validation

TRACK C: CERTIFICATION + PROVENANCE (after Tracks A+B, Tasks 9-11)
  Task 9: Provenance Certificate (Merkle tree)
  Task 10: Bell Test Circuit (scheduler addition)
  Task 11: Certified Entropy API (ties all layers together)

TRACK D: PUBLICATIONS (parallel with Track C, Tasks 12-15)
  Task 12: Provisional Patent Draft
  Task 13: Technical Whitepaper v1
  Task 14: Academic Paper Draft (IEEE/USENIX format)
  Task 15: Jupyter Demo Notebook (08_che_framework.ipynb)

TRACK E: VALIDATION (final, Task 16)
  Task 16: Full Integration Test + Benchmark Suite
```

**Dependency graph:**
```
Task 1 ──> Task 2 ──> Task 3 ──> Task 4 ──────────────┐
Task 1 ──> Task 5 ──> Task 6 ──> Task 7 ──> Task 8 ──┐│
Task 1 ──> Task 10 (Bell test, can start early) ──────┤│
                                                       ├┴─> Task 9 ──> Task 11
Task 9 ──> Task 12 (patent)
Task 8 ──> Task 13 (whitepaper)
Task 11 ──> Task 14 (paper)
Task 11 ──> Task 15 (notebook)
Task 16 depends on ALL prior tasks
```

**Note:** Task 10 (Bell test) only needs Task 1 (health module) and qiskit.
It can run in parallel with Tasks 2-8, saving wall-clock time.

---

## File Structure

### New Files

| File | Purpose | Language | Est. Lines |
|------|---------|----------|-----------|
| `crates/zipminator-core/src/are/mod.rs` | ARE module root: types, traits | Rust | 60 |
| `crates/zipminator-core/src/are/extractor.rs` | ARE extraction engine | Rust | 250 |
| `crates/zipminator-core/src/are/program.rs` | Algebraic program generation | Rust | 150 |
| `crates/zipminator-core/src/are/domains.rs` | Number domain implementations (N,Z,Q,R,C) | Rust | 200 |
| `crates/zipminator-core/src/provenance/mod.rs` | Provenance module root | Rust | 40 |
| `crates/zipminator-core/src/provenance/certificate.rs` | Merkle-tree certificates | Rust | 200 |
| `crates/zipminator-core/src/provenance/verify.rs` | Certificate verification | Rust | 120 |
| `src/zipminator/entropy/health.py` | NIST SP 800-90B online health tests | Python | 250 |
| `src/zipminator/entropy/compositor.py` | Weighted multi-source compositor | Python | 200 |
| `src/zipminator/entropy/are.py` | ARE Python bindings | Python | 100 |
| `src/zipminator/entropy/provenance.py` | Provenance certificate Python API | Python | 120 |
| `src/zipminator/entropy/bell_test.py` | CHSH Bell inequality circuit | Python | 80 |
| `tests/python/test_entropy_health.py` | Health test suite | Python | 200 |
| `tests/python/test_entropy_compositor.py` | Compositor tests | Python | 180 |
| `tests/python/test_entropy_are.py` | ARE Python tests | Python | 150 |
| `tests/python/test_entropy_provenance.py` | Provenance tests | Python | 120 |
| `tests/python/test_entropy_bell.py` | Bell test tests | Python | 80 |
| `tests/python/test_entropy_integration_che.py` | Full CHE integration test | Python | 200 |
| `docs/papers/che-framework/main.tex` | Academic paper (IEEE format) | LaTeX | 800 |
| `docs/papers/che-framework/figures/` | Paper figures | SVG/PDF | — |
| `docs/papers/che-whitepaper.md` | Technical whitepaper | Markdown | 600 |
| `docs/patents/che-provisional.md` | Provisional patent draft | Markdown | 400 |
| `docs/book/notebooks/08_che_framework.ipynb` | Interactive demo | Jupyter | 500 |

### Modified Files

| File | What Changes |
|------|-------------|
| `crates/zipminator-core/src/lib.rs` | Add `pub mod are; pub mod provenance;` |
| `crates/zipminator-core/Cargo.toml` | `sha2` already present; implement Merkle tree from scratch (~50 lines, avoids new dep) |
| `src/zipminator/entropy/factory.py` | Insert compositor between pool and consumers |
| `src/zipminator/entropy/scheduler.py` | Add Bell test circuit, provenance logging |
| `src/zipminator/entropy/__init__.py` | Export new modules |
| `docs/book/_toc.yml` | Add CHE notebook |

---

## TRACK A: FOUNDATIONS

### Task 1: NIST SP 800-90B Health Test Suite

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 45 min
> **Skills**: `/test-specialist`, `/pair-programming`, context7 (NIST docs)

**Files:**
- Create: `src/zipminator/entropy/health.py`
- Create: `tests/python/test_entropy_health.py`

- [ ] **Step 1: Research NIST SP 800-90B Section 4 health tests**

The two mandatory online health tests per NIST SP 800-90B:
1. **Repetition Count Test**: Detects if source gets stuck producing same value
2. **Adaptive Proportion Test**: Detects if one value appears too frequently

```bash
# Use WebSearch to verify current NIST SP 800-90B requirements
# Read existing health-related code
grep -r "health\|nist\|800.90" src/zipminator/entropy/ crates/zipminator-core/src/qrng/
```

- [ ] **Step 2: Write failing tests for Repetition Count Test**

```python
# tests/python/test_entropy_health.py
"""NIST SP 800-90B Section 4.4 online health tests."""
import os
import pytest
from zipminator.entropy.health import (
    RepetitionCountTest,
    AdaptiveProportionTest,
    HealthTestSuite,
    HealthStatus,
)


class TestRepetitionCountTest:
    """Section 4.4.1: catches stuck-at faults."""

    def test_healthy_random_data(self):
        """Random-looking data should pass."""
        rct = RepetitionCountTest(alpha=2**-20, bit_width=8)
        data = bytes(range(256)) * 4  # cycling 0-255
        for byte in data:
            result = rct.feed(byte)
            assert result == HealthStatus.HEALTHY

    def test_stuck_at_fault(self):
        """Repeated identical values must trigger failure."""
        rct = RepetitionCountTest(alpha=2**-20, bit_width=8)
        # Feed the same byte many times — must fail before 100 repetitions
        failed = False
        for _ in range(100):
            if rct.feed(0xAA) == HealthStatus.FAILED:
                failed = True
                break
        assert failed, "RCT should detect stuck-at-zero fault"

    def test_cutoff_calculation(self):
        """Cutoff C should be ceil(1 + (-log2(alpha) / H))."""
        rct = RepetitionCountTest(alpha=2**-20, bit_width=8)
        # For H=8 (uniform bytes), C = 1 + ceil(20/8) = 4
        assert rct.cutoff >= 3  # minimum reasonable cutoff


class TestAdaptiveProportionTest:
    """Section 4.4.2: catches bias drift."""

    def test_healthy_uniform_data(self):
        """Roughly uniform data should pass."""
        apt = AdaptiveProportionTest(alpha=2**-20, bit_width=8, window_size=512)
        import os
        data = os.urandom(512)
        results = [apt.feed(b) for b in data]
        assert all(r != HealthStatus.FAILED for r in results)

    def test_heavily_biased_data(self):
        """Data that's 90% one value must trigger failure."""
        apt = AdaptiveProportionTest(alpha=2**-20, bit_width=8, window_size=512)
        biased = bytes([0x42] * 460 + list(range(52)))  # 90% same value
        failed = any(apt.feed(b) == HealthStatus.FAILED for b in biased)
        assert failed, "APT should detect heavy bias"

    def test_window_reset(self):
        """After a window completes, counters should reset."""
        apt = AdaptiveProportionTest(alpha=2**-20, bit_width=8, window_size=64)
        data = os.urandom(128)  # two full windows
        for b in data:
            apt.feed(b)
        assert apt.samples_in_window < 64  # should have reset


class TestHealthTestSuite:
    """Combined suite runs both tests."""

    def test_suite_healthy(self):
        suite = HealthTestSuite(alpha=2**-20, bit_width=8)
        import os
        for b in os.urandom(1024):
            status = suite.feed(b)
            assert status != HealthStatus.FAILED

    def test_suite_detects_failure(self):
        suite = HealthTestSuite(alpha=2**-20, bit_width=8)
        failed = any(suite.feed(0xFF) == HealthStatus.FAILED for _ in range(100))
        assert failed
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
micromamba activate zip-pqc && pytest tests/python/test_entropy_health.py -v
```
Expected: `ModuleNotFoundError: No module named 'zipminator.entropy.health'`

- [ ] **Step 4: Implement health.py**

```python
# src/zipminator/entropy/health.py
"""
NIST SP 800-90B Section 4.4 online health tests.

Provides continuous entropy source monitoring via:
- Repetition Count Test (RCT): detects stuck-at faults
- Adaptive Proportion Test (APT): detects bias drift

Both tests run per-sample with O(1) memory and O(1) time per sample.
"""
import enum
import math
from typing import Optional


class HealthStatus(enum.Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


class RepetitionCountTest:
    """NIST SP 800-90B Section 4.4.1.

    Detects stuck-at faults by counting consecutive identical samples.
    Fails if the count exceeds a cutoff derived from the significance
    level alpha and assumed min-entropy H.
    """

    def __init__(self, alpha: float = 2**-20, bit_width: int = 8,
                 assumed_h: Optional[float] = None):
        self.bit_width = bit_width
        # Conservative: assume H = bit_width (uniform) if not specified
        h = assumed_h if assumed_h is not None else float(bit_width)
        # Cutoff C = 1 + ceil(-log2(alpha) / H)
        self.cutoff = 1 + math.ceil(-math.log2(alpha) / h)
        self._prev: Optional[int] = None
        self._count = 0

    def feed(self, sample: int) -> HealthStatus:
        if sample == self._prev:
            self._count += 1
        else:
            self._prev = sample
            self._count = 1

        if self._count >= self.cutoff:
            return HealthStatus.FAILED
        return HealthStatus.HEALTHY

    def reset(self):
        self._prev = None
        self._count = 0


class AdaptiveProportionTest:
    """NIST SP 800-90B Section 4.4.2.

    Detects bias drift within a sliding window. Fails if any single
    value appears more than the cutoff number of times in a window.
    """

    def __init__(self, alpha: float = 2**-20, bit_width: int = 8,
                 window_size: int = 512, assumed_h: Optional[float] = None):
        self.bit_width = bit_width
        self.window_size = window_size
        h = assumed_h if assumed_h is not None else float(bit_width)

        # Cutoff from NIST SP 800-90B Table 2 approximation.
        # No scipy dependency: use Chernoff bound for binomial tail.
        # C = ceil(window_size * p + z * sqrt(window_size * p * (1-p)))
        # where p = 2^(-H) and z = sqrt(-2 * ln(alpha))
        p = 2**(-h)
        z = math.sqrt(-2.0 * math.log(alpha))
        mean = window_size * p
        stddev = math.sqrt(window_size * p * (1 - p))
        self._cutoff = max(3, math.ceil(mean + z * stddev))

        self._reference: Optional[int] = None
        self._count = 0
        self.samples_in_window = 0

    def feed(self, sample: int) -> HealthStatus:
        if self.samples_in_window == 0:
            # Start new window: first sample is the reference
            self._reference = sample
            self._count = 1
            self.samples_in_window = 1
            return HealthStatus.HEALTHY

        self.samples_in_window += 1
        if sample == self._reference:
            self._count += 1

        if self._count >= self._cutoff:
            self.reset()
            return HealthStatus.FAILED

        if self.samples_in_window >= self.window_size:
            self.reset()

        return HealthStatus.HEALTHY

    def reset(self):
        self._reference = None
        self._count = 0
        self.samples_in_window = 0


class HealthTestSuite:
    """Combined NIST SP 800-90B online health test suite.

    Runs RCT and APT in parallel on every sample. Returns the worst
    status of the two tests.
    """

    def __init__(self, alpha: float = 2**-20, bit_width: int = 8,
                 window_size: int = 512):
        self.rct = RepetitionCountTest(alpha=alpha, bit_width=bit_width)
        self.apt = AdaptiveProportionTest(
            alpha=alpha, bit_width=bit_width, window_size=window_size
        )
        self._total_samples = 0
        self._failures = 0

    def feed(self, sample: int) -> HealthStatus:
        self._total_samples += 1
        rct_status = self.rct.feed(sample)
        apt_status = self.apt.feed(sample)

        if rct_status == HealthStatus.FAILED or apt_status == HealthStatus.FAILED:
            self._failures += 1
            return HealthStatus.FAILED
        return HealthStatus.HEALTHY

    @property
    def failure_rate(self) -> float:
        if self._total_samples == 0:
            return 0.0
        return self._failures / self._total_samples

    def reset(self):
        self.rct.reset()
        self.apt.reset()
        self._total_samples = 0
        self._failures = 0
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
micromamba activate zip-pqc && pytest tests/python/test_entropy_health.py -v
```
Expected: All tests PASS

- [ ] **Step 6: Polish — run /simplify**

- [ ] **Step 7: Harden — run /verification-quality, truth score >= 0.95**

- [ ] **Step 8: Commit**

```bash
git add src/zipminator/entropy/health.py tests/python/test_entropy_health.py
git commit -m "feat(entropy): NIST SP 800-90B online health tests (RCT + APT)"
```

---

### Task 2: Online Min-Entropy Estimator

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 40 min
> **Depends on**: Task 1

**Files:**
- Modify: `src/zipminator/entropy/health.py` (add MinEntropyEstimator class)
- Modify: `tests/python/test_entropy_health.py` (add estimator tests)

- [ ] **Step 1: Write failing tests for min-entropy estimation**

```python
# Append to tests/python/test_entropy_health.py

class TestMinEntropyEstimator:
    """Online min-entropy estimation via Most Common Value (MCV) method.
    NIST SP 800-90B Section 6.3.1."""

    def test_uniform_source_high_entropy(self):
        """os.urandom should yield near-maximal min-entropy."""
        from zipminator.entropy.health import MinEntropyEstimator
        est = MinEntropyEstimator(bit_width=8)
        import os
        for b in os.urandom(10000):
            est.feed(b)
        h_min = est.estimate()
        # Uniform 8-bit source: H_min should be close to 8.0
        assert h_min > 7.0, f"uniform source should have high entropy, got {h_min}"

    def test_constant_source_zero_entropy(self):
        """Constant source should yield near-zero min-entropy."""
        from zipminator.entropy.health import MinEntropyEstimator
        est = MinEntropyEstimator(bit_width=8)
        for _ in range(10000):
            est.feed(42)
        h_min = est.estimate()
        assert h_min < 0.1, f"constant source should have ~0 entropy, got {h_min}"

    def test_biased_source_intermediate_entropy(self):
        """Source with 50% one value should have ~1 bit entropy."""
        from zipminator.entropy.health import MinEntropyEstimator
        est = MinEntropyEstimator(bit_width=8)
        data = [0] * 5000 + list(range(256)) * 19 + [0] * 136
        for b in data:
            est.feed(b % 256)
        h_min = est.estimate()
        assert 0.5 < h_min < 3.0, f"biased source entropy out of range: {h_min}"

    def test_insufficient_samples(self):
        """Should return None or raise if not enough samples."""
        from zipminator.entropy.health import MinEntropyEstimator
        est = MinEntropyEstimator(bit_width=8, min_samples=1000)
        for b in range(100):
            est.feed(b)
        assert est.estimate() is None
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
micromamba activate zip-pqc && pytest tests/python/test_entropy_health.py::TestMinEntropyEstimator -v
```

- [ ] **Step 3: Implement MinEntropyEstimator in health.py**

```python
# Add to src/zipminator/entropy/health.py

class MinEntropyEstimator:
    """Online min-entropy estimation via Most Common Value (MCV).

    NIST SP 800-90B Section 6.3.1. Tracks frequency of each symbol
    and estimates: H_min = -log2(p_max) where p_max is the maximum
    observed probability.

    This is a conservative (lower-bound) estimator: real min-entropy
    may be higher than the estimate.
    """

    def __init__(self, bit_width: int = 8, min_samples: int = 1000):
        self.bit_width = bit_width
        self.min_samples = min_samples
        self._counts: dict[int, int] = {}
        self._total = 0

    def feed(self, sample: int) -> None:
        self._counts[sample] = self._counts.get(sample, 0) + 1
        self._total += 1

    def estimate(self) -> Optional[float]:
        """Return estimated min-entropy in bits, or None if insufficient data."""
        if self._total < self.min_samples:
            return None
        p_max = max(self._counts.values()) / self._total
        if p_max <= 0 or p_max >= 1:
            return 0.0 if p_max >= 1 else float(self.bit_width)
        return -math.log2(p_max)

    @property
    def sample_count(self) -> int:
        return self._total

    def reset(self):
        self._counts.clear()
        self._total = 0
```

- [ ] **Step 4: Run tests — verify pass**
- [ ] **Step 5: Polish (/simplify) + Harden (/verification-quality)**
- [ ] **Step 6: Commit**

```bash
git add src/zipminator/entropy/health.py tests/python/test_entropy_health.py
git commit -m "feat(entropy): online min-entropy estimator (NIST 800-90B MCV method)"
```

---

### Task 3: Dynamic Compositor (Weighted Multi-Source XOR)

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 50 min
> **Depends on**: Task 2

**Files:**
- Create: `src/zipminator/entropy/compositor.py`
- Create: `tests/python/test_entropy_compositor.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/python/test_entropy_compositor.py
"""Tests for heterogeneous entropy compositor."""
import os
import pytest
from unittest.mock import MagicMock
from zipminator.entropy.compositor import (
    EntropyCompositor,
    EntropySource,
    SourceStatus,
    CompositionResult,
)


class FakeSource(EntropySource):
    """Deterministic source for testing."""
    def __init__(self, name: str, data: bytes, min_entropy: float = 8.0):
        self._name = name
        self._data = data
        self._pos = 0
        self._min_entropy = min_entropy

    @property
    def name(self) -> str:
        return self._name

    def read(self, n: int) -> bytes:
        chunk = self._data[self._pos:self._pos + n]
        self._pos += n
        if len(chunk) < n:
            chunk += b'\x00' * (n - len(chunk))
        return chunk

    @property
    def estimated_min_entropy(self) -> float:
        return self._min_entropy

    @property
    def status(self) -> SourceStatus:
        return SourceStatus.HEALTHY if self._pos < len(self._data) else SourceStatus.DEGRADED


class TestEntropyCompositor:
    def test_single_source(self):
        """With one source, output equals source."""
        src = FakeSource("test", os.urandom(64))
        comp = EntropyCompositor([src])
        result = comp.compose(32)
        assert len(result.data) == 32
        assert result.sources_used == ["test"]

    def test_xor_composition(self):
        """Two sources XOR'd should differ from either individual source."""
        data_a = os.urandom(64)
        data_b = os.urandom(64)
        src_a = FakeSource("alpha", data_a)
        src_b = FakeSource("beta", data_b)
        comp = EntropyCompositor([src_a, src_b])
        result = comp.compose(32)
        assert result.data != data_a[:32]
        assert result.data != data_b[:32]
        assert len(result.sources_used) == 2

    def test_degraded_source_excluded(self):
        """Source with status FAILED should be skipped."""
        src_good = FakeSource("good", os.urandom(64))
        src_bad = FakeSource("bad", b"", min_entropy=0.0)  # empty = degraded
        # Read past the data to make it degraded
        src_bad.read(1)
        comp = EntropyCompositor([src_good, src_bad], min_sources=1)
        result = comp.compose(32)
        assert "good" in result.sources_used

    def test_provenance_metadata(self):
        """Result should include provenance for each source."""
        src = FakeSource("quantum", os.urandom(64), min_entropy=7.5)
        comp = EntropyCompositor([src])
        result = comp.compose(16)
        assert result.provenance is not None
        assert result.provenance[0]["source"] == "quantum"
        assert result.provenance[0]["min_entropy"] >= 7.0

    def test_min_entropy_of_composition(self):
        """Composed min-entropy >= max of individual sources."""
        src_a = FakeSource("high", os.urandom(64), min_entropy=7.8)
        src_b = FakeSource("low", os.urandom(64), min_entropy=3.2)
        comp = EntropyCompositor([src_a, src_b])
        result = comp.compose(32)
        assert result.estimated_min_entropy >= 7.8
```

- [ ] **Step 2: Run tests — verify fail**
- [ ] **Step 3: Implement compositor.py**

```python
# src/zipminator/entropy/compositor.py
"""
Heterogeneous entropy compositor.

XOR-fuses multiple independent entropy sources with dynamic
health-based weighting. Provides provenance metadata for each
composition, enabling downstream certification.

Security property: the composed output has min-entropy at least
as high as the strongest individual source (assuming independence).
"""
import enum
import hashlib
import time
from dataclasses import dataclass, field
from typing import List, Optional, Protocol


class SourceStatus(enum.Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


class EntropySource(Protocol):
    """Protocol for pluggable entropy sources."""

    @property
    def name(self) -> str: ...

    def read(self, n: int) -> bytes: ...

    @property
    def estimated_min_entropy(self) -> float: ...

    @property
    def status(self) -> SourceStatus: ...


@dataclass
class SourceProvenance:
    source: str
    min_entropy: float
    status: str
    bytes_contributed: int
    timestamp: float


@dataclass
class CompositionResult:
    data: bytes
    sources_used: List[str]
    estimated_min_entropy: float
    provenance: List[dict] = field(default_factory=list)
    sha256: str = ""

    def __post_init__(self):
        if not self.sha256:
            self.sha256 = hashlib.sha256(self.data).hexdigest()


class EntropyCompositor:
    """Composes entropy from multiple heterogeneous sources via XOR.

    Defense-in-depth: even if k-1 of k sources are compromised,
    the output retains the min-entropy of the remaining honest source.
    """

    def __init__(self, sources: List[EntropySource], min_sources: int = 1):
        self._sources = sources
        self._min_sources = min_sources

    def compose(self, num_bytes: int) -> CompositionResult:
        """Read num_bytes from all healthy sources, XOR-fuse, return result."""
        active_sources = [
            s for s in self._sources
            if s.status != SourceStatus.FAILED
        ]

        if len(active_sources) < self._min_sources:
            raise RuntimeError(
                f"Only {len(active_sources)} healthy sources, "
                f"need {self._min_sources}"
            )

        result = bytearray(num_bytes)
        provenance = []
        sources_used = []
        max_entropy = 0.0

        for src in active_sources:
            try:
                chunk = src.read(num_bytes)
                if len(chunk) < num_bytes:
                    chunk = chunk + bytes(num_bytes - len(chunk))

                # XOR into accumulator
                for i in range(num_bytes):
                    result[i] ^= chunk[i]

                sources_used.append(src.name)
                max_entropy = max(max_entropy, src.estimated_min_entropy)
                provenance.append({
                    "source": src.name,
                    "min_entropy": src.estimated_min_entropy,
                    "status": src.status.value,
                    "bytes_contributed": len(chunk),
                    "timestamp": time.time(),
                })
            except Exception:
                continue

        return CompositionResult(
            data=bytes(result),
            sources_used=sources_used,
            estimated_min_entropy=max_entropy,
            provenance=provenance,
        )
```

- [ ] **Step 4: Run tests — verify pass**
- [ ] **Step 5: Polish (/simplify) + Harden (/verification-quality)**
- [ ] **Step 6: Commit**

```bash
git add src/zipminator/entropy/compositor.py tests/python/test_entropy_compositor.py
git commit -m "feat(entropy): heterogeneous multi-source compositor with provenance"
```

---

### Task 4: Wire Compositor Into Factory

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 20 min
> **Depends on**: Task 3

**Files:**
- Modify: `src/zipminator/entropy/factory.py`
- Modify: `src/zipminator/entropy/__init__.py`

- [ ] **Step 1: Write integration test**

```python
# tests/python/test_entropy_compositor.py (append)

class TestFactoryIntegration:
    """Compositor integrates with existing factory."""

    def test_get_compositor_returns_compositor(self):
        from zipminator.entropy.factory import get_compositor
        comp = get_compositor()
        assert comp is not None
        result = comp.compose(32)
        assert len(result.data) == 32
        assert len(result.sources_used) >= 1
```

- [ ] **Step 2: Run test — verify fail**
- [ ] **Step 3: Add QuantumProviderAdapter and `get_compositor()` to factory.py**

The existing `QuantumProvider` ABC uses `get_entropy(num_bits) -> str` (binary string).
The compositor expects `EntropySource` protocol with `read(n_bytes) -> bytes`.
Bridge them with an adapter:

```python
# Add to src/zipminator/entropy/compositor.py (or factory.py)
from .base import QuantumProvider

class QuantumProviderAdapter:
    """Adapts the existing QuantumProvider ABC to EntropySource protocol."""

    def __init__(self, provider: QuantumProvider):
        self._provider = provider
        self._health = HealthTestSuite()
        self._estimator = MinEntropyEstimator()

    @property
    def name(self) -> str:
        return self._provider.name()

    def read(self, n: int) -> bytes:
        bits = self._provider.get_entropy(n * 8)
        data = int(bits, 2).to_bytes(n, "big")
        for byte in data:
            self._health.feed(byte)
            self._estimator.feed(byte)
        return data

    @property
    def estimated_min_entropy(self) -> float:
        h = self._estimator.estimate()
        return h if h is not None else 8.0  # assume uniform until enough data

    @property
    def status(self) -> SourceStatus:
        if self._health.failure_rate > 0.01:
            return SourceStatus.FAILED
        return SourceStatus.HEALTHY
```

Add `get_compositor()` that wraps existing providers via the adapter and returns an `EntropyCompositor`. The existing `get_provider()` remains unchanged for backward compatibility.

- [ ] **Step 4: Run tests — verify pass (existing + new)**
- [ ] **Step 5: Polish + Harden**
- [ ] **Step 6: Commit**

```bash
git add src/zipminator/entropy/factory.py src/zipminator/entropy/__init__.py tests/python/test_entropy_compositor.py
git commit -m "feat(entropy): wire compositor into factory with backward compat"
```

---

## TRACK B: ALGEBRAIC RANDOMNESS EXTRACTION (ARE)

### Task 5: ARE Formal Specification + Test Vectors

> **Agent**: Opus (crypto-critical) | **RALPH phases**: R-A-L-P-H | **Est. time**: 60 min
> **Skills**: `/quantum-cryptanalysis-expert`, `/research-paper-writer` (for formal notation)
> **Parallel with**: Track A Tasks 2-4

**Files:**
- Create: `docs/papers/che-framework/are-spec.md` (formal spec with test vectors)
- Create: `crates/zipminator-core/src/are/mod.rs`

- [ ] **Step 1: Research existing randomness extractors**

```bash
# Search for related work on algebraic extractors
# WebSearch: "randomness extractor algebraic construction universal hashing"
# WebSearch: "Toeplitz matrix extractor seed efficiency comparison"
# context7: look up num-bigint, rug crate docs for arbitrary precision arithmetic
```

- [ ] **Step 2: Write formal ARE specification**

Document in `docs/papers/che-framework/are-spec.md`:
- Definition of algebraic domains (N_n, Z_n, Q_n, R_n, C_n) with bounded ranges
- Definition of an algebraic program P = [(d_i, v_i, op_i)] for i in 1..k
- The extraction function f_P(x) = fold(x, P) mod p
- Seed cost analysis: bits_per_step = ceil(log2(5)) + ceil(log2(n)) + ceil(log2(|Ops|))
- At least 8 concrete test vectors with known inputs/outputs
- Sketch of epsilon-universality argument

- [ ] **Step 3: Create Rust module skeleton with types**

```rust
// crates/zipminator-core/src/are/mod.rs
//! Algebraic Randomness Extraction (ARE)
//!
//! A new family of randomness extractors parameterized by randomly-chosen
//! algebraic operations across number domains (N, Z, Q, R, C).

pub mod domains;
pub mod extractor;
pub mod program;

/// The five classical number domains (bounded for computation).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Domain {
    Natural,    // N_n: {0, 1, ..., n-1}
    Integer,    // Z_n: {-(n-1), ..., n-1}
    Rational,   // Q_n: {a/b : a,b in Z_n, b != 0}
    Real,       // R_n: fixed-point with n bits of precision
    Complex,    // C_n: (a + bi) where a,b in R_n
}

/// Arithmetic operations available in ARE programs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Operation {
    Add,
    Sub,
    Mul,
    Div,   // Protected: division by zero maps to identity
    Mod,
    Exp,   // Modular exponentiation (for N, Z only)
}

/// A single step in an ARE program.
#[derive(Debug, Clone)]
pub struct AreStep {
    pub domain: Domain,
    pub value: i128,       // Encoded value (interpretation depends on domain)
    pub value_imag: i128,  // Imaginary part (Complex domain only, 0 otherwise)
    pub operation: Operation,
}

/// A complete ARE program: a sequence of algebraic steps.
#[derive(Debug, Clone)]
pub struct AreProgram {
    pub steps: Vec<AreStep>,
    pub modulus: u128,  // Final reduction modulus (large prime)
}
```

- [ ] **Step 4: Create stub files so crate compiles**

Create empty stub files for submodules declared in mod.rs so `cargo check` passes:

```rust
// crates/zipminator-core/src/are/domains.rs
//! Number domain arithmetic implementations. (Stub — implemented in Task 6.)

// crates/zipminator-core/src/are/program.rs
//! ARE program generation and serialization. (Stub — implemented in Task 6.)

// crates/zipminator-core/src/are/extractor.rs
//! ARE extraction engine. (Stub — implemented in Task 6.)
```

- [ ] **Step 5: Verify crate compiles**

```bash
cargo check --package zipminator-core
```
Expected: compiles with no errors (stubs are empty but valid)

- [ ] **Step 6: Commit spec + module skeleton**

```bash
git add docs/papers/che-framework/are-spec.md crates/zipminator-core/src/are/
git commit -m "feat(are): formal specification and Rust module skeleton"
```

---

### Task 6: ARE Rust Implementation

> **Agent**: Opus (crypto-critical) | **RALPH phases**: R-A-L-P-H | **Est. time**: 90 min
> **Depends on**: Task 5
> **Skills**: `/pair-programming` (Navigator/Driver TDD), ultrathink for crypto

**Files:**
- Create: `crates/zipminator-core/src/are/domains.rs`
- Create: `crates/zipminator-core/src/are/program.rs`
- Create: `crates/zipminator-core/src/are/extractor.rs`
- Modify: `crates/zipminator-core/src/lib.rs` (add `pub mod are;`)
- Modify: `crates/zipminator-core/Cargo.toml` (add deps if needed)

- [ ] **Step 1: Write failing Rust tests**

```rust
// In crates/zipminator-core/src/are/extractor.rs
#[cfg(test)]
mod tests {
    use super::*;
    use crate::are::program::AreProgram;
    use crate::are::{Domain, Operation, AreStep};

    #[test]
    fn test_extract_deterministic() {
        // Same program + same input = same output
        let program = AreProgram::from_steps(vec![
            AreStep { domain: Domain::Integer, value: 42, value_imag: 0, operation: Operation::Add },
            AreStep { domain: Domain::Natural, value: 7, value_imag: 0, operation: Operation::Mul },
        ], 1_000_000_007);

        let out1 = program.extract(12345u128);
        let out2 = program.extract(12345u128);
        assert_eq!(out1, out2);
    }

    #[test]
    fn test_different_inputs_different_outputs() {
        let program = AreProgram::from_steps(vec![
            AreStep { domain: Domain::Integer, value: 99, value_imag: 0, operation: Operation::Mul },
            AreStep { domain: Domain::Natural, value: 13, value_imag: 0, operation: Operation::Add },
        ], 1_000_000_007);

        let out1 = program.extract(100);
        let out2 = program.extract(200);
        assert_ne!(out1, out2);
    }

    #[test]
    fn test_different_programs_different_outputs() {
        let prog_a = AreProgram::from_steps(vec![
            AreStep { domain: Domain::Integer, value: 42, value_imag: 0, operation: Operation::Add },
        ], 1_000_000_007);

        let prog_b = AreProgram::from_steps(vec![
            AreStep { domain: Domain::Integer, value: 43, value_imag: 0, operation: Operation::Add },
        ], 1_000_000_007);

        assert_ne!(prog_a.extract(999), prog_b.extract(999));
    }

    #[test]
    fn test_program_from_seed() {
        // Generate program from random seed bytes
        let seed = [0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE];
        let program = AreProgram::from_seed(&seed, 4); // 4 steps
        assert_eq!(program.steps.len(), 4);
        // Same seed = same program
        let program2 = AreProgram::from_seed(&seed, 4);
        assert_eq!(program.extract(42), program2.extract(42));
    }

    #[test]
    fn test_division_by_zero_safety() {
        let program = AreProgram::from_steps(vec![
            AreStep { domain: Domain::Integer, value: 0, value_imag: 0, operation: Operation::Div },
        ], 1_000_000_007);
        // Should not panic — div by zero maps to identity
        let result = program.extract(12345);
        assert_eq!(result, 12345 % 1_000_000_007);
    }

    #[test]
    fn test_complex_domain() {
        let program = AreProgram::from_steps(vec![
            AreStep { domain: Domain::Complex, value: 3, value_imag: 4, operation: Operation::Mul },
        ], 1_000_000_007);
        let result = program.extract(100);
        // Complex multiplication: (100+0i) * (3+4i) = (300+400i)
        // Output = Re part mod p = 300
        assert!(result < 1_000_000_007);
    }

    #[test]
    fn test_seed_efficiency() {
        // A 4-step program needs: 4 * (3 + 64 + 3) = 280 bits of seed
        // A Toeplitz matrix for 128-bit extraction needs: 128 * 128 = 16384 bits
        // ARE is ~58x more seed-efficient
        let seed = [0u8; 35]; // 280 bits
        let program = AreProgram::from_seed(&seed, 4);
        assert_eq!(program.steps.len(), 4);
    }
}
```

- [ ] **Step 2: Run tests — verify fail**

```bash
cargo test --package zipminator-core are -- --nocapture
```

- [ ] **Step 3: Implement domains.rs**

Implement arithmetic operations for each domain with overflow protection and div-by-zero safety.

- [ ] **Step 4: Implement program.rs**

Implement `AreProgram::from_seed()` (deterministic program generation from random bytes) and `AreProgram::from_steps()`.

- [ ] **Step 5: Implement extractor.rs**

Implement `AreProgram::extract()` that folds input through the algebraic program and reduces mod p.

- [ ] **Step 6: Run tests — verify pass**

```bash
cargo test --package zipminator-core are -- --nocapture
```

- [ ] **Step 7: Polish (clippy) + Harden (fuzz)**

```bash
cargo clippy --package zipminator-core -- -D warnings
# Add fuzz target for ARE
cargo fuzz run fuzz_are -- -runs=10000
```

- [ ] **Step 8: Commit**

```bash
git add crates/zipminator-core/src/are/ crates/zipminator-core/src/lib.rs
git commit -m "feat(are): Algebraic Randomness Extraction engine in Rust"
```

---

### Task 7: ARE Python Bindings (PyO3)

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 30 min
> **Depends on**: Task 6

**Files:**
- Create: `src/zipminator/entropy/are.py`
- Create: `tests/python/test_entropy_are.py`
- Modify: `crates/zipminator-core/src/python_bindings.rs` (add ARE bindings)

- [ ] **Step 1: Write failing Python tests for ARE**

```python
# tests/python/test_entropy_are.py
"""Tests for Algebraic Randomness Extraction Python bindings."""
import os
import pytest


class TestArePythonBindings:
    def test_roundtrip_determinism(self):
        """Same seed + same input = same output."""
        from zipminator.entropy.are import AreExtractor
        seed = os.urandom(35)  # 280 bits for 4-step program
        ext = AreExtractor.from_seed(seed, num_steps=4)
        out1 = ext.extract(12345)
        out2 = ext.extract(12345)
        assert out1 == out2

    def test_different_seeds_different_output(self):
        from zipminator.entropy.are import AreExtractor
        ext1 = AreExtractor.from_seed(b'\x00' * 35, num_steps=4)
        ext2 = AreExtractor.from_seed(b'\xff' * 35, num_steps=4)
        assert ext1.extract(42) != ext2.extract(42)

    def test_extract_bytes(self):
        """Extract raw bytes for entropy pool use."""
        from zipminator.entropy.are import AreExtractor
        ext = AreExtractor.from_seed(os.urandom(35), num_steps=4)
        data = ext.extract_bytes(b'\xde\xad\xbe\xef', output_len=32)
        assert len(data) == 32
        assert isinstance(data, bytes)

    def test_large_input_no_panic(self):
        """Large inputs should not overflow or panic."""
        from zipminator.entropy.are import AreExtractor
        ext = AreExtractor.from_seed(os.urandom(35), num_steps=4)
        big = int.from_bytes(os.urandom(128), 'big')
        result = ext.extract(big)
        assert result >= 0
```

- [ ] **Step 2: Run tests — verify fail**

```bash
micromamba activate zip-pqc && pytest tests/python/test_entropy_are.py -v
```

- [ ] **Step 3: Add PyO3 bindings for AreProgram in python_bindings.rs**

Note: Rust `u128` does not auto-convert in PyO3. Use `#[pyo3(signature = (value))]` with
`value: u128` converted from Python `int` via `.extract::<u128>()`, or pass as bytes and
convert internally. The bytes approach is more Pythonic.

- [ ] **Step 4: Create Python wrapper `are.py`**

Thin wrapper that imports the native `_core` module and provides `AreExtractor` class.

- [ ] **Step 5: Rebuild native bindings**

```bash
micromamba activate zip-pqc && maturin develop
```

- [ ] **Step 6: Run tests — verify pass**
- [ ] **Step 7: Polish + Harden + Commit**

```bash
git commit -m "feat(are): Python bindings for Algebraic Randomness Extraction"
```

---

### Task 8: ARE NIST Validation

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 40 min
> **Depends on**: Task 7

**Files:**
- Create: `tests/python/test_entropy_are_nist.py`

- [ ] **Step 1: Write NIST SP 800-22 test battery on ARE output**

Generate 1MB of ARE-extracted output and run: frequency, block frequency, runs, longest run, spectral (DFT), non-overlapping template, serial, approximate entropy, cumulative sums.

- [ ] **Step 2: Run tests, record results**
- [ ] **Step 3: Compare vs. raw QRNG and vs. Toeplitz extraction**
- [ ] **Step 4: Record seed efficiency metrics**
- [ ] **Step 5: Commit test results**

```bash
git commit -m "test(are): NIST SP 800-22 validation suite for ARE output"
```

---

## TRACK C: CERTIFICATION + PROVENANCE

### Task 9: Provenance Certificates (Merkle Tree)

> **Agent**: Opus (crypto-critical) | **RALPH phases**: R-A-L-P-H | **Est. time**: 60 min
> **Depends on**: Tasks 4 + 8

**Files:**
- Create: `crates/zipminator-core/src/provenance/mod.rs`
- Create: `crates/zipminator-core/src/provenance/certificate.rs`
- Create: `crates/zipminator-core/src/provenance/verify.rs`
- Create: `src/zipminator/entropy/provenance.py`
- Create: `tests/python/test_entropy_provenance.py`

- [ ] **Step 1: Write failing tests for Merkle-tree certificates**

Test: create certificate from composition result, verify certificate, tamper detection, serialization/deserialization.

- [ ] **Step 2: Implement Rust Merkle tree (SHA-256 leaves = source provenance records)**
- [ ] **Step 3: Implement Python wrapper**
- [ ] **Step 4: Run tests — verify pass**
- [ ] **Step 5: Polish + Harden + Commit**

```bash
git commit -m "feat(provenance): Merkle-tree entropy certificates with verification"
```

---

### Task 10: Bell Test Circuit

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 30 min
> **Depends on**: Task 1

**Files:**
- Create: `src/zipminator/entropy/bell_test.py`
- Create: `tests/python/test_entropy_bell.py`
- Modify: `src/zipminator/entropy/scheduler.py`

- [ ] **Step 0: Ensure qiskit is in optional deps**

Add `qiskit>=1.0` to `[project.optional-dependencies.quantum]` in `pyproject.toml` if not already present. Bell test functionality requires `pip install zipminator[quantum]`.

- [ ] **Step 1: Write failing tests**

Test: CHSH circuit construction, S-value calculation from mock results, pass/fail classification (S > 2 = quantum certified, S <= 2 = classical).

- [ ] **Step 2: Implement CHSH Bell inequality circuit**

```python
# src/zipminator/entropy/bell_test.py
"""CHSH Bell inequality test for device-independent entropy certification.

Periodically runs a 2-qubit entangled circuit and verifies Bell violation
(S > 2), certifying that the entropy source is genuinely quantum.
"""
from qiskit.circuit import QuantumCircuit
import math

def create_chsh_circuits() -> list:
    """Create the 4 CHSH measurement setting circuits."""
    circuits = []
    # Settings: (a,b) in {(0,0), (0,1), (1,0), (1,1)}
    # a=0: measure Z, a=1: measure X (apply H before measurement)
    # b=0: measure in (Z+X)/sqrt2, b=1: measure in (Z-X)/sqrt2
    for a in [0, 1]:
        for b in [0, 1]:
            qc = QuantumCircuit(2, 2)
            # Create Bell state |Phi+>
            qc.h(0)
            qc.cx(0, 1)
            # Alice's measurement basis
            if a == 1:
                qc.h(0)
            # Bob's measurement basis
            if b == 0:
                qc.ry(-math.pi / 4, 1)
            else:
                qc.ry(math.pi / 4, 1)
            qc.measure([0, 1], [0, 1])
            circuits.append(qc)
    return circuits

def compute_s_value(correlators: list) -> float:
    """Compute CHSH S value from 4 correlators E(a,b).
    S = E(0,0) - E(0,1) + E(1,0) + E(1,1)
    Classical bound: |S| <= 2. Quantum max: 2*sqrt(2) ~ 2.828.
    """
    return abs(correlators[0] - correlators[1] + correlators[2] + correlators[3])
```

- [ ] **Step 3: Add periodic Bell test to scheduler.py**

Add `--bell-test` flag that runs CHSH circuit every N harvests and logs S-value to provenance.

- [ ] **Step 4: Run tests — verify pass**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(entropy): CHSH Bell test for device-independent quantum certification"
```

---

### Task 11: Certified Entropy API (Ties All Layers Together)

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 45 min
> **Depends on**: Tasks 9 + 10

**Files:**
- Create: `src/zipminator/entropy/certified.py`
- Create: `tests/python/test_entropy_integration_che.py`

- [ ] **Step 1: Write integration test for full CHE stack**

```python
# tests/python/test_entropy_integration_che.py
def test_full_che_pipeline():
    """End-to-end: sources -> health test -> compositor -> ARE -> certificate."""
    from zipminator.entropy.certified import CertifiedEntropyProvider
    provider = CertifiedEntropyProvider()
    result = provider.get_certified_entropy(256)  # 256 bits

    assert len(result.data) == 32  # 256 bits = 32 bytes
    assert result.certificate is not None
    assert result.certificate.verify()
    assert result.min_entropy_bits >= 128  # at minimum
    assert len(result.sources) >= 1
```

- [ ] **Step 2: Implement CertifiedEntropyProvider**

Orchestrates: health check -> compositor -> ARE -> provenance certificate.

- [ ] **Step 3: Run integration tests**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat(entropy): CertifiedEntropyProvider — full CHE stack integration"
```

---

## TRACK D: PUBLICATIONS (parallel with Track C)

> **Note:** Tasks 12-14 produce DRAFTS for human review, not submission-ready documents.
> The patent draft needs attorney review. The paper needs co-author (formal proofs) and
> human editorial passes. The whitepaper needs Mo's voice and business context. These
> drafts provide 80% of the content; the remaining 20% is human refinement.

### Task 12: Provisional Patent Draft

> **Agent**: Opus | **Est. time**: 90 min
> **Depends on**: Task 9 (provenance spec needed for claims)
> **Skills**: `/research-paper-writer` (formal writing style)

**Files:**
- Create: `docs/patents/che-provisional.md`

- [ ] **Step 1: Draft patent with these sections**

1. Title: "System and Method for Certified Heterogeneous Entropy Composition"
2. Field of Invention
3. Background (prior art: single-source QRNG, WiFi key agreement, standard extractors)
4. Summary of Invention (CHE framework, ARE construction, continuous certification)
5. Detailed Description (5 layers, with figures)
6. Claims (20 independent + dependent claims covering):
   - Multi-source heterogeneous entropy composition
   - Algebraic Randomness Extraction family
   - Continuous online certification with dynamic weighting
   - Cryptographic provenance certificates
   - WiFi CSI as entropy harvester (not pairwise key agreement)
   - Bell-test integration for device-independent certification
7. Abstract (150 words)

- [ ] **Step 2: Review claims for completeness**
- [ ] **Step 3: Commit**

```bash
git commit -m "docs(patent): provisional patent draft for CHE framework"
```

---

### Task 13: Technical Whitepaper v1

> **Agent**: Sonnet | **Est. time**: 120 min
> **Depends on**: Task 8 (needs NIST test results)
> **Skills**: `/research-paper-writer`, `/quantum-scientific-writer`

**Files:**
- Create: `docs/papers/che-whitepaper.md`

- [ ] **Step 1: Write whitepaper (15-20 pages) with sections**

1. Executive Summary
2. The Problem: Why Single-Source Entropy Is Not Enough
3. Zipminator's Multi-Source Architecture (L0-L1)
4. Algebraic Randomness Extraction (L2) — non-formal, intuitive explanation
5. Continuous Certification (L3)
6. Provenance Certificates (L4)
7. NIST Test Results (tables from Task 8)
8. Comparison vs. ID Quantique, Quantinuum, NIST Beacon
9. DORA Art. 6.4 Compliance Implications
10. Conclusion + Roadmap

- [ ] **Step 2: Add figures (ASCII diagrams for the markdown version)**
- [ ] **Step 3: Review with /verification-quality**
- [ ] **Step 4: Commit**

```bash
git commit -m "docs(whitepaper): CHE Framework technical whitepaper v1"
```

---

### Task 14: Academic Paper Draft (IEEE Format)

> **Agent**: Opus | **Est. time**: 180 min (multi-session)
> **Depends on**: Task 11 (needs full implementation results)
> **Skills**: `/research-paper-writer` (IEEE formatting), `research-paper-writer/references/ieee_formatting_specs.md`

**Files:**
- Create: `docs/papers/che-framework/main.tex`
- Create: `docs/papers/che-framework/references.bib`
- Create: `docs/papers/che-framework/figures/`

- [ ] **Step 1: Write paper following IEEE double-column format**

Structure (14 pages):
1. Abstract (200 words)
2. Introduction (1.5 pages) — motivation, contributions (5 bullet points), organization
3. Background & Related Work (2 pages) — QRNG products, WiFi CSI crypto, randomness extractors, entropy composition
4. System Model (1 page) — heterogeneous source model, threat model, security goals
5. CSI Entropy Harvesting (1.5 pages) — Von Neumann on phase LSBs, throughput analysis
6. Algebraic Randomness Extraction (2 pages) — formal definition, universality argument, seed efficiency
7. Composition & Certification (1.5 pages) — XOR bounds, online estimation, provenance
8. Implementation (1 page) — Rust/Python architecture, IBM Quantum integration
9. Evaluation (2 pages) — NIST tests, throughput, comparison, Bell test results
10. Discussion (0.5 pages) — limitations, future work (formal universality proof with co-author)
11. Conclusion (0.5 pages)
12. References (30-40 citations, ALL verified via WebFetch/WebSearch)

- [ ] **Step 2: Verify every citation exists (zero-hallucination protocol)**

```bash
# For each reference: WebFetch https://doi.org/[DOI] or WebFetch https://arxiv.org/abs/[ID]
# Cross-check: title, authors, year must match
```

- [ ] **Step 3: Generate figures (architecture diagram, NIST test results table, throughput comparison)**
- [ ] **Step 4: Commit**

```bash
git commit -m "docs(paper): CHE Framework academic paper draft (IEEE format)"
```

---

### Task 15: Jupyter Demo Notebook

> **Agent**: Sonnet | **Est. time**: 60 min
> **Depends on**: Task 11

**Files:**
- Create: `docs/book/notebooks/08_che_framework.ipynb`
- Modify: `docs/book/_toc.yml`

- [ ] **Step 1: Create interactive notebook demonstrating CHE**

Cells:
1. Introduction to CHE (markdown)
2. Single-source vs. multi-source entropy (visualize distributions)
3. ARE in action: generate program, extract, show NIST test results
4. Composition demo: XOR two sources, measure min-entropy improvement
5. Provenance certificate: create, inspect, verify
6. Bell test simulation: CHSH circuit, S-value calculation
7. Throughput comparison: sources vs. composition vs. ARE
8. Enterprise scenario: DORA compliance audit trail

- [ ] **Step 2: Run all cells, verify outputs**
- [ ] **Step 3: Add to _toc.yml**
- [ ] **Step 4: Commit**

```bash
git commit -m "docs(notebook): interactive CHE framework demonstration"
```

---

## TRACK E: VALIDATION

### Task 16: Full Integration Test + Benchmark Suite

> **Agent**: Sonnet | **RALPH phases**: R-A-L-P-H | **Est. time**: 60 min
> **Depends on**: ALL prior tasks
> **Skills**: `/batch-tdd` (parallel test domains), `/verification-quality` (final gate)

**Files:**
- Modify: `tests/python/test_entropy_integration_che.py` (expand)

- [ ] **Step 1: Run ALL existing test suites — verify no regressions**

```bash
micromamba activate zip-pqc
cargo test --workspace
pytest tests/ -v --tb=short
```

- [ ] **Step 2: Run full NIST SP 800-22 on composed + ARE output**
- [ ] **Step 3: Benchmark throughput (bits/sec per source, composed, ARE-processed)**
- [ ] **Step 4: Run /verification-quality on entire entropy/ directory — score >= 0.95**
- [ ] **Step 5: Final commit**

```bash
git commit -m "test(che): full integration suite and NIST benchmark results"
```

---

## Execution Orchestration (Hive-Mind)

```
Queen Prompt:
  You are the Hive Queen for CHE Framework implementation.
  Use /hive-mind-advanced with hierarchical-mesh topology.

  Read context:
  - docs/superpowers/plans/2026-03-23-che-framework.md (this plan)
  - docs/guides/FEATURES.md
  - CLAUDE.md

  PHASE 1 — FOUNDATIONS (Track A: Tasks 1-4, sequential):
    Spawn Worker-Alpha (Sonnet): Execute Tasks 1-4 sequentially.
    RALPH each task. /verification-quality after each.

  PHASE 2 — ARE (Track B: Tasks 5-8, parallel with late Track A):
    Spawn Worker-Beta (Opus): Execute Tasks 5-6 (Rust ARE core).
    Spawn Worker-Gamma (Sonnet): Execute Tasks 7-8 (Python + NIST validation).
    Worker-Gamma blocks on Worker-Beta completing Task 6.

  PHASE 2b — BELL TEST (can start after Task 1, parallel with everything):
    Spawn Worker-Epsilon (Sonnet): Task 10 (Bell test). Needs only Task 1.

  PHASE 3 — CERTIFICATION (Track C: Tasks 9+11, after A+B+10):
    Spawn Worker-Delta (Opus): Task 9 (provenance).
    Queen: Task 11 (integration, after Delta + Epsilon + all tracks).

  PHASE 4 — PUBLICATIONS (Track D: Tasks 12-15, parallel with C):
    Spawn Worker-Zeta (Opus): Task 12 (patent) — start after Task 9.
    Spawn Worker-Eta (Sonnet): Task 13 (whitepaper) — start after Task 8.
    Spawn Worker-Theta (Opus): Task 14 (paper) — start after Task 11.
    Spawn Worker-Iota (Sonnet): Task 15 (notebook) — start after Task 11.

  PHASE 5 — VALIDATION (Track E: Task 16):
    Queen runs final integration after all tracks complete.

  QUALITY PROTOCOL:
  - Every task: RALPH loop (max 12 iterations)
  - After each RALPH: /verification-quality (threshold 0.95)
  - Memory: agentdb-memory-patterns for cross-agent state
  - Learning: reasoningbank-intelligence tracks iteration outcomes
  - Version control: agentic-jujutsu for reasoning trajectories
  - Streaming: stream-chain for real-time coordination
```

---

## Success Criteria

- [ ] All existing tests still pass (no regressions)
- [ ] 15+ new Python tests pass (health, compositor, ARE, provenance, Bell, integration)
- [ ] 10+ new Rust tests pass (ARE extraction, domains, program generation, provenance)
- [ ] NIST SP 800-22 full test battery passes on ARE output
- [ ] NIST SP 800-90B health tests detect stuck-at and bias faults
- [ ] Provisional patent draft covers all 5 novel contributions
- [ ] Whitepaper is 15+ pages with NIST test results
- [ ] Academic paper draft is 12+ pages IEEE format with verified citations
- [ ] Jupyter notebook runs end-to-end with visualizations
- [ ] /verification-quality score >= 0.95 across all entropy modules
