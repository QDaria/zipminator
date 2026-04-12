# Releases

This page tracks Zipminator's shipping cadence, major release notes, and upgrade guidance. Zipminator ships the Python SDK on PyPI, the Flutter super-app through TestFlight and the Google Play Store, and a set of backend services on Fly.io. Entries are ordered from most recent to oldest.

## Python SDK v0.5.0 (2026-04-02)

The Python SDK is the most-used installation path for scripts, notebooks, and server integrations. Version 0.5.0 is available on PyPI.

### Install

```bash
pip install zipminator
```

With uv inside an activated environment:

```bash
micromamba activate zip-pqc
uv pip install zipminator
```

### Extras

The SDK ships nine optional extras. Install only what you need to keep the dependency surface small.

```bash
uv pip install "zipminator[data]"           # DataFrames + parquet
uv pip install "zipminator[anonymization]"  # PII anonymisation pipeline
uv pip install "zipminator[cli]"            # Rich CLI with progress bars
uv pip install "zipminator[quantum]"        # IBM / Rigetti / QBraid adaptors
uv pip install "zipminator[jupyter]"        # Notebook helpers and widgets
uv pip install "zipminator[email]"          # SMTP encryption helpers
uv pip install "zipminator[benchmark]"      # Kyber and entropy benchmarks
uv pip install "zipminator[dev]"            # Test, lint, type-check tooling
uv pip install "zipminator[all]"            # Everything above
```

```{tip}
For a quick start, `zipminator[cli]` plus `zipminator[jupyter]` is usually enough. Add `quantum` only when you plan to pull entropy from a hardware backend.
```

### API key gating

Subscription levels L1 through L3 are free to use without an API key. From L4 upward the SDK requires the `ZIPMINATOR_API_KEY` environment variable. See [Subscription](subscription.md) and [API credentials](api_credentials.md) for the full matrix.

```bash
export ZIPMINATOR_API_KEY="zmk_live_..."
python -c "import zipminator, os; print('ok', bool(os.environ.get('ZIPMINATOR_API_KEY')))"
```

### PyPI

The canonical release artefact lives on PyPI:

```
https://pypi.org/project/zipminator/
```

## Flutter super-app on TestFlight (2026-04-06)

Build 43 (`v0.5.0+43`) of the Zipminator Flutter super-app went live on TestFlight on 2026-04-06. The build contains 11 feature screens and 17 Riverpod providers wired through `flutter_rust_bridge` v2.11.1 to the Rust PQC core.

### What's in build 43

- 11 feature screens: Vault, Messenger, VoIP, Q-VPN, Anonymiser, Q-AI, Mail, Browser, Mesh, Settings, Dashboard
- 17 state providers managing auth, crypto, entropy, and presence
- Material 3 Quantum theme
- Supabase auth with GitHub, Google, LinkedIn, and Apple providers

### How to join

The TestFlight invitation is distributed per request. Reach out through `testflight@zipminator.zip` with your Apple ID email address to receive an invite. Once accepted in the TestFlight app, future builds arrive automatically.

```{note}
The Google Play Store submission for the same build is staged and awaiting review. An update will appear on this page once the Play version is open.
```

Full screen-by-screen walkthrough is in [Flutter super-app](flutter_app.md).

## Signaling server live on Fly.io (2026-03-26)

The WebSocket signalling server that coordinates Messenger and VoIP sessions went live on Fly.io on 2026-03-26.

- Endpoint: `wss://zipminator-signaling.fly.dev`
- Role: bootstrap rendezvous for end-to-end messenger sessions and VoIP calls; carries no plaintext content; only relays opaque handshakes and ratchet advertisements
- Verification: six end-to-end tests pass against production (`tests/e2e/test_signaling_roundtrip.py`)

```{note}
The signalling server is intentionally low-trust. All session keys are derived client-side via the PQC ratchet; the server never sees a private key or plaintext payload.
```

## Physical Cryptography Wave 1 (2026-03-20)

Wave 1 of the physical-layer crypto subsystem shipped on 2026-03-20 inside `crates/zipminator-mesh/`. Six modules, 106 mesh tests total (90 unit, 16 integration).

Modules:

- CSI entropy harvester (`csi_entropy.rs`)
- PUEK physical unclonable environment key (`puek.rs`)
- EM canary (`em_canary.rs`)
- Vital-sign continuous auth (`vital_auth.rs`)
- Topological mesh authentication (`topo_auth.rs`)
- Spatiotemporal non-repudiation (`spatiotemporal.rs`)

Full detail is in [Q-Mesh: Physical Cryptography Wave 1](mesh_wave1.md).

## Upgrading

Upgrading the Python SDK is a single command:

```bash
uv pip install --upgrade zipminator
```

Or, with plain pip:

```bash
pip install --upgrade zipminator
```

Before upgrading across a major version, review the changelog for breaking changes. Zipminator follows semantic versioning: `MAJOR.MINOR.PATCH`. Minor versions are additive; major versions may rename or remove APIs.

### Verifying the install

```bash
python -c "import zipminator; print(zipminator.__version__)"
```

### Downgrading

Pin the previous version if a regression surfaces:

```bash
uv pip install "zipminator==0.4.9"
```

```{warning}
Always verify the installed version in CI before enabling L4+ features, since the API key gate changes behaviour between SDK releases.
```

## Full changelog

The exhaustive per-commit changelog lives in the repository:

```
https://github.com/QDaria/zipminator/blob/main/CHANGELOG.md
```

Changelog entries are grouped by SDK version and by Flutter build number. Each entry links back to the commit and, where relevant, to the pull request that introduced the change.

## Related chapters

- [Installation](installation.md), first-time setup
- [Getting started](getting_started.md), end-to-end example
- [Subscription](subscription.md), level matrix and API key rules
- [Flutter super-app](flutter_app.md), client platform reference
- [Q-Mesh: Physical Cryptography Wave 1](mesh_wave1.md), wave 1 module reference
