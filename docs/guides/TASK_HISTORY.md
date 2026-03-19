# Task History

> Moved from CLAUDE.md to save context window tokens. Read on demand.

## Completed (2026-03-16, Python SDK Sprint)

- [x] Python SDK v0.5.0b1: Fix cli.py broken imports (shared -> zipminator.crypto)
- [x] Guard optional imports in anonymization.py (numpy, pandas, faker, phe)
- [x] Rewrite test_comprehensive.py -> 6 focused test files (162 tests passing)
- [x] pyproject.toml: version 0.5.0b1, requires-python>=3.9, restructure deps into 8 extras
- [x] Add APIKeyValidator to subscription.py (L1-3 free, L4+ API key gated)
- [x] Add EntropyQuotaManager (tier-based monthly quotas + pay-as-you-go overage)
- [x] Add entropy scheduler daemon (scripts/qrng_harvester.py -> src/zipminator/entropy/scheduler.py)
- [x] Move task tracker out of CLAUDE.md to docs/guides/TASK_HISTORY.md (saves ~80 lines of context)
- [x] Update MEMORY.md with Python SDK session results
- [x] Python test counts: 162 passed, 17 skipped (was: 0 passed, 17 skipped)
- [x] Release wheel: zipminator-0.5.0b1-cp38-abi3-macosx_11_0_arm64.whl (894KB)

## Completed (2026-03-15, App Store Sprint)

- [x] pubspec fixed, Info.plist 6 permissions, PrivacyInfo.xcprivacy
- [x] Android permissions + signing, privacy/terms pages
- [x] anonymizer_provider, CI release jobs

## Completed (2026-03-11, Beta Launch Sessions 1-6)

- [x] og:image, sitemap, robots.txt, test fixes
- [x] OAuth fix, Vercel deploy, AUTH_URL production
- [x] Blog posts drafted (docs/blog/, 3 articles)
- [x] LinkedIn 5 posts + Twitter 3 threads (docs/social/)
- [x] GitHub Release v1.0.0-beta.1 published as prerelease
- [x] Committed all unstaged work, pushed, cleaned worktree branches
- [x] Landing page zero-hallucination audit (IBM->Rigetti, test count sync, claim corrections)

## Completed (2026-03-09, Sprint 2)

- [x] Wave 4 UI Polish Sprint: glass-morphic QuantumCard, PillarHeader animations
- [x] OpenClaw -> Q-AI Assistant rename across 17+ files
- [x] All 8 pillar screens polished, flutter analyze: 0 issues, flutter test: 23/23
- [x] cargo test: 332 pass (pre-gap-closure)

## Completed (2026-03-09, Sprint 1)

- [x] FEATURES.md consolidated as single source of truth
- [x] implementation_plan.md corrected
- [x] DMG tested on M1 Max, OAuth verified

## Completed (2026-03-08)

- [x] vitest + @testing-library for web/ (15 waitlist tests)
- [x] Vercel production deployed: https://www.zipminator.zip
- [x] Grant templates audited (10/10)
- [x] All 3 OAuth providers verified

## Completed (2026-03-06)

- [x] ruflo v3.5 always-on setup
- [x] Docs consolidation
- [x] TDD verification: cargo test 166/166

## Completed (earlier sessions)

- [x] JupyterLab integration (6 files)
- [x] zip-pqc micromamba env (312 packages)
- [x] Mobile Expo TDD (11/11 suites, 267/274 tests)
- [x] Supabase waitlist verified
- [x] Demo launch verified
