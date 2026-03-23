# Q-Mesh: Physical Cryptography

The room itself becomes the security perimeter. Q-Mesh fuses WiFi Channel State Information (CSI) sensing from RuView ESP32-S3 mesh nodes with Zipminator's post-quantum cryptographic engine to create a new category of security: **Physical Cryptography** -- where the laws of physics become the access control mechanism.

```{admonition} What is Physical Cryptography?
:class: note

Traditional authentication relies on something you *know* (password), something you *have* (hardware token), or something you *are* (biometrics via a scanner). Physical Cryptography introduces a fourth factor: **something that physics proves about you and your environment**, measured passively through WiFi signals with no sensors touching your body.
```

## How It Works

RuView ESP32-S3 nodes are deployed as a mesh network within a physical space. Each node captures WiFi CSI data at 20 Hz, producing 56 complex subcarriers per frame.

CSI encodes the **electromagnetic eigenstructure** of the physical space: room geometry, furniture placement, wall materials, and the bodies of every person present. When a person enters, leaves, or moves, the CSI pattern changes in a way that is deterministic, measurable, and extremely difficult to forge.

Zipminator consumes this CSI data as cryptographic input material. The system requires:

- No cameras
- No wearables
- No passwords
- No biometric scanners

The WiFi signals already passing through the room carry all the information needed.

## Zero-Interaction Authentication

Employees walk into a room and are authenticated by their physical presence. The system recognizes four distinct biometric signatures extracted from CSI data:

- **Breathing pattern** -- Unique respiratory signature derived from CSI periodicity. Each person's breathing rate, depth, and rhythm produce a distinctive waveform in the subcarrier amplitude.
- **Heart rate** -- Micro-Doppler shifts from cardiac motion are detectable in CSI. The chest wall moves approximately 0.5 mm per heartbeat, enough to modulate WiFi signals.
- **Micro-movement signature** -- Body sway, gait characteristics, and postural oscillations create a movement fingerprint that persists even when a person stands still.
- **Room eigenstructure** -- The combined CSI pattern proves the person is in the correct physical space. Replaying a captured CSI stream from a different room produces a mismatch.

The result: no typing passwords, no touching fingerprint readers, no looking at cameras. The physics of your body and your location IS your authentication.

```{admonition} Privacy by Design
:class: tip

Q-Mesh does not record video, audio, or images. It processes WiFi signal metadata only. The raw CSI data is consumed and discarded after feature extraction. No biometric templates leave the local mesh -- authentication decisions are made on-device.
```

## Security Clearance Levels

Q-Mesh defines four security levels with progressively stricter authentication requirements:

| Level | Name | Threshold | Authentication | Use Case |
|-------|------|:---------:|----------------|----------|
| L1 | Standard | 0.75 | Room presence only | Office access, basic workstations |
| L2 | Elevated | 0.85 | Room + biometric profile match | Financial systems, medical records |
| L3 | High | 0.95 | Room + biometrics + vital signs normal | Government classified, SCIF |
| L4 | Military | 0.98 | Room + biometrics + duress + EM canary + topology lock | Defense, nuclear facilities, critical infrastructure |

**L1 (Standard)** verifies that an authorized person is physically present in the room. Sufficient for general office environments where proximity is the primary access control concern.

**L2 (Elevated)** adds biometric profile matching. The system compares the detected breathing and movement patterns against enrolled profiles to confirm identity, not just presence.

**L3 (High)** adds vital sign analysis. If a person's heart rate or breathing pattern indicates abnormal stress (potential coercion), the session is flagged. Suitable for environments handling classified information.

**L4 (Military)** adds three additional layers:

- **Coercion detection** -- Stressed biometrics (elevated heart rate, irregular breathing, tremor) auto-terminate the session and trigger a silent alert.
- **EM Canary** -- A physical intrusion detection system that monitors the electromagnetic environment. Unauthorized devices, RF jammers, or shielding attempts are detected. This cannot be social-engineered because it operates on physics, not human trust.
- **Topology lock** -- The network encryption key is derived in part from the exact arrangement of mesh nodes. Moving, adding, or removing a node invalidates the key. An attacker cannot replicate the network topology without physical access to all nodes simultaneously.
- **Spatiotemporal non-repudiation** -- Cryptographic proof that a specific person was in a specific room at a specific time, signed with the mesh topology and CSI fingerprint.

```{admonition} Duress Handling
:class: warning

At L3 and L4, if the system detects coercion indicators (abnormal vitals under authentication context), it does NOT lock the user out visibly. Instead, it silently downgrades access, triggers an alert to security personnel, and can optionally present a decoy workspace. The coerced user appears to have normal access while the real system is protected.
```

## The Six Cryptographic Primitives

Q-Mesh Wave 1 implements six cryptographic modules, each addressing a different aspect of physical security:

### 1. CSI Entropy Harvester

Extracts **classical physical randomness** from WiFi CSI measurements. The electromagnetic environment produces high-quality entropy because it reflects the chaotic interactions of radio waves with moving bodies, air currents, and thermal variations.

```{admonition} CSI Entropy vs QRNG
:class: warning

CSI entropy is **not** quantum random number generation. QRNG derives provably non-deterministic randomness from quantum measurements (the Born rule). CSI entropy derives computationally unpredictable randomness from classical electromagnetic scattering. Both are genuine physical randomness, but they differ in their security guarantees:

- **QRNG** (IBM Quantum, QBraid, Rigetti): Information-theoretically secure. No computational power, classical or quantum, can predict the output.
- **CSI entropy** (WiFi signals): Computationally secure. Predicting it would require modelling the thermal state of every air molecule in the room simultaneously.

Zipminator uses CSI entropy as a **supplementary source**, XORed with QRNG output. The XOR combination guarantees the result is at least as random as the stronger source. If QRNG hardware is unavailable, CSI provides a high-quality physical fallback. If CSI is compromised, QRNG still protects the output.
```

### 2. PUEK (Physical Unclonable Encryption Key)

Derives encryption keys from the physical characteristics of a location. The CSI eigenstructure of a room is unique and cannot be replicated elsewhere. PUEK binds encrypted data to a physical space: ciphertext encrypted in Room A cannot be decrypted in Room B, even with the correct secret key, because the location-derived key component will differ.

### 3. Vital-Sign Continuous Auth

Authentication does not stop after login. The system continuously monitors the CSI biometric signature throughout the session. If the authenticated person leaves, if a different person sits down, or if vital signs indicate duress, the session state changes in real time. This eliminates session hijacking after initial authentication.

### 4. EM Canary

The mesh continuously monitors the electromagnetic environment for anomalies: unauthorized wireless devices, RF shielding attempts, signal jamming, or unexpected changes in the propagation environment. An EM canary alert indicates physical tampering that cannot be achieved through software attacks alone.

### 5. Topological Mesh Auth

The arrangement of mesh nodes forms a graph whose topology contributes to the encryption key derivation. The key is a function of which nodes can see which other nodes, their signal strengths, and their relative positions. Altering the physical topology (removing a node, inserting a rogue node, moving furniture that blocks signal paths) changes the derived key and invalidates active sessions.

### 6. Spatiotemporal Non-Repudiation

Produces cryptographic attestations that bind a person's biometric profile to a physical location and a timestamp. These attestations are signed using ML-KEM-768 key material and can be independently verified. They provide audit-grade proof of physical presence without relying on cameras or access card logs.

## Gaussian Splatting Visualization

3D Gaussian splatting renders the WiFi CSI field as a volumetric heat map, making the invisible visible. Each Gaussian splat represents the electromagnetic interaction at a point in 3D space, colored by signal strength and phase.

When a person enters the room, the splat field deforms around their body. When they move, the deformation follows. When they leave, the field relaxes to its baseline. This visualization demonstrates why CSI is an unclonable security substrate: the electromagnetic eigenstructure depends on the exact physical configuration of the space, down to the position of chairs and the materials in the walls.

The visualization serves both as a diagnostic tool (operators can see coverage gaps and dead zones) and as a demonstration of the sensing resolution that makes biometric extraction possible.

## Architecture

```
┌─────────────────────────────────────┐
│         RuView ESP32-S3 Mesh        │
│  CSI Capture → Eigenstructure →     │
│  Vital Signs → Anomaly Detection    │
└────────────┬────────────────────────┘
             │ Attestation Wire Format (RVAT)
             ▼
┌─────────────────────────────────────┐
│      Zipminator Rust Engine         │
│  crates/zipminator-mesh/            │
│  CSI Entropy | PUEK | Vital Auth    │
│  EM Canary | Topology | Signatures  │
└────────────┬────────────────────────┘
             │ ML-KEM-768 + HKDF-SHA256
             ▼
┌─────────────────────────────────────┐
│     Application Layer               │
│  Encrypted sessions, signed docs,   │
│  access control, audit trails       │
└─────────────────────────────────────┘
```

The RuView mesh nodes capture and pre-process CSI data on-device, then transmit attestation records in the RVAT wire format to the Zipminator Rust engine. The engine runs the six cryptographic primitives and produces session keys, authentication decisions, and signed attestations. The application layer consumes these outputs for access control, document signing, and audit logging.

All communication between layers uses ML-KEM-768 for key encapsulation and HKDF-SHA256 for key derivation. No plaintext biometric data crosses a network boundary.

## Implementation Status

| Wave | Scope | Status | Tests |
|------|-------|--------|------:|
| Wave 1 | Crypto Primitives (6 modules) | Complete | 106 |
| Wave 2 | Integration Bridge (RVAT wire format, NVS V2 provisioner) | Complete | 44 |
| Wave 3 | Advanced Protocols (Ghost Protocol, TEMPEST, Physical ZKP, RF Shroud) | Research | -- |

```{admonition} Wave 3 Research
:class: note

Wave 3 protocols are in the research phase and not yet implemented. **Ghost Protocol** enables presence authentication without any device on the person. **TEMPEST** detects electromagnetic emanation attacks. **Physical ZKP** proves presence without revealing identity. **RF Shroud** creates a Faraday-cage-equivalent through active signal cancellation. These are documented as research directions, not shipping features.
```

## Interactive Demo

See the [Q-Mesh Interactive Demo](../notebooks/08_qmesh_physical_crypto.ipynb) for visualizations of CSI sensing, Gaussian splatting, biometric detection, and the full authentication pipeline.
