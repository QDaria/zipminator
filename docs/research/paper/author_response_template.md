# Author Response Template — PoPETs 2026 Submission

**Paper**: Quantum-Certified Anonymization: Irreversibility Beyond Computational Hardness
**Authors**: Daniel Mo Houshmand

---

## Predictable Reviewer Concerns and Pre-Drafted Responses

### Concern 1: "Why is the Born rule a stronger foundation than CSPRNG security?"

**Response**: The distinction is between a *computational assumption* and a *physical law verified by experiment*. A CSPRNG's security depends on (a) the seed remaining secret and (b) no efficient algorithm breaking the underlying primitive. Both conditions are falsifiable: the seed is a physical object that can be captured via memory forensics, cold boot attacks, or side channels (Table 1); and the computational hardness assumption may be broken by algorithmic advances or quantum computing. The Born rule, by contrast, has been tested in loophole-free Bell experiments (Hensen et al. 2015, Nobel Prize 2022) and holds under every empirically viable interpretation of quantum mechanics, including Bohmian mechanics (which reproduces Born-rule statistics despite having hidden variables; see our proof of Theorem 2). The paper does not claim the Born rule is *absolutely certain*; it claims it provides a qualitatively stronger foundation than any computational hardness assumption, a claim formalized in our three-tier hierarchy (Definitions 1-3) and the strict ordering proved in Lemma 1.

**Key sections**: Section 2.1 (Born rule), Section 2.2 (Bell's theorem), Theorem 2 proof (Bohmian mechanics paragraph), Definition 3.

---

### Concern 2: "What if the quantum hardware vendor is compromised?"

**Response**: This is acknowledged explicitly in Limitation 5 (Trust in quantum hardware vendors). We describe three mitigations: (1) multi-provider aggregation (Section 6.3): drawing entropy from multiple independent providers so compromise requires collusion; (2) statistical testing: NIST SP 800-22 validation rejects biased outputs (Table 9); and (3) device-independent certification (Future Work item 3): Bell inequality violations can verify randomness without trusting the device. We note that vendor trust is a weaker assumption than CSPRNG seed secrecy, because the vendor must actively collude (a detectable act) rather than the seed merely being exposed (a passive vulnerability). For organizations requiring the strongest guarantees, we recommend the device-independent extension outlined in Section 11.

**Key sections**: Section 10 (Limitations, item 5), Section 6.3 (multi-provider architecture), Section 11 (Future Work, item 3).

---

### Concern 3: "Broadbent and Islam (2020) already proposed quantum certified deletion. How is this different?"

**Response**: Quantum certified deletion (Broadbent-Islam, CRYPTO 2020) addresses a fundamentally different problem. In their framework, a sender encrypts data, transmits it to a receiver, and later requests deletion; the receiver can produce a classical certificate proving deletion occurred. The quantum property ensures that the certificate and the data cannot both exist. Our work addresses data *anonymization*, not data *transmission*. The anonymization system operates on a local dataset: it replaces PII values with QRNG tokens and destroys the mapping. There is no receiver, no certificate, and no quantum channel. The quantum property we exploit is different: Born-rule indeterminacy of measurement outcomes (no seed to capture), not the no-cloning theorem (cannot copy quantum state). Table 6 in the paper compares our approach with QKD on exactly these dimensions: the two use different quantum properties for different purposes.

**Key sections**: Section 8.4 (Quantum Encryption with Certified Deletion), Table 6 (QKD comparison), Section 9.4 (Comparison with QKD).

---

### Concern 4: "L10 has zero utility. Who would use a system that destroys all data value?"

**Response**: L10 is designed for a specific, high-value use case: satisfying GDPR Article 17 (right to erasure) and Recital 26 (anonymous data falls outside GDPR scope) without destroying the dataset structure. Consider an organization that must delete personal data upon request but wants to retain the dataset for schema documentation, system testing, or record-count auditing. L10 produces a dataset that preserves the row/column structure with all values replaced, providing the strongest technical basis for claiming the data is anonymous under Recital 26. For use cases requiring analytical utility, the system offers L1-L9 with configurable privacy-utility tradeoffs (Figure 8). The privacy-utility spectrum is by design: different use cases require different points on the spectrum, and L10 anchors the maximum-privacy end. We also note that DORA Article 6.4 requires organizations to plan for degradation of cryptographic protections; L10 provides a guarantee that does not degrade with advances in computing.

**Key sections**: Section 9.1 (Privacy-Utility Spectrum), Figure 8, Section 2.5 (GDPR/DORA), Limitation 3 (Utility destruction).

---

### Concern 5: "The UCI Adult dataset has only 32K rows. This is too small for real-world evaluation."

**Response**: The UCI Adult dataset (32,561 records, 15 attributes) is the standard benchmark in k-anonymity and differential privacy research, used by Sweeney (2002), Machanavajjhala et al. (2007), Li et al. (2007), and hundreds of subsequent papers. We use it specifically to enable direct comparison with published results (Table 8). Our scaling analysis (Figure 6, Section 6.2) shows that L10 scales linearly with the number of unique values, processing 5,000 rows in 2.3 seconds. The entropy consumption is 16 bytes per unique value; our 2.72 MB quantum entropy pool suffices for ~170,000 unique values (7.8x the UCI Adult dataset). For production datasets exceeding this, the background harvester replenishes the pool. The anonymization algorithm itself is O(n) in unique values and does not depend on dataset size for correctness; larger datasets require more entropy but not more time per value.

**Key sections**: Section 6.2 (Scaling Behavior), Section 6.5 (UCI Adult), Figure 6, Section 6.4 (Production-scale harvest).

---

## Generic Response Templates

### "The paper is too long / could be shortened"
The paper is 21 pages including appendix. We can reduce to ~18 pages by moving Table 1 (PRNG attack vectors) and the QKD comparison (Section 9.4) to supplementary materials if the committee prefers a shorter main body.

### "The writing style is unusual for PoPETs"
We aimed for a style closer to the cryptographic tradition (formal definitions, numbered theorems with proofs) rather than the typical PoPETs empirical style. We believe this is appropriate given the paper's theoretical contribution (three-tier hierarchy, impossibility result, security proof). We are happy to adjust formatting to match PoPETs conventions.

### "Claim X needs qualification"
We have qualified all "first" claims with "to our knowledge" (5 instances). If specific additional claims need qualification, we will address them individually.
