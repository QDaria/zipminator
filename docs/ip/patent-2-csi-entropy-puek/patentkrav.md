# CLAIMS / PATENTKRAV

## Independent Claims

**Claim 1.** A computer-implemented method for unilateral entropy harvesting from wireless channel state information, comprising:

(a) receiving WiFi Channel State Information (CSI) frames from a wireless interface, each frame comprising complex-valued subcarrier measurements;

(b) for each subcarrier measurement, computing the phase angle and quantizing said phase to a discrete level;

(c) extracting the least-significant bit (LSB) of each quantized phase value to produce a raw bit stream;

(d) applying Von Neumann debiasing to the raw bit stream, wherein consecutive bit pairs are processed such that differing pairs produce an output bit and identical pairs are discarded;

(e) accumulating debiased output bits into entropy bytes;

wherein the method operates on a single device without requiring a second wireless endpoint, and the output bytes constitute general-purpose entropy suitable for any cryptographic application, distinct from bilateral key agreement protocols that require two cooperating endpoints.

**Claim 2.** A method for deriving location-locked encryption keys from wireless channel eigenstructure, comprising:

(a) capturing CSI magnitude data across multiple frames from a WiFi interface at an enrollment location;

(b) computing a covariance matrix from the centered CSI magnitude data;

(c) performing Singular Value Decomposition (SVD) on said covariance matrix to obtain eigenvalues sorted in descending order;

(d) storing the top-K eigenvalues as an enrollment profile together with a configurable similarity threshold;

(e) at key-derivation time, capturing fresh CSI magnitude data from the same physical location;

(f) computing fresh eigenvalues via SVD of the fresh CSI covariance matrix;

(g) computing cosine similarity between the enrolled and fresh eigenvalue vectors;

(h) if the cosine similarity meets or exceeds the threshold, deriving a cryptographic key from the enrolled eigenmodes using HKDF-SHA256 with a purpose-specific info string;

(i) if the cosine similarity falls below the threshold, rejecting the key derivation request;

wherein the derived key is cryptographically bound to the physical RF environment of the enrollment location and cannot be derived from a different physical location, and wherein the method fingerprints the environment rather than the hardware device.

**Claim 3.** A method for generating post-quantum mesh encryption keys from composed entropy, comprising:

(a) obtaining CSI entropy bytes via the method of Claim 1;

(b) obtaining quantum random bytes from a quantum random number generator (QRNG);

(c) XOR-combining the CSI entropy bytes with the QRNG bytes to produce composed entropy, wherein the composed output has min-entropy at least as high as the stronger individual source;

(d) deriving mesh authentication keys using HKDF-SHA256 with the composed entropy as input keying material and distinct purpose-specific info strings for each key type;

wherein the derived keys are suitable for use with ML-KEM-768 (NIST FIPS 203) key encapsulation in a wireless mesh network, and wherein compromise of either individual entropy source does not reduce the security of the composed output below the entropy of the uncompromised source.

## Dependent Claims

**Claim 4.** The method of Claim 1, wherein the CSI frames comprise 56 complex-valued subcarrier measurements conforming to the IEEE 802.11n HT20 frame structure.

**Claim 5.** The method of Claim 1, wherein the Von Neumann debiasing processes consecutive bit pairs such that a pair (0, 1) produces output bit 0, a pair (1, 0) produces output bit 1, and pairs (0, 0) and (1, 1) are discarded.

**Claim 6.** The method of Claim 1, wherein the wireless interface is an ESP32-S3 microcontroller configured to capture raw CSI data from WiFi frames.

**Claim 7.** The method of Claim 1, further comprising writing the accumulated entropy bytes to a persistent pool file in append mode, enabling offline consumption by a separate process with position tracking.

**Claim 8.** The method of Claim 2, wherein the configurable similarity threshold is selected from preset security profiles comprising: SCIF (0.98), Office (0.85), Home (0.75), or a custom value in the range [0.0, 1.0].

**Claim 9.** The method of Claim 2, wherein the HKDF-SHA256 key derivation uses a fixed info string for domain separation and an optional salt parameter for network-specific binding.

**Claim 10.** The method of Claim 3, wherein the XOR combination provides defense-in-depth such that even if the CSI data is fully compromised by an adversary, the composed output retains the full entropy of the QRNG source.

**Claim 11.** The method of Claim 3, further comprising deriving a SipHash-2-4 frame integrity key from the composed entropy using HKDF-SHA256 with a distinct info string separate from the mesh authentication key.

**Claim 12.** The method of Claim 3, further comprising deriving a MeshKey for HMAC-SHA256 beacon authentication from the composed entropy using HKDF-SHA256.

**Claim 13.** The method of Claim 1, wherein a CSI pool provider raises a runtime error when the pool file is exhausted rather than falling back to operating system entropy, thereby preserving the provenance integrity of CSI-derived entropy.
