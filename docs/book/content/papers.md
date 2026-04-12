# Research Papers

The cryptographic foundations underpinning Zipminator are published as three peer-reviewed-track papers. Each paper is paired with a public GitHub repository that contains the proofs, experiment code, and artefacts required to reproduce the results. This chapter summarises the papers, their target venues, and how to cite them.

```{note}
Publication status, venue targets, and submission windows are tracked continuously. See the project memory file and the repository READMEs for the authoritative status.
```

## Paper 1: Quantum-Certified Anonymization

Paper 1 addresses certified anonymisation for structured records using quantum-derived entropy. It introduces IND-ANON (indistinguishability under anonymisation), a composition theorem for anonymisation transcripts, and a universal composability treatment that lets the scheme plug into larger PQC protocol stacks.

### Summary

Classical anonymisation techniques typically rely on heuristics (for example, k-anonymity thresholds) that leak information under active adversaries. Paper 1 replaces the heuristic with a certificate: an anonymisation transcript that binds the output to a quantum-sampled one-time pad and to the IND-ANON game. Under this definition, the adversary cannot distinguish a correctly anonymised record from an independently drawn record, even with auxiliary knowledge, as long as the pad is quantum-sourced and bound through the certified protocol.

### Venue

- Target: PoPETs 2027
- Submission deadline: 2026-05-31
- Prior cycle: an earlier ePrint submission was rejected with the feedback "insufficient contribution". The rewrite strengthens the paper with IND-ANON, the composition theorem, and a UC security argument.

### Repository

```
https://github.com/QDaria/quantum-certified-anonymization
```

The repository contains the LaTeX source, proof scripts, experiment harnesses, and the entropy traces used to regenerate the empirical figures.

## Paper 2: Unilateral CSI Entropy

Paper 2 studies channel-state-information (CSI) entropy harvested from a unilateral WiFi receiver. It shows that a single-sided receiver, without cooperation from the transmitter, can extract min-entropy from the physical channel at a rate sufficient to seed an authenticated-encryption scheme, with explicit bounds under a standard adversarial WiFi model.

### Summary

Most prior work on CSI-based key agreement assumes a reciprocal channel and two cooperating endpoints. Paper 2 drops the reciprocity requirement. The receiver observes CSI magnitudes over a moving window, applies a Von Neumann debiasing step to remove static bias, and proves a min-entropy lower bound under adversarial motion and spoofing. The extracted pool feeds the same PoolEntropySource trait used across Zipminator's crypto core.

### Venue

- Target: ACM CCS 2026
- Abstract deadline: 2026-04-22
- Paper deadline: 2026-04-29

### Repository

```
https://github.com/QDaria/unilateral-csi-entropy
```

## Paper 3: Certified Heterogeneous Entropy

Paper 3 generalises the entropy combiner used by Zipminator in production. It treats multiple heterogeneous entropy sources (quantum hardware, CSI, OS RNG) as distinct oracles with different leakage profiles and builds a certified combiner that retains a security guarantee even when one or more of the sources is adversarially controlled.

### Summary

A naive XOR combiner preserves min-entropy only when at least one source is honest. Paper 3 sharpens that guarantee with a certificate that binds every contribution to a provenance tag, proves a composition theorem across tags, and shows how to run the combiner in constant time. The proof is modular: each oracle comes with its own leakage budget, and the combined budget is additive.

### Venue

- Target: ACM CCS 2026
- Same submission window as Paper 2

### Repository

```
https://github.com/QDaria/certified-heterogeneous-entropy
```

## Citation guidance

Until the papers appear in their venue proceedings, cite the arXiv or ePrint preprints. The repositories carry the current citation block. Placeholders below will be updated once venue acceptance is confirmed.

```bibtex
@misc{qdaria2026qca,
  title        = {Quantum-Certified Anonymization},
  author       = {QDaria Research},
  year         = {2026},
  howpublished = {Preprint, submission in progress},
  note         = {See https://github.com/QDaria/quantum-certified-anonymization}
}

@misc{qdaria2026csi,
  title        = {Unilateral CSI Entropy},
  author       = {QDaria Research},
  year         = {2026},
  howpublished = {Preprint, submission in progress},
  note         = {See https://github.com/QDaria/unilateral-csi-entropy}
}

@misc{qdaria2026mix,
  title        = {Certified Heterogeneous Entropy Mixing},
  author       = {QDaria Research},
  year         = {2026},
  howpublished = {Preprint, submission in progress},
  note         = {See https://github.com/QDaria/certified-heterogeneous-entropy}
}
```

```{tip}
When citing in a publication, check the repository README for the latest BibTeX. The entries above are kept deliberately generic so they do not go stale between preprint and camera-ready.
```

## Reproducibility

Each paper repository follows the same layout:

- `paper/`: LaTeX source, figures, proofs
- `experiments/`: runnable scripts and data loaders
- `data/`: small, checked-in entropy traces or links to externally hosted datasets
- `Makefile`: one-command build for the PDF and for the experiment artefacts

### Typical reproduction flow

```bash
git clone https://github.com/QDaria/unilateral-csi-entropy
cd unilateral-csi-entropy
micromamba activate zip-pqc
uv pip install -r experiments/requirements.txt
make figures        # regenerates all plots used in the paper
make pdf            # rebuilds the PDF (requires a TeX distribution)
```

```{warning}
Some figures depend on hardware-captured CSI traces that are too large to commit directly. In those cases the repository includes a download script that fetches the data from an externally hosted archive.
```

## Related chapters

- [Entropy](entropy.md), the entropy combiner that the papers formalise
- [Q-Mesh: Physical Cryptography Wave 1](mesh_wave1.md), the CSI harvester in code
- [Patent portfolio](patents.md), the patent side of the same research line
- [Compliance](compliance.md), how published proofs support regulatory audits
