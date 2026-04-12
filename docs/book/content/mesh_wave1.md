# Q-Mesh: Physical Cryptography Wave 1

On 2026-03-20, Zipminator shipped six physical-layer cryptography primitives inside `crates/zipminator-mesh/`. Together they turn raw WiFi channel-state information (CSI) into authenticated sensing mesh keys, and they integrate with the RuView ESP32-S3 mesh hardware used in field deployments. This chapter is the developer reference for Wave 1.

```{note}
Wave 1 focuses on primitives. Wave 2 adds the attestation protocol on top of these primitives and is documented separately.
```

## Module map

| Module | Purpose |
|--------|---------|
| `csi_entropy.rs` | Harvest min-entropy from WiFi CSI snapshots |
| `puek.rs` | Physical Unclonable Environment Key derived from CSI eigenstructure |
| `em_canary.rs` | Electromagnetic threat-level canary driving key rotation |
| `vital_auth.rs` | Continuous authentication from WiFi-derived vitals |
| `topo_auth.rs` | Topology-invariant mesh authentication |
| `spatiotemporal.rs` | Spatiotemporal presence proofs for non-repudiation |

Each module is independent and composable. Downstream code in `crates/zipminator-core/` consumes the outputs via well-defined traits.

## CSI Entropy Harvester (`csi_entropy.rs`)

The entropy harvester is the first module in the pipeline. It turns raw WiFi CSI snapshots into an entropy pool that downstream code can pull from.

### Pipeline

1. Capture CSI snapshot from the driver
2. Apply Von Neumann debiasing to remove static bias
3. XOR with a QRNG sample from the hardware pool
4. Tag the output with a provenance record
5. Expose the result through the `PoolEntropySource` trait

### API sketch

```rust
use zipminator_mesh::csi_entropy::{CsiHarvester, PoolEntropySource};

let harvester = CsiHarvester::new(driver_handle, qrng_source);
let bytes = harvester.pool_read(32)?;   // 32 bytes of certified entropy
assert_eq!(bytes.len(), 32);
```

```{tip}
The harvester expects CSI snapshots at 1 kHz or above. On slower drivers, buffering kicks in and the pool refills at the driver's actual rate.
```

## PUEK: Physical Unclonable Environment Key (`puek.rs`)

PUEK derives a site-specific key from the eigenstructure of a sequence of CSI snapshots. It behaves like a software PUF anchored to the physical environment.

### Profiles

Three profiles are shipped:

- `Scif`: for SCIF-grade deployments, with strict variance thresholds and frequent re-derivation
- `Office`: for enterprise deployments, with balanced thresholds
- `Home`: for prosumer deployments, with relaxed thresholds to tolerate noisier environments

### Derivation

PUEK runs an SVD on a stacked CSI matrix, selects the top-k singular vectors, quantises them to a fixed grid, and hashes the result to produce a 256-bit key.

```rust
use zipminator_mesh::puek::{Puek, Profile};

let key = Puek::new(Profile::Office).derive(&csi_snapshots)?;
assert_eq!(key.len(), 32);
```

## EM Canary (`em_canary.rs`)

The canary watches the electromagnetic floor for anomalies. It outputs one of four threat levels on each tick:

1. Normal
2. Elevated
3. High
4. Critical

The policy engine consumes the current level and triggers actions (for example, rotate mesh keys, pause traffic, force re-auth).

```rust
use zipminator_mesh::em_canary::{Canary, ThreatLevel, Policy};

let canary = Canary::new();
match canary.tick()? {
    ThreatLevel::Normal    => {},
    ThreatLevel::Elevated  => Policy::increase_rekey_rate(),
    ThreatLevel::High      => Policy::force_rekey_now(),
    ThreatLevel::Critical  => Policy::pause_traffic(),
}
```

## Vital-Sign Continuous Auth (`vital_auth.rs`)

`vital_auth.rs` turns WiFi-derived vitals (micro-motion signatures, breathing rhythm) into a rolling HMAC that continuously re-authenticates the user.

- Rolling HMAC window updates at configurable rate
- Drift detection flags gradual changes (for example, a different user sitting down)
- Liveness detection rejects replayed vitals

```rust
use zipminator_mesh::vital_auth::{VitalAuth, AuthState};

let mut auth = VitalAuth::new(seed_key);
match auth.update(&vital_frame)? {
    AuthState::Ok       => proceed(),
    AuthState::Drift    => request_reconfirm(),
    AuthState::Rejected => terminate_session(),
}
```

```{warning}
Vital-auth is a defence in depth. It should never be the sole gate for access to a secret. Combine it with a PQC credential.
```

## Topological Mesh Authentication (`topo_auth.rs`)

Mesh topology is encoded as a graph using `petgraph`. Topology invariants (number of components, diameter, spectral signature) form a fingerprint that must match on re-auth. Any structural change to the mesh triggers re-authentication of the affected subgraph.

```rust
use zipminator_mesh::topo_auth::{TopoAuth, TopoFingerprint};

let auth = TopoAuth::new();
let fp: TopoFingerprint = auth.fingerprint(&mesh_graph);
if !auth.matches(&fp, &previous_fp) {
    auth.force_reauth(&affected_subgraph)?;
}
```

## Spatiotemporal Non-Repudiation (`spatiotemporal.rs`)

This module produces presence proofs: signed tuples of `(csi_fingerprint, vital_fingerprint, timestamp)` that tie a user and a moment to a physical location. Proofs are non-repudiable under the certified entropy combiner.

```rust
use zipminator_mesh::spatiotemporal::{PresenceProver, PresenceProof};

let prover = PresenceProver::new(signing_key);
let proof: PresenceProof = prover.prove(&csi_fp, &vital_fp, timestamp)?;
proof.verify(&verifier_key)?;
```

```{tip}
Presence proofs are useful for audit trails in regulated industries. They are designed to be short (under 2 KB per proof) so they can be stored alongside every security-relevant action.
```

## Testing

Wave 1 ships with 106 mesh tests: 90 unit tests plus 16 integration tests exercising end-to-end scenarios across multiple modules. The workspace total is 513 tests across all crates.

```bash
cargo test -p zipminator-mesh          # run Wave 1 tests only
cargo test --workspace                 # run everything
```

### Coverage highlights

- `csi_entropy.rs`: Von Neumann debiasing correctness, pool refill under driver stall
- `puek.rs`: SVD stability under noise, profile boundary cases
- `em_canary.rs`: threshold crossings, level hysteresis
- `vital_auth.rs`: drift detection, liveness against replay
- `topo_auth.rs`: fingerprint invariance under permutation, sensitivity to real change
- `spatiotemporal.rs`: proof generation, proof verification, tampering rejection

## Integration

The end-to-end notebook for Wave 1 lives at:

```
notebooks/08_qmesh_physical_crypto.ipynb
```

It walks through capturing CSI, running the full pipeline, and verifying a presence proof in under 60 seconds on a laptop with a supported WiFi chipset.

## Related chapters

- [Q-Mesh](qmesh.md), the Q-Mesh overview and clearance model
- [Clearance levels](clearance_levels.md), policy tiers consumed by `em_canary`
- [Entropy](entropy.md), the pool that `csi_entropy` feeds
- [Research papers](papers.md), the academic background for CSI entropy and combiner
- [Patent portfolio](patents.md), the IP protecting these modules
