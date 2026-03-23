# USPTO Provisional Patent Application — Filing Guide

## Filing URL

**https://www.uspto.gov/patents/apply/patent-center**

Or use EFS-Web: https://patentcenter.uspto.gov/

## Filing Checklist

- [ ] Create USPTO account at Patent Center (if you don't have one)
- [ ] Select "Provisional Application" under "New Submission"
- [ ] Upload the specification document (see below)
- [ ] Pay the filing fee ($320 for micro-entity, $640 for small entity)
- [ ] Receive confirmation with Application Number and Filing Date

## Micro-Entity Qualification

You likely qualify as a **micro-entity** ($320 fee instead of $1,600) if:

- [ ] QDaria AS has fewer than 500 employees
- [ ] You have not been named as inventor on more than 4 previously filed patent applications
- [ ] Your gross income in the previous year did not exceed 3x the US median household income (~$225,000)
- [ ] You have not assigned or licensed (and are not obligated to) the application to an entity that would not qualify as micro-entity

If all four are true, file the Micro-Entity Certification (form PTO/SB/15A) with the application.

## Documents to Upload

### 1. Specification (REQUIRED)

Upload the file `provisional-patent-quantum-anonymization.md` converted to PDF.

To convert:
```bash
# Option A: Use pandoc
pandoc docs/ip/provisional-patent-quantum-anonymization.md -o docs/ip/provisional-patent-quantum-anonymization.pdf

# Option B: Print from browser
# Open the .md file in a browser/viewer and print to PDF
```

### 2. Cover Sheet (form PTO/SB/16)

Fill in:
- **Title**: Method and System for Irreversible Data Anonymization Using Quantum Random Number Generation with Physics-Guaranteed Non-Reversibility
- **Inventor(s)**: Daniel Mo Houshmand, Oslo, Norway
- **Correspondence address**: QDaria AS, Oslo, Norway, mo@qdaria.com
- **Entity status**: Micro-entity (if qualified) or Small entity

### 3. Micro-Entity Certification (form PTO/SB/15A)

Required if claiming micro-entity status ($320 fee).

### 4. Application Data Sheet (form PTO/AIA/14)

Fill in:
- Inventor: Daniel Mo Houshmand
- Applicant: QDaria AS (if assigning to company)
- Domestic Priority: None (this is the first filing)
- Foreign Priority: None

## What Happens After Filing

1. **Immediately**: You receive a filing receipt with an Application Number and Filing Date. This date is your **priority date**.

2. **Within 12 months**: You must file either:
   - A non-provisional US patent application (claiming priority from this provisional), OR
   - A PCT international application (claiming priority from this provisional)

   If you do neither within 12 months, the provisional expires and you lose the priority date.

3. **The provisional is never examined**. It just establishes a priority date and a disclosure.

## Recommended Timeline After Filing

| When | Action |
|------|--------|
| Day 1 | File provisional at USPTO ($320) |
| Day 2-7 | Publish arXiv preprint (establishes academic priority) |
| Day 2-7 | Post blog + LinkedIn + Twitter (public launch) |
| Month 3 | Submit to PoPETs (peer-reviewed academic publication) |
| Month 6 | Engage patent attorney for non-provisional drafting |
| Month 9 | Professional CNIPA (China) prior art search |
| Month 11 | File PCT international application (~$4,000) |
| Month 12 | Provisional expires; PCT takes over |
| Month 30 | Enter national phase: US, EP, NO, UK, JP, KR |

## Cost Summary

| Item | Cost | When |
|------|------|------|
| Provisional filing (micro-entity) | $320 | Now |
| PCT filing | ~$4,000 | Month 11-12 |
| Patent attorney (non-provisional drafting) | $8,000-15,000 | Month 6-11 |
| National phase entries (5-6 countries) | $15,000-40,000 | Month 30 |
| **Total Year 1** | **~$4,500** | |
| **Total through grant** | **~$30,000-60,000** | |

## CRITICAL: Timing Relative to DMCA

The CYBERELLUM/zipminator-pqc public repo currently exposes your source code including anonymization logic. While this does NOT destroy your patentability (you are the author and have a 1-year US grace period for your own disclosures), it does create complications:

1. **File the provisional BEFORE the DMCA is processed**, so your priority date is established regardless of what happens with the DMCA.

2. **At the EPO (European Patent Office), there is NO grace period.** Any public disclosure before the filing date can be used against you. HOWEVER: the disclosure on CYBERELLUM's repo is an unauthorized disclosure, not your own. Under EPO rules, unauthorized disclosures within 6 months before filing do not destroy novelty if they resulted from an "evident abuse" (Article 55 EPC). CYBERELLUM's license stripping and republication qualifies as evident abuse. Document this with the DMCA filing.

3. **File the DMCA on the same day as the provisional** for clean documentation.

## The Specification Document

The full provisional specification is at:

```
docs/ip/provisional-patent-quantum-anonymization.md
```

It contains:
- Title
- Field of the invention
- Background (PRNG vulnerability, Born rule, QRNG)
- Summary of the invention
- Detailed description with algorithm pseudocode
- 6 embodiments (pure OTP, OTP+k-anonymity, OTP+DP, column-selective, multi-provider, hardware enclave)
- 15 claims (3 independent + 12 dependent)
- Abstract
- 3 figures (system architecture, irreversibility comparison, multi-provider architecture)

This is intentionally more detailed than a typical provisional. The extra detail strengthens the eventual non-provisional claims and makes it harder for competitors to design around the patent.
