**To:** eprint-editor@iacr.org
**Subject:** Request to resubmit xxxx/108710 with substantial cryptographic strengthening

Dear Editors (Dr. Bos, Dr. Celi, Dr. Kannwischer),

Thank you for your review of submission xxxx/108710 ("Quantum-Certified Anonymization: Irreversibility Beyond Computational Hardness"). I appreciate the feedback that the original contribution to cryptology was unclear, and I have substantially revised the paper to address this.

The original submission positioned the work primarily as an anonymization system using known primitives (OTP + QRNG). The revised version adds three new cryptographic contributions that did not appear in the original:

**1. IND-ANON Indistinguishability Game (new Definition + Theorem)**
I define a standard left-or-right indistinguishability game for anonymization schemes, analogous to IND-CPA for encryption. The adversary selects two datasets of identical schema, receives the anonymization of one, and must guess which. I prove that the advantage is exactly zero for computationally unbounded adversaries under per-cell tokenization, and provide a tight bound via the total variation distance of column frequency vectors for per-value tokenization. This formalizes anonymization security in the language that the cryptographic community expects.

**2. Composition Theorem with Differential Privacy (new Theorem + Corollary)**
The original version explicitly deferred this result to future work. The revised version proves it: QRNG-OTP-Destroy composes cleanly with epsilon-differential privacy. The DP guarantee survives post-processing (via Dwork and Roth, Proposition 2.1), and the physics-guaranteed irreversibility is independent of the DP mechanism. A corollary formalizes the defense-in-depth composition of k-anonymity, l-diversity, Laplace DP, and quantum tokenization.

**3. Ideal Anonymization Functionality (new Definition + Theorem)**
I define an ideal functionality F_ANON in the simulation paradigm of Canetti (FOCS 2001) and prove that the protocol realizes it exactly under the Born rule assumption (distributional identity, not merely computational indistinguishability). For per-value tokenization, I provide a delta-approximate realization bound tied to the equality-structure leakage.

These additions bring the cryptographic content to three new formal definitions, three new theorems with proofs, and one new corollary, in addition to the original hierarchy of irreversibility tiers, the PRNG impossibility result, and the QRNG-OTP-Destroy construction.

**Suggested category change:** I would like to resubmit under the "Applications" category rather than "Foundations," as the work applies cryptographic formalisms (indistinguishability games, composition theorems, ideal functionalities) to the domain of data anonymization.

The revised PDF is attached. I am happy to provide any additional information.

Best regards,
Daniel Mo Houshmand
QDaria Quantum Research, Oslo, Norway
mo@qdaria.com
ORCID: 0009-0008-2270-5454
