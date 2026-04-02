# PATENT APPLICATION

## Patentstyret (Norwegian Industrial Property Office)

**Filing under Norwegian Patents Act (Patentloven) &sect; 8**

---

## TITLE OF THE INVENTION

**Method and System for Unilateral Entropy Harvesting from Wireless Channel State Information with Post-Quantum Key Derivation**

---

## INVENTOR(S)

Daniel Mo Houshmand
Oslo, Norway

---

## ASSIGNEE

QDaria AS
Oslo, Norway

---

## CROSS-REFERENCE TO RELATED APPLICATIONS

Related to Norwegian Patent Application No. 20260384 (filed 2026-03-24), "Method and System for Irreversible Data Anonymization Using Quantum Random Number Generation," which shares the entropy pool infrastructure but claims a distinct invention.

---

## FIELD OF THE INVENTION

The present invention relates to wireless security, entropy generation, and post-quantum cryptography. More specifically, the invention relates to: (1) a method for extracting general-purpose cryptographic entropy from WiFi Channel State Information (CSI) using a single device without bilateral key agreement; (2) a method for deriving location-locked encryption keys from CSI eigenstructure (Physical Unclonable Environment Keys); and (3) a method for composing CSI entropy with quantum random bytes to derive mesh network keys compatible with NIST FIPS 203 (ML-KEM-768).

---

## BACKGROUND OF THE INVENTION

### CSI-Based Key Agreement: The State of the Art

Channel State Information (CSI) describes the frequency-domain response of a wireless channel across OFDM subcarriers. Each subcarrier measurement is a complex number encoding amplitude and phase, influenced by multipath propagation, scattering, and the physical environment.

Prior work has exploited CSI for **bilateral key agreement**, wherein two wireless endpoints simultaneously observe the same channel and extract correlated random bits:

- **Mathur et al. (2008)**, "Radio-Telepathy: Extracting a Secret Key from an Unauthenticated Wireless Channel," ACM MobiCom. First demonstration of RSS-based bilateral key extraction.
- **Jana et al. (2009)**, ACM MobiCom. Extended bilateral key extraction to CSI (amplitude and phase) across OFDM subcarriers.
- **Liu et al. (2012)**, IEEE TIFS. Adaptive quantization for bilateral CSI key generation with improved bit agreement rates.
- **Avrahami et al. (2023)**. Recent bilateral WiFi-based key exchange with enhanced reconciliation.

Patent literature confirms this bilateral focus:

- **WO2007124054A2**: Wireless channel-based key agreement requiring both endpoints.
- **US20210345102A1**: Bilateral CSI key generation with quantization.
- **US10402172B1**: Symmetric key extraction from shared wireless observations.
- **US8015224B1**: Channel reciprocity-based key distribution.

### The Unoccupied Gap

All prior art requires **two cooperating endpoints** that observe the same channel simultaneously. The extracted bits serve exclusively as a shared secret key. No prior system uses CSI measurements from a **single device** to produce **general-purpose entropy bytes** suitable for any cryptographic application (key generation, nonce creation, entropy pool seeding, randomness extraction).

This represents a paradigm shift from bilateral key agreement to unilateral entropy harvesting.

### Physical Unclonable Functions (PUFs) vs. Environment Keys

RF-PUF approaches (e.g., Chatterjee et al. 2018) fingerprint **hardware** manufacturing variations. The present invention fingerprints the **physical RF environment** (room geometry, furniture, wall materials) via CSI eigenstructure. The key is bound to a location, not a device.

### Post-Quantum Key Derivation Gap

No prior art combines WiFi CSI entropy with ML-KEM-768 (NIST FIPS 203) key encapsulation for quantum-resistant mesh networking.

---

## SUMMARY OF THE INVENTION

The present invention provides three interrelated methods:

1. **Unilateral CSI entropy harvesting**: A single device extracts phase LSBs from WiFi CSI subcarrier measurements, applies Von Neumann debiasing, and produces general-purpose entropy bytes. No second endpoint participates.
2. **Physical Unclonable Environment Key (PUEK)**: CSI covariance eigenstructure is captured at enrollment. At key-derivation time, fresh CSI eigenvalues are compared via cosine similarity against the enrollment profile. If similarity meets a configurable threshold (0.75-0.98), a 32-byte key is derived via HKDF-SHA256. The key is cryptographically bound to the physical location.
3. **Hybrid CSI+QRNG mesh key derivation**: CSI entropy bytes are XOR-combined with quantum random bytes for defense-in-depth. The composed entropy feeds HKDF-SHA256 to derive MeshKey (HMAC-SHA256 beacon authentication) and SipHashKey (SipHash-2-4 frame integrity) compatible with ML-KEM-768 mesh networks.

---

## DETAILED DESCRIPTION OF THE INVENTION

### System Architecture

#### 1. CSI Capture

The preferred embodiment uses an ESP32-S3 microcontroller configured to capture raw CSI data from WiFi frames. Each CSI frame comprises 56 complex-valued subcarrier measurements conforming to the 802.11n HT20 frame structure (`CSI_SUBCARRIERS = 56`, defined in `crates/zipminator-mesh/src/csi_entropy.rs:22`).

#### 2. Phase LSB Extraction

For each complex subcarrier value H_k, the system computes the phase angle via `arg(H_k)`, quantizes it to 256 discrete levels, and extracts the least-significant bit:

```
quantized = ((phase + PI) / (2 * PI) * 256.0) as u8
lsb = (quantized & 1) != 0
```

This produces 56 raw bits per CSI frame. Implementation: `extract_phase_lsbs()` at `csi_entropy.rs:96-108`.

#### 3. Von Neumann Debiasing

Raw phase LSBs exhibit measurement bias. The `VonNeumannExtractor` (`csi_entropy.rs:36-90`) processes consecutive bit pairs:

- (0, 1) -> output bit 0
- (1, 0) -> output bit 1
- (0, 0) or (1, 1) -> discard

This produces approximately 14 unbiased bits per 56-subcarrier frame (50% discard rate typical). Eight accumulated bits form one entropy byte.

#### 4. XOR Defense-in-Depth

The `CsiEntropySource` (`csi_entropy.rs:121-228`) optionally accepts a secondary entropy source (e.g., QRNG pool) via `with_xor_source()` (`csi_entropy.rs:143-149`). Each debiased byte is XORed with a byte from the secondary source. By the XOR lemma, the composed output has min-entropy at least as high as the stronger individual source.

#### 5. Pool File Writer

The `flush_to_file()` method (`csi_entropy.rs:187-206`) appends accumulated entropy bytes to a persistent pool file (`csi_entropy_pool.bin`) in append mode. This enables the Python `CsiPoolProvider` (`src/zipminator/entropy/csi_pool_provider.py:38-132`) to consume CSI entropy from a separate file with full provenance tracking. The `CsiPoolProvider` raises `RuntimeError` when the pool is exhausted rather than falling back to `os.urandom`, preserving provenance integrity.

#### 6. PUEK Enrollment and Verification

Enrollment (`puek.rs:121-137`):

1. Capture CSI magnitude data across N frames (rows) and M subcarriers (columns).
2. Center the data matrix by subtracting column means.
3. Compute the covariance matrix C = X^T * X.
4. Perform SVD to obtain eigenvalues sorted in descending order (`compute_eigenmodes()`, `puek.rs:86-114`).
5. Store the top-K eigenvalues with a similarity threshold from `SecurityProfile` (`puek.rs:35-57`): SCIF (0.98), Office (0.85), Home (0.75), or Custom.

Verification (`PuekVerifier::verify_and_derive()`, `puek.rs:178-217`):

1. Capture fresh CSI data from the same location.
2. Compute fresh eigenvalues via SVD.
3. Compute cosine similarity between enrolled and fresh eigenvalue vectors (`cosine_similarity()`, `puek.rs:140-161`).
4. If similarity >= threshold: derive a 32-byte key via HKDF-SHA256 using enrolled eigenmodes as input keying material, with info string `zipminator-puek-v1` (`puek.rs:16`).
5. If similarity < threshold: return `EnvironmentMismatch` error.

The `DerivedKey` (`puek.rs:229-248`) implements `ZeroizeOnDrop` and redacts its Debug output.

#### 7. Mesh Key Derivation

The `EntropyBridge` (`entropy_bridge.rs:124-219`) derives purpose-specific mesh keys from composed entropy:

- **MeshKey** (16-byte PSK): HKDF-SHA256 with info string `zipminator-mesh-psk-v1` (`entropy_bridge.rs:23`). Used for HMAC-SHA256 beacon authentication (`derive_mesh_key()`, `entropy_bridge.rs:140-145`).
- **SipHashKey** (16-byte): HKDF-SHA256 with info string `zipminator-mesh-siphash-v1` (`entropy_bridge.rs:26`). Used for SipHash-2-4 frame integrity (`derive_siphash_key()`, `entropy_bridge.rs:152-161`).

Input keying material requires a minimum of 32 bytes (`MIN_ENTROPY_BYTES`, `entropy_bridge.rs:20`). The IKM is zeroized after derivation.

### Security Analysis

#### Unilateral vs. Bilateral: Why This Matters

| Property | Bilateral (Prior Art) | Unilateral (This Invention) |
|---|---|---|
| Endpoints required | Two (synchronized) | One |
| Output type | Shared secret key only | General-purpose entropy bytes |
| Reconciliation needed | Yes (bit mismatch correction) | No |
| Uses | Key agreement | Any cryptographic application |
| PQC compatibility | Not addressed | ML-KEM-768 via HKDF |
| Deployment | Both devices must cooperate | Single device, passive capture |

#### PUEK vs. RF-PUF

| Property | RF-PUF (Chatterjee 2018) | PUEK (This Invention) |
|---|---|---|
| What is fingerprinted | Hardware manufacturing defects | Physical RF environment |
| Key bound to | Device | Location |
| Key changes when | Device replaced | Room altered |
| Security profiles | Fixed | Configurable (0.75-0.98) |
| Key derivation | Direct from hardware response | HKDF-SHA256 from eigenstructure |

### Implementation

The preferred embodiment is implemented in:

- **Rust crate** `zipminator-mesh`: CSI entropy harvester (`csi_entropy.rs`, 407 lines, 12 tests), PUEK (`puek.rs`, 393 lines, 11 tests), entropy bridge (`entropy_bridge.rs`, 368 lines, 11 tests).
- **Python module** `src/zipminator/entropy/csi_pool_provider.py`: CSI pool reader with position persistence and file locking (132 lines, 11 tests).
- **ESP32-S3**: CSI capture platform (802.11n HT20, 56 subcarriers).

Total test coverage: 45 tests across the three Rust modules plus 11 Python tests.

---

## CLAIMS

### Independent Claims

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

### Dependent Claims

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

---

## ABSTRACT

A method and system for unilateral entropy harvesting from WiFi Channel State Information (CSI) and location-locked key derivation. Unlike all prior CSI-based approaches that require bilateral key agreement between two endpoints, the present invention operates on a single device, extracting general-purpose entropy bytes from subcarrier phase measurements via Von Neumann debiasing. The Physical Unclonable Environment Key (PUEK) subsystem derives cryptographic keys bound to a physical location's RF eigenstructure using SVD and HKDF-SHA256, with configurable similarity thresholds for different security environments (SCIF 0.98, Office 0.85, Home 0.75). A hybrid composition method XOR-combines CSI entropy with quantum random bytes for defense-in-depth, deriving mesh authentication keys compatible with ML-KEM-768 (NIST FIPS 203). The system implements provenance-preserving pool management that never falls back to operating system entropy, ensuring CSI entropy bytes are genuinely derived from wireless channel measurements.

---

## DRAWINGS

### Figure 1: Single-Device CSI Entropy Harvesting Pipeline

```
WiFi CSI Frame (56 subcarriers, 802.11n HT20)
  |
  v
+-------------------------------+
|   Phase LSB Extraction        |  extract_phase_lsbs()
|   arg(H_k) -> quantize(256)  |  csi_entropy.rs:96-108
|   -> LSB per subcarrier       |
+---------------+---------------+
                | 56 raw bits per frame
                v
+-------------------------------+
|   Von Neumann Debiasing       |  VonNeumannExtractor
|   (0,1)->0  (1,0)->1         |  csi_entropy.rs:36-90
|   (0,0)->X  (1,1)->X         |
+---------------+---------------+
                | ~14 unbiased bits per frame
                v
+-------------------------------+
|   Byte Accumulator            |  CsiEntropySource
|   8 bits -> 1 entropy byte    |  csi_entropy.rs:121-228
+-------+--------------+-------+
        |              |
        v              v
  +-----------+  +--------------+
  | XOR with  |  | flush_to_file|
  | QRNG pool |  | (append mode)|
  +-----+-----+  +--------------+
        |
        v
+-------------------------------+
|   HKDF-SHA256 Key Derivation  |  EntropyBridge
|   -> MeshKey (16B PSK)        |  entropy_bridge.rs
|   -> SipHashKey (16B)         |
+-------------------------------+
```

### Figure 2: PUEK Enrollment and Verification

```
ENROLLMENT                          VERIFICATION
===========                         ============

CSI magnitudes                      Fresh CSI magnitudes
(frames x subcarriers)              (frames x subcarriers)
  |                                   |
  v                                   v
Center data (subtract means)        Center data
  |                                   |
  v                                   v
Covariance matrix: X^T * X         Covariance matrix: X^T * X
  |                                   |
  v                                   v
SVD -> eigenvalues (desc.)          SVD -> eigenvalues (desc.)
  |                                   |
  v                                   |
Store top-K eigenmodes              |
+ threshold (0.75-0.98)            |
  |                                   |
  +------------+----------------------+
               |
               v
      cosine_similarity(enrolled, fresh)
               |
               +--- >= threshold ---> HKDF-SHA256 ---> DerivedKey (32B)
               |
               +--- < threshold ----> EnvironmentMismatch ERROR
```

### Figure 3: Prior Art Comparison

```
PRIOR ART (ALL BILATERAL)            THIS INVENTION (UNILATERAL)
=========================            ===========================

Device A <---CSI---> Device B        Device A ---CSI--->  (no Device B)
   |                    |               |
   v                    v               v
 Extract              Extract         Extract entropy
 correlated bits    correlated bits   (general-purpose bytes)
   |                    |               |
   v                    v               v
 Reconcile <---------> Match         Von Neumann debias
   |                                    |
   v                                    v
 Shared Key                           Entropy Pool / PUEK Key / Mesh Keys
 (key agreement only)                 (any cryptographic use)
```

---

*End of Patent Application*
