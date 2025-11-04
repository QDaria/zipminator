# FIPS 140-3 Validation Timeline for Zipminator

## Executive Summary

**Total Duration**: 9-12 months (optimistic: 9 months, realistic: 12 months, pessimistic: 15 months)
**Critical Path**: CAVP algorithm validation → CMVP lab testing → NIST review
**Estimated Certificate Date**: Q4 2026 (assuming start January 2026)
**Risk Buffer**: 3 months recommended for unexpected delays

---

## Timeline Overview

```
Month 1-2:  ████████░░░░░░░░░░░░░░░░ Pre-Validation Preparation (Internal)
Month 3:    ░░░░░░░░████░░░░░░░░░░░░ CAVP Algorithm Submission (NIST ACVTS)
Month 4:    ░░░░░░░░░░░░████░░░░░░░░ CAVP Certificate Receipt
Month 5-8:  ░░░░░░░░░░░░░░░░████████ CMVP Lab Testing (Accredited Lab)
Month 9-12: ░░░░░░░░░░░░░░░░░░░░████ NIST CMVP Review & Certification
            ├────────────────────────┤
            START                    CERTIFICATE ISSUED
```

**Key Milestones**:
1. ✅ **Month 2**: Pre-validation complete, ready for CAVP submission
2. ✅ **Month 4**: CAVP certificates received (blockers cleared)
3. ✅ **Month 8**: Lab testing complete, test report submitted to NIST
4. ✅ **Month 12**: FIPS 140-3 certificate issued, module listed on CMVP website

---

## Detailed Timeline

### Phase 1: Pre-Validation Preparation (Month 1-2)

**Duration**: 8 weeks
**Responsibility**: Zipminator internal team (2-3 FTEs)
**Cost**: Internal engineering time (~$50K labor)

#### Month 1 (Weeks 1-4)

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 1** | - Define module boundary<br>- Select security level (Level 2)<br>- Draft high-level Security Policy outline | - Module specification doc<br>- Security Policy template | Tech Lead |
| **Week 2** | - Algorithm implementation review<br>- ML-KEM-768/1024 correctness testing<br>- ML-DSA-65/87 correctness testing | - Algorithm test report<br>- NIST test vector validation | Crypto Engineer |
| **Week 3** | - Implement power-up self-tests (KATs)<br>- Implement health tests (RCT, APT)<br>- Test failure scenarios | - Self-test code<br>- Test results log | Software Engineer |
| **Week 4** | - Entropy source characterization<br>- Collect 1M samples from QRNG<br>- Run SP 800-90B entropy estimation suite | - Entropy data set<br>- Min-entropy calculation | Quantum Engineer |

**Checkpoint**: End of Month 1
- [ ] Module boundary defined and documented
- [ ] All algorithms passing NIST test vectors
- [ ] Self-tests implemented and passing
- [ ] Entropy min-entropy ≥ 0.5 bits/sample confirmed

#### Month 2 (Weeks 5-8)

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 5** | - Complete Entropy Assessment Report<br>- Health test design documentation<br>- Noise source description | - Entropy Assessment Report v1.0 | Quantum Engineer |
| **Week 6** | - Complete Security Policy (Sections 1-6)<br>- Document interfaces, roles, services<br>- Physical security procedures (Level 2) | - Security Policy v1.0 (draft) | Security Officer |
| **Week 7** | - Complete Security Policy (Sections 7-11)<br>- SSP management, self-tests, mitigation<br>- User guidance documents | - Security Policy v1.0 (final)<br>- Admin/User Guides | Tech Writer |
| **Week 8** | - Source code freeze and tag (`v1.0.0-fips`)<br>- Design docs (HLD, LLD, FSM)<br>- CMVP lab selection and contracting | - Source code archive<br>- Design doc package<br>- Lab contract signed | Tech Lead |

**Checkpoint**: End of Month 2
- [ ] ✅ Security Policy complete (all 11 sections)
- [ ] ✅ Entropy Assessment Report complete
- [ ] ✅ Source code frozen and documented
- [ ] ✅ CMVP lab selected (e.g., Acumen Security)
- [ ] ✅ Ready for CAVP submission

**Deliverables**:
- Security Policy Document (50-100 pages)
- Entropy Assessment Report (30-50 pages)
- Design Documentation (HLD, LLD, FSM) (100-150 pages)
- User Guidance (Admin/User Guides) (30-50 pages)
- Source code archive (tagged release)

---

### Phase 2: CAVP Algorithm Validation (Month 3-4)

**Duration**: 4-8 weeks (NIST processing time)
**Responsibility**: NIST ACVTS (automated testing system)
**Cost**: Included in CMVP lab fees (~$5K-$10K)

#### Month 3 (Weeks 9-12): CAVP Submission

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 9** | - Register vendor account on NIST ACVTS<br>- Submit ML-KEM-768 implementation<br>- Submit ML-KEM-1024 implementation | - ACVTS account<br>- Submission confirmation | Crypto Engineer |
| **Week 10** | - Submit ML-DSA-65 implementation<br>- Submit ML-DSA-87 implementation<br>- Submit SHA-256/384/512 (if needed) | - Submission confirmation | Crypto Engineer |
| **Week 11** | - Submit SHAKE-128/256 (if needed)<br>- Monitor ACVTS status<br>- Respond to any validation errors | - Corrected submissions (if needed) | Crypto Engineer |
| **Week 12** | - Continue monitoring ACVTS<br>- Begin CMVP lab pre-engagement | - Status updates | Crypto Engineer |

#### Month 4 (Weeks 13-16): CAVP Certificate Receipt

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 13-15** | - Wait for NIST ACVTS processing<br>- Address any validation issues<br>- Re-run test vectors if corrections needed | - Algorithm corrections (if needed) | Crypto Engineer |
| **Week 16** | - **RECEIVE CAVP CERTIFICATES** ✅<br>- Record certificate numbers<br>- Update Security Policy with cert numbers | - CAVP Certificate #A1234 (ML-KEM-768)<br>- CAVP Certificate #A1235 (ML-KEM-1024)<br>- CAVP Certificate #A1236 (ML-DSA-65)<br>- CAVP Certificate #A1237 (ML-DSA-87) | Crypto Engineer |

**Checkpoint**: End of Month 4
- [ ] ✅ CAVP certificates received for all algorithms
- [ ] ✅ Certificate numbers recorded in Security Policy
- [ ] ✅ Ready for CMVP lab submission

**Critical**: CAVP certificates are **blockers** for CMVP submission. If not received by end of Month 4, entire timeline shifts.

**Risk Mitigation**:
- Submit early (Week 9 vs. Week 12)
- Run ACVTS validation tests locally before submission
- Have contingency: Use pre-validated library (e.g., OpenSSL FIPS module) for supporting algorithms

---

### Phase 3: CMVP Laboratory Testing (Month 5-8)

**Duration**: 12-16 weeks (realistic: 16 weeks)
**Responsibility**: Accredited CMVP lab (e.g., Acumen Security)
**Cost**: $50,000 - $150,000 (Level 2 module)

#### Month 5 (Weeks 17-20): Lab Engagement Kickoff

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 17** | - Deliver pre-submission package to lab:<br>  • CAVP certificates<br>  • Security Policy<br>  • Entropy Assessment Report<br>  • Source code<br>  • Design docs | - Complete submission package | Project Manager |
| **Week 18** | - Lab intake and kickoff meeting<br>- Review scope, timeline, milestones<br>- Establish communication protocol | - Lab project plan<br>- Weekly status meeting schedule | CMVP Lab |
| **Week 19** | - Lab begins Section 1-2 review:<br>  • Cryptographic Module Specification<br>  • Cryptographic Module Interfaces | - Initial questions from lab | CMVP Lab |
| **Week 20** | - Respond to lab questions (expected: 5-10)<br>- Clarify module boundary, interfaces | - Question responses | Tech Lead |

#### Month 6 (Weeks 21-24): Core Algorithm Testing

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 21** | - Lab tests Section 3-4:<br>  • Roles, Services, Authentication<br>  • Software/Firmware Security | - Test results (Section 3-4) | CMVP Lab |
| **Week 22** | - Lab tests Section 5-6:<br>  • Operational Environment<br>  • Physical Security (Level 2) | - Tamper-evident seal inspection<br>- OS validation | CMVP Lab |
| **Week 23** | - Lab tests Section 7-8:<br>  • Non-Invasive Security (side-channel)<br>  • SSP Management | - Side-channel analysis report<br>- Key zeroization verification | CMVP Lab |
| **Week 24** | - Address any issues from Weeks 21-23<br>- Provide additional documentation if needed | - Issue resolution report | Tech Lead |

**Checkpoint**: End of Month 6
- [ ] Physical security testing complete (seals intact)
- [ ] Side-channel testing complete (no critical vulnerabilities)
- [ ] 50% of CMVP test report drafted

#### Month 7 (Weeks 25-28): Self-Test and Entropy Testing

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 25** | - Lab tests Section 9 (Self-Tests):<br>  • Power-up KATs (all algorithms)<br>  • Continuous health tests (RCT, APT)<br>  • Critical functions test | - Self-test validation report | CMVP Lab |
| **Week 26** | - Lab reviews Entropy Assessment Report<br>- Validate SP 800-90B compliance<br>- Verify health test cutoff values | - Entropy assessment validation | CMVP Lab |
| **Week 27** | - Lab tests Section 10-11:<br>  • Life-Cycle Assurance<br>  • Mitigation of Other Attacks | - Configuration management review<br>- Secure distribution validation | CMVP Lab |
| **Week 28** | - Address any self-test or entropy issues<br>- Re-test if needed | - Issue resolution | Tech Lead |

#### Month 8 (Weeks 29-32): Test Report Finalization

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 29** | - Lab compiles CMVP Test Report<br>- Internal lab review (QA) | - Draft Test Report (200-300 pages) | CMVP Lab |
| **Week 30** | - Zipminator reviews draft Test Report<br>- Verify accuracy of all technical details | - Review comments | Tech Lead |
| **Week 31** | - Lab incorporates Zipminator feedback<br>- Final Test Report version 1.0 | - CMVP Test Report v1.0 | CMVP Lab |
| **Week 32** | - **SUBMIT TEST REPORT TO NIST CMVP** ✅<br>- Update CMVP module entry<br>- Begin NIST review queue | - Submission confirmation<br>- NIST case number | CMVP Lab |

**Checkpoint**: End of Month 8
- [ ] ✅ CMVP Test Report submitted to NIST
- [ ] ✅ Module entered in NIST review queue
- [ ] ✅ Lab testing phase complete

**Deliverables**:
- CMVP Test Report (200-300 pages, confidential)
- Security Policy (updated with test results)
- Entropy Assessment Report (validated)

**Risk Mitigation**:
- Weekly status calls with lab (identify issues early)
- Budget for re-testing: Add $10K-$20K contingency
- Fast-track option: Some labs offer expedited testing (+$20K)

---

### Phase 4: NIST CMVP Review and Certification (Month 9-12)

**Duration**: 12-20 weeks (realistic: 16 weeks)
**Responsibility**: NIST CMVP validators
**Cost**: Included in lab fees (no additional charge)

#### Month 9 (Weeks 33-36): Initial NIST Review

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 33** | - Module in NIST review queue<br>- Wait for assignment to validator | - Queue status updates | CMVP Lab |
| **Week 34** | - NIST validator assigned<br>- Begin initial document review | - Validator assignment notice | NIST |
| **Week 35** | - NIST reviews Security Policy<br>- NIST reviews Test Report | - (Internal NIST review) | NIST |
| **Week 36** | - NIST reviews Entropy Assessment<br>- NIST checks CAVP certificate numbers | - (Internal NIST review) | NIST |

#### Month 10 (Weeks 37-40): First Round of Comments

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 37** | - **NIST ISSUES FIRST ROUND OF COMMENTS**<br>- Typical: 10-20 questions/clarifications | - NIST Comment Letter #1 | NIST |
| **Week 38** | - Lab and Zipminator review comments<br>- Draft responses and documentation updates | - Response strategy | CMVP Lab + Tech Lead |
| **Week 39** | - Update Security Policy per NIST comments<br>- Update Test Report (if needed) | - Security Policy v1.1<br>- Test Report v1.1 | CMVP Lab |
| **Week 40** | - **SUBMIT RESPONSES TO NIST** | - Response letter<br>- Updated documents | CMVP Lab |

**Typical NIST Comments**:
- "Clarify how the module ensures key zeroization on power loss."
- "Provide additional detail on side-channel countermeasures for ML-KEM."
- "Update Figure 3 to show correct data flow for Crypto Officer role."
- "Entropy Assessment: Justify cutoff value for APT (Section 4.4.2)."

#### Month 11 (Weeks 41-44): Second Round of Comments

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 41-42** | - NIST reviews responses<br>- Wait for second round of comments | - (Internal NIST review) | NIST |
| **Week 43** | - **NIST ISSUES SECOND ROUND OF COMMENTS** (if needed)<br>- Typical: 3-5 minor clarifications | - NIST Comment Letter #2 | NIST |
| **Week 44** | - Address minor comments<br>- Submit final updates | - Final response letter | CMVP Lab |

#### Month 12 (Weeks 45-48): Final Approval and Certificate Issuance

| Week | Tasks | Deliverables | Owner |
|------|-------|--------------|-------|
| **Week 45-46** | - NIST final review<br>- Certificate preparation | - (Internal NIST processing) | NIST |
| **Week 47** | - **FIPS 140-3 CERTIFICATE ISSUED** ✅<br>- Certificate number assigned (e.g., #4567)<br>- Module listed on CMVP website | - FIPS 140-3 Certificate (PDF)<br>- CMVP website listing | NIST |
| **Week 48** | - Publish Security Policy (public version)<br>- Update Zipminator marketing materials<br>- Press release: "FIPS 140-3 Certified" | - Public Security Policy<br>- Marketing collateral | Marketing + Tech Lead |

**Checkpoint**: End of Month 12
- [ ] ✅ FIPS 140-3 certificate received
- [ ] ✅ Certificate number: #_____ (assigned by NIST)
- [ ] ✅ Module listed on https://csrc.nist.gov/projects/cmvp
- [ ] ✅ Security Policy published on NIST website
- [ ] ✅ **VALIDATION COMPLETE**

**Deliverables**:
- FIPS 140-3 Certificate (official PDF from NIST)
- Certificate number (e.g., #4567)
- Security Policy (public version, 50-100 pages)
- CMVP website listing

**Risk Mitigation**:
- Budget 3 months buffer for multiple NIST comment rounds
- Use experienced CMVP lab (they know NIST's expectations)
- Over-communicate: Detailed responses to every NIST question

---

## Alternative Timelines

### Optimistic Timeline (9 months)

**Assumptions**:
- CAVP certificates received in 6 weeks (vs. 8 weeks)
- CMVP lab testing completes in 12 weeks (vs. 16 weeks)
- NIST review completes in 8 weeks (vs. 16 weeks, only 1 comment round)

**Total**: 9 months (36 weeks)

**Risks**: Low probability (~20% chance). Requires perfect execution and no delays.

### Realistic Timeline (12 months)

**Assumptions**:
- CAVP certificates received in 8 weeks
- CMVP lab testing completes in 16 weeks
- NIST review completes in 16 weeks (2 comment rounds)

**Total**: 12 months (48 weeks) ← **RECOMMENDED PLANNING BASELINE**

**Risks**: Medium probability (~60% chance).

### Pessimistic Timeline (15 months)

**Assumptions**:
- CAVP certificate delays (3 months instead of 2)
- CMVP lab testing delays (5 months instead of 4)
- NIST review delays (5 months instead of 4, 3 comment rounds)

**Total**: 15 months (60 weeks)

**Risks**: High probability if issues arise (~20% chance). Add 3-month buffer.

---

## Milestone-Based Payments (CMVP Lab Contract)

**Recommended Payment Structure**:

| Milestone | Payment | Timeline | Deliverable |
|-----------|---------|----------|-------------|
| **Contract Signing** | 25% ($37.5K of $150K) | Month 5, Week 17 | Lab engagement kickoff |
| **Mid-Testing** | 25% ($37.5K) | Month 6, Week 24 | 50% of test report complete |
| **Test Report Submission** | 25% ($37.5K) | Month 8, Week 32 | Test report submitted to NIST |
| **Certificate Issuance** | 25% ($37.5K) | Month 12, Week 47 | FIPS 140-3 certificate received |

**Rationale**: Aligns lab incentives with Zipminator success, spreads cash flow.

---

## Resource Allocation

### Internal Team Requirements

| Role | Effort (FTE) | Duration | Cost Estimate |
|------|--------------|----------|---------------|
| **Tech Lead** | 0.5 FTE | 12 months | $90K |
| **Crypto Engineer** | 1.0 FTE | 4 months (CAVP + support) | $60K |
| **Software Engineer** | 1.0 FTE | 2 months (self-tests + fixes) | $30K |
| **Quantum Engineer** | 0.5 FTE | 1 month (entropy assessment) | $15K |
| **Security Officer** | 0.5 FTE | 2 months (Security Policy) | $30K |
| **Tech Writer** | 0.5 FTE | 1 month (user guides) | $15K |
| **Project Manager** | 0.25 FTE | 12 months | $30K |
| **TOTAL INTERNAL** | ~2.5-3 FTE | 12 months | **$270K** |

### External Costs

| Item | Cost | Timeline |
|------|------|----------|
| **CMVP Lab Fees** | $150K | Month 5-12 |
| **CAVP Testing** | Included | Month 3-4 |
| **Physical Seals** (tamper-evident) | $2K | Month 2 |
| **Pre-Assessment** (optional) | $20K | Month 4 |
| **TOTAL EXTERNAL** | **$172K** | |

**GRAND TOTAL**: $442K (internal + external)

**Note**: Internal costs are opportunity cost (engineers' time). External costs are out-of-pocket.

---

## Risk Management

### High-Risk Delays (Add Buffer)

| Risk | Probability | Impact (Delay) | Mitigation |
|------|-------------|----------------|------------|
| **CAVP certificate delays** | 30% | +1-2 months | Submit early (Month 3 Week 1), follow up weekly |
| **Entropy source fails SP 800-90B** | 20% | +1 month | Pre-validate with SP 800-90B tools, collect 10M samples |
| **Side-channel vulnerability found** | 25% | +2-3 months | Pre-assessment in Month 4, hire specialized firm |
| **NIST comment rounds > 2** | 40% | +1-2 months | Use experienced lab, over-document Security Policy |
| **Lab resource contention** | 15% | +1 month | Sign contract early (Month 2), reserve lab capacity |

### Mitigation Strategies

1. **Fast-Track CAVP**: Pay expedite fee (+$5K) to reduce CAVP time by 2-4 weeks
2. **Parallel Workstreams**: Begin Security Policy drafting during CAVP phase
3. **Lab Pre-Engagement**: Start informal discussions with lab in Month 2
4. **Buffer Budget**: Add 20% contingency ($50K) for re-testing and delays
5. **Executive Sponsorship**: Weekly executive review to unblock issues quickly

---

## Post-Certification Maintenance

### Certificate Lifecycle (Years 1-5)

| Year | Activity | Effort | Cost |
|------|----------|--------|------|
| **Year 1** | - Monitor for algorithm updates<br>- Respond to customer validation questions | 0.1 FTE | $15K |
| **Year 2** | - Software updates (bug fixes, patches)<br>- Submit change letters to CMVP (if needed) | 0.2 FTE | $30K |
| **Year 3** | - Add new algorithms (e.g., ML-KEM-512)<br>- Partial re-validation ($30K lab fees) | 0.5 FTE | $50K + $30K |
| **Year 4** | - Maintain certificate status<br>- Prepare for re-validation (if major changes) | 0.1 FTE | $15K |
| **Year 5** | - **Certificate expires**<br>- Begin full re-validation for v2.0 | 2.0 FTE | $200K (new cycle) |

**Total 5-Year Cost**: $340K (maintenance) + $200K (re-validation) = **$540K**

### Algorithm Transitions (CNSA 2.0)

**2025-2030 Timeline**:
- **2025**: ML-KEM/ML-DSA preferred, classical algorithms still allowed
- **2027**: Begin deprecating RSA, ECDH for NSS systems
- **2030**: Quantum-resistant only for new NSS deployments
- **2035**: Classical algorithms prohibited for NSS

**Zipminator Strategy**:
- Maintain FIPS 140-3 with both classical and PQC (2025-2030)
- Transition to PQC-only module by 2030
- Re-validate every 2-3 years to stay current

---

## Success Metrics

### Timeline Success Criteria

- ✅ **On-Time Milestones**: 90% of milestones hit within +/- 2 weeks
- ✅ **Budget Adherence**: Total cost within 10% of estimate ($150K lab + $270K internal)
- ✅ **Quality**: Certificate issued with zero critical findings
- ✅ **First-Time Pass**: No major re-testing required (only minor NIST comments)

### Business Success Criteria

- ✅ **Market Access**: Zipminator qualified for federal procurement within 30 days of certification
- ✅ **Revenue Impact**: $5M in government contracts within 12 months post-certification
- ✅ **Competitive Advantage**: First QRNG-based PQC platform with FIPS 140-3 (Q4 2026)

---

## Appendix: Gantt Chart

```
                   Q1 2026        Q2 2026        Q3 2026        Q4 2026
Task               J  F  M  A  M  J  J  A  S  O  N  D
────────────────────────────────────────────────────────────────
Pre-Validation     ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
CAVP Submission    ░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░
CAVP Certificates  ░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░
CMVP Lab Testing   ░░░░░░░░░░░░████████████░░░░░░░░░░░░
NIST Review        ░░░░░░░░░░░░░░░░░░░░░░░░████████████
Certificate        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░★
                   └─────────────────────────────────────┘
                   Start: Jan 2026        End: Dec 2026
```

**Legend**:
- `█` Work in progress
- `░` Waiting/idle time
- `★` Certificate issued

---

**Document Control**
Version: 1.0
Date: 2025-10-30
Author: FIPS Validation Specialist
Status: Final
Next Review: Monthly during validation process
