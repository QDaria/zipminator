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

(a) capturing complex-valued CSI data across multiple frames from a WiFi interface at an enrollment location, forming a matrix $\mathbf{C} \in \mathbb{C}^{M \times K}$ where $M$ is the number of frames and $K$ is the number of subcarriers;

(b) performing Singular Value Decomposition (SVD) on said CSI matrix to obtain $\mathbf{C} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^H$, where $\mathbf{V}$ contains the right singular vectors;

(c) storing the top-$d$ right singular vectors $\mathbf{V}_{\mathrm{ref}} = [\mathbf{v}_1, \ldots, \mathbf{v}_d]$ as an enrollment profile together with a configurable similarity threshold;

(d) at key-derivation time, capturing fresh complex-valued CSI data from the same physical location;

(e) computing fresh right singular vectors $\mathbf{V}_{\mathrm{new}}$ via SVD of the fresh CSI matrix;

(f) computing subspace similarity as $s = \frac{1}{d}\sum_{i=1}^{d}|\langle \mathbf{v}_{\mathrm{ref},i}, \mathbf{v}_{\mathrm{new},i}\rangle|^2$;

(g) if the subspace similarity $s$ meets or exceeds the threshold, deriving a cryptographic key from the enrollment eigenstructure using HKDF-SHA256 with a purpose-specific info string;

(h) if the subspace similarity $s$ falls below the threshold, rejecting the key derivation request;

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

**Claim 8.** The method of Claim 2, wherein the configurable similarity threshold is selected from preset security profiles comprising: Standard (0.75, office access and workstations), Elevated (0.85, financial and medical records), High (0.95, government classified and SCIF), Military (0.98, defense, nuclear, and critical infrastructure), or a custom value in the range [0.0, 1.0].

**Claim 9.** The method of Claim 2, wherein the HKDF-SHA256 key derivation uses a fixed info string for domain separation and an optional salt parameter for network-specific binding.

**Claim 10.** The method of Claim 3, wherein the XOR combination provides defense-in-depth such that even if the CSI data is fully compromised by an adversary, the composed output retains the full entropy of the QRNG source.

**Claim 11.** The method of Claim 3, further comprising deriving a SipHash-2-4 frame integrity key from the composed entropy using HKDF-SHA256 with a distinct info string separate from the mesh authentication key.

**Claim 12.** The method of Claim 3, further comprising deriving a MeshKey for HMAC-SHA256 beacon authentication from the composed entropy using HKDF-SHA256.

**Claim 13.** The method of Claim 1, wherein a CSI pool provider raises a runtime error when the pool file is exhausted rather than falling back to operating system entropy, thereby preserving the provenance integrity of CSI-derived entropy.

**Claim 14.** The method of Claim 1, wherein the wireless interface is any IEEE 802.11-compatible device capable of reporting per-subcarrier complex-valued channel state information, including but not limited to 802.11n, 802.11ac, and 802.11ax interfaces with any subcarrier count.
