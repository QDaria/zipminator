'use client'

import { motion } from 'framer-motion'
import { GlowCard, MetricCard, DataTable, EquationCard } from '../BlueprintSection'

/* ═══════════════════════════════════════════════════════════════════════
   SECTION: Comprehensive Platform Status
   Full technical audit of the Zipminator PQC super-app.
   This is NOT a pitch deck. It is an investor-grade technical document.
   ═══════════════════════════════════════════════════════════════════════ */

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export const SectionComprehensiveStatus = () => (
  <div className="space-y-16">

    {/* ─── Part A: What Zipminator Is ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        A. What Zipminator Is
      </h3>
      <GlowCard accent="#22D3EE">
        <p className="text-slate-300 leading-relaxed text-[15px]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Zipminator is the world&apos;s first <span className="text-cyan-400 font-semibold">Post-Quantum Cryptography (PQC) super-app</span>.
          It is a QCaaS/QCaaP cybersecurity platform with 9 pillars of military-grade encryption infrastructure.
          It harvests real quantum entropy from IBM Quantum hardware (156-qubit processors) to seed all
          cryptographic operations. It protects device network traffic, stored credentials, and data at rest
          from both classical and quantum adversaries.
        </p>
        <div
          className="mt-4 px-4 py-3 rounded-lg"
          style={{
            background: 'rgba(34,211,238,0.06)',
            borderLeft: '3px solid #22D3EE',
          }}
        >
          <p className="text-sm text-cyan-200 font-medium">
            It is encryption infrastructure, not antivirus or EDR.
          </p>
        </div>
      </GlowCard>
    </div>

    {/* ─── Part B: Codebase Scale ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        B. Codebase Scale
      </h3>

      {/* Top-line metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total LoC" value="1.2M" sub="Lines of production code" accent="#22D3EE" />
        <MetricCard label="Commits" value="238" sub="4 contributors" accent="#F59E0B" />
        <MetricCard label="Languages" value="5" sub="Rust, Python, Dart, TS, SQL" accent="#34D399" />
        <MetricCard label="Velocity" value="6/day" sub="Mar-Apr 2026 average" accent="#A78BFA" />
      </div>

      {/* Language breakdown */}
      <GlowCard accent="#F59E0B">
        <h4 className="text-sm font-mono font-semibold text-amber-400 uppercase tracking-wider mb-4"
          style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Language Breakdown
        </h4>
        <DataTable
          accent="#F59E0B"
          headers={['Language', 'Lines', 'Scope']}
          rows={[
            ['Rust', '~218K', '6 crates: core crypto, FFI bridge, benchmarks, fuzz, mesh, NIST KAT'],
            ['Python', '~133K', 'SDK (PyPI v0.5.0), API (FastAPI), email, entropy, 1,031 tests'],
            ['Dart/Flutter', '~87K', 'Super-app: macOS, Windows, Linux, iOS, Android, Web'],
            ['TypeScript (web)', '~619K', 'Next.js landing, dashboard, 22-slide pitch, blueprint'],
            ['TypeScript (mobile)', '~142K', 'Expo React Native with PQC service layer'],
          ]}
        />
      </GlowCard>

      {/* Rust crate structure */}
      <GlowCard accent="#22D3EE">
        <h4 className="text-sm font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-4"
          style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Rust Crate Architecture (6 Crates)
        </h4>
        <DataTable
          accent="#22D3EE"
          headers={['Crate', 'Purpose', 'Tests']}
          rows={[
            ['zipminator-core', 'ML-KEM-768, QRNG, ratchet, SRTP, PII, email crypto', '118'],
            ['zipminator-app', 'Flutter Rust Bridge (FRB v2.11.1), 16 annotated functions', '16'],
            ['zipminator-bench', 'Performance benchmarks (keygen, encap, decap)', '15'],
            ['zipminator-fuzz', 'Fuzz testing (keygen, encapsulate, decapsulate)', '5'],
            ['zipminator-mesh', 'Q-Mesh entropy bridge for RuView ESP32', '4'],
            ['zipminator-nist', 'NIST KAT vector verification (FIPS 203 compliance)', '2'],
            ['Total', '', '156 pass, 4 ignored'],
          ]}
        />
      </GlowCard>
    </div>

    {/* ─── Part C: Test Coverage ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        C. Test Coverage
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Grand Total" value="1,616" sub="All platforms" accent="#34D399" />
        <MetricCard label="Rust" value="156" sub="4 ignored" accent="#22D3EE" />
        <MetricCard label="Python" value="1,031" sub="All green" accent="#F59E0B" />
        <MetricCard label="E2E" value="6/6" sub="iPhone verified" accent="#FB7185" />
      </div>

      <GlowCard accent="#34D399">
        <DataTable
          accent="#34D399"
          headers={['Domain', 'Tests', 'Status']}
          rows={[
            ['Rust workspace', '156 pass, 4 ignored', 'All green'],
            ['Python SDK + integration', '1,031 collected', 'All green'],
            ['Flutter widget tests', '23', 'All green'],
            ['Mobile (Expo)', '267/274', '7 skipped'],
            ['Web (Next.js)', '30', 'All green'],
            ['Browser (Tauri)', '103', 'All green'],
            ['E2E signaling', '6/6', 'Verified on iPhone'],
          ]}
        />
      </GlowCard>
    </div>

    {/* ─── Part D: The 9 Pillars (FULL DETAIL) ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        D. The 9 Pillars — Code-Verified Status
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Pillars" value="9" sub="All code-complete" accent="#A78BFA" />
        <MetricCard label="Weighted Avg" value="100%" sub="Verified Apr 6 2026" accent="#34D399" />
        <MetricCard label="Crypto Engine" value="ML-KEM-768" sub="NIST FIPS 203" accent="#22D3EE" />
      </div>

      {PILLARS_FULL.map((pillar, i) => (
        <motion.div key={pillar.name} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.05 }}>
          <GlowCard accent={pillar.color}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex-none w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                  style={{ background: `${pillar.color}20`, color: pillar.color }}
                >
                  {i + 1}
                </span>
                <h4 className="text-lg font-semibold text-slate-100">{pillar.name}</h4>
              </div>
              <span
                className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                style={{
                  background: `${pillar.color}15`,
                  color: pillar.color,
                  border: `1px solid ${pillar.color}30`,
                }}
              >
                {pillar.completion}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {pillar.description}
            </p>
            {pillar.tests && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {pillar.tests}
              </div>
            )}
          </GlowCard>
        </motion.div>
      ))}
    </div>

    {/* ─── Part E: Platform Clients ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        E. Platform Clients
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <GlowCard accent="#22D3EE">
          <h4 className="text-sm font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-3"
            style={{ fontFamily: 'var(--font-jetbrains)' }}>
            Flutter Super-App (app/)
          </h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">●</span> Flutter 3.41.4, Dart 3.11.1, Riverpod 3, GoRouter, FRB v2.11.1</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">●</span> All 4 waves complete (Foundation, 8 Pillars, Integration+Polish, Platform Toolchain)</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">●</span> macOS/iOS builds working, Android SDK 36 configured</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">●</span> 43 TestFlight builds (0.5.0+1 through +43)</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">●</span> Crypto roundtrip verified: keypair → encapsulate → decapsulate → 32-byte shared secret</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">●</span> 7 Riverpod providers: crypto, ratchet, pii, email, vpn, srtp, theme</li>
          </ul>
        </GlowCard>

        <GlowCard accent="#F59E0B">
          <h4 className="text-sm font-mono font-semibold text-amber-400 uppercase tracking-wider mb-3"
            style={{ fontFamily: 'var(--font-jetbrains)' }}>
            Web Landing (web/)
          </h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">●</span> Next.js on port 3099, 22+ routes including /invest, /mail, /dashboard</li>
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">●</span> OAuth: GitHub, Google, LinkedIn, Apple (next-auth v5)</li>
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">●</span> Supabase waitlist with rate limiting and Zod validation</li>
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">●</span> 22-slide investor pitch deck + IP valuation blueprint</li>
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">●</span> Live at: https://www.zipminator.zip</li>
          </ul>
        </GlowCard>

        <GlowCard accent="#34D399">
          <h4 className="text-sm font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-3"
            style={{ fontFamily: 'var(--font-jetbrains)' }}>
            Mobile (mobile/)
          </h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">●</span> Expo React Native, 267/274 tests passing (7 skipped)</li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">●</span> PQC services: Messenger, VoIP, VPN, PII Scanner, ZipMail, ZipBrowser</li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">●</span> Shared service layer with Flutter super-app via Rust FFI</li>
          </ul>
        </GlowCard>

        <GlowCard accent="#A78BFA">
          <h4 className="text-sm font-mono font-semibold text-violet-400 uppercase tracking-wider mb-3"
            style={{ fontFamily: 'var(--font-jetbrains)' }}>
            Browser (browser/)
          </h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">●</span> Tauri 2.x desktop browser, 103 Rust tests, DMG 5.7 MB (aarch64)</li>
            <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">●</span> PQC TLS proxy (ML-KEM-768 handshake), VPN tunnel integration</li>
            <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">●</span> AI sidebar, password vault (Argon2), zero telemetry</li>
          </ul>
        </GlowCard>
      </div>
    </div>

    {/* ─── Part F: Python SDK ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        F. Python SDK (Published on PyPI)
      </h3>
      <GlowCard accent="#F59E0B">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <MetricCard label="Package" value="v0.5.0" sub="zipminator on PyPI" accent="#F59E0B" />
          <MetricCard label="License" value="Apache-2.0" sub="Open source" accent="#34D399" />
          <MetricCard label="Extras" value="10" sub="data, cli, quantum, email..." accent="#A78BFA" />
        </div>
        <div
          className="rounded-lg p-4 mt-4"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(245,158,11,0.2)',
            fontFamily: 'var(--font-jetbrains)',
          }}
        >
          <p className="text-xs text-slate-500 mb-2">Installation</p>
          <p className="text-sm text-amber-300">pip install zipminator[all]</p>
          <p className="text-xs text-slate-500 mt-3 mb-2">CLI Usage</p>
          <p className="text-sm text-amber-300">zipminator anonymize --level 7 input.csv output.csv</p>
          <p className="text-xs text-slate-500 mt-3 mb-2">API Key Gating</p>
          <p className="text-sm text-slate-400">L1-L3: Free (basic anonymization). L4+: Requires ZIPMINATOR_API_KEY</p>
        </div>
      </GlowCard>
    </div>

    {/* ─── Part G: Entropy Infrastructure ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        G. Quantum Entropy Infrastructure
      </h3>

      <GlowCard accent="#22D3EE">
        <p className="text-sm text-slate-300 leading-relaxed mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Three provenance-separated entropy pools with no cross-contamination.
          The CompositorProvider XOR-fuses pools with health monitoring and Merkle provenance tracking.
        </p>
        <DataTable
          accent="#22D3EE"
          headers={['Pool', 'Size', 'Source']}
          rows={[
            ['quantum_entropy_pool.bin', '6.8 MB', 'Real quantum entropy (35 IBM jobs, ibm_kingston 156q)'],
            ['csi_entropy_pool.bin', '9 KB', 'CSI WiFi entropy (provenance-clean, no os.urandom fallback)'],
            ['os_entropy_pool.bin', '15 MB', 'os.urandom (classical fallback)'],
          ]}
        />
      </GlowCard>

      <div className="grid md:grid-cols-2 gap-4">
        <EquationCard
          label="Entropy Composition"
          equation="H(Q ⊕ C ⊕ O) ≥ max(H(Q), H(C), H(O))"
          description="XOR-fused entropy is at least as strong as the strongest source"
          accent="#22D3EE"
        />
        <EquationCard
          label="NIST SP 800-90B"
          equation="min-entropy ≥ 0.997 bits/bit"
          description="Measured across 35 IBM Quantum jobs on ibm_kingston (156 qubits)"
          accent="#34D399"
        />
      </div>
    </div>

    {/* ─── Part H: Live Infrastructure ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        H. Live Infrastructure
      </h3>
      <GlowCard accent="#34D399">
        <DataTable
          accent="#34D399"
          headers={['Service', 'URL', 'Status']}
          rows={[
            ['Web landing', 'https://www.zipminator.zip', 'Live (Vercel)'],
            ['Signaling server', 'wss://zipminator-signaling.fly.dev', 'Live (Fly.io)'],
            ['Docs (Jupyter Book)', 'docs.zipminator.zip', 'Configured'],
            ['Demo', 'localhost:5001 (Flask) + localhost:3000 (HTTP)', 'Local only'],
            ['TestFlight', 'Build 43 (0.5.0+43)', 'Live (App Store Connect)'],
          ]}
        />
      </GlowCard>
    </div>

    {/* ─── Part I: Research & IP Portfolio ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        I. Research &amp; IP Portfolio
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Papers" value="3" sub="IEEE format, ePrint" accent="#6366f1" />
        <MetricCard label="Patents Filed" value="3" sub="46 total claims" accent="#F59E0B" />
        <MetricCard label="Grant Templates" value="12" sub="Ready to submit" accent="#34D399" />
        <MetricCard label="Public Repos" value="3" sub="Companion code" accent="#22D3EE" />
      </div>

      <GlowCard accent="#6366f1">
        <h4 className="text-sm font-mono font-semibold text-indigo-400 uppercase tracking-wider mb-4"
          style={{ fontFamily: 'var(--font-jetbrains)' }}>
          3 Academic Papers (IEEE Format, ePrint-Submitted)
        </h4>
        <DataTable
          accent="#6366f1"
          headers={['Paper', 'Target Venue', 'Score', 'Deadline']}
          rows={[
            ['Paper 1: Quantum Certified Anonymization', 'PoPETs 2027 Issue 1', '0.93', 'May 31, 2026'],
            ['Paper 2: Unilateral CSI Entropy (PUEK-IND proof)', 'CCS 2026', '0.95', 'Apr 29, 2026'],
            ['Paper 3: Certified Heterogeneous Entropy (GF bijection)', 'CCS 2026', '0.93', 'Apr 29, 2026'],
          ]}
        />
      </GlowCard>

      <GlowCard accent="#F59E0B">
        <h4 className="text-sm font-mono font-semibold text-amber-400 uppercase tracking-wider mb-4"
          style={{ fontFamily: 'var(--font-jetbrains)' }}>
          3 Patents Filed (46 Claims Total)
        </h4>
        <DataTable
          accent="#F59E0B"
          headers={['Patent', 'Filing ID', 'Claims', 'Subject']}
          rows={[
            ['Patent 1', '20260384 (Patentstyret)', '15', 'Quantum anonymization (L1-L10)'],
            ['Patent 2', 'Altinn ef95b9a26a3e (2,433 NOK)', '14', 'CSI entropy extraction + PUEK'],
            ['Patent 3', 'Altinn 870867694a06 (3,421 NOK)', '17', 'CHE/ARE compositor'],
          ]}
        />
        <div
          className="mt-4 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(245,158,11,0.06)', borderLeft: '3px solid #F59E0B' }}
        >
          <p className="text-sm text-amber-200">PCT deadline for Patent 1: March 24, 2027</p>
        </div>
      </GlowCard>

      {/* Key equations */}
      <div className="grid md:grid-cols-3 gap-4">
        <EquationCard
          label="Patent 1 — IND-ANON"
          equation="Adv^{IND-ANON}_A(λ) ≤ negl(λ)"
          description="Computational indistinguishability of anonymized records"
          accent="#22D3EE"
        />
        <EquationCard
          label="Patent 2 — PUEK-IND"
          equation="H_∞(K | CSI, PK) ≥ κ"
          description="Min-entropy of shared key given public knowledge"
          accent="#F59E0B"
        />
        <EquationCard
          label="Patent 3 — GF Bijection"
          equation="φ: F_{2^n} → F_{2^n}, φ(0) ≠ 0"
          description="Zero-avoidance bijection over Galois fields"
          accent="#34D399"
        />
      </div>
    </div>

    {/* ─── Part J: Development Velocity ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        J. Development Velocity
      </h3>
      <GlowCard accent="#A78BFA">
        <DataTable
          accent="#A78BFA"
          headers={['Month', 'Commits', 'Notes']}
          rows={[
            ['Pre-2026', '4', 'Initial setup'],
            ['Jan 2026', '0', '—'],
            ['Feb 2026', '0', '—'],
            ['Mar 2026', '160', 'Massive sprint: Flutter super-app, all 9 pillars, Tauri browser, signaling, patents'],
            ['Apr 2026 (7 days)', '63', 'Python SDK on PyPI, ePrint submissions, entropy architecture, patent filings'],
          ]}
        />
        <div
          className="mt-4 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(167,139,250,0.06)', borderLeft: '3px solid #A78BFA' }}
        >
          <p className="text-sm text-violet-200">
            Effectively ~223 commits in 37 days (Mar 1 - Apr 6), averaging <span className="font-mono font-bold text-violet-300">6 commits/day</span>.
          </p>
        </div>
      </GlowCard>
    </div>

    {/* ─── Part K: Appendix — Cryptographic Primitives ─── */}
    <div className="space-y-6">
      <h3
        className="text-xl font-semibold text-slate-100"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        K. Appendix — Cryptographic Primitives
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        <EquationCard
          label="ML-KEM-768 Key Sizes"
          equation="pk: 1,184 B | sk: 2,400 B | ct: 1,088 B"
          description="NIST FIPS 203 (August 2024). Category 3 security level."
          accent="#22D3EE"
        />
        <EquationCard
          label="Shared Secret"
          equation="ss = Decapsulate(sk, ct) → 32 bytes"
          description="Constant-time decapsulation, zeroize-on-drop"
          accent="#F59E0B"
        />
        <EquationCard
          label="PQ Double Ratchet"
          equation="K_{i+1} = HKDF(K_i || KEM.Decap(sk, ct_i))"
          description="Forward-secret key derivation with ML-KEM-768 ratchet steps"
          accent="#34D399"
        />
        <EquationCard
          label="Entropy Composition"
          equation="H_∞(S_Q ⊕ S_C ⊕ S_O) ≥ max_i H_∞(S_i)"
          description="Provenance-separated XOR fusion with Merkle audit trail"
          accent="#A78BFA"
        />
      </div>

      <GlowCard accent="#FB7185">
        <h4 className="text-sm font-mono font-semibold text-rose-400 uppercase tracking-wider mb-4"
          style={{ fontFamily: 'var(--font-jetbrains)' }}>
          NIST PQC Standards (Final, August 2024)
        </h4>
        <DataTable
          accent="#FB7185"
          headers={['Standard', 'Algorithm', 'Replaces', 'Zipminator Usage']}
          rows={[
            ['FIPS 203', 'ML-KEM (Kyber)', 'RSA, ECDH', 'Core KEM in all 9 pillars'],
            ['FIPS 204', 'ML-DSA (Dilithium)', 'ECDSA', 'Digital signatures (roadmap)'],
            ['FIPS 205', 'SLH-DSA (SPHINCS+)', 'RSA-PSS', 'Hash-based signatures (roadmap)'],
          ]}
        />
        <div
          className="mt-4 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(251,113,133,0.06)', borderLeft: '3px solid #FB7185' }}
        >
          <p className="text-sm text-rose-200">
            NIST deprecates RSA/ECC after 2030, disallows after 2035. Zipminator is quantum-safe from day one.
          </p>
        </div>
      </GlowCard>
    </div>

  </div>
)

/* ─────────────────────────────────────────────
   Full pillar data with detailed descriptions
   ───────────────────────────────────────────── */

const PILLARS_FULL = [
  {
    name: 'Quantum Vault',
    color: '#22D3EE',
    completion: '100%',
    description: 'AES-256-GCM + ML-KEM-768 keys seeded from IBM Quantum entropy. DoD 5220.22-M 3-pass self-destruct wired to Tauri UI. PII auto-scan before encryption. CSV/JSON/Parquet/Excel support. Hardware-backed key storage with zeroize-on-drop.',
    tests: '118 tests (core crypto)',
  },
  {
    name: 'PQC Messenger',
    color: '#34D399',
    completion: '100%',
    description: 'Post-Quantum Double Ratchet (ML-KEM-768 ratchet, AES-256-GCM payload, HKDF-SHA-256 chain keys with forward secrecy). WebSocket signaling via wss://zipminator-signaling.fly.dev. MessageStore with offline queue + group fanout. Verified on iPhone.',
    tests: '6/6 E2E tests',
  },
  {
    name: 'Quantum VoIP',
    color: '#F59E0B',
    completion: '100%',
    description: 'PQ-SRTP with ML-KEM-768 master key derivation, AES-256-GCM frame encryption. Encrypted voicemail storage. Full call state machine. Audio verified on device.',
    tests: '33 tests',
  },
  {
    name: 'Q-VPN',
    color: '#A78BFA',
    completion: '100%',
    description: 'PQ-WireGuard (ML-KEM-768 handshake). Full state machine with kill switch. Packet wrapping with quantum-safe tunnel encapsulation. Bridge to signaling server created.',
    tests: '28 tests',
  },
  {
    name: '10-Level Anonymizer',
    color: '#FB7185',
    completion: '100%',
    description: 'All L1-L10 implemented. L1-3: regex+SHA-3. L4: reversible tokenization. L5-6: K-anonymity + L-diversity. L7-8: QRNG jitter + differential privacy. L9: combined pipeline. L10: quantum OTP (patent pending). CLI wired end-to-end.',
    tests: '109 tests',
  },
  {
    name: 'Q-AI Assistant',
    color: '#6366f1',
    completion: '100%',
    description: 'Ollama local LLM (llama3.2, mistral, phi-3). PromptGuard with 18 injection patterns detected. PII scan before send. PQC tunnel (ephemeral ML-KEM-768 per session). All queries processed locally, zero cloud telemetry.',
    tests: '85 tests',
  },
  {
    name: 'Quantum Mail',
    color: '#ef4444',
    completion: '100%',
    description: '@zipminator.zip domain. PQC envelope crypto (ML-KEM-768 + AES-256-GCM). SMTP transport with PQC bridge. Self-destruct TTL. S/MIME bridge for enterprise gateway compatibility.',
    tests: '15 tests',
  },
  {
    name: 'ZipBrowser',
    color: '#f97316',
    completion: '100%',
    description: 'Tauri 2.x desktop browser. PQC TLS proxy (ML-KEM-768 handshake). VPN integration. AI sidebar with local LLM. Password vault (Argon2 + ML-KEM). Zero telemetry. Fingerprint resistance. Automatic cookie rotation.',
    tests: '103 tests. DMG 5.7 MB (aarch64)',
  },
  {
    name: 'Q-Mesh (RuView)',
    color: '#14b8a6',
    completion: '100%',
    description: 'Quantum-secured WiFi sensing mesh (ESP32-S3 CSI extraction). HMAC-SHA256 beacon auth. SipHash-2-4 frame integrity. Physical Cryptography Wave 1 complete: 6 new modules, 106 mesh tests. Entropy bridge to compositor pool.',
    tests: '106 mesh tests. External repo: MoHoushmand/RuView (1,300+ tests)',
  },
]
