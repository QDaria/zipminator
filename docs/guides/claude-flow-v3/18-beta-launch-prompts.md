# 18 -- Beta Launch Execution Prompts

> Parallelized agent team recipes for the 6 high-priority beta launch items.
> Each recipe is a self-contained Claude Code prompt. Run them in parallel sessions.
>
> **Prerequisite**: `source docs/guides/claude-flow-v3/scripts/activate-all.sh`
>
> **Dependency graph** (what can run in parallel):
>
> ```
> PARALLEL TRACK A (no dependencies between these):
>   ├── Recipe M: Push to remote (5 min)
>   ├── Recipe N: PyPI publish (15 min)
>   ├── Recipe O: Blog posts (45 min)
>   └── Recipe P: Social content (30 min)
>
> SEQUENTIAL TRACK B (must be ordered):
>   Recipe Q: GitHub Release tag ──→ Recipe R: App Store submissions
>   (needs clean remote)              (needs release tag for version)
> ```
>
> **Optimal execution**: Run A recipes as 4 parallel agent team members.
> Run B sequentially after Recipe M completes.

---

## Recipe M: Push 23 Commits to Remote

**Tier**: Single session (no agents needed)
**Time**: 5 minutes
**Model**: Haiku (simple git ops)

```
Push all 23 pending commits to origin/main.

BEFORE pushing:
1. Run `git log --oneline origin/main..HEAD` to review all commits
2. Run `cargo test --workspace` to verify nothing is broken
3. Run `cd web && npx next build` to verify web builds
4. Verify no secrets in any commit: `git log --oneline -23 -p | grep -iE "(api_key|secret|password|token)" | head -5`

If all green: `git push origin main`

DO NOT force push. If rejected, investigate.
```

---

## Recipe N: PyPI Publish

**Tier**: Single session + subagent
**Time**: 15 minutes
**Model**: Sonnet

```
Publish Zipminator Python SDK v0.5.0b1 to PyPI.

PREREQUISITE: micromamba activate zip-pqc

RALPH loop:
R: Read src/zipminator/__init__.py for current version. Read pyproject.toml for build config.
   Check if wheel exists: ls dist/zipminator-0.5.0b1-*.whl
A: If wheel missing, build with maturin: `maturin build --release`
   If wheel exists, verify: `pip install dist/zipminator-*.whl && python -c "import zipminator; print(zipminator.__version__)"`
L: Test the installed package:
   - `python -c "from zipminator.crypto.pqc import keypair; print(keypair())"`
   - `pytest tests/ -x --tb=short` (quick sanity check)
P: Verify pyproject.toml metadata (name, version, description, classifiers, URLs)
H: Publish: `twine upload dist/zipminator-0.5.0b1-*.whl`
   Or if using maturin: `maturin publish`
   Verify on PyPI: spawn subagent to WebFetch https://pypi.org/project/zipminator/

CREDENTIALS: Check ~/.pypirc or TWINE_USERNAME/TWINE_API_TOKEN env vars.
If no credentials, AskUserQuestion for PyPI token.
```

---

## Recipe O: Blog Posts for qdaria.com (Agent Team)

**Tier**: Agent team (3 writers + 1 reviewer)
**Time**: 45 minutes
**Model**: Sonnet (writers), Opus (reviewer)

```
Create 3 blog posts for qdaria.com announcing Zipminator beta.

CONTEXT FILES (read first):
- docs/guides/FEATURES.md (product spec)
- docs/guides/investor-overview.md (positioning)
- web/app/invest/zipminator/page.tsx (pitch narrative)
- .claude/rules/zero-hallucination.md (NO unverified claims)
- .claude/rules/02-security-pqc.md (FIPS language rules)

SPAWN 3 writer teammates + 1 reviewer:

Writer 1: "launch-announcement" (Sonnet)
  Title: "Introducing Zipminator: The World's First PQC Super-App"
  Tone: Technical but accessible. Target: CTOs, CISOs, security engineers.
  Length: 800-1200 words.
  Must cover: 9 pillars, NIST FIPS 203, IBM Quantum 156q QRNG, DORA compliance.
  NEVER say "FIPS certified" — say "implements FIPS 203 (ML-KEM-768)".

Writer 2: "why-pqc-now" (Sonnet)
  Title: "Why Post-Quantum Cryptography Can't Wait: HNDL and the 2035 Deadline"
  Tone: Thought leadership. Target: Finance decision-makers.
  Length: 600-900 words.
  Must cover: Harvest Now Decrypt Later, NIST 2035 deprecation, DORA Art. 6.4, Mosca's theorem.

Writer 3: "technical-deep-dive" (Sonnet)
  Title: "Building ML-KEM-768 in Rust: Lessons from Zipminator's Crypto Core"
  Tone: Developer blog. Target: Rust/crypto developers.
  Length: 1000-1500 words.
  Must cover: NTT implementation, PyO3 bindings, constant-time ops, NIST KAT vectors, entropy pool.

Reviewer: "editor" (Opus)
  Reviews all 3 posts for:
  - Zero-hallucination compliance (no unverified claims)
  - FIPS language compliance (never "certified")
  - Technical accuracy
  - Data integrity (all numbers verifiable)
  - Consistent voice (direct, no AI-tells, no em-dashes)

Output: Save to docs/blog/ directory as markdown files.
DO NOT publish — just create the files for review.
```

---

## Recipe P: LinkedIn + Social Launch Content

**Tier**: Single session + subagent
**Time**: 30 minutes
**Model**: Sonnet

```
Create social media launch content for Zipminator beta.

CONTEXT: Read docs/guides/FEATURES.md and docs/guides/investor-overview.md

Create the following files in docs/social/:

1. linkedin-launch-post.md
   - 1500-2000 char LinkedIn post (Mo Houshmand as author)
   - Announce Zipminator beta, 9 pillars, NIST FIPS 203
   - Include: "Norway's first PQC super-app" positioning
   - End with waitlist CTA: zipminator.zip
   - Professional but not corporate. Direct. No buzzwords.

2. twitter-thread.md
   - 8-10 tweet thread
   - Tweet 1: Hook (what is Zipminator, why now)
   - Tweets 2-5: Each covers 2-3 pillars with key tech detail
   - Tweet 6: DORA compliance angle
   - Tweet 7: Test counts / codebase stats (verifiable only)
   - Tweet 8: CTA (waitlist, GitHub link)
   - Each tweet <= 280 chars

3. linkedin-technical.md
   - 1000-1500 char technical post
   - Target: Rust/crypto/quantum computing community
   - Focus: ML-KEM-768, 441 Rust tests, IBM Quantum entropy, open-source core
   - Include GitHub link: github.com/QDaria/zipminator

CONSTRAINTS:
- ALL metrics must be verifiable (test counts, LOC, platform count)
- NEVER: "FIPS certified", "military-grade" without qualifier, fake user counts
- SAFE: "implements FIPS 203", "441 Rust tests passing", "9-pillar architecture"
```

---

## Recipe Q: GitHub Release v1.0.0-beta.1

**Tier**: Single session
**Time**: 15 minutes
**Model**: Sonnet
**Depends on**: Recipe M (push must complete first)

```
Create GitHub Release v1.0.0-beta.1 for Zipminator.

PREREQUISITES:
1. All commits pushed to origin/main (verify: git log --oneline origin/main..HEAD shows 0)
2. cargo test --workspace passes
3. cd web && npx next build passes

STEPS:
1. Read CHANGELOG.md for recent changes
2. Create annotated tag:
   git tag -a v1.0.0-beta.1 -m "Zipminator v1.0.0-beta.1 — First public PQC super-app beta"

3. Push tag: git push origin v1.0.0-beta.1

4. Create GitHub release via gh CLI:
   gh release create v1.0.0-beta.1 \
     --title "Zipminator v1.0.0-beta.1 — PQC Super-App Beta" \
     --notes "$(cat <<'EOF'
   ## What's New

   The world's first Post-Quantum Cryptography super-app.

   ### 9 Pillars of PQC Infrastructure
   - Quantum Vault (ML-KEM-768 + AES-256-GCM)
   - PQC Messenger (Post-Quantum Double Ratchet)
   - Quantum VoIP (PQ-SRTP)
   - Q-VPN (PQ-WireGuard)
   - 10-Level Anonymizer (15-country PII detection)
   - Q-AI Assistant
   - Quantum Mail (@zipminator.zip)
   - ZipBrowser (Tauri 2.x, 7 privacy subsystems)
   - Q-Mesh (quantum-secured WiFi sensing)

   ### Test Coverage
   - 441 Rust tests, 429 Python tests, 23 Flutter tests
   - 30 web vitest, 267 mobile Expo tests

   ### Platforms
   - Flutter: macOS, Windows, Linux, iOS, Android, Web
   - Tauri DMG: macOS Apple Silicon (5.7MB)
   - Python SDK: v0.5.0b1 (abi3 wheel)

   ### Crypto Core
   - NIST FIPS 203 ML-KEM-768 in Rust
   - IBM Quantum 156q QRNG via qBraid
   - Verified against NIST KAT test vectors

   EOF
   )" \
     --prerelease

5. Verify: gh release view v1.0.0-beta.1
```

---

## Recipe R: App Store Submissions (Agent Team)

**Tier**: Agent team (2 teammates)
**Time**: 60+ minutes (mostly waiting for builds)
**Model**: Sonnet
**Depends on**: Recipe Q (release tag needed for version)

```
Prepare iOS TestFlight and Google Play submissions for Zipminator Flutter app.

CONTEXT FILES:
- app/pubspec.yaml (Flutter project config)
- app/ios/Runner.xcodeproj/ (iOS project)
- app/android/app/build.gradle (Android config)
- docs/guides/code-signing-checklist.md (signing steps)

SPAWN 2 teammates:

Teammate 1: "ios-submission" (Sonnet, worktree)
  1. Read docs/guides/code-signing-checklist.md
  2. Verify Xcode project: cd app && flutter build ios --release --no-codesign
  3. Check Bundle ID: com.qdaria.zipminator
  4. Check Info.plist for required privacy descriptions
  5. AskUserQuestion: "Do you have the Apple Distribution certificate and provisioning profile ready?"
  6. If yes: flutter build ipa
  7. Upload to TestFlight: xcrun altool --upload-app -f build/ios/ipa/*.ipa
  8. If blocked on signing, document exactly what's needed

Teammate 2: "android-submission" (Sonnet, worktree)
  1. Verify Android build: cd app && flutter build apk --release
  2. Check if Rust NDK cross-compilation works:
     - rustup target add aarch64-linux-android armv7-linux-androideabi
     - Verify cargo-ndk is installed
  3. If NDK build fails, document the blocker and AskUserQuestion
  4. Build app bundle: flutter build appbundle --release
  5. Check signing: verify keystore exists or create one
  6. AskUserQuestion: "Do you have a Google Play Developer account and keystore ready?"

IMPORTANT: App store submissions will likely BLOCK on signing credentials.
Document every blocker clearly. Do not guess at credentials.
```
