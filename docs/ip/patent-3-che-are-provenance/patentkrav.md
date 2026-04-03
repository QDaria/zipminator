# CLAIMS / PATENTKRAV

## Independent Claims

**Claim 1.** A computer-implemented method for extracting randomness from input data using algebraic programs, comprising:

(a) generating an algebraic program from a cryptographic seed using SHAKE-256 deterministic expansion, wherein the program comprises a sequence of steps, each step specifying a number domain selected from Natural numbers, Integers, Rationals, Reals, and Complex numbers, an arithmetic value, and an arithmetic operation selected from addition, subtraction, multiplication, division, modular reduction, and exponentiation;

(b) applying the algebraic program to input data by sequentially executing each step's operation on an accumulator in the specified domain, wherein each domain implements bounded arithmetic with domain-specific projection rules;

(c) reducing the final accumulator value modulo a prime to produce the extracted output;

(d) for multi-byte output, using SHA-256 in counter mode to expand the algebraic extraction into uniformly distributed output bytes;

wherein the algebraic program constitutes a new family of randomness extractors distinct from hash-based extractors including universal hash functions, Trevisan extractors, and leftover hash lemma applications.

**Claim 2.** A computer-implemented method for producing certified entropy from multiple heterogeneous sources, comprising:

(a) maintaining a registry of entropy sources, each source satisfying a protocol interface specifying a name, a read method returning entropy bytes, an estimated min-entropy in bits per byte, and a health status classified as HEALTHY, DEGRADED, or FAILED;

(b) for each composition request, identifying active sources by excluding sources with FAILED health status;

(c) reading the requested number of bytes from each active source;

(d) XOR-combining the bytes from all active sources into a single output buffer;

(e) recording per-source provenance metadata comprising source name, estimated min-entropy, health status, bytes contributed, and timestamp;

(f) constructing a Merkle-tree provenance certificate from the provenance records, wherein each record is serialized with pipe-separated canonical encoding and hashed as a leaf node using SHA-256, pairs of leaf hashes are recursively combined via SHA-256, and odd-numbered nodes are duplicated;

(g) returning the composed entropy bytes together with the provenance certificate and a conservative min-entropy estimate equal to the maximum individual source min-entropy;

wherein the certificate provides cryptographic proof of which sources contributed to the entropy output, verifiable by recomputing the Merkle root from the stored records.

**Claim 3.** A computer-implemented method for entropy composition with graceful degradation, comprising:

(a) monitoring each entropy source using NIST SP 800-90B health tests including a configurable failure rate threshold;

(b) classifying each source as HEALTHY if tests pass, DEGRADED if anomalies are detected, or FAILED if the failure rate exceeds the configured threshold;

(c) automatically excluding FAILED sources from composition while continuing to include DEGRADED sources with a logged warning;

(d) adjusting the reported min-entropy bound to reflect only the entropy of sources that actually contributed to the composition;

(e) raising an error if fewer than a configurable minimum number of non-FAILED sources are available;

wherein the system continues to produce certified entropy even when individual sources fail, with accurately adjusted min-entropy bounds that decrease as sources drop out, and wherein no silent fallback to weaker entropy sources occurs without explicit reporting in the provenance certificate.

## Dependent Claims

**Claim 4.** The method of Claim 1, wherein the SHAKE-256 expansion produces 34 bytes per algebraic step, comprising 1 byte for domain selection modulo 5, 16 bytes for a signed 128-bit value, 16 bytes for a signed 128-bit imaginary component, and 1 byte for operation selection modulo 6.

**Claim 5.** The method of Claim 1, wherein the Natural number domain performs arithmetic modulo n with wrapping, the Integer domain projects results into the range {-(n-1), ..., n-1}, and exponentiation is capped at exponent 64 to prevent computational explosion.

**Claim 6.** The method of Claim 1, wherein the Rational domain embeds the accumulator as acc/1 and the step value as num/den, performs scaled integer arithmetic to avoid floating-point computation, and extracts the integer part after the operation.

**Claim 7.** The method of Claim 1, wherein the Complex domain treats the accumulator as a purely real complex number, performs complex arithmetic with the step value (re + im*i), and takes the real part of the result projected back to the integer range.

**Claim 8.** The method of Claim 2, wherein the provenance record canonical serialization uses pipe separators between fields in the order: source_name, min_entropy formatted to 6 decimal places, health_status, bytes_contributed, timestamp formatted to 6 decimal places, and sha256_hash.

**Claim 9.** The method of Claim 2, wherein the Merkle tree handles an odd number of leaf nodes by duplicating the last node before combining pairs.

**Claim 10.** The method of Claim 2, further comprising adapting legacy quantum entropy providers to the composition protocol via an adapter that runs NIST SP 800-90B health tests and min-entropy estimation on every byte read from the legacy provider.

**Claim 11.** The method of Claim 3, wherein the failure rate threshold for classifying a source as FAILED is 1%.

**Claim 12.** The method of Claim 2, wherein the certified entropy result comprises: composed entropy bytes, a Merkle-tree provenance certificate with a verifiable root hash, a conservative min-entropy estimate in bits, and a list of source names that contributed to the composition.
