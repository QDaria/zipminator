#!/usr/bin/env bash
# ============================================================================
#  Zipminator -- Interactive Post-Quantum Cryptography Demo
#
#  This script demonstrates real CRYSTALS-Kyber-768 operations:
#    1. Key generation (public + secret key)
#    2. Encapsulation (produce ciphertext + shared secret)
#    3. Decapsulation (recover shared secret from ciphertext)
#    4. Tampering detection (implicit rejection)
#    5. Performance benchmarking
#
#  All operations use real cryptography -- no simulation.
#  Standard: NIST FIPS 203 (ML-KEM, Security Level 3)
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Find and activate venv
if [ -d "$PROJECT_ROOT/.venv" ]; then
    VENV_DIR="$PROJECT_ROOT/.venv"
elif [ -d "$PROJECT_ROOT/../.venv" ]; then
    VENV_DIR="$(cd "$PROJECT_ROOT/../.venv" && pwd)"
fi

if [ -d "$VENV_DIR" ]; then
    source "$VENV_DIR/bin/activate"
else
    echo -e "${RED}Virtual environment not found. Run install.sh first.${NC}"
    exit 1
fi

clear
echo ""
echo -e "${BOLD}================================================================${NC}"
echo -e "${BOLD}${CYAN}"
echo "  ______                _             _             "
echo " |___  /               (_)           | |            "
echo "    / /  _ _ __  _ __ ___  _ __   __ _| |_ ___  _ __"
echo "   / /  | | '_ \\| '_ \` _ \\| '_ \\ / _\` | __/ _ \\| '__|"
echo "  / /__ | | |_) | | | | | | | | | (_| | || (_) | |   "
echo " /_____|_| .__/|_| |_| |_|_| |_|\\__,_|\\__\\___/|_|   "
echo "         | |                                         "
echo "         |_|   Post-Quantum Cryptography Platform    "
echo -e "${NC}"
echo -e "${BOLD}  CRYSTALS-Kyber-768  |  NIST FIPS 203  |  Security Level 3${NC}"
echo -e "${BOLD}================================================================${NC}"
echo ""
echo -e "${DIM}  Prepared for: Norwegian Government evaluation${NC}"
echo -e "${DIM}  All operations use real cryptography -- zero simulation${NC}"
echo ""

read -p "  Press Enter to begin the demonstration... "

# ===================================================================
# DEMO 1: Key Generation
# ===================================================================
echo ""
echo -e "${BOLD}${CYAN}--- Demo 1: Key Pair Generation ---${NC}"
echo ""
echo -e "  Generating CRYSTALS-Kyber-768 key pair..."
echo -e "  ${DIM}(Public key: 1184 bytes, Secret key: 2400 bytes)${NC}"
echo ""

python3 -c "
import time
from zipminator._core import keypair, get_constants

constants = get_constants()
print(f'  Algorithm Parameters:')
print(f'    Public Key  : {constants[\"public_key_bytes\"]} bytes')
print(f'    Secret Key  : {constants[\"secret_key_bytes\"]} bytes')
print(f'    Ciphertext  : {constants[\"ciphertext_bytes\"]} bytes')
print(f'    Shared Secret: {constants[\"shared_secret_bytes\"]} bytes')
print()

start = time.perf_counter()
pk, sk = keypair()
elapsed = (time.perf_counter() - start) * 1000

print(f'  Key Generation:')
print(f'    Public Key  : {pk.to_bytes()[:16].hex()}... ({pk.size} bytes)')
print(f'    Secret Key  : {sk.to_bytes()[:16].hex()}... ({sk.size} bytes)')
print(f'    Time        : {elapsed:.2f} ms')
print(f'    Status      : OK')

# Save for next steps
import json, base64
data = {
    'pk': base64.b64encode(pk.to_bytes()).decode(),
    'sk': base64.b64encode(sk.to_bytes()).decode()
}
with open('/tmp/zipminator_demo_keys.json', 'w') as f:
    json.dump(data, f)
"

echo ""
read -p "  Press Enter to continue to encapsulation... "

# ===================================================================
# DEMO 2: Encapsulation
# ===================================================================
echo ""
echo -e "${BOLD}${CYAN}--- Demo 2: Key Encapsulation (Encrypt) ---${NC}"
echo ""
echo -e "  Encapsulating a shared secret using the public key..."
echo -e "  ${DIM}(Produces a ciphertext and a 32-byte shared secret)${NC}"
echo ""

python3 -c "
import time, json, base64
from zipminator._core import PublicKey, encapsulate

with open('/tmp/zipminator_demo_keys.json') as f:
    data = json.load(f)

pk = PublicKey.from_bytes(base64.b64decode(data['pk']))

start = time.perf_counter()
ct, ss = encapsulate(pk)
elapsed = (time.perf_counter() - start) * 1000

print(f'  Encapsulation Result:')
print(f'    Ciphertext   : {ct.to_bytes()[:16].hex()}... ({ct.size} bytes)')
print(f'    Shared Secret: {ss.hex()}')
print(f'    Time         : {elapsed:.2f} ms')
print(f'    Status       : OK')

# Save for next steps
data['ct'] = base64.b64encode(ct.to_bytes()).decode()
data['ss'] = ss.hex()
with open('/tmp/zipminator_demo_keys.json', 'w') as f:
    json.dump(data, f)
"

echo ""
read -p "  Press Enter to continue to decapsulation... "

# ===================================================================
# DEMO 3: Decapsulation
# ===================================================================
echo ""
echo -e "${BOLD}${CYAN}--- Demo 3: Key Decapsulation (Decrypt) ---${NC}"
echo ""
echo -e "  Recovering the shared secret using the secret key..."
echo -e "  ${DIM}(Must produce the identical 32-byte shared secret)${NC}"
echo ""

python3 -c "
import time, json, base64
from zipminator._core import SecretKey, Ciphertext, decapsulate

with open('/tmp/zipminator_demo_keys.json') as f:
    data = json.load(f)

sk = SecretKey.from_bytes(base64.b64decode(data['sk']))
ct = Ciphertext.from_bytes(base64.b64decode(data['ct']))

start = time.perf_counter()
ss2 = decapsulate(ct, sk)
elapsed = (time.perf_counter() - start) * 1000

ss1_hex = data['ss']
ss2_hex = ss2.hex()
match = ss1_hex == ss2_hex

print(f'  Decapsulation Result:')
print(f'    Recovered SS : {ss2_hex}')
print(f'    Original SS  : {ss1_hex}')
print(f'    Match        : {\"YES\" if match else \"NO\"}')
print(f'    Time         : {elapsed:.2f} ms')
print()
if match:
    print(f'  VERIFICATION: Shared secrets match.')
    print(f'  The key encapsulation mechanism is working correctly.')
else:
    print(f'  ERROR: Shared secrets DO NOT match!')
    exit(1)
"

echo ""
read -p "  Press Enter to continue to tampering detection... "

# ===================================================================
# DEMO 4: Tampering Detection (Implicit Rejection)
# ===================================================================
echo ""
echo -e "${BOLD}${CYAN}--- Demo 4: Tampering Detection (Implicit Rejection) ---${NC}"
echo ""
echo -e "  Flipping a single bit in the ciphertext..."
echo -e "  ${DIM}(Kyber uses implicit rejection: tampered ciphertext -> different secret)${NC}"
echo ""

python3 -c "
import json, base64
from zipminator._core import SecretKey, Ciphertext, decapsulate

with open('/tmp/zipminator_demo_keys.json') as f:
    data = json.load(f)

sk = SecretKey.from_bytes(base64.b64decode(data['sk']))
ct_bytes = bytearray(base64.b64decode(data['ct']))

# Flip one bit
original_byte = ct_bytes[0]
ct_bytes[0] ^= 0x01
tampered_byte = ct_bytes[0]

ct_tampered = Ciphertext.from_bytes(bytes(ct_bytes))
ss_tampered = decapsulate(ct_tampered, sk)

original_ss = data['ss']
tampered_ss = ss_tampered.hex()
detected = original_ss != tampered_ss

print(f'  Tampering Test:')
print(f'    Original byte[0]  : 0x{original_byte:02x}')
print(f'    Tampered byte[0]  : 0x{tampered_byte:02x}  (1 bit flipped)')
print()
print(f'    Original SS  : {original_ss[:32]}...')
print(f'    Tampered SS  : {tampered_ss[:32]}...')
print(f'    Match        : {\"YES (BAD!)\" if not detected else \"NO (correct)\"}')
print()
if detected:
    print(f'  TAMPERING DETECTED: The shared secrets differ.')
    print(f'  An attacker who modifies the ciphertext cannot recover the original secret.')
    print(f'  This is FIPS 203 implicit rejection in action.')
else:
    print(f'  WARNING: Tampering was NOT detected.')
    exit(1)
"

echo ""
read -p "  Press Enter to continue to performance benchmark... "

# ===================================================================
# DEMO 5: Performance Benchmark
# ===================================================================
echo ""
echo -e "${BOLD}${CYAN}--- Demo 5: Performance Benchmark ---${NC}"
echo ""
echo -e "  Running 100 complete keygen/encaps/decaps cycles..."
echo ""

python3 -c "
import time
from zipminator._core import keypair, encapsulate, decapsulate

ROUNDS = 100
keygen_times = []
encaps_times = []
decaps_times = []
failures = 0

for i in range(ROUNDS):
    t0 = time.perf_counter()
    pk, sk = keypair()
    t1 = time.perf_counter()
    ct, ss1 = encapsulate(pk)
    t2 = time.perf_counter()
    ss2 = decapsulate(ct, sk)
    t3 = time.perf_counter()

    keygen_times.append((t1 - t0) * 1000)
    encaps_times.append((t2 - t1) * 1000)
    decaps_times.append((t3 - t2) * 1000)

    if ss1 != ss2:
        failures += 1

def stats(times):
    avg = sum(times) / len(times)
    mn = min(times)
    mx = max(times)
    return avg, mn, mx

kg_avg, kg_min, kg_max = stats(keygen_times)
en_avg, en_min, en_max = stats(encaps_times)
de_avg, de_min, de_max = stats(decaps_times)
total_avg = kg_avg + en_avg + de_avg

print(f'  Benchmark Results ({ROUNDS} rounds):')
print(f'  {\"─\" * 54}')
print(f'  {\"Operation\":<16} {\"Avg (ms)\":>10} {\"Min (ms)\":>10} {\"Max (ms)\":>10}')
print(f'  {\"─\" * 54}')
print(f'  {\"KeyGen\":<16} {kg_avg:>10.3f} {kg_min:>10.3f} {kg_max:>10.3f}')
print(f'  {\"Encapsulate\":<16} {en_avg:>10.3f} {en_min:>10.3f} {en_max:>10.3f}')
print(f'  {\"Decapsulate\":<16} {de_avg:>10.3f} {de_min:>10.3f} {de_max:>10.3f}')
print(f'  {\"─\" * 54}')
print(f'  {\"Full cycle\":<16} {total_avg:>10.3f}')
print()
print(f'  Operations/sec : ~{int(1000 / total_avg)} full KEM cycles')
print(f'  Failures       : {failures}/{ROUNDS}')
print(f'  Success rate   : {(ROUNDS - failures) / ROUNDS * 100:.1f}%')
"

echo ""
echo -e "${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}  Demonstration Complete${NC}"
echo -e "${BOLD}================================================================${NC}"
echo ""
echo -e "  All operations used ${BOLD}real CRYSTALS-Kyber-768 cryptography${NC}."
echo -e "  No simulation. No mocking. Every byte is genuine."
echo ""
echo -e "  For the full Python tutorial:  ${CYAN}python3 tutorial.py${NC}"
echo -e "  For API integration examples:  ${CYAN}python3 api_example.py${NC}"
echo ""

# Cleanup
rm -f /tmp/zipminator_demo_keys.json
