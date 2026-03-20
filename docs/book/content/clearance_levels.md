# Clearance Levels: L1 through L4

Physical Cryptography clearance levels define how many cryptographic primitives are layered together for authentication. Each level adds requirements, increasing security at the cost of infrastructure complexity. L1 is suitable for any office; L4 requires a full RuView mesh deployment with quantum entropy and is designed for military-grade facilities.

## Overview

| Feature | L1 | L2 | L3 | L4 |
|---------|----|----|----|----|
| Room presence (PUEK) | ✓ | ✓ | ✓ | ✓ |
| Biometric matching | | ✓ | ✓ | ✓ |
| Continuous re-auth | | ✓ | ✓ | ✓ |
| Duress detection | | | ✓ | ✓ |
| EM intrusion detection | | | | ✓ |
| Topology lock | | | | ✓ |
| Spatiotemporal signatures | | | | ✓ |
| QRNG entropy required | | | ✓ | ✓ |
| Min RuView nodes | 2 | 3 | 4 | 6 |
| Threshold | 0.75 | 0.85 | 0.95 | 0.98 |

---

## L1: Standard

**Threshold**: 0.75 | **Checks**: Room eigenstructure (PUEK) | **Min Nodes**: 2

The room's WiFi electromagnetic fingerprint is compared against enrollment. If similarity >= 0.75, the device is confirmed to be in the correct physical space. No per-user identification is performed at this level.

```python
from zipminator_mesh import ClearanceValidator

validator = ClearanceValidator(level=1)
result = validator.authenticate(device_id="workstation-07")

print(result)
# ClearanceResult(
#     level=1,
#     puek_similarity=0.83,
#     threshold=0.75,
#     passed=True,
#     checks=["room_eigenstructure"]
# )
```

**Use cases**: Office building access, shared workstations, conference room booking confirmation.

**What it prevents**: Remote access attacks, stolen credential use from outside the building.

**What it doesn't prevent**: An unauthorized person inside the room using a legitimate device.

---

## L2: Elevated

**Threshold**: 0.85 | **Checks**: Room eigenstructure + biometric profile | **Min Nodes**: 3

L1 checks plus continuous vital-sign monitoring. The system matches breathing rate, heart rate, and micro-movement signature against enrolled profiles. Each person has a unique biometric "shape" in CSI data, and the system re-authenticates on a rolling basis.

```python
validator = ClearanceValidator(level=2)
result = validator.authenticate(
    device_id="terminal-finance-03",
    user_id="trader-alice",
)

print(result)
# ClearanceResult(
#     level=2,
#     puek_similarity=0.91,
#     biometric_match=0.88,
#     threshold=0.85,
#     passed=True,
#     checks=["room_eigenstructure", "biometric_profile"],
#     reauth_interval_sec=30
# )
```

**Use cases**: Financial trading floors, medical record systems, law firm document access.

**What it prevents**: Everything in L1 plus unauthorized person using a device inside the room.

**What it doesn't prevent**: A coerced authorized user (addressed in L3).

---

## L3: High

**Threshold**: 0.95 | **Checks**: Room + biometrics + vital signs within normal range | **Min Nodes**: 4

L2 checks plus duress detection. If heart rate variability changes, breathing becomes erratic, or stress micro-tremors appear, the session is automatically terminated. The system distinguishes voluntary operation from coerced operation.

```python
validator = ClearanceValidator(level=3, entropy_source="qrng")
result = validator.authenticate(
    device_id="scif-terminal-01",
    user_id="analyst-bravo",
)

print(result)
# ClearanceResult(
#     level=3,
#     puek_similarity=0.97,
#     biometric_match=0.96,
#     vital_signs_normal=True,
#     duress_detected=False,
#     threshold=0.95,
#     passed=True,
#     checks=["room_eigenstructure", "biometric_profile", "duress_detection"],
#     entropy_source="qrng"
# )
```

**Use cases**: Government classified systems (SCIF), intelligence community, diplomatic facilities.

**What it prevents**: Coercion attacks (gunpoint authentication), sedation attacks.

**Novel security primitive**: This is the first deployed coercion detection system that does not require the user to enter a duress code or press a panic button. Detection is passive and continuous.

---

## L4: Military Grade

**Threshold**: 0.98 | **Checks**: Full Physical Cryptography stack | **Min Nodes**: 6

Everything in L3 plus three additional layers:

- **EM Canary**: Monitors for hidden devices, unauthorized RF transmitters, and physical intrusion attempts
- **Topology lock**: The mesh network key depends on the exact spatial arrangement of all RuView nodes. Moving a single node invalidates the key and triggers re-enrollment
- **Spatiotemporal non-repudiation**: Every action is signed with an attestation proving physical presence at a specific location and time

```python
validator = ClearanceValidator(
    level=4,
    entropy_source="qrng",
    topology_lock=True,
    em_canary=True,
)
result = validator.authenticate(
    device_id="bunker-console-01",
    user_id="commander-sierra",
)

print(result)
# ClearanceResult(
#     level=4,
#     puek_similarity=0.99,
#     biometric_match=0.98,
#     vital_signs_normal=True,
#     duress_detected=False,
#     em_canary_clear=True,
#     topology_intact=True,
#     spatiotemporal_attestation="signed",
#     threshold=0.98,
#     passed=True,
#     checks=[
#         "room_eigenstructure",
#         "biometric_profile",
#         "duress_detection",
#         "em_canary",
#         "topology_lock",
#         "spatiotemporal_attestation"
#     ],
#     reauth_interval_sec=30,
#     entropy_source="qrng"
# )
```

**Use cases**: Nuclear facilities, defense command centers, critical infrastructure control rooms.

**What it prevents**: Every known physical and cyber attack vector short of total facility destruction.

---

## Choosing Your Level

```{tip}
Start with L1 for immediate value. It requires minimal infrastructure and prevents the most common attack vector: remote credential theft. Upgrade to L2 when you need per-person authentication. L3 and L4 are for environments where the threat model includes physical coercion or state-level adversaries.
```

## Regulatory Alignment

- **L1-L2**: Meets DORA Art. 6.1 (encryption policy documentation) and Art. 7 (key lifecycle management)
- **L3**: Meets additional requirements for EU classified information handling
- **L4**: Designed for environments subject to ITAR, NATO COSMIC, or NSA CSfC requirements

```{warning}
L3 and L4 clearance levels are designed specifications. They describe the security architecture implemented in `crates/zipminator-mesh/`. Deployment in actual classified environments would require independent security evaluation and certification by the relevant national authority.
```
