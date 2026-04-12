# Patent Portfolio

Three Zipminator patent applications were filed with Patentstyret (the Norwegian Industrial Property Office) in March 2026. Together they contain 46 claims across quantum one-time padding, CSI entropy harvesting, and certified heterogeneous entropy mixing. The PCT filing deadline for Patent 1 is 2027-03-24. This chapter summarises what is filed, what the claims protect, and how to approach licensing.

```{warning}
Patent information is provided for transparency. It is not legal advice. Consult a qualified patent attorney for specific use cases.
```

## Patent 1: Quantum OTP for Irreversible Anonymisation

- Title area: Quantum one-time pad applied to irreversible anonymisation of structured records (Pillar 5, Level 10)
- Filing: Patentstyret, March 2026
- PCT deadline: 2027-03-24
- Claim count: 18 (independent and dependent combined)

### Overview

Patent 1 covers a method for anonymising structured records by XOR-combining a quantum-sampled one-time pad with the record, binding the result to an audit-friendly transcript, and proving the anonymisation is irreversible in an information-theoretic sense. The claims track the construction used by the `anonymize_level10` path in the Python SDK and by the corresponding Rust core.

## Patent 2: CSI Entropy Harvesting

- Title area: Harvesting min-entropy from WiFi channel-state information in a unilateral receiver
- Filing: Patentstyret, March 2026
- Claim count: 14

### Overview

Patent 2 covers the pipeline that turns raw WiFi CSI snapshots into a certified entropy pool: bias removal, debiasing, min-entropy estimation, and the provenance-tagged combiner that feeds the PoolEntropySource trait used by the Rust core. It also covers the associated hardware-agnostic APIs that let the pipeline run on commodity WiFi chipsets without privileged drivers.

## Patent 3: Certified Heterogeneous Entropy Mixing

- Title area: Certified combiner for heterogeneous entropy sources with per-source leakage budgets
- Filing: Patentstyret, March 2026
- Claim count: 14

### Overview

Patent 3 covers the combiner that mixes quantum, CSI, and OS entropy into a single pool while retaining a security guarantee when at most one source is adversarial. The claims include the provenance tag format, the composition theorem enforcement at runtime, and the constant-time implementation used in production.

## What the patents protect

The three patents form a layered protection envelope around Zipminator's entropy and anonymisation stack:

| Patent | Protects | Matching code path |
|--------|----------|---------------------|
| 1 | Quantum OTP irreversible anonymisation | `src/zipminator/anonymization/level10.py`, Rust `zipminator-core::otp` |
| 2 | CSI entropy harvesting | `crates/zipminator-mesh/src/csi_entropy.rs` |
| 3 | Certified heterogeneous entropy mixing | `crates/zipminator-core/src/entropy/combiner.rs` |

In plain language:

- Patent 1 stops a third party from shipping an anonymisation product that uses a quantum-sourced pad plus an audit transcript in the same structural way.
- Patent 2 stops a third party from shipping a WiFi CSI entropy harvester that turns a unilateral receiver's CSI stream into certified min-entropy.
- Patent 3 stops a third party from shipping a combiner that mixes heterogeneous entropy sources with per-source leakage budgets bound by provenance tags.

```{note}
Patents protect against commercial use of the claimed method, not against academic study. Researchers are welcome to read the public papers and the open-source repositories listed in [Research papers](papers.md).
```

## Scope and limits

Patent claims bite only on the specific method set out in the claim text. Engineers who want to build adjacent systems should read the granted claims and, where needed, engage counsel. Common questions:

- Do the patents cover any use of Kyber or any PQC scheme? No. The PQC primitives themselves come from NIST standards (FIPS 203, 204, 205) and are open. The patents cover integration patterns around entropy and anonymisation.
- Do the patents cover all CSI-based key derivation? No. Patent 2 targets the unilateral pipeline with Von Neumann debiasing and the certified provenance tag. A bilateral, reciprocal channel-based scheme is outside scope.
- Do the patents cover all entropy mixers? No. Patent 3 requires the per-source leakage budget and the provenance-tagged combiner. A plain XOR of two sources without the certificate is outside scope.

## Licensing

Zipminator offers commercial licensing of the three patents. For enquiries contact:

```
enterprise@qdaria.com
```

The contact above is the single entry point. Terms are negotiated per customer and depend on the intended deployment scope (for example, internal use, SaaS offering, embedded in a third-party product).

```{warning}
This page deliberately does not state licence fees, royalty rates, or grant-back terms. Any specific terms come from a signed licence agreement with QDaria AS.
```

## Related chapters

- [Research papers](papers.md), the academic side of the same research line
- [Entropy](entropy.md), the runtime system covered by Patents 2 and 3
- [Anonymization](anonymization.md), the runtime system covered by Patent 1
- [Compliance](compliance.md), how patents and publications support regulatory audits
