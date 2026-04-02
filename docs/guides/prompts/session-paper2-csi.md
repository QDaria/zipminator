# Session: Paper 2 — CSI Entropy (ACM WiSec)

> Paste this into a fresh Claude Code terminal. Self-contained.

/effort max

## Task

Write the first academic paper demonstrating WiFi CSI as a unilateral entropy source with NIST SP 800-90B validation. This has never been published. Target venue: ACM Conference on Security and Privacy in Wireless and Mobile Networks (WiSec).

## Context (READ THESE FILES FIRST)

1. `scripts/csi_entropy_pipeline.py` — Working pipeline (CSIKit + Von Neumann + SP 800-90B)
2. `crates/zipminator-mesh/src/csi_entropy.rs` — Rust implementation (Von Neumann, flush_to_file, 118 tests)
3. `crates/zipminator-mesh/src/puek.rs` — PUEK (location-locked keys from CSI eigenstructure)
4. `crates/zipminator-mesh/src/entropy_bridge.rs` — HKDF-SHA256 key derivation
5. `src/zipminator/entropy/csi_pool_provider.py` — Python pool reader (11 tests)
6. `src/zipminator/entropy/compositor.py` — XOR composition with health monitoring
7. `quantum_entropy/csi_entropy_pool.bin` — 3 KB real CSI entropy (Nexmon/Broadcom dataset)
8. `quantum_entropy/quantum_entropy_pool.bin` — 2.7 MB real IBM quantum entropy (for comparison)
9. `memory/project_csi_entropy_patent.md` — Prior art search results, novelty assessment
10. `docs/book/content/qmesh.md` — Q-Mesh documentation (clearance levels L1-L4)

## Key Result (already measured, April 1 2026)

NIST SP 800-90B non-IID entropy assessment (`ea_non_iid -a <file> 8`):

| Source | Min-Entropy (bits/byte) |
|--------|------------------------|
| WiFi CSI (Nexmon/Broadcom, real capture) | **5.50** |
| IBM Quantum (ibm_kingston, 156q) | **6.35** |
| os.urandom (CSPRNG) | **6.36** |

This is the headline result. No paper has ever published SP 800-90B measurements for WiFi CSI.

## Prior Art (all bilateral, none unilateral)

- Mathur et al. 2008 "Radio-Telepathy" (MobiCom) — bilateral key agreement
- Jana et al. 2009 (MobiCom) — bilateral, showed static environments yield low entropy
- Liu et al. 2012 (IEEE TIFS) — bilateral, CSI >> RSSI for key generation
- Avrahami et al. 2023 — bilateral, 1.2-1.6 secure bits/packet
- Chatterjee et al. 2018 RF-PUF — fingerprints hardware (transmitter), not environment
- Zero papers on unilateral CSI entropy harvesting

## Paper Structure (~12-15 pages)

1. **Introduction**: The entropy problem for IoT/mesh networks. Cost of QRNG ($1.60/s) vs CSI ($5 once). The gap: nobody has measured CSI min-entropy with SP 800-90B.

2. **Background**: OFDM CSI (subcarriers, amplitude, phase). Von Neumann debiasing. NIST SP 800-90B methodology. Bilateral key agreement (prior art). Why unilateral is different.

3. **System Design**: Phase LSB extraction from 56 subcarriers. Von Neumann extractor. Pool file architecture. CsiPoolProvider with provenance (no OS fallback).

4. **PUEK: Physical Unclonable Environment Keys**: CSI eigenstructure → SVD → enrollment → HKDF derivation. Location-locked cryptography. Configurable thresholds (0.75-0.98).

5. **Evaluation**:
   - SP 800-90B results table (CSI vs QRNG vs CSPRNG)
   - Extraction ratio (~24.5% after Von Neumann)
   - Throughput estimate (140-280 bits/s from 20 Hz × 56 subcarriers)
   - Shannon entropy vs min-entropy comparison
   - Static vs dynamic environment (when Pi data available)
   - Independence between two capture locations (when Pi data available)

6. **Economics**: IBM Quantum free tier (10 min/mo, ~80 KB/job, $1.60/s paid) vs one ESP32-S3 ($5, 45-90 MB/mo, offline). Table showing cost per MB of entropy.

7. **Integration with PQC**: XOR composition with QRNG pool. HKDF-SHA256 → ML-KEM-768 mesh keys. Defense-in-depth (XOR lemma guarantee). CHE framework reference.

8. **Security Analysis**: Thermal noise is fundamental physics. Adversary model (must replicate multipath environment). Static environment degradation. Comparison to bilateral threat model.

9. **Conclusion**: First SP 800-90B validation of WiFi CSI entropy. 5.50 bits/byte from real hardware. $5 replaces $1.60/s. Open-source implementation.

## Output

Create `docs/research/csi-entropy-paper/main.tex` (ACM sigconf format). Include all sections, the results table, and proper BibTeX references. Verify every citation with WebFetch before adding.

## Quality

Run /verification-quality after drafting. All claims must be supported by code or measured data. No mock results. No unverified citations. Use the actual SP 800-90B numbers from the pipeline run.

## CRITICAL RULES

- The CSI data is from a PUBLIC DATASET (Gi-z/CSI-Data, TU Darmstadt). Cite it properly.
- NEVER claim CSI entropy is "quantum" — it is classical physical entropy.
- NEVER claim "FIPS certified" — only "implements FIPS 203 (ML-KEM-768)".
- The 5.50 bits/byte figure is from the MCV estimator with 99% confidence bound.
- Distinguish min-entropy (conservative, security-relevant) from Shannon entropy (theoretical upper bound).

## Skills to load

Load: /quantum-scientific-writer, /research-paper-writer, /verification-quality, /quantum-assurance-validator, /quantum-statistical-validator
