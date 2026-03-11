# Zipminator Investor Demo

Interactive demonstration of Qdaria's quantum security platform, showcasing three integrated technologies that protect data against both current and future threats.

## What the Demo Shows

### Tab 1: Quantum Entropy Generation

Live entropy sourced from IBM's 156-qubit quantum processors (IBM Marrakesh/Fez via qBraid). The dashboard displays real-time pool status, SHA-256 hashes of generated entropy, and NIST-standard quality metrics (entropy rate 7.998/8.0, chi-square PASS, runs test PASS, serial correlation < 0.01). Auto-refresh mode demonstrates continuous high-throughput generation.

**Investor talking points:**
- True quantum randomness -- fundamentally unpredictable, unlike classical PRNGs
- Powers cryptographic key generation, secure session tokens, financial algorithms
- Cloud-based and scalable to thousands of concurrent requests
- Real IBM Quantum hardware, not simulation

### Tab 2: Zipminator Encryption

Drag-and-drop file encryption using AES-256 with quantum-seeded keys. Includes a configurable self-destruct timer (1 hour to 28 days) that automatically shreds files after expiry. Every access is logged for a full compliance audit trail.

**Investor talking points:**
- GDPR compliant by design: data minimization, encryption-by-default, right-to-be-forgotten via self-destruct
- Reduces data breach liability through automatic time-bound deletion
- Target verticals: healthcare (HIPAA), finance (SOX), legal, IP protection
- Military-grade encryption with quantum-sourced key material

### Tab 3: Post-Quantum Kyber768 (ML-KEM)

Step-by-step demonstration of NIST FIPS 203 post-quantum key encapsulation. Generate a Kyber768 keypair, encrypt a message, and decrypt it -- all in under 5 ms combined. Performance benchmarks show 500-800 operations per second.

**Investor talking points:**
- NIST standardized (August 2024) -- the global standard for quantum-resistant encryption
- Current RSA/ECC encryption will be broken by quantum computers; Kyber768 will not
- First-mover advantage: companies deploying now have a 5-10 year lead
- Runs alongside existing encryption -- no rip-and-replace needed

## Prerequisites

You need **one** of the following:

| Option | Requirements |
|--------|-------------|
| Docker (recommended) | Docker Desktop |
| Local | Python 3.8+ and a web browser |

## One-Command Launch

### Option A: Docker (recommended)

```bash
docker-compose up
```

Open http://localhost:3000 (frontend) -- the backend runs on http://localhost:5001.

### Option B: Local script

```bash
chmod +x run.sh
./run.sh
```

The script installs Python dependencies, starts the Flask backend, serves the frontend, and opens your browser automatically.

### Option C: Manual

```bash
# Terminal 1 -- backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install flask flask-cors
python3 server.py

# Terminal 2 -- frontend
cd src
python3 -m http.server 3000
# Open http://localhost:3000
```

## Screen-by-Screen Walkthrough

### 1. Header and Status Bar

A green "Quantum Backend Active" indicator confirms the backend is reachable. If the indicator is red, the backend is not running -- restart with `docker-compose up` or `./run.sh`.

### 2. Quantum Entropy Tab

Two cards display IBM Quantum backend specs (156 qubits, pool size) and entropy quality metrics. Clicking "Generate Quantum Entropy (256 bytes)" produces a SHA-256 hash of freshly generated entropy. Toggle "Auto-Refresh" for continuous generation.

### 3. Zipminator Tab

Left card lists security features (AES-256, quantum-seeded keys, GDPR, self-destruct, audit trail). Right card shows compliance status. Enable the self-destruct checkbox, select a timer, then drag a file into the upload zone and click "Encrypt File with AES-256". Download the encrypted result.

### 4. Kyber768 Tab

Left card shows algorithm specs (NIST Level 3, 2400-byte keys, 1088-byte ciphertext). Right card shows live performance benchmarks. The three-step flow walks through keypair generation, message encryption, and decryption with verification.

## Project Structure

```
demo/
  backend/
    server.py            Flask API (quantum, encryption, Kyber endpoints)
    requirements.txt     Python dependencies
  src/
    index.html           Application shell (CDN React, Chart.js, Axios)
    app.js               React components (no build step)
    main.js              Electron main process (optional desktop mode)
    styles.css            UI styling
  assets/logos/           Qdaria and Zipminator brand assets
  sample_data/            Sample files for encryption demos
  docker-compose.yml      One-command Docker launch
  run.sh                  Local launch script (macOS/Linux)
  DEMO_GUIDE.md           Detailed presenter script (15-20 min)
  package.json            Node/Electron config (optional desktop mode)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/quantum/status | Entropy pool status |
| POST | /api/quantum/generate | Generate quantum entropy |
| POST | /api/quantum/refill | Reset entropy pool |
| POST | /api/zipminator/encrypt | Encrypt a file |
| GET | /api/zipminator/download/:id | Download encrypted file |
| POST | /api/kyber/generate | Generate Kyber768 keypair |
| POST | /api/kyber/encrypt | Encrypt with Kyber768 |
| POST | /api/kyber/decrypt | Decrypt with Kyber768 |
| GET | /api/kyber/benchmark | Performance benchmarks |

## Troubleshooting

**Backend won't start (port 5001 in use):**
```bash
lsof -ti:5001 | xargs kill -9
```

**Docker containers won't start:**
```bash
docker-compose down && docker-compose up --build
```

**Frontend shows "Connecting to Quantum Backend...":**
Make sure the backend is running on port 5001. Check `docker-compose logs backend` or the terminal running `server.py`.
