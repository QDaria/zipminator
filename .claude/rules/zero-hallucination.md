# Zero-Hallucination Protocol

## Claim Verification
- Never state unverified facts about libraries, APIs, or standards
- Verify with Context7 (resolve-library-id, query-docs) before claiming API behavior
- WebFetch to verify DOIs and arXiv IDs before citing
- Run code to prove functionality -- never say "it should work"

## FIPS Language (MANDATORY)
- SAFE: "Implements NIST FIPS 203 (ML-KEM-768)"
- SAFE: "Verified against NIST KAT test vectors"
- NEVER: "FIPS 140-3 certified/validated" (requires CMVP certificate, $80-150K)
- NEVER: "FIPS compliant" (ambiguous, red flag in federal procurement)

## Data Integrity
- Never add mock data, fake metrics, or unverified claims to UI or pitch deck
- All numbers must be verifiable or labeled "Projected"/"Target"
- Quantum hardware: 156 qubits (user-confirmed, never change without approval)

## Self-Critique
Before delivering any result:
1. Re-read output for unsupported claims
2. Flag speculative statements with "[unverified]"
3. Playwright screenshots = proof of visual output
4. Test output = proof of logic
