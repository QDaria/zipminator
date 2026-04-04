# Phase 7: Quantum-Secure Email — Implementation Plan

> Research-backed plan for `@zipminator.zip` email service.
> Generated from 3 parallel research agents (PQC TLS, Self-Destruct, PII Scanning).
> **Status: Research complete. Decisions locked in. No code written yet.**

## Decisions Locked In (Maximum Quantum Configuration)

| # | Decision | Choice | Headline Claim |
|---|----------|--------|----------------|
| 1 | PQ DKIM | **Hybrid dual-sign** (RSA-2048 + ML-DSA-65) | *"First email server with PQ DKIM signatures"* |
| 2 | Mobile NER | **On-device NER** via native ONNX module in Rust bridge | *"Your words never leave your device"* |
| 3 | KMS hosting | **Self-hosted Redis** (no persistence), enclave-ready architecture | *"Even we can't read your keys"* |
| 4 | OpenPGP interop | **Ship PQC composite keys** (ML-KEM-768 + X25519), Sequoia-compatible | *"First PQC OpenPGP interoperable email"* |
| 5 | Legal hold | **Ship in v1** with audit log + admin freeze API | *"Quantum compliance: automated right-to-erasure"* |

---

## Architecture Overview

```
+--------------------+     +--------------------+     +--------------------+
|   Compose Client   |     |   Mail Transport   |     |   Receive Client   |
|  (React Native /   |     |                    |     |  (React Native /   |
|   Next.js WebMail) |     |  Postfix + Dovecot |     |   Next.js WebMail) |
|                    |     |  OpenSSL 3.5       |     |                    |
| PII Scanner (L1-2) |---->| X25519MLKEM768 TLS |---->| Secure Viewer      |
| PQ Ratchet Encrypt |     | SMTP/IMAP          |     | PQ Ratchet Decrypt |
| Self-Destruct Meta |     |                    |     | Timer Enforcement  |
+--------+-----------+     +--------------------+     +--------+-----------+
         |                                                      |
         v                                                      v
+--------------------+                               +--------------------+
| Key Management     |<----------------------------->| Key Management     |
| Service (KMS)      |   DEK store/fetch/TTL purge   | Service (KMS)      |
| Redis (memory-only)|                               | Redis (memory-only)|
| HSM master key     |                               |                    |
+--------------------+                               +--------------------+
```

---

## Sub-Phases

| Sub-Phase | Scope | Effort | Dependencies |
|-----------|-------|--------|--------------|
| **7A** | PQC TLS for SMTP/IMAP (transport layer) | Low | OpenSSL 3.5, Postfix 3.10, Dovecot 2.3.21 |
| **7B** | PII scanning in compose flow | Medium | Existing `PIIDetector` in `src/zipminator/crypto/patterns/` |
| **7C** | Self-destructing emails (KMS + crypto-shredding) | Medium-High | Redis, existing PQ Double Ratchet |
| **7D** | E2E PQC email encryption (CMS/KEMRecipientInfo) | High | Rust ML-KEM-768 core, RFC 9629 |
| **7E** | Webmail UI + mobile client | Medium | Phase 7A-7D APIs |

---

## 7A: PQC TLS for SMTP/IMAP

### What the research found

PQC TLS for email is **production-ready today**. OpenSSL 3.5 (LTS, released April 2025) ships ML-KEM-768 in the default provider. Postfix 3.10 and Dovecot 2.3.21 negotiate `X25519MLKEM768` hybrid key exchange with minimal config.

Verified deployment exists (FreeBSD 15, February 2026) with log output:
```
TLSv1.3 with cipher TLS_AES_256_GCM_SHA384 (256/256 bits) key-exchange X25519MLKEM768
```

### Implementation steps

1. **Docker base image**: Alpine/Debian with OpenSSL >= 3.5.0
2. **Postfix 3.10** compiled against OpenSSL 3.5:
   ```
   # /etc/postfix/main.cf
   tls_eecdh_auto_curves = X25519MLKEM768, X25519, prime256v1, secp384r1
   smtpd_tls_security_level = may
   smtp_tls_security_level = may
   ```
3. **Dovecot 2.3.21** compiled against OpenSSL 3.5:
   ```
   # /etc/dovecot/conf.d/10-ssl.conf
   ssl_curve_list = X25519MLKEM768:X25519:prime256v1:secp384r1
   ssl_min_protocol = TLSv1.2
   ```
4. **Verification script**:
   ```bash
   openssl s_client -connect mail.zipminator.zip:993 \
       -groups X25519MLKEM768 -brief 2>&1 | grep -E 'Protocol|group'
   ```
5. **DNS records**: MX, SPF, DMARC, MTA-STS
6. **DKIM — Hybrid dual-sign** (Decision #1):
   - **Primary selector** (`s1`): RSA-2048 DKIM signature — ensures universal deliverability
   - **Secondary selector** (`s1pq`): ML-DSA-65 DKIM signature — PQ verification for receivers that support it
   - Both signatures added to every outgoing email via Postfix milter (OpenDKIM + custom ML-DSA signer)
   - DNS TXT for `s1pq._domainkey.zipminator.zip` carries the ML-DSA-65 public key (~2.6KB base64, requires EDNS0)
   - Receivers that don't understand ML-DSA validate RSA and ignore the PQ selector
   - When IETF PQ DKIM standard lands, we're already compliant
7. **Fallback**: Hybrid `?X25519MLKEM768:X25519` prefix ensures graceful degradation when remote servers lack PQC support

### Performance impact

- Handshake overhead: +1.6 KB (KEM public key + ciphertext)
- Compute: +80-150 microseconds (negligible)
- Throughput: -2.3% vs classical (amortized across SMTP pipelining)

### Risks

| Risk | Mitigation |
|------|------------|
| Email clients don't support PQC TLS groups | Hybrid fallback to X25519. Server-to-server SMTP benefits immediately |
| PQ signature certificates not yet issued by CAs | Use classical ECDSA certs for auth + PQ for key exchange |
| PQ DKIM DNS record size (~2.6KB for ML-DSA-65) | EDNS0 + TCP fallback. Classical RSA selector guarantees deliverability regardless |
| No receiver validates PQ DKIM yet | Dual-sign means zero delivery risk; PQ selector is additive, not replacing classical |

### Decision: Hybrid Dual-Sign DKIM (locked in)

Ship **both** RSA-2048 and ML-DSA-65 DKIM signatures on every outgoing email. Classical selector ensures deliverability today. PQ selector makes Zipminator the first mail server with a post-quantum DKIM signature in the wild. When the IETF standard lands, we're already ahead.

---

## 7B: PII Scanning in Compose Flow

### What the research found

Zipminator already has a comprehensive PII scanning subsystem with 50+ regex patterns across 4 countries (USA, UK, UAE, Norway), checksum validators (Luhn, MOD11, Verhoeff), and a `PIIDetector` class that supports freetext multi-country scanning. The gap is: (1) no NER for person names/organizations/addresses, and (2) no real-time compose integration.

Every existing enterprise email DLP product (Google, Microsoft, Proofpoint) scans server-side. **Zipminator scanning client-side before encryption is a unique market differentiator.**

### Three-layer scanning pipeline

```
Layer 1: INSTANT (0ms debounce, critical patterns only)
  Engine: Compiled regex (passwords, API keys, PEM blocks)
  Latency: <1ms
  UI: Immediate red indicator

Layer 2: DEBOUNCED (200ms after typing stops)
  Engine: Full 50+ pattern sweep with checksum validation
  Latency: <5ms for 5KB email body
  UI: Inline highlights (web), warning panel (mobile)

Layer 3: DEEP SCAN (on Send press)
  Engine: NER for names/orgs/addresses
  Latency: 100-500ms
  UI: Send-gate modal with action options
```

### Implementation steps

1. **Extract pattern definitions** from `src/zipminator/crypto/patterns/{usa,uk,uae}.py` into shared JSON/TOML consumed by both Python backend and Rust/WASM scanner
2. **Compile Rust WASM module** from `crates/zipminator-core/` regex patterns for browser-side scanning (shares same pattern definitions)
3. **React Native integration** via existing `zipminator-crypto` Expo native module (JSI bridge, not WASM — Hermes doesn't support WASM)
4. **NER layer** (Layer 3) — Decision #2: On-device everywhere:
   - **Web**: Transformers.js with `Xenova/bert-base-NER` in Web Worker (~50MB quantized q4 model, cached in IndexedDB)
   - **Mobile**: On-device NER via **ONNX Runtime C++ API** bundled inside `zipminator-crypto` Expo native module. Quantized DistilBERT NER model (~25MB q4) loaded into background thread via JSI bridge. Inference runs off-main-thread. No data leaves the device, ever. This is the zero-trust differentiator: *"Your words never leave your device. Not even to scan them."*
   - **Implementation**: ONNX Runtime C++ is already linkable alongside the Rust FFI (both compile to `.so`/`.dylib`). The NER model ships as a bundled asset in the app binary. First inference has ~500ms cold start (model load); subsequent scans run in 50-150ms on modern mobile SoCs
5. **Compose UI integration**:
   - Web: Overlay `<div>` behind `<textarea>` for inline highlighting (red=critical, orange=high, yellow=medium)
   - React Native: Warning panel below `TextInput` with tap-to-jump (native TextInput doesn't support mixed inline styling)
6. **Send-gate modal** when PII detected:
   - Actions: Encrypt and Send, Auto-Redact, Review, Cancel
   - CRITICAL items (leaked secrets) default to Block
7. **Attachment scanning**: Text extraction + regex on attach; PDF OCR server-side (opt-in)

### PII categories

| Tier | Risk | Examples | Detection | Status |
|------|------|---------|-----------|--------|
| 1 | CRITICAL | Passwords, API keys, private keys | Regex + keyword context | Exists |
| 2 | HIGH | Credit cards, SSN, bank accounts, passports | Regex + checksum | Exists |
| 3 | MEDIUM | Person names, addresses, phone numbers | NER + regex | Partial (names/addresses need NER) |
| 4 | LOW | Org names, IP addresses, ZIP codes | NER + regex | Partial |

### Email-specific additions needed

- Medical condition keywords (HIPAA): keyword dictionary + context
- Financial amounts with context: regex + NER
- Geolocation coordinates: regex

### Decision: On-Device NER Everywhere (locked in)

Bundle a quantized DistilBERT NER model (~25MB) inside the native module. Run inference on-device via ONNX Runtime C++. No draft content ever touches a server. This is the "zero-trust PII scanning" story that Google, Microsoft, and Proofpoint cannot match — they all scan server-side. Engineering cost: 2-3 days to integrate ONNX Runtime into the native module build pipeline.

---

## 7C: Self-Destructing Emails

### What the research found

The strongest pattern is **dual-layer crypto-shredding**: each email is encrypted with a per-message Data Encryption Key (DEK). The DEK is stored in a Key Management Service with a TTL. When the TTL expires, the DEK is purged, rendering the ciphertext unrecoverable. This is how Keybase and Wickr achieve forward secrecy for ephemeral messages.

Zipminator's existing PQ Double Ratchet (`crates/zipminator-core/src/ratchet/`) already provides per-message forward secrecy via KEM ratchet steps. Combining this with server-side KMS TTL creates defense-in-depth that neither layer achieves alone.

### Architecture

```
Sender                    KMS (Redis, memory-only)        Recipient
  |                              |                           |
  |-- Generate DEK ------------->|                           |
  |-- Store DEK with TTL ------->|                           |
  |-- Encrypt body with DEK ---->|                           |
  |-- Send {ct, kms_id, meta} -->|                           |
  |                              |<--- Fetch DEK ------------|
  |                              |--- Return DEK ----------->|
  |                              |<--- Read receipt ----------|
  |                              |--- Reset TTL (post-read)->|
  |                              |=== DEK purged (TTL) ====> |
  |                              |<--- Fetch DEK ------------|
  |                              |--- 404: key expired ----->|
```

### Self-destruct modes

| Mode | Timer start | Use case |
|------|-------------|----------|
| **Expire after send** | Message sent timestamp | Time-boxed availability (1h - 28d) |
| **Expire after read** | Read-receipt received | Countdown after opening (30s - 7d) |
| **Read once** | First fetch, immediate deletion | Maximum security, worst UX |

### Two-tier TTL

- **Server TTL** (ceiling): Maximum time encrypted message + DEK exist on server (e.g., 30 days). If recipient never reads, message is purged and sender is notified.
- **Post-read TTL**: Time after reading before DEK destruction (e.g., 5 minutes). Triggered by read-receipt API call.

### Implementation steps

1. **Key Management Service** — Decision #3: Self-hosted, enclave-ready:
   - **Self-hosted Redis in Docker**, persistence explicitly disabled (`save ""`, `appendonly no`)
   - No managed service (ElastiCache/MemoryDB) — we control the full persistence config, zero ambiguity
   - Each DEK stored as `email:{message_id}:dek` with `EXPIREAT`
   - HSM-backed master key encrypts DEKs at rest in Redis memory
   - API: `POST /keys` (store DEK + TTL), `GET /keys/{id}` (fetch), `POST /keys/{id}/read-receipt` (reset TTL), `DELETE /keys/{id}` (immediate destroy)
   - Read-receipt is **one-shot**: only accepted once per key_id, then locks the post-read TTL
   - **Enclave-ready architecture**: Docker container designed for future migration into SGX/TDX enclave (AMD SEV-SNP or Intel TDX). When deployed in an enclave, even a compromised host OS cannot read DEKs in memory. This is the *"even we can't read your keys"* story
   - **Deployment**: `docker-compose.yml` service alongside Postfix/Dovecot with `--memory` limit and no volume mounts (no disk surface)

2. **Timer service + Legal hold** — Decision #5: Ship in v1:
   - Handles two-tier TTL management
   - Push notifications to all recipient devices on key destruction
   - Sender notification when message expires unread
   - **Legal hold in v1** (mandatory): Admin API `POST /hold/{account_id}` freezes all TTLs for an account. `POST /hold/{message_id}` freezes individual messages. `DELETE /hold/{id}` resumes normal TTL countdown
   - **Audit log**: Append-only log records `{message_id, event_type, timestamp, actor}` for every key lifecycle event (created, fetched, read-receipt, held, released, destroyed). No content stored. Satisfies GDPR Article 17 evidence requirements and eDiscovery preservation proof
   - **Retention policy override**: Per-domain admin setting that disables self-destruct for regulated communications (FINRA, HIPAA). Configurable at account or organizational level
   - Full eDiscovery export tooling deferred to post-launch enterprise tier

3. **Client-side integration**:
   - Compose UI: timer selector (mode + duration)
   - Secure viewer: plaintext held in memory only, never written to disk
   - Android: `FLAG_SECURE` prevents screenshots
   - iOS: `UIApplicationUserDidTakeScreenshotNotification` detection + sender notification
   - Local timer as secondary enforcement (in case push notification delayed)
   - On app foreground: poll KMS to check key status, purge if gone

4. **Per-email encryption flow**:
   ```
   1. Advance PQ ratchet -> (header, ratchet_ciphertext)
   2. Generate random 32-byte DEK
   3. Encrypt body + attachments with DEK (AES-256-GCM)
   4. Store DEK on KMS with configured TTL
   5. Package: {ratchet_header, aes_ciphertext, kms_key_id, ttl_config}
   6. Send via transport
   ```

5. **Multi-device sync**: Server-authoritative. Once KMS deletes DEK, no device can decrypt. Push notification triggers local purge. Offline devices check KMS on next foreground and get 404.

### Anti-circumvention (realistic scope)

| Measure | Platform | Effort |
|---------|----------|--------|
| `FLAG_SECURE` | Android | Low |
| Screenshot detection + sender notification | iOS | Low |
| Forensic watermarking (invisible recipient ID) | All | Medium |
| Disable forward/copy in compose UI | All | Low |
| Sandboxed WebView for decrypted content | Web | Medium |
| DRM | Skip | Not justified given fundamental limitation |

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| KMS compromise exposes active DEKs | Critical | HSM master key; memory-only Redis; network isolation; enclave-ready for future hardening |
| Recipient caches plaintext before destruction | High | Accept as fundamental limitation. FLAG_SECURE + watermarking reduce casual leakage |
| Redis TTL imprecision | Low | Redis TTL is second-precise. Use active API deletion for sub-second needs |
| Legal hold not activated before destruction | Medium | Admin API ships in v1. Enterprise accounts default to legal-hold-aware mode |
| Self-hosted Redis uptime | Medium | Docker health checks + automatic restart policy. Dual-node Redis Sentinel for HA in production |

### Decisions: Self-Hosted KMS + Legal Hold in v1 (locked in)

**KMS**: Self-hosted Redis in Docker with zero persistence. Enclave-ready architecture for future SGX/TDX migration. No managed service dependency.

**Legal hold**: Ships in v1 with `POST /hold/{account_id}`, `POST /hold/{message_id}`, and append-only audit log. Self-destruct becomes a *compliance feature* ("automated right-to-erasure") rather than a liability. Opens the enterprise/B2B market from day one.

---

## 7D: E2E PQC Email Encryption

### What the research found

RFC 9629 ("Using KEM Algorithms in CMS") is a published standard defining `KEMRecipientInfo` for S/MIME. The ML-KEM-specific draft (`draft-ietf-lamps-cms-kyber-13`) is near-final. OpenPGP PQC (`draft-ietf-openpgp-pqc-17`) is approved as Proposed Standard, expected H1 2026.

Zipminator's existing `keypair()`, `encapsulate(pk)`, `decapsulate(ct, sk)` API maps directly to the CMS KEMRecipientInfo flow.

### Implementation steps

1. **CMS KEMRecipientInfo** (RFC 9629 compliant):
   - ASN.1 structure generation in Rust
   - `encapsulate(recipient_pk)` -> `(ct, shared_secret)`
   - `KEK = HKDF-SHA-256(shared_secret, "ZipminatorEmail_v1")` (32-byte AES key)
   - Wrap CEK with KEK using AES-256-WRAP (RFC 3394)
   - Encrypt body with CEK using AES-256-GCM
   - Package as CMS EnvelopedData

2. **Hybrid compatibility**: Add classical RSA/ECDH RecipientInfo alongside KEMRecipientInfo for recipients whose clients don't support PQC

3. **OpenPGP PQC composite keys** — Decision #4: Ship now, Sequoia-compatible:
   - Implement `draft-ietf-openpgp-pqc-17` composite encryption keys: **ML-KEM-768 + X25519**
   - Implement composite signature keys: **ML-DSA-65 + Ed25519**
   - Align with **Sequoia PGP** reference implementation (draft-compliant)
   - **Do NOT target GnuPG** — their PQC format is intentionally incompatible with the IETF draft
   - Publish PQC composite public keys on Zipminator's key directory AND standard OpenPGP keyservers (keys.openpgp.org)
   - This enables interoperability with Proton Mail (when they ship PQC OpenPGP) and any Sequoia-based client
   - **First-mover claim**: If Zipminator ships before Proton, we are the first PQC OpenPGP interoperable email service

4. **Key distribution**:
   - Custom key directory API (`GET /keys/{email}`) — returns both CMS and OpenPGP formatted keys
   - OpenPGP keyserver publication (composite ML-KEM-768 + X25519 keys)
   - WKD (Web Key Directory, RFC draft) at `https://zipminator.zip/.well-known/openpgpkey/`
   - Future: S/MIME certificate with ML-KEM public key (when CAs issue PQC certs)

5. **PQ Double Ratchet for ongoing conversations**: Use existing `PqRatchetSession` for forward secrecy in email threads (session state persisted to encrypted local storage)

### Interoperability target

- **Primary**: Zipminator-to-Zipminator (full PQC, ratchet, self-destruct, PII scanning)
- **Secondary**: Sequoia PGP + Proton Mail ecosystem (draft-ietf-openpgp-pqc composite keys)
- **Tertiary**: S/MIME via CMS KEMRecipientInfo (enterprise clients)
- **Avoid**: GnuPG PQC (incompatible proprietary format — explicitly out of scope)

### Decision: Ship OpenPGP PQC Now (locked in)

Implement OpenPGP PQC composite keys (ML-KEM-768 + X25519) aligned with Sequoia PGP's draft-compliant implementation. This is 2-3 weeks of additional work on ASN.1/OpenPGP packet construction, but the payoff is interoperability with the broader PQC email ecosystem and a credible "first PQC OpenPGP email" claim.

---

## 7E: Webmail UI + Mobile Client

### Implementation steps

1. **Webmail** (Next.js, quantum-purple design language):
   - Compose view with PII scanning overlay (Layer 1-3)
   - Self-destruct timer selector
   - Secure viewer with sandboxed iframe (CSP-restricted)
   - Key management UI (generate, export, import ML-KEM keypairs)

2. **Mobile client** (`ZipMail.tsx` in Expo app):
   - Compose view with PII warning panel below TextInput
   - Self-destruct mode selector
   - `FLAG_SECURE` on Android, screenshot detection on iOS
   - Push notification handling for destruction events
   - Integrates with existing `zipminator-crypto` native module for PQ operations

3. **QRNG-seeded session tokens**: Per-session tokens seeded from quantum entropy pool (`quantum_entropy/quantum_entropy_pool.bin`)

---

## Implementation Order

```
7A: PQC TLS + Hybrid DKIM  ──────> can ship independently (1-3 days)
                                     |
7B: PII scanning + ONNX NER ──┐     |    (1.5-2 weeks)
7C: Self-destruct KMS + hold ──┤     |    (1.5-2 weeks)
7D: E2E PQC + OpenPGP keys  ──┘     |    (2-3 weeks)
        |                            |
        v                            v
7E: Webmail UI + mobile     ──────> requires 7A-7D APIs (2-3 weeks)
```

**Recommended sequence**:
1. **7A first** (1-3 days): Docker + Postfix + Dovecot + OpenSSL 3.5 config. Add ML-DSA-65 DKIM milter. Immediate transport-layer PQC with world-first PQ DKIM.
2. **7B, 7C, 7D in parallel** (3 agent workstreams):
   - **7B** (1.5-2 weeks): Pattern extraction to shared format, Rust WASM build, ONNX Runtime integration in native module, compose UI overlay/panel.
   - **7C** (1.5-2 weeks): Redis KMS Docker service, two-tier TTL API, legal hold endpoint, audit log, push notification for destruction events.
   - **7D** (2-3 weeks): CMS KEMRecipientInfo in Rust, OpenPGP composite key generation (ML-KEM-768 + X25519), key directory API, WKD publication.
3. **7E last** (2-3 weeks): Next.js webmail + React Native `ZipMail.tsx`. Integrates all 7A-7D APIs. Secure viewer, timer selector, PII overlay, key management UI.

---

## Technology Choices Summary (Final)

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Mail server | Postfix 3.10 + Dovecot 2.3.21 | Production PQC TLS support with OpenSSL 3.5 |
| TLS KEM | X25519MLKEM768 (hybrid) | NIST Level 3 PQ + classical fallback |
| **DKIM** | **Hybrid dual-sign: RSA-2048 + ML-DSA-65** | First PQ DKIM in the wild; classical ensures deliverability |
| PII regex engine | Existing `PIIDetector` + Rust WASM | Reuses 50+ validated patterns with checksums |
| PII NER (web) | Transformers.js + bert-base-NER in Web Worker | Client-side, privacy-preserving |
| **PII NER (mobile)** | **On-device ONNX Runtime C++ in native module** | Zero-trust: no data leaves device, ever |
| **Self-destruct KMS** | **Self-hosted Redis (Docker, no persistence), enclave-ready** | Full control, zero disk surface, future SGX/TDX path |
| **Legal hold** | **Ships in v1: admin freeze API + audit log** | Opens enterprise market; compliance as feature |
| E2E encryption | ML-KEM-768 via Rust core + CMS KEMRecipientInfo | RFC 9629 compliant, reuses existing crypto |
| **OpenPGP interop** | **PQC composite keys (ML-KEM-768 + X25519), Sequoia-compatible** | First PQC OpenPGP interoperable email |
| Forward secrecy | PQ Double Ratchet (existing) | Already implemented in `crates/zipminator-core/src/ratchet/` |
| Webmail | Next.js | Matches existing `web/` stack |
| Mobile | React Native (Expo) | Matches existing `mobile/` stack |
| Anti-screenshot | FLAG_SECURE (Android) + detection (iOS) + forensic watermark | Multi-layer anti-circumvention |

---

## Five "First in the World" Claims

| # | Claim | Basis |
|---|-------|-------|
| 1 | First email server with PQ DKIM signatures | Hybrid dual-sign RSA + ML-DSA-65; no other mail server ships this |
| 2 | First zero-trust on-device PII scanning for email | All competitors (Google, Microsoft, Proofpoint) scan server-side |
| 3 | First crypto-shredding email with enclave-ready KMS | Memory-only DEK store with TTL; designed for SGX/TDX attestation |
| 4 | First PQC OpenPGP interoperable email service | Composite ML-KEM-768 + X25519 keys per draft-ietf-openpgp-pqc-17 |
| 5 | First self-destructing email with built-in legal hold | Compliance as feature, not afterthought; automated GDPR Art. 17 |

---

## Key References

### PQC TLS
- [OpenSSL 3.5 PQC Release Notes](https://openssl-library.org/news/openssl-3.5-notes/)
- [Postfix PQC TLS patch (postfix-devel)](http://www.mail-archive.com/postfix-devel@postfix.org/msg01301.html)
- [Production deployment guide (kernel-error.de, Feb 2026)](https://www.kernel-error.de/2026/02/12/post-quantum-tls-fuer-e-mail-postfix-und-dovecot-mit-x25519mlkem768-auf-freebsd-15/)
- [RFC 9629: KEM Algorithms in CMS](https://www.rfc-editor.org/rfc/rfc9629.html)
- [draft-ietf-lamps-cms-kyber-13](https://datatracker.ietf.org/doc/draft-ietf-lamps-cms-kyber/)
- [draft-ietf-openpgp-pqc-17](https://datatracker.ietf.org/doc/draft-ietf-openpgp-pqc/)
- [NSA CNSA 2.0 Algorithms](https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF)

### Self-Destruct
- [Keybase exploding messages](https://keybase.io/blog/keybase-exploding-messages)
- [Wickr Messaging Protocol whitepaper](https://d1.awsstatic.com/WhitePaper_WickrMessagingProtocol.pdf)
- [Signal disappearing messages](https://signal.org/blog/disappearing-by-default/)
- [Crypto-shredding (Wikipedia)](https://en.wikipedia.org/wiki/Crypto-shredding)
- [ProtonMail message expiration](https://proton.me/support/expiration)
- [Signal SPQR Triple Ratchet (NIST presentation)](https://csrc.nist.gov/csrc/media/events/2025/sixth-pqc-standardization-conference/post-quantum%20ratcheting%20for%20signal.pdf)

### PII Scanning
- [Microsoft Presidio](https://github.com/microsoft/presidio)
- [Hybrid NLP + ML PII detection (Nature, 2025)](https://www.nature.com/articles/s41598-025-04971-9)
- [RECAP: regex + LLM PII (arXiv:2510.07551)](https://arxiv.org/abs/2510.07551)
- [Transformers.js](https://huggingface.co/docs/transformers.js/en/index)
- [Local-Sanitizer: Rust WASM PII masking](https://local-sanitizer.com/)
- [Rust regex crate](https://crates.io/crates/regex)

### Competitors
- [Tuta PQC email](https://tuta.com/blog/post-quantum-cryptography)
- [Secria PQ email](https://secria.me/whitepaper/)
- [Proton PQC PGP](https://proton.me/blog/post-quantum-encryption)
- [Google Workspace DLP GA (Feb 2025)](https://workspaceupdates.googleblog.com/2025/02/gmail-data-loss-prevention-general-availability.html)
