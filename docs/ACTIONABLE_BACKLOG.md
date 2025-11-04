# Zipminator - Actionable Backlog
**Date**: November 3, 2025
**Document Version**: 1.0
**Last Updated**: 2025-11-03

---

## 🎯 Purpose

This document provides a prioritized, actionable backlog for the Zipminator project. Each item includes:
- **Priority Level** (P0-P4)
- **Estimated Effort** (hours/days/weeks)
- **Owner/Responsible Party**
- **Success Criteria**
- **Dependencies**
- **Risk Level**

---

## 📊 Priority Definitions

| Priority | Definition | Timeframe | Examples |
|----------|-----------|-----------|----------|
| **P0** 🔥 | BLOCKING - Must fix immediately | Hours | Critical bugs, security issues, demo blockers |
| **P1** ⚡ | HIGH - Required for next milestone | Days | Seed funding requirements, beta launch features |
| **P2** 📋 | MEDIUM - Important but not urgent | Weeks | Feature enhancements, technical debt |
| **P3** 💡 | LOW - Nice to have | Months | Optimizations, minor features |
| **P4** 🔬 | RESEARCH - Exploratory | Quarters | Experimental features, R&D projects |

---

## 🔥 P0: CRITICAL (Immediate Action Required)

### P0-1: Fix IBM Quantum Token (BLOCKING DEMO)

**Status**: 🔴 CRITICAL
**Priority**: P0 🔥
**Effort**: 5 minutes
**Owner**: Founder/DevOps
**Deadline**: IMMEDIATE (before next investor demo)

**Problem**: Current IBM Quantum token in `.env` is invalid/expired. Token is only 48 characters (real tokens are 200-400 characters). This blocks all quantum entropy generation and makes the competitive advantage claim (vs Naoris) impossible to demonstrate.

**Impact**:
- ❌ Cannot generate quantum entropy for demos
- ❌ Cannot prove real quantum hardware access
- ❌ Competitive advantage claim unverifiable
- ❌ Investor demo will fail

**Solution**:
```bash
# Step 1: Get new token (3 minutes)
# Visit: https://quantum.ibm.com/account
# Login with IBM ID
# Navigate to: Profile → API tokens
# Click: "Generate new token" or "Copy token"
# Copy FULL token (~200-400 characters)

# Step 2: Update .env file (1 minute)
cd /Users/mos/dev/zipminator
echo 'IBM_QUANTUM_TOKEN="your_long_token_here"' > .env
chmod 600 .env  # Secure permissions

# Step 3: Validate token (1 minute)
python3 scripts/test_ibm_token.py
# Expected: "Token valid, backend access confirmed"

# Step 4: Generate quantum entropy for demo (10 minutes)
python3 scripts/production_qrng_harvest.py --bytes 51200 --qubits 120
# Expected: 51,200 bytes of quantum entropy generated
# Output: production/entropy_pool/quantum_entropy_*.bin

# Step 5: Test demo application
cd demo && ./test_demo.sh
# Expected: 17/17 tests passing
```

**Success Criteria**:
- ✅ New IBM token validated (200-400 chars)
- ✅ Token stored securely in `.env` (permissions 600)
- ✅ Quantum entropy generated (50KB+)
- ✅ Demo application tests passing (17/17)
- ✅ Can demonstrate live quantum entropy generation

**Dependencies**: None (blocking everything else)

**Risk Level**: 🔴 HIGH (currently blocks all demos, affects investor confidence)

**Post-Fix Actions**:
- Set up automated token rotation (30-90 days)
- Add token expiration monitoring
- Create token refresh runbook
- Update operational documentation

---

## ⚡ P1: HIGH PRIORITY (Next 30 Days)

### P1-1: Automate IBM Token Rotation

**Status**: 🟡 TODO
**Priority**: P1 ⚡
**Effort**: 2 weeks (80 hours)
**Owner**: DevOps Engineer (future hire) or Founder
**Deadline**: 30 days

**Problem**: Manual token refresh is error-prone and caused the current blocker. Need automated token management to prevent future incidents.

**Solution**:
1. **Token Rotation Script** (3 days)
   - Auto-refresh token every 30-90 days
   - Store securely (encrypted, version controlled secrets)
   - Validate new token before replacing old token
   - Rollback mechanism if new token invalid

2. **Monitoring & Alerting** (2 days)
   - Token expiration warnings (7 days, 3 days, 1 day)
   - Token validation health checks (daily)
   - Failed API call detection (alert on 401/403)
   - PagerDuty/Slack integration

3. **CI/CD Integration** (2 days)
   - Pre-commit hooks (prevent token exposure)
   - Token validation in test pipeline
   - Automated token refresh in staging/prod
   - Secrets management (AWS Secrets Manager or HashiCorp Vault)

4. **Operational Runbook** (1 day)
   - Token refresh procedure
   - Emergency token replacement process
   - Troubleshooting guide
   - Contact escalation (IBM Quantum support)

5. **Testing & Validation** (2 days)
   - End-to-end token rotation test
   - Failure scenario testing (expired token, invalid token)
   - Load testing (ensure rotation doesn't disrupt operations)
   - Documentation review

**Success Criteria**:
- ✅ Automated token rotation working (test environment)
- ✅ Monitoring alerts firing correctly (test expiration)
- ✅ CI/CD pipeline validates tokens (pre-commit hooks working)
- ✅ Operational runbook complete and tested
- ✅ Zero manual token-related incidents for 90 days

**Dependencies**:
- P0-1 completed (valid token in place)
- Secrets management solution (AWS Secrets Manager or Vault)
- Monitoring infrastructure (Prometheus/Grafana or Datadog)

**Risk Level**: 🟡 MEDIUM (operational efficiency, not immediately blocking)

---

### P1-2: Launch Beta Customer Program (3-5 Enterprise Pilots)

**Status**: 🟡 TODO
**Priority**: P1 ⚡
**Effort**: 4 weeks (160 hours)
**Owner**: Founder + VP Sales (future hire)
**Deadline**: 45 days (by Dec 15, 2025)

**Objective**: Sign 3-5 enterprise customers for beta pilot program to validate product-market fit and generate early revenue.

**Target Customer Profile**:
- **Industries**: Financial services, healthcare, government, critical infrastructure
- **Data Size**: 1TB+ sensitive data requiring encryption
- **Compliance**: GDPR, HIPAA, FedRAMP, or equivalent
- **Budget**: $200K+ annual security budget
- **Decision Makers**: CISO, VP Engineering, CTO

**Beta Program Offer**:
- **Pricing**: 50% discount Year 1 ($100K instead of $200K)
- **Support**: Direct engineering access (Slack channel)
- **Influence**: Product roadmap input, feature prioritization
- **Duration**: 90-day pilot, renewable annually
- **SLA**: 99.5% uptime (lower than GA, but sufficient for pilot)

**Implementation Plan**:

#### Week 1-2: Outreach & Qualification (40 hours)
- [ ] **Target List Creation** (8 hours)
  - Identify 50 target companies (10 per industry vertical)
  - Research decision makers (LinkedIn, company websites)
  - Score by fit (budget, compliance needs, tech stack)
  - Prioritize top 20 for outreach

- [ ] **Outreach Campaign** (16 hours)
  - Personalized emails (cold outreach, 20 targets)
  - LinkedIn connection requests (executives)
  - Warm introductions (investor network, advisors)
  - Follow-up cadence (day 3, day 7, day 14)

- [ ] **Discovery Calls** (16 hours)
  - Schedule 10-15 discovery calls (30 min each)
  - Understand pain points (current encryption, quantum concerns)
  - Qualify budget and timeline (pilot budget available?)
  - Identify technical requirements (integration points)

#### Week 3-4: Demo & Proposal (60 hours)
- [ ] **Technical Demos** (24 hours)
  - Conduct 5-8 live demos (60 min each)
  - Demonstrate quantum entropy generation
  - Show Kyber768 encryption performance
  - Highlight GDPR compliance features
  - Q&A and technical deep-dive

- [ ] **Pilot Proposals** (16 hours)
  - Custom pilot proposals (5 customers)
  - Scope definition (data size, use cases, success criteria)
  - Pricing and terms ($100K pilot, 90 days)
  - Technical requirements (API integration, key management)
  - Timeline and milestones

- [ ] **Negotiation & Close** (20 hours)
  - Address objections (security, performance, compliance)
  - Legal review (MSA, DPA, SOW)
  - Negotiate terms (payment schedule, termination clauses)
  - Sign pilot agreements (target: 3-5 customers)

#### Week 4+: Onboarding & Support (60 hours)
- [ ] **Customer Onboarding** (30 hours)
  - Kickoff meetings (project team, stakeholders)
  - Environment setup (staging, production)
  - API key provisioning and testing
  - Integration guidance (documentation, code samples)
  - Training sessions (engineering team, security team)

- [ ] **Ongoing Support** (30 hours ongoing)
  - Weekly check-ins (progress, blockers)
  - Engineering support (Slack channel, email)
  - Bug fixes and hotfixes (prioritized for pilots)
  - Feature requests (capture and prioritize)
  - Success metrics tracking (usage, performance, satisfaction)

**Success Criteria**:
- ✅ 3-5 pilot agreements signed ($300-500K pipeline)
- ✅ 2+ customers actively using in production (not just testing)
- ✅ 1+ customer testimonial/case study
- ✅ Product feedback captured (feature requests, bugs)
- ✅ Pilot-to-paid conversion path validated (pricing accepted)

**Dependencies**:
- P0-1 completed (demo working with real quantum entropy)
- Demo application stable (17/17 tests passing)
- Basic enterprise features (SSO optional, but RBAC helpful)
- Customer success playbook (onboarding, support process)

**Risk Level**: 🟡 MEDIUM (sales execution risk, customer readiness varies)

**Mitigation**:
- Start with 1-2 warm leads (investor introductions)
- Offer extended pilot (180 days if needed)
- Provide white-glove support (over-invest in early customers)
- Capture detailed feedback (even if pilot doesn't convert)

---

### P1-3: Secure $6M Seed Round

**Status**: 🟡 IN PROGRESS
**Priority**: P1 ⚡
**Effort**: 6-8 weeks (240 hours)
**Owner**: Founder + Advisors
**Deadline**: 60 days (by Dec 30, 2025)

**Objective**: Close $6M seed round at $24-30M post-money valuation to fund team hiring, product development, and go-to-market.

**Fundraising Plan**:

#### Week 1-2: Preparation (40 hours)
- [x] **Pitch Deck Finalized** - COMPLETE
  - Problem, solution, market opportunity
  - Competitive analysis (Naoris fact-check)
  - Financial projections ($2M → $24M ARR)
  - Team and roadmap
  - Ask: $6M seed, 20-25% equity

- [x] **Financial Model** - COMPLETE
  - 5-year P&L projections
  - Unit economics (CAC, LTV, gross margin)
  - Headcount plan (10 FTEs Year 1)
  - Burn rate and runway (18-24 months)

- [ ] **Data Room Setup** (8 hours)
  - Incorporate (C-corp, Delaware) if not done
  - Cap table (founder shares, option pool 15%)
  - Financials (historical if any, projections)
  - Legal documents (incorporation, IP assignment)
  - Technical documentation (architecture, security)
  - Customer pipeline (beta prospects, LOIs if any)

- [ ] **Target Investor List** (8 hours)
  - Seed-stage VCs (Andreessen Horowitz, Kleiner Perkins, etc.)
  - Crypto/quantum-focused funds (Variant, Multicoin)
  - Strategic investors (IBM Ventures, AWS, Intel Capital)
  - Angel syndicates (SV Angel, Hustle Fund)
  - Score by fit (thesis, check size, portfolio relevance)

#### Week 3-4: Outreach & Meetings (60 hours)
- [ ] **Warm Introductions** (16 hours)
  - Leverage network (advisors, existing investors, LinkedIn)
  - Target 20 VCs with warm intros (double opt-in preferred)
  - Cold outreach to 10 strategic investors (IBM, AWS, Intel)

- [ ] **Pitch Meetings** (32 hours)
  - First meetings (30-45 min pitch + Q&A)
  - Partner meetings (1-2 hour deep-dive)
  - Demo sessions (technical due diligence)
  - Customer reference calls (beta customers)

- [ ] **Follow-Up & Updates** (12 hours)
  - Weekly investor updates (progress, metrics, traction)
  - Answer questions (technical, market, competitive)
  - Provide additional materials (data room access)

#### Week 5-6: Due Diligence (60 hours)
- [ ] **Technical Due Diligence** (24 hours)
  - Code review (VCs bring technical advisors)
  - Architecture walkthrough (multi-provider QRNG, Kyber768)
  - Security audit (constant-time validation, memory safety)
  - Performance testing (benchmarks, scalability)

- [ ] **Business Due Diligence** (24 hours)
  - Market sizing validation (TAM, SAM, SOM)
  - Competitive analysis verification (Naoris research)
  - Customer interviews (beta pilots if available)
  - Reference checks (advisors, previous employers)

- [ ] **Legal Due Diligence** (12 hours)
  - Cap table review (ownership, vesting)
  - IP verification (no third-party claims)
  - Regulatory compliance (GDPR, NIST, export controls)
  - Employment agreements (founder, employees if any)

#### Week 7-8: Term Sheet & Close (80 hours)
- [ ] **Term Sheet Negotiation** (24 hours)
  - Review term sheets (likely 2-3 offers)
  - Compare terms (valuation, liquidation preference, board seats)
  - Negotiate key terms (founder-friendly provisions)
  - Select lead investor (aligned vision, value-add)

- [ ] **Legal Documentation** (40 hours)
  - Series Seed documents (stock purchase agreement, voting agreement)
  - Founder vesting agreements (4-year vest, 1-year cliff)
  - Board formation (founder + lead investor + independent)
  - Option pool creation (15% post-money)

- [ ] **Wire Transfer & Close** (16 hours)
  - Final signatures (DocuSign or in-person)
  - Wire transfer ($6M to company bank account)
  - Press release (optional, some prefer stealth mode)
  - Investor onboarding (board meeting cadence, reporting)

**Success Criteria**:
- ✅ $6M seed round closed (wire transfer received)
- ✅ Valuation $24-30M post-money (20-25% dilution)
- ✅ Founder-friendly terms (4-year vesting, 1-year cliff)
- ✅ Lead investor value-add (quantum/crypto expertise, customer intros)
- ✅ 18-24 month runway (based on $2M burn Year 1)

**Dependencies**:
- P0-1 completed (demo working for investor meetings)
- P1-2 in progress (beta traction helps valuation)
- Pitch deck and financial model complete (DONE)
- Strong competitive positioning (Naoris fact-check complete)

**Risk Level**: 🟡 MEDIUM (fundraising always uncertain, but strong fundamentals)

**Mitigation**:
- Multiple investor conversations (diversify options)
- Beta customer traction (de-risk execution)
- Strong technical demo (differentiate from competitors)
- Advisor support (leverage network, warm intros)
- Realistic valuation (don't overprice seed round)

---

### P1-4: Implement NIST Randomness Validation (SP 800-90B)

**Status**: 🟡 TODO
**Priority**: P1 ⚡
**Effort**: 3 weeks (120 hours)
**Owner**: Cryptography Engineer (future hire) or Founder
**Deadline**: 60 days (by Dec 30, 2025)

**Objective**: Implement NIST SP 800-90B health tests to validate quantum entropy quality for regulatory compliance and customer confidence.

**Background**: Current implementation has basic quality checks (SHA-256 hash, byte distribution). Need comprehensive NIST validation for:
- Regulatory compliance (FIPS 140-3 pathway)
- Customer confidence (provable randomness quality)
- Competitive differentiation (certified vs uncertified)

**Implementation Plan**:

#### Phase 1: Research & Design (1 week, 40 hours)
- [ ] **NIST SP 800-90B Study** (16 hours)
  - Read NIST Special Publication 800-90B
  - Understand entropy source requirements
  - Identify applicable health tests (startup, continuous)
  - Review reference implementations (NIST GitHub)

- [ ] **Test Selection** (8 hours)
  - Startup tests (run once at initialization)
    - Repetition Count Test
    - Adaptive Proportion Test
  - Continuous tests (run on each entropy batch)
    - Repetition Count Test
    - Adaptive Proportion Test
    - Chi-square test
    - Serial correlation test

- [ ] **Architecture Design** (16 hours)
  - Integration points (quantum_entropy_pool.py, ibm_qrng_harvester.py)
  - Test parameters (window size, threshold, failure handling)
  - Logging and reporting (test results, failures)
  - Performance impact (acceptable overhead?)

#### Phase 2: Implementation (1 week, 60 hours)
- [ ] **Core Test Implementation** (32 hours)
  ```python
  # src/python/nist_health_tests.py (new file)
  class NISTHealthTests:
      def __init__(self, window_size=512):
          self.window_size = window_size
          self.repetition_count_threshold = 10
          self.adaptive_proportion_threshold = ...

      def repetition_count_test(self, data: bytes) -> bool:
          """NIST SP 800-90B Section 4.4.1"""
          # Check for repeated values
          pass

      def adaptive_proportion_test(self, data: bytes) -> bool:
          """NIST SP 800-90B Section 4.4.2"""
          # Check for biased values
          pass

      def chi_square_test(self, data: bytes) -> bool:
          """Chi-square goodness of fit test"""
          pass

      def serial_correlation_test(self, data: bytes) -> bool:
          """Test for correlation between bytes"""
          pass

      def run_all_tests(self, data: bytes) -> dict:
          """Run all health tests, return results"""
          pass
  ```

- [ ] **Integration** (16 hours)
  - Add to quantum entropy harvesting pipeline
  - Startup tests (before accepting entropy source)
  - Continuous tests (on each batch generated)
  - Failure handling (retry, fallback to different backend)

- [ ] **Logging & Monitoring** (12 hours)
  - Detailed test results (pass/fail, statistics)
  - Alert on repeated failures (entropy source degraded?)
  - Metrics for monitoring (test pass rate, entropy quality score)

#### Phase 3: Testing & Validation (1 week, 20 hours)
- [ ] **Unit Tests** (8 hours)
  - Test each health test implementation
  - Edge cases (all zeros, all ones, repeated patterns)
  - Threshold tuning (false positive rate < 0.01%)

- [ ] **Integration Tests** (8 hours)
  - Test with real quantum entropy (IBM Brisbane)
  - Test with bad entropy (simulator, deterministic data)
  - Verify failure detection (inject bad data)

- [ ] **Documentation** (4 hours)
  - NIST compliance documentation
  - Test parameters and thresholds
  - Failure handling procedures
  - Audit trail requirements

**Success Criteria**:
- ✅ All 4 NIST health tests implemented and tested
- ✅ Integration with quantum entropy pipeline complete
- ✅ Tests passing on real quantum data (IBM Brisbane, IonQ)
- ✅ Logging and monitoring operational
- ✅ Documentation complete (compliance-ready)
- ✅ Performance impact <5% (acceptable overhead)

**Dependencies**:
- P0-1 completed (need real quantum entropy for testing)
- Access to multiple quantum providers (IBM, IonQ, Rigetti)
- Monitoring infrastructure (Prometheus/Grafana)

**Risk Level**: 🟢 LOW (well-defined requirements, clear implementation path)

**Post-Implementation**:
- Run continuous validation (monthly entropy quality reports)
- Compare providers (which has highest quality entropy?)
- Publish results (marketing: "NIST-validated quantum entropy")
- Begin FIPS 140-3 certification process (18-24 months)

---

## 📋 P2: MEDIUM PRIORITY (Next 60-90 Days)

### P2-1: Hire Key Engineering Team (6 FTEs)

**Status**: 🟡 TODO
**Priority**: P2 📋
**Effort**: 12 weeks (480 hours recruiting + onboarding)
**Owner**: Founder + Recruiting Firm
**Deadline**: 90 days (contingent on seed funding)

**Objective**: Build world-class engineering team to accelerate product development and support beta customers.

**Hiring Plan**:

#### Priority #1: Senior Cryptography Engineer ($180K-220K)
**Responsibilities**:
- Own Kyber768 implementation (Rust + C++)
- NIST standards expertise (FIPS 203, 204, 205)
- Security audits and constant-time validation
- FIPS 140-3 certification pathway

**Requirements**:
- PhD in Cryptography or 10+ years applied crypto
- Deep knowledge of lattice-based cryptography
- Rust or C++ systems programming
- NIST FIPS experience (validation lab coordination)
- Strong publication record (papers, talks)

**Sourcing Strategy**:
- Target: Universities (Stanford, MIT, Carnegie Mellon)
- Target: Big tech crypto teams (Google, Apple, Microsoft)
- Target: Defense contractors (Raytheon, Lockheed)
- Outreach: Conferences (CRYPTO, Eurocrypt, Real World Crypto)

**Timeline**: 8 weeks (sourcing 3 weeks, interviews 2 weeks, close 3 weeks)

---

#### Priority #2: Lead Quantum Software Engineer ($160K-200K)
**Responsibilities**:
- Own multi-provider QRNG integration
- Quantum circuit optimization (Qiskit)
- IBM/IonQ/Rigetti hardware expertise
- Credit optimization and performance tuning

**Requirements**:
- MS/PhD in Quantum Computing or Physics
- 5+ years quantum software development
- Qiskit, Cirq, or Braket SDK expertise
- Experience with real quantum hardware (not just simulation)
- Strong Python skills

**Sourcing Strategy**:
- Target: IBM Quantum, IonQ, Rigetti (poach talent)
- Target: Quantum startups (PsiQuantum, Atom Computing)
- Target: Academic labs (quantum information groups)
- Outreach: Qiskit Global Summer School, Q2B Conference

**Timeline**: 8 weeks (quantum talent scarce, may take longer)

---

#### Priority #3: Backend Engineer - Python/Rust ($140K-180K)
**Responsibilities**:
- Own Flask API server (9 endpoints → 50+ endpoints)
- Entropy pool management (storage, retrieval, rotation)
- Performance optimization (latency, throughput)
- Database design (PostgreSQL, metadata)

**Requirements**:
- BS/MS Computer Science
- 5+ years backend engineering (Python, Rust, or Go)
- Flask, FastAPI, or Django experience
- PostgreSQL, Redis, distributed systems
- API design and performance tuning

**Sourcing Strategy**:
- Target: Big tech backend teams (Stripe, Uber, Airbnb)
- Target: Security startups (1Password, Tailscale)
- Outreach: Python conferences, Rust meetups

**Timeline**: 6 weeks (backend engineers more abundant)

---

#### Priority #4: Frontend Engineer - React/Electron ($140K-180K)
**Responsibilities**:
- Own demo application UI (React + Electron)
- Enterprise admin console (multi-tenancy, RBAC)
- Real-time monitoring dashboard (entropy pool, metrics)
- UX design and accessibility

**Requirements**:
- BS/MS Computer Science or Design
- 5+ years frontend engineering
- React, TypeScript, Electron expertise
- Design systems, accessibility (WCAG)
- Security-focused UI/UX

**Sourcing Strategy**:
- Target: Security product companies (1Password, Duo)
- Target: Enterprise SaaS (Datadog, Snowflake)
- Outreach: React conferences, design communities

**Timeline**: 6 weeks

---

#### Priority #5: DevOps/SRE Engineer ($150K-190K)
**Responsibilities**:
- Kubernetes deployment and orchestration
- CI/CD pipeline (GitHub Actions, Jenkins)
- Monitoring and alerting (Prometheus, Grafana, PagerDuty)
- Infrastructure as Code (Terraform, Ansible)
- On-call rotation and incident response

**Requirements**:
- BS Computer Science or equivalent
- 5+ years DevOps/SRE experience
- Kubernetes, Docker, Helm charts
- AWS, Azure, or GCP expertise
- Monitoring and observability (Prometheus, Datadog)

**Sourcing Strategy**:
- Target: Big tech SRE teams (Google, Netflix, Amazon)
- Target: High-growth startups (Databricks, Snowflake)
- Outreach: SREcon, DevOpsDays conferences

**Timeline**: 6 weeks

---

#### Priority #6: Security Engineer ($160K-200K)
**Responsibilities**:
- Security audits and penetration testing
- FIPS 140-3 validation coordination
- Vulnerability management (bug bounty, responsible disclosure)
- Compliance (SOC 2, ISO 27001, GDPR)
- Incident response and forensics

**Requirements**:
- BS/MS Computer Science or Security
- 5+ years application security
- Penetration testing (OSCP, CEH certifications)
- Compliance experience (SOC 2, FIPS 140-3)
- Bug bounty platforms (HackerOne, Bugcrowd)

**Sourcing Strategy**:
- Target: Security consulting firms (NCC Group, Trail of Bits)
- Target: Big tech security teams (Google, Microsoft)
- Outreach: Black Hat, DEF CON, security meetups

**Timeline**: 8 weeks (security talent competitive)

---

**Total Engineering Hiring**:
- **Timeframe**: 12 weeks (3 months, staggered starts)
- **Budget**: ~$1M Year 1 salaries + $250K benefits/taxes = **$1.25M**
- **Recruiting**: Partner with specialized recruiters (Triplebyte, Hired, Vettery)
- **Onboarding**: 2-week intensive onboarding (codebase, architecture, domain knowledge)

**Success Criteria**:
- ✅ 6 engineering hires made (all key roles filled)
- ✅ Team ramped up (productive within 30 days)
- ✅ Sprint cadence established (2-week sprints)
- ✅ Engineering culture defined (values, practices, tools)
- ✅ Retention plan (equity, growth path, challenging problems)

**Dependencies**:
- P1-3 completed (seed funding in bank)
- Office space or remote-first policy decided
- Equity option pool approved (15% post-money)
- Legal (employment agreements, IP assignment)

**Risk Level**: 🟡 MEDIUM (hiring always challenging, quantum talent especially scarce)

**Mitigation**:
- Use specialized recruiters (quantum, crypto, security)
- Competitive compensation (top quartile for Bay Area)
- Equity upside (early employees, significant ownership)
- Interesting problems (quantum + crypto + security)
- Remote-first if needed (expand talent pool)

---

### P2-2: Enterprise Features (SSO, RBAC, Key Management)

**Status**: 🟡 TODO
**Priority**: P2 📋
**Effort**: 8 weeks (320 hours)
**Owner**: Backend Engineer + Security Engineer (post-hire)
**Deadline**: 120 days (Q1 2026)

**Objective**: Implement enterprise-grade features required for larger deals ($500K+ ACV) and SOC 2 compliance.

**Feature List**:

#### 1. Single Sign-On (SSO) - 3 weeks
**Protocols**: SAML 2.0, OAuth 2.0/OIDC
**Providers**: Okta, Auth0, Azure AD, Google Workspace, OneLogin

**Implementation**:
- [ ] SAML 2.0 integration (backend, service provider)
- [ ] OAuth 2.0/OIDC support (modern SaaS apps)
- [ ] User provisioning (JIT or SCIM)
- [ ] Session management (token expiration, refresh)
- [ ] Admin console (SSO configuration UI)

**Success Criteria**:
- ✅ Okta integration working (most common request)
- ✅ Azure AD integration (Microsoft shops)
- ✅ User provisioning (automatic account creation)
- ✅ Session security (HTTPS-only, secure cookies)

---

#### 2. Role-Based Access Control (RBAC) - 3 weeks
**Roles**: Admin, User, Auditor, ReadOnly
**Permissions**: encrypt, decrypt, view_logs, manage_users, manage_keys

**Implementation**:
- [ ] Permission system design (roles, permissions, resources)
- [ ] Database schema (users, roles, permissions, role_bindings)
- [ ] API authorization middleware (check permissions on every request)
- [ ] Admin console (role management UI)
- [ ] Audit logging (who did what, when)

**Success Criteria**:
- ✅ 4+ roles defined (Admin, User, Auditor, ReadOnly)
- ✅ Granular permissions (50+ permission types)
- ✅ API authorization enforced (every endpoint)
- ✅ Audit trail complete (immutable log)

---

#### 3. Advanced Key Management - 2 weeks
**Features**: Key rotation, versioning, escrow, HSM integration

**Implementation**:
- [ ] Key rotation (automatic, policy-driven)
- [ ] Key versioning (track key versions, migrate data)
- [ ] Key escrow (recovery mechanism for lost keys)
- [ ] HSM integration (AWS CloudHSM, Azure Dedicated HSM)
- [ ] Key lifecycle management (creation, active, deprecated, destroyed)

**Success Criteria**:
- ✅ Key rotation working (90-day policy)
- ✅ Key versioning (backward compatibility)
- ✅ HSM integration (AWS CloudHSM or equivalent)
- ✅ Recovery mechanism (key escrow, M-of-N threshold)

**Total Effort**: 8 weeks (320 hours)
**Priority**: HIGH for enterprise deals >$500K

**Dependencies**:
- Backend engineer hired (P2-1)
- Security engineer hired (P2-1)
- Database infrastructure (PostgreSQL)
- Admin console UI (frontend engineer)

**Risk Level**: 🟢 LOW (well-known patterns, many libraries available)

---

### P2-3: AWS + Azure Marketplace Listings

**Status**: 🟡 TODO
**Priority**: P2 📋
**Effort**: 6 weeks (240 hours)
**Owner**: DevOps Engineer + Sales Engineer
**Deadline**: 120 days (Q1 2026)

**Objective**: List Zipminator on AWS Marketplace and Azure Marketplace to expand distribution channels and capture cloud-native customers.

**AWS Marketplace Listing**:

#### Phase 1: Technical Setup (3 weeks)
- [ ] **AMI Creation** (1 week)
  - Build AWS Machine Image (Ubuntu 22.04 + Zipminator)
  - Install dependencies (Python, Rust, Node.js)
  - Pre-configure Zipminator (systemd service)
  - Security hardening (minimal packages, firewall)
  - Test deployment (EC2 instance launch, verify working)

- [ ] **CloudFormation Template** (1 week)
  - Infrastructure as Code (VPC, subnets, security groups)
  - RDS PostgreSQL (metadata storage)
  - S3 buckets (entropy pool storage)
  - IAM roles (least privilege)
  - Load balancer (ALB for production)

- [ ] **Billing Integration** (1 week)
  - AWS Marketplace metering API
  - Usage tracking (encrypt operations, data volume)
  - Billing reports (monthly usage)
  - Pricing tiers (bronze, silver, gold)

#### Phase 2: Marketplace Onboarding (2 weeks)
- [ ] **AWS Marketplace Registration** (3 days)
  - Create seller account
  - Banking information (ACH, wire transfer)
  - Tax forms (W-9, sales tax)

- [ ] **Product Listing** (5 days)
  - Product metadata (name, description, categories)
  - Pricing model (hourly, annual, bring-your-own-license)
  - Screenshots and videos (demo, features)
  - Documentation (setup guide, API reference)
  - Support information (email, Slack, forum)

- [ ] **Submission & Review** (3 days)
  - Submit for AWS review (security, compliance)
  - Address feedback (AWS product team)
  - Final approval and go-live

#### Phase 3: Launch & Promotion (1 week)
- [ ] Press release (AWS Marketplace listing live)
- [ ] Blog post (how to deploy Zipminator on AWS)
- [ ] LinkedIn/Twitter announcement
- [ ] AWS sales team enablement (partner meeting)

**Success Criteria**:
- ✅ AWS Marketplace listing live (publicly available)
- ✅ 1-click deployment working (CloudFormation)
- ✅ Billing integration tested (test customer)
- ✅ Documentation complete (setup guide, troubleshooting)
- ✅ 10+ AWS customers in first 90 days

---

**Azure Marketplace Listing** (similar process, 3 weeks):
- [ ] Azure VM image (similar to AWS AMI)
- [ ] ARM template (similar to CloudFormation)
- [ ] Azure billing integration
- [ ] Azure Marketplace registration and listing

**Total Effort**: 6 weeks (AWS 3 weeks + Azure 3 weeks)
**Priority**: HIGH for cloud distribution

**Dependencies**:
- DevOps engineer hired (P2-1)
- Multi-cloud infrastructure (AWS + Azure accounts)
- Legal (seller agreements, billing terms)

**Risk Level**: 🟢 LOW (well-documented process, AWS/Azure support available)

---

### P2-4: Performance Optimization (Rust Kyber768 <60 µs)

**Status**: 🟡 TODO
**Priority**: P2 📋
**Effort**: 4 weeks (160 hours)
**Owner**: Cryptography Engineer (post-hire)
**Deadline**: 120 days (Q1 2026)

**Objective**: Optimize Rust Kyber768 implementation to achieve competitive performance (<60 µs total) via AVX2 SIMD and other optimizations.

**Current Performance**:
- KeyGen: 15-30 µs
- Encaps: 15-30 µs
- Decaps: 20-40 µs
- **Total**: 50-100 µs (1.5-3x C++ baseline of 34 µs)

**Target Performance**:
- KeyGen: 10-15 µs
- Encaps: 10-15 µs
- Decaps: 15-25 µs
- **Total**: 40-60 µs (1.2-1.8x C++ baseline)

**Optimization Plan**:

#### Week 1: Profiling & Baseline (40 hours)
- [ ] **Criterion Benchmarks** (8 hours)
  - Run existing benchmarks (cargo bench)
  - Identify hotspots (NTT, polynomial multiplication)
  - Baseline measurements (median, variance)

- [ ] **Flamegraph Profiling** (8 hours)
  - Generate flamegraphs (cargo flamegraph)
  - Identify CPU-intensive functions
  - Memory allocation profiling (heap usage)

- [ ] **Assembly Inspection** (8 hours)
  - Cargo ASM (inspect generated assembly)
  - Vectorization opportunities (SIMD not used)
  - Cache misses (memory access patterns)

- [ ] **Optimization Roadmap** (16 hours)
  - Prioritize optimizations (impact vs effort)
  - AVX2 SIMD (highest impact, 30-40% speedup)
  - Memory layout (reduce cache misses)
  - Algorithmic improvements (faster algorithms)

#### Week 2-3: AVX2 SIMD Implementation (80 hours)
- [ ] **NTT Vectorization** (32 hours)
  ```rust
  // Before: Scalar operations
  fn ntt_layer(coeffs: &mut [i16]) {
      for i in 0..N {
          // Scalar butterfly operations
      }
  }

  // After: AVX2 vectorized (process 16 coefficients at once)
  #[cfg(target_feature = "avx2")]
  unsafe fn ntt_layer_avx2(coeffs: &mut [i16]) {
      use std::arch::x86_64::*;
      for i in (0..N).step_by(16) {
          let a = _mm256_loadu_si256(coeffs[i..].as_ptr() as *const __m256i);
          // Vectorized butterfly operations (16x parallel)
          // ...
      }
  }
  ```

- [ ] **Polynomial Multiplication** (24 hours)
  - Vectorize coefficient-wise multiplication
  - Vectorize modular reduction (Barrett reduction)
  - Cache-friendly memory layout

- [ ] **Testing & Validation** (24 hours)
  - NIST KAT test vectors (ensure correctness)
  - Constant-time validation (dudect)
  - Cross-platform testing (AVX2, SSE, fallback)

#### Week 4: Profile-Guided Optimization & Tuning (40 hours)
- [ ] **PGO Build** (16 hours)
  - Collect runtime profiles (cargo PGO)
  - Rebuild with profile data
  - Measure speedup (10-15% expected)

- [ ] **Memory Layout** (12 hours)
  - Align data structures (cache line alignment)
  - Reduce padding (struct packing)
  - Prefetch hints (for predictable access patterns)

- [ ] **Final Benchmarks** (12 hours)
  - Re-run criterion benchmarks
  - Compare to C++ baseline (target: 40-60 µs)
  - Generate performance report

**Success Criteria**:
- ✅ Total performance <60 µs (40-60 µs target)
- ✅ AVX2 SIMD working (30-40% speedup over scalar)
- ✅ NIST test vectors passing (correctness preserved)
- ✅ Constant-time validation passing (no timing leaks)
- ✅ Cross-platform support (AVX2, SSE4.2, scalar fallback)

**Dependencies**:
- Cryptography engineer hired (P2-1)
- x86_64 CPU with AVX2 (Intel Haswell+, AMD Zen+)
- Criterion benchmarking framework
- Dudect constant-time validation

**Risk Level**: 🟡 MEDIUM (SIMD is complex, may not hit <60 µs target)

**Mitigation**:
- Incremental approach (optimize one function at a time)
- Extensive testing (correctness critical)
- Fallback to scalar (if AVX2 not available)
- Accept 60-80 µs if <60 µs not achievable (still competitive)

---

## 💡 P3: LOW PRIORITY (Next 6 Months)

### P3-1: FIPS 140-3 Certification Pathway

**Status**: 🟡 TODO
**Priority**: P3 💡
**Effort**: 18-24 months (long process)
**Owner**: Cryptography Engineer + Security Engineer + External Lab
**Deadline**: Q3 2027 (long-term goal)

**Objective**: Achieve FIPS 140-3 Level 2 or 3 certification to enable sales to US government and highly regulated industries.

**Background**: FIPS 140-3 is required for cryptographic modules used by US federal agencies. Certification is expensive ($100K-300K), time-consuming (18-24 months), but unlocks $50B+ federal market and significantly increases enterprise credibility.

**FIPS 140-3 Levels**:
- **Level 1**: Software-only, basic requirements (public algorithms, key management)
- **Level 2**: Role-based authentication, physical security (tamper-evident)
- **Level 3**: Tamper-resistant, identity-based authentication, physical penetration resistance
- **Level 4**: Tamper-active, environmental failure protection (rare, very expensive)

**Target**: Level 2 (balance of cost, time, and market requirements)

**Certification Process**:

#### Phase 1: Pre-Assessment (3 months)
- [ ] **Gap Analysis** (1 month)
  - Review FIPS 140-3 requirements (NIST documentation)
  - Identify gaps in current implementation
  - Estimate effort and cost
  - Select accredited testing lab (Acumen Security, atsec, Corsec)

- [ ] **Cryptographic Boundary Definition** (2 weeks)
  - Define what's included in the "cryptographic module"
    - Kyber768 implementation (Rust code)
    - Quantum entropy source (QRNG integration)
    - Key management (generation, storage, destruction)
    - API interfaces (input, output, control, status)
  - Document interfaces and data flows

- [ ] **Security Policy** (1.5 months)
  - Write comprehensive security policy (100+ pages)
  - Roles and services (Crypto Officer, User, Auditor)
  - Finite State Model (states, transitions)
  - Physical security (if Level 2 or higher)
  - Self-tests (power-on, conditional, periodic)
  - Mitigation of other attacks (side-channel)

#### Phase 2: Implementation & Documentation (6-9 months)
- [ ] **Self-Tests Implementation** (2 months)
  - Power-on self-tests (cryptographic algorithm tests)
  - Conditional self-tests (key generation, random number generation)
  - Known Answer Tests (KATs) for all algorithms

- [ ] **Key Management** (2 months)
  - Secure key generation (quantum entropy + deterministic DRBG)
  - Key establishment (Kyber768 encapsulation/decapsulation)
  - Key storage (encrypted, access-controlled)
  - Key zeroization (secure memory wipe)

- [ ] **Entropy Source Validation** (2 months)
  - NIST SP 800-90B compliance (already P1-4)
  - Min-entropy estimation
  - Health tests (startup, continuous)
  - Documentation for entropy source validation

- [ ] **Physical Security** (1 month, if Level 2+)
  - Tamper-evident seals (for hardware modules)
  - Physical access controls
  - Documentation of physical security

- [ ] **Documentation** (2 months)
  - Security Policy (SP)
  - Finite State Model (FSM)
  - Interface specification
  - Test documentation (self-tests, KATs)
  - Vendor evidence (source code, design docs)

#### Phase 3: Testing Lab Engagement (6-9 months)
- [ ] **Pre-submission Review** (1 month)
  - Lab reviews documentation
  - Identifies issues early
  - Provides guidance

- [ ] **Formal Submission** (1 week)
  - Submit all documentation to lab
  - Submit cryptographic module (source code, binaries)
  - Pay lab fees ($50K-150K depending on complexity)

- [ ] **Testing** (3-6 months)
  - Algorithm testing (AES, SHA-3, Kyber768)
  - Entropy source validation (SP 800-90B)
  - Physical security testing (if Level 2+)
  - Penetration testing (bypass attempts)
  - Documentation review (completeness, accuracy)

- [ ] **Findings & Re-Testing** (1-3 months)
  - Address lab findings (bugs, documentation errors)
  - Re-test (additional fees if major changes)
  - Final validation

#### Phase 4: NIST Validation (2-4 months)
- [ ] **CMVP Submission** (1 month)
  - Lab submits to NIST Cryptographic Module Validation Program (CMVP)
  - NIST reviews lab report
  - May request additional information

- [ ] **Certificate Issuance** (1-3 months)
  - NIST issues FIPS 140-3 certificate
  - Module added to NIST validated modules list
  - Press release and marketing ("FIPS 140-3 Validated")

**Total Timeline**: 18-24 months (from start to certificate)
**Total Cost**: $100K-300K (lab fees, engineering time, re-testing)

**Success Criteria**:
- ✅ FIPS 140-3 Level 2 certificate issued
- ✅ Module on NIST validated modules list
- ✅ Documentation complete and approved
- ✅ Ongoing maintenance plan (annual revalidation if needed)

**Dependencies**:
- P1-4 completed (NIST SP 800-90B entropy validation)
- P2-4 completed (Rust Kyber768 optimized and stable)
- Cryptography engineer hired (P2-1)
- Security engineer hired (P2-1)
- Budget ($150K-300K for lab fees)

**Risk Level**: 🟡 MEDIUM (complex process, many unknowns, expensive)

**Mitigation**:
- Engage testing lab early (pre-assessment)
- Budget contingency (20% buffer for re-testing)
- Timeline buffer (assume 24 months, not 18 months)
- Parallel path (sell to non-FIPS customers while certifying)

**Post-Certification**:
- Unlock federal market (DoD, IC, civilian agencies)
- Increase enterprise credibility (FIPS badge is gold standard)
- Higher pricing power (FIPS adds 20-30% premium)
- Marketing ("FIPS 140-3 Validated Quantum-Secure Encryption")

---

### P3-2: Multi-Source Entropy Fusion (Combine IBM + IonQ)

**Status**: 🟡 TODO
**Priority**: P3 💡
**Effort**: 6 weeks (240 hours)
**Owner**: Quantum Engineer (post-hire)
**Deadline**: Q2 2026 (after basic features stabilized)

**Objective**: Combine entropy from multiple quantum providers (IBM + IonQ) to increase entropy quality and resilience against provider-specific weaknesses.

**Motivation**:
- **Resilience**: If one provider has degraded hardware, other sources compensate
- **Quality**: Mixing multiple quantum sources may increase entropy quality
- **Trust**: No single point of failure (defense against compromised provider)
- **Marketing**: "Multi-source quantum entropy" sounds more robust

**Approach**: XOR multiple entropy sources (cryptographically sound if at least one source is truly random)

#### Implementation Plan:

**Week 1-2: Research & Design (80 hours)**
- [ ] **Entropy Mixing Theory** (16 hours)
  - Study cryptographic entropy mixing (XOR, hash-based extraction)
  - NIST SP 800-90B multi-source guidance
  - Academic research (entropy fusion, quantum randomness)

- [ ] **Provider Selection** (8 hours)
  - Primary: IBM Brisbane (127 qubits, high volume)
  - Secondary: IonQ Harmony (11 qubits, high quality trapped ion)
  - Tertiary: Rigetti Aspen (79 qubits, backup)

- [ ] **Architecture Design** (24 hours)
  - Parallel entropy generation (IBM + IonQ simultaneously)
  - XOR mixing (bitwise XOR of sources)
  - Hash-based extraction (SHA-3 for added mixing)
  - Quality verification (statistical tests on mixed entropy)

- [ ] **Failure Handling** (16 hours)
  - Graceful degradation (fall back to single source if one fails)
  - Source health monitoring (detect degraded quality)
  - Alert on single-source mode (operational issue)

- [ ] **Documentation** (16 hours)
  - Entropy mixing specification
  - Security analysis (why XOR is safe)
  - Performance impact (2x cost, but higher quality)

**Week 3-4: Implementation (100 hours)**
- [ ] **Multi-Source Harvester** (40 hours)
  ```python
  # src/python/multi_source_entropy_fusion.py
  class MultiSourceEntropyFusion:
      def __init__(self, providers: List[str] = ['ibm', 'ionq']):
          self.providers = providers
          self.harvesters = [
              IBMQuantumHarvester(),
              IonQHarvester(),
          ]

      async def harvest_fused_entropy(self, num_bytes: int) -> bytes:
          # Generate entropy from all providers in parallel
          entropy_sources = await asyncio.gather(
              self.harvesters[0].harvest(num_bytes),
              self.harvesters[1].harvest(num_bytes),
          )

          # XOR all sources together
          fused = bytes([a ^ b for a, b in zip(*entropy_sources)])

          # Additional mixing with SHA-3 (belt and suspenders)
          return sha3_256(fused)
  ```

- [ ] **Provider Coordination** (32 hours)
  - Parallel job submission (asyncio, concurrent)
  - Timeout handling (if one provider is slow)
  - Retry logic (if one provider fails)
  - Cost tracking (sum of all providers)

- [ ] **Quality Verification** (16 hours)
  - Run NIST health tests on fused entropy
  - Compare quality metrics (before vs after fusion)
  - Verify no degradation (should be equal or better)

- [ ] **Integration** (12 hours)
  - Add to quantum_entropy_pool.py
  - CLI option (--multi-source flag)
  - Configuration (enable/disable multi-source)

**Week 5-6: Testing & Validation (60 hours)**
- [ ] **Unit Tests** (16 hours)
  - Test XOR mixing logic
  - Test hash extraction
  - Test failure handling (one source fails)

- [ ] **Integration Tests** (24 hours)
  - Generate fused entropy (IBM + IonQ)
  - Verify quality (NIST health tests pass)
  - Performance testing (latency, cost)

- [ ] **Security Analysis** (12 hours)
  - Prove: If at least one source is random, output is random
  - Document security properties
  - Peer review (external cryptographer)

- [ ] **Documentation** (8 hours)
  - User guide (how to enable multi-source)
  - Security analysis document
  - Performance benchmarks (cost vs quality trade-off)

**Success Criteria**:
- ✅ Multi-source entropy fusion working (IBM + IonQ)
- ✅ Quality metrics equal or better (NIST health tests)
- ✅ Graceful degradation (fall back to single source)
- ✅ Documentation complete (security analysis)
- ✅ Performance acceptable (2x cost, but higher confidence)

**Dependencies**:
- P1-4 completed (NIST health tests implemented)
- Multi-provider harvester working (already exists)
- Access to IonQ hardware (via qBraid or AWS Braket)

**Risk Level**: 🟢 LOW (well-understood cryptographic technique)

**Marketing Value**:
- "Multi-source quantum entropy" (sounds more robust)
- "Defense against compromised providers" (security messaging)
- "Highest quality quantum randomness" (quality claim)

---

## 🔬 P4: RESEARCH (6-12+ Months)

### P4-1: Mojo Language Implementation (Experimental)

**Status**: 🟡 TODO
**Priority**: P4 🔬
**Effort**: 20+ weeks (800+ hours)
**Owner**: Research Engineer or Intern
**Deadline**: Q4 2026 (no urgency, exploratory)

**Objective**: Evaluate Mojo programming language for Kyber768 implementation to potentially achieve 5-10x performance improvement over Rust.

**Background**: Mojo is a new language from Modular (Chris Lattner, LLVM/Swift creator) designed for AI and high-performance computing. Claims Python-like syntax with C/C++ performance via MLIR (Multi-Level Intermediate Representation) compiler infrastructure.

**Current Status**: Exploratory research only, not production-ready

**Potential Benefits**:
- **Performance**: 5-10x faster than Rust (if benchmarks hold)
- **Python Interop**: Seamless integration with Python codebase
- **SIMD**: First-class SIMD support (easier than Rust unsafe code)
- **Hardware**: Optimizes for modern CPUs, GPUs, TPUs

**Risks**:
- **Language Immaturity**: Mojo is <2 years old, ecosystem nascent
- **No Standard Library**: Missing critical libraries (crypto, networking)
- **Limited Tooling**: No mature debuggers, profilers, IDEs
- **Uncertain Future**: Modular could pivot, abandon Mojo
- **Hiring**: Zero Mojo developers in market (team must learn)

**Recommendation**: **Monitor, Don't Implement Yet**

#### Phase 1: Monitoring & Evaluation (Ongoing, 2 hours/quarter)
- [ ] Track Mojo language releases (new features, stability)
- [ ] Monitor ecosystem growth (libraries, tools, community)
- [ ] Review performance benchmarks (vs Rust, C++)
- [ ] Assess production readiness (major companies using?)

#### Phase 2: Prototype (If Mojo Matures, Q3 2026)
- [ ] **Proof of Concept** (4 weeks, 160 hours)
  - Implement basic Kyber768 operations (NTT, polynomial arithmetic)
  - Benchmark vs Rust implementation
  - Evaluate developer experience (syntax, tooling)
  - Assess portability (cross-platform, dependencies)

- [ ] **Go/No-Go Decision** (1 week)
  - Performance: Is Mojo >2x faster than Rust? (worthwhile)
  - Maturity: Is Mojo production-ready? (stable, libraries)
  - Hiring: Can we hire/train Mojo developers? (talent availability)
  - Risk: What's the migration cost if Mojo fails? (exit strategy)

#### Phase 3: Full Implementation (If Go Decision, Q4 2026+)
- [ ] **Complete Kyber768 in Mojo** (12 weeks)
- [ ] **NIST KAT Validation** (2 weeks)
- [ ] **Constant-Time Validation** (2 weeks)
- [ ] **Performance Benchmarking** (2 weeks)
- [ ] **Production Deployment** (4 weeks)

**Success Criteria (for Go Decision)**:
- ✅ Mojo achieves >2x performance vs Rust (60 µs → <30 µs)
- ✅ Mojo ecosystem mature (crypto libraries, tooling)
- ✅ Team can hire or train Mojo developers
- ✅ Migration cost acceptable (4-6 month effort)

**Dependencies**:
- Mojo language maturity (not under our control)
- Cryptography engineer with bandwidth (P2-1 hire)
- Performance benchmarks from Rust implementation (P2-4)

**Risk Level**: 🔴 HIGH (language immaturity, uncertain future, no production users)

**Mitigation**:
- Keep Rust as primary implementation (Tier 1 production)
- Treat Mojo as research project (Tier 2, not customer-facing)
- Small prototype first (4 weeks, not 6 months)
- Easy rollback (Mojo code is isolated, no production dependencies)

**Decision Point**: Q3 2026
- If Mojo not mature by Q3 2026, **ABANDON** (don't invest further)
- If Mojo shows promise, continue prototype (4-week investment)
- If prototype successful, evaluate full implementation (12-week investment)

---

### P4-2: Blockchain-Based Entropy Verification

**Status**: 🟡 TODO
**Priority**: P4 🔬
**Effort**: 8 weeks (320 hours)
**Owner**: Research Engineer or University Collaboration
**Deadline**: Q4 2026 (research project, not urgent)

**Objective**: Research and prototype blockchain-based verification system for quantum entropy to provide public auditability and tamper-evidence.

**Motivation**:
- **Auditability**: External parties can verify entropy quality without trusting Zipminator
- **Tamper-Evidence**: Immutable record of entropy generation (timestamps, hashes, metadata)
- **Marketing**: "Blockchain-verified quantum entropy" (buzzword compliance)
- **Differentiation**: No competitor offers this (unique feature)

**Approach**: Publish entropy metadata (hashes, not raw entropy) to public blockchain

#### Research Questions:
1. **Which blockchain?** (Ethereum, Bitcoin, Arweave, custom?)
2. **What to publish?** (hash, timestamp, backend, quality metrics)
3. **How often?** (every batch, hourly, daily?)
4. **Who pays gas fees?** (Zipminator, customer, shared?)
5. **Privacy?** (don't leak customer usage patterns)

#### Phase 1: Research & Design (2 weeks, 80 hours)
- [ ] **Blockchain Selection** (16 hours)
  - Ethereum (most popular, high gas fees)
  - Bitcoin (OP_RETURN, low throughput)
  - Arweave (permanent storage, low cost)
  - IPFS + Filecoin (distributed storage)
  - Custom blockchain (overkill for research)

- [ ] **Data Structure Design** (16 hours)
  ```json
  {
    "timestamp": "2025-11-03T12:34:56Z",
    "entropy_hash": "sha256:abcd1234...",
    "backend": "ibm_brisbane",
    "num_bytes": 1024,
    "quality_score": 0.998,
    "nist_health_tests": {
      "repetition_count": "PASS",
      "adaptive_proportion": "PASS"
    },
    "zipminator_signature": "ed25519:sig..."
  }
  ```

- [ ] **Privacy Analysis** (16 hours)
  - What leaks? (batch size, frequency, customer patterns?)
  - Mitigation: Aggregate multiple customers (privacy pool)
  - Mitigation: Publish at fixed intervals (no timing correlation)

- [ ] **Cost Analysis** (16 hours)
  - Gas fees (Ethereum mainnet vs L2 vs sidechains)
  - Storage costs (IPFS, Arweave, S3)
  - Verification costs (who pays for reading data?)

- [ ] **Security Analysis** (16 hours)
  - Threat model (what attacks does blockchain prevent?)
  - Trust assumptions (still trust quantum provider, just verify Zipminator didn't tamper)
  - Limitations (blockchain can't verify randomness quality, just that data existed at time T)

#### Phase 2: Prototype (4 weeks, 160 hours)
- [ ] **Smart Contract** (if Ethereum, 60 hours)
  ```solidity
  // Ethereum smart contract
  contract QuantumEntropyRegistry {
      struct EntropyRecord {
          uint256 timestamp;
          bytes32 entropy_hash;
          string backend;
          uint256 num_bytes;
          uint16 quality_score;  // 0-1000 (3 decimals)
      }

      EntropyRecord[] public records;

      function publishEntropyRecord(
          bytes32 entropy_hash,
          string memory backend,
          uint256 num_bytes,
          uint16 quality_score
      ) public onlyOwner {
          records.push(EntropyRecord({
              timestamp: block.timestamp,
              entropy_hash: entropy_hash,
              backend: backend,
              num_bytes: num_bytes,
              quality_score: quality_score
          }));
      }

      function getRecord(uint256 index) public view returns (EntropyRecord memory) {
          return records[index];
      }
  }
  ```

- [ ] **Integration** (60 hours)
  - Integrate with quantum_entropy_pool.py
  - Publish entropy metadata after generation
  - Retry logic (if blockchain transaction fails)
  - Cost optimization (batch multiple records)

- [ ] **Verification Client** (40 hours)
  - CLI tool to verify entropy records
  - Download from blockchain (Web3.py)
  - Verify signatures (Ed25519)
  - Display audit trail (human-readable)

#### Phase 3: Evaluation (2 weeks, 80 hours)
- [ ] **Performance Testing** (24 hours)
  - Measure latency (how long to publish?)
  - Measure cost (gas fees per record)
  - Stress testing (1000 records, batch size optimization)

- [ ] **Security Audit** (24 hours)
  - Smart contract audit (external auditor)
  - Privacy analysis (no customer data leaked?)
  - Threat modeling (what attacks still possible?)

- [ ] **User Testing** (16 hours)
  - Can customers verify entropy? (UX test)
  - Is verification value clear? (marketing message)
  - Would customers pay for this? (pricing question)

- [ ] **Go/No-Go Decision** (16 hours)
  - Value vs Cost: Is blockchain worth the complexity?
  - Customer demand: Do customers care about this feature?
  - Competitive advantage: Does this differentiate us?
  - Recommendation: Launch, abandon, or defer

**Success Criteria (for Go Decision)**:
- ✅ Blockchain verification working (testnet)
- ✅ Cost acceptable (<$0.01 per record on mainnet)
- ✅ Performance acceptable (<5 second latency)
- ✅ Customer value validated (surveys, interviews)
- ✅ Marketing message clear ("publicly auditable quantum entropy")

**Dependencies**:
- P1-4 completed (NIST health tests generate quality metrics)
- Blockchain infrastructure (Ethereum node or Infura API key)
- Smart contract expertise (Solidity developer or consultant)

**Risk Level**: 🟡 MEDIUM (complexity, cost, uncertain customer value)

**Mitigation**:
- Start with testnet (Sepolia, Goerli, no real cost)
- Prototype before committing (4 weeks, not 6 months)
- Customer validation (surveys, pilot customers)
- Easy to disable (optional feature, not core product)

**Decision Point**: Q4 2026
- If customer value unclear, **ABANDON** (research project failed)
- If customer value validated, launch (mainnet deployment)
- If high cost, explore alternatives (IPFS, centralized audit log)

---

## 📊 Backlog Summary

### Total Backlog Items: 16

**By Priority**:
- P0 (Critical): 1 item
- P1 (High): 4 items
- P2 (Medium): 4 items
- P3 (Low): 2 items
- P4 (Research): 2 items

**By Timeline**:
- Immediate (0-7 days): 1 item (P0-1)
- Short-term (8-30 days): 2 items (P1-1, P1-2)
- Medium-term (31-90 days): 4 items (P1-3, P1-4, P2-1, P2-2)
- Long-term (90+ days): 7 items (P2-3, P2-4, P3-1, P3-2, P4-1, P4-2)

**By Effort**:
- Small (<2 weeks): 2 items
- Medium (2-8 weeks): 8 items
- Large (>8 weeks): 4 items

**By Risk**:
- High Risk: 3 items (P0-1, P4-1, P4-2)
- Medium Risk: 7 items
- Low Risk: 4 items

---

## 🎯 Recommended Execution Order

### Week 1 (Nov 4-10, 2025)
1. **P0-1: Fix IBM Token** (5 min) - BLOCKING, DO FIRST
2. **P1-2: Beta Customer Outreach** (starts, ongoing)
3. **P1-3: Seed Fundraising** (continues, ongoing)

### Week 2-4 (Nov 11 - Dec 1, 2025)
4. **P1-1: Token Rotation Automation** (parallel with fundraising)
5. **P1-2: Beta Customer Pilots** (continue, aim for 3-5 signed)
6. **P1-3: Close Seed Round** (target: by end of month)

### Month 2 (Dec 2025)
7. **P1-4: NIST Randomness Validation** (after token stable)
8. **P2-1: Engineering Hiring** (starts after funding)
9. **P1-3: Seed Round Close** (if not already closed)

### Month 3-4 (Jan-Feb 2026)
10. **P2-1: Engineering Hiring** (continues, target 6 hires)
11. **P2-2: Enterprise Features** (starts after backend engineer hired)
12. **P2-3: AWS/Azure Marketplace** (starts after DevOps hired)

### Month 5-6 (Mar-Apr 2026)
13. **P2-4: Rust Performance Optimization** (after crypto engineer hired)
14. **P3-2: Multi-Source Entropy Fusion** (after quantum engineer hired)

### Month 7-12 (May-Oct 2026)
15. **P3-1: FIPS 140-3 Certification** (long-term, 18-24 months)
16. **P4-1: Mojo Research** (if language matures)
17. **P4-2: Blockchain Verification** (research project)

---

## 🚦 Status Dashboard

| Item | Priority | Status | Timeline | Risk |
|------|----------|--------|----------|------|
| P0-1: IBM Token Fix | 🔥 P0 | 🔴 BLOCKING | 5 min | 🔴 HIGH |
| P1-1: Token Automation | ⚡ P1 | 🟡 TODO | 2 weeks | 🟡 MED |
| P1-2: Beta Customers | ⚡ P1 | 🟡 TODO | 4 weeks | 🟡 MED |
| P1-3: Seed Round | ⚡ P1 | 🟡 IN PROGRESS | 6-8 weeks | 🟡 MED |
| P1-4: NIST Validation | ⚡ P1 | 🟡 TODO | 3 weeks | 🟢 LOW |
| P2-1: Engineering Hiring | 📋 P2 | 🟡 TODO | 12 weeks | 🟡 MED |
| P2-2: Enterprise Features | 📋 P2 | 🟡 TODO | 8 weeks | 🟢 LOW |
| P2-3: Cloud Marketplaces | 📋 P2 | 🟡 TODO | 6 weeks | 🟢 LOW |
| P2-4: Performance Optimization | 📋 P2 | 🟡 TODO | 4 weeks | 🟡 MED |
| P3-1: FIPS Certification | 💡 P3 | 🟡 TODO | 18-24 mo | 🟡 MED |
| P3-2: Multi-Source Entropy | 💡 P3 | 🟡 TODO | 6 weeks | 🟢 LOW |
| P4-1: Mojo Research | 🔬 P4 | 🟡 TODO | 20+ weeks | 🔴 HIGH |
| P4-2: Blockchain Verification | 🔬 P4 | 🟡 TODO | 8 weeks | 🟡 MED |

---

## 📞 Questions & Escalation

**For P0/P1 items**: Founder / CEO
**For P2/P3 items**: Engineering Manager (post-hire)
**For P4 items**: Research Lead (post-hire or advisor)

**Weekly Review**: Monday 9:00 AM
**Sprint Planning**: Every 2 weeks
**Quarterly Planning**: Last week of each quarter

---

**Document End** | **Version 1.0** | **November 3, 2025**
