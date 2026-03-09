# 08 -- Terminal Prompt Recipes J-L + UI/UX Polish Toolkit

> Extracted from Section 7 (Recipes J-L) and Section 18 (UI/UX Polish Toolkit) of the orchestration guide.
> See also: [06-recipes-core.md](06-recipes-core.md) for Recipes A-F,
> [07-recipes-browser-email.md](07-recipes-browser-email.md) for Recipes G-I.

---

## Recipe J: Iterative UI/UX Polish (RALPH + Screenshot Verification)

The visual RALPH loop: design -> implement -> screenshot -> score -> fix -> repeat. Uses Playwright for screenshot-driven feedback instead of unit tests.

```
Polish the Zipminator web landing page (web/app/page.tsx) and demo UI
(demo/src/app.js) using an iterative visual refinement loop.

TOOLS TO USE:
- frontend-enhancer skill from .claude/skills/frontend-enhancer/
  (read SKILL.md, references/design_principles.md, references/color_palettes.md)
- Playwright MCP for screenshot verification after each change
- RALPH loop with visual quality gates

STEP 1 - ASSESS (Research):
  Take a screenshot of the current page via Playwright.
  Read .claude/skills/frontend-enhancer/references/design_principles.md
  Identify issues: spacing, color consistency, typography, responsive gaps,
  accessibility (contrast ratio, focus indicators, touch targets).
  Score the current state on a 0-1 scale across 5 axes:
    - Visual hierarchy (layout, spacing, typography)
    - Color consistency (palette adherence, contrast ratios)
    - Responsiveness (breakpoint behavior)
    - Animations (smoothness, purpose, reduced-motion support)
    - Accessibility (WCAG AA compliance)

STEP 2 - DESIGN (Architecture):
  Choose color palette from .claude/skills/frontend-enhancer/references/color_palettes.md
  (use "Vibrant Purple" for Zipminator's quantum brand, or "Dark Mode" for dashboard).
  Plan the changes needed to reach score >= 0.95 on all axes.
  Get my approval before implementing.

STEP 3 - IMPLEMENT (Logic):
  Apply changes one axis at a time (most impactful first).
  After each change:
    - Take a fresh Playwright screenshot
    - Score the axis you changed
    - If improved, move to next axis
    - If regressed, revert and try different approach

STEP 4 - POLISH:
  Add animations from .claude/skills/frontend-enhancer/assets/animations.css
  (fadeInUp for hero, stagger for feature grid, hover-lift for cards).
  Test with prefers-reduced-motion: reduce.

STEP 5 - HARDEN:
  Run accessibility check (contrast, keyboard nav, screen reader labels).
  Test at breakpoints: 320px, 640px, 768px, 1024px, 1280px.
  Take final comparison screenshots (before vs after).

RALPH ITERATION: Repeat steps 3-5 up to 12 times until all axes >= 0.95.
Save checkpoint every 3 iterations.

CONSTRAINT: Never break existing functionality. Keep quantum-* Tailwind tokens.
```

---

## Recipe K: Design System Sprint (Agent Team + BMAD UX Designer)

For establishing or refactoring a consistent design system across all Zipminator UI surfaces (web landing, demo, dashboard, mobile).

```
Create an agent team to build a unified Zipminator design system.

CONTEXT FILES:
- .claude/skills/frontend-enhancer/SKILL.md (component library reference)
- .claude/skills/frontend-enhancer/references/color_palettes.md
- .claude/skills/frontend-enhancer/references/design_principles.md
- .claude/skills/frontend-enhancer/assets/animations.css
- .claude/commands/bmad/bmm/agents/ux-designer.md (UX persona)
- web/tailwind.config.js (existing quantum-* tokens)
- web/app/globals.css (existing utility classes)

Spawn 3 teammates:

1. "ux-lead" (Opus): UX Designer persona from BMAD.
   Owns: Design tokens, component API contracts, spacing scale, color system.
   First task: audit all UI surfaces and produce a design token spec.
   Deliverable: web/lib/design-tokens.ts + updated tailwind.config.js

2. "component-builder" (Sonnet): Frontend Enhancer specialist.
   Owns: Shared component library using frontend-enhancer assets as base.
   First task: copy + adapt button, card, input variants to Zipminator brand.
   Deliverable: web/components/ui/ (Button, Card, Input, Layout components)

3. "polish-verifier" (Sonnet): Visual QA with Playwright screenshots.
   Owns: Screenshot regression testing, accessibility audits, responsive checks.
   First task: capture baseline screenshots of all pages at 5 breakpoints.
   Continuous: re-screenshot after every component-builder change, flag regressions.

RALPH LOOP per component:
  R: Review existing usage across web/, demo/, mobile/
  A: Design the component API (props, variants, states)
  L: Implement with TypeScript + Tailwind, write Storybook story
  P: Apply animations, hover/focus states, responsive behavior
  H: Playwright screenshot at 5 breakpoints, accessibility check

QUALITY GATES:
  - All components render without errors
  - WCAG AA contrast ratio on all text
  - Keyboard navigation works for all interactive elements
  - Screenshots match across breakpoints
  - No regressions in existing pages

CHECKPOINT: Save .checkpoint.json every 3 components completed.
```

---

## Recipe L: Quick Visual Fix (Single Session + Playwright)

For targeted fixes: "make this button look better", "fix the spacing on mobile", etc.

```
Fix [specific UI issue] in [file path].

Use this approach:
1. Screenshot the current state via Playwright
2. Read .claude/skills/frontend-enhancer/references/design_principles.md
   for the relevant principle (spacing, hierarchy, color, etc.)
3. Implement the fix
4. Screenshot again and compare
5. If not satisfied, iterate (max 5 cycles for a single fix)

Constraint: minimal change, don't refactor surrounding code.
```

---

## UI/UX Polish Toolkit (Section 18)

Complete reference for the `.claude/` resources available for iterative visual refinement. Use with Recipes J, K, L above.

### 18.1 Frontend Enhancer Skill

**Location:** `.claude/skills/frontend-enhancer/`

The primary skill for visual polish. Contains production-ready assets and design references.

| Resource | Path | Contents |
|----------|------|----------|
| **SKILL.md** | `SKILL.md` | Master workflow: Assess -> Design -> Implement -> Refine -> Review |
| **Design Principles** | `references/design_principles.md` | Visual hierarchy, spacing rhythm, typography, accessibility (WCAG AA/AAA) |
| **Color Palettes** | `references/color_palettes.md` | 6 palettes: Corporate Blue, Vibrant Purple, Minimalist Gray, Warm Sunset, Ocean Fresh, Dark Mode |
| **Button Variants** | `assets/button-variants.tsx` | primary, secondary, outline, ghost, danger x sm/md/lg + loading state |
| **Card Variants** | `assets/card-variants.tsx` | default, bordered, elevated, interactive + Header/Title/Description/Content/Footer |
| **Input Variants** | `assets/input-variants.tsx` | Text + textarea with validation states, icons, error/helper text |
| **Hero Section** | `assets/layout-hero-section.tsx` | centered, split, minimal variants with CTA support |
| **Feature Grid** | `assets/layout-feature-grid.tsx` | 2/3/4 column responsive grid with icon slots |
| **Animations** | `assets/animations.css` | fadeIn/Out/Up/Down, slideIn, scaleIn, bounce, pulse, shimmer, hover-lift/glow/scale + stagger delays |
| **cn() Utility** | `assets/utils-cn.ts` | `clsx` + `tailwind-merge` class name helper |

**Zipminator palette recommendation:** "Vibrant Purple" for landing pages (maps to existing `quantum-*` tokens), "Dark Mode" for dashboard and developer-facing UIs.

### 18.2 RALPH-Wiggum Checkpoint System

**Location:** `.claude/skills/skill-artisan/references/ralph-wiggum.md`

The autonomous iteration engine. Wraps any RALPH loop with state persistence and convergence detection.

```yaml
ralph_wiggum:
  max_iterations: 12          # hard stop
  checkpoint_interval: 3      # save state every 3 cycles
  auto_resume: true           # pick up where you left off
  stop_conditions:
    - score >= 0.995          # target quality reached
    - convergence_delta < 0.001  # no more improvement possible
    - structural_limitation_detected  # blocked by external constraint
```

**Checkpoint file** (`.checkpoint.json`):
```json
{
  "status": "iterating",
  "iteration": 5,
  "current_score": 0.978,
  "target_score": 0.995,
  "fixes_applied": 8,
  "remaining_issues": ["contrast on hero subtitle", "mobile nav overflow"],
  "convergence_history": [0.812, 0.890, 0.934, 0.967, 0.978]
}
```

**For UI/UX, adapt the scoring axes:**

| Axis | Weight | Measurement |
|------|--------|-------------|
| Visual hierarchy | 25% | Layout structure, spacing rhythm, typography scale |
| Color consistency | 20% | Palette adherence, contrast ratios (WCAG AA = 4.5:1) |
| Responsiveness | 20% | Correct rendering at 320/640/768/1024/1280px breakpoints |
| Animations | 15% | Smoothness (60fps), purpose, `prefers-reduced-motion` support |
| Accessibility | 20% | Keyboard nav, focus indicators, semantic HTML, touch targets (44x44px) |

### 18.3 BMAD UX Design Workflow

**Location:** `.claude/commands/bmad/bmm/`

| Resource | Path | Use |
|----------|------|-----|
| UX Design Workflow | `workflows/create-ux-design.md` | Collaborative design sessions with UX expert persona |
| UX Designer Agent | `agents/ux-designer.md` | Full UX designer persona with menu-driven interaction |
| Wireframe Creator | `workflows/create-excalidraw-wireframe.md` | ASCII/Excalidraw wireframe notation |
| PRD Workflow | `workflows/create-prd.md` | Product requirements for UI features |
| Story Creator | `workflows/create-story.md` | User stories with acceptance criteria |

**Activation:** Reference the agent file in your prompt to make Claude adopt the UX designer persona:
```
Load the UX Designer persona from .claude/commands/bmad/bmm/agents/ux-designer.md.
Conduct a design review of web/app/page.tsx.
Focus on the hero section layout and CTA placement.
```

### 18.4 SPARC Refinement Agent

**Location:** `.claude/agents/sparc/refinement.md`

The TDD Red/Green/Refactor cycle adapted for UI work:

| Phase | Traditional (Code) | Adapted (UI/UX) |
|-------|-------------------|------------------|
| **Red** | Write failing test | Take screenshot, identify visual defects |
| **Green** | Implement to pass | Apply minimal CSS/component fix |
| **Refactor** | Improve structure | Consolidate tokens, extract components, clean up |

### 18.5 Verification Quality Scoring

**Location:** `.claude/skills/skill-artisan/references/verification.md`

Default scoring weights (adapt for UI work):

```
Structure:    20%  ->  Layout structure, component hierarchy
Content:      25%  ->  Visual completeness, feature coverage
Compliance:   20%  ->  Accessibility, responsive breakpoints
Ecosystem:    15%  ->  Design token usage, animation consistency
Documentation: 20% ->  Component API docs, storybook coverage
```

Threshold: 0.995 (99.5%) before marking a component as "done".

### 18.6 Playwright Screenshot Verification Loop

The visual feedback loop that replaces unit tests for UI work:

```
+---------------------------------------------------+
|  SCREENSHOT-DRIVEN RALPH LOOP                      |
+---------------------------------------------------+
|                                                    |
|  1. Start dev server (npm run dev / flask)         |
|  2. Navigate to target page via Playwright         |
|  3. Take baseline screenshot                       |
|  4. Score current state (5 axes, 0-1 each)         |
|                                                    |
|  LOOP (max 12 iterations):                         |
|    5. Identify lowest-scoring axis                 |
|    6. Apply targeted fix                           |
|    7. Take new screenshot                          |
|    8. Re-score all axes                            |
|    9. If any axis regressed -> revert fix          |
|   10. If all axes >= 0.95 -> DONE                  |
|   11. If convergence_delta < 0.01 -> DONE          |
|   12. Checkpoint every 3 iterations                |
|                                                    |
|  Compare: side-by-side before/after screenshots    |
+---------------------------------------------------+
```

**Playwright commands used:**
```
browser_navigate    -> load the page
browser_snapshot    -> accessibility tree (for semantic checks)
browser_take_screenshot -> visual capture
browser_resize      -> test breakpoints (320, 640, 768, 1024, 1280)
browser_evaluate    -> check computed styles, contrast ratios
```

### 18.7 Quick Reference: Which Tool for Which Task

| Task | Tool/Skill | Recipe |
|------|-----------|--------|
| "Make this page look better" | frontend-enhancer + Playwright | Recipe L |
| "Fix spacing on mobile" | Playwright resize + screenshot loop | Recipe L |
| "Build a design system" | Agent team + BMAD UX + frontend-enhancer | Recipe K |
| "Polish all UI surfaces" | RALPH loop + Playwright + checkpoints | Recipe J |
| "Choose a color palette" | frontend-enhancer `color_palettes.md` | Recipe J step 2 |
| "Add animations" | frontend-enhancer `animations.css` | Recipe J step 4 |
| "Accessibility audit" | Playwright snapshot + WCAG checks | Recipe J step 5 |
| "Design a new component" | BMAD UX Designer persona + TDD | Recipe K |
| "Review UX patterns" | BMAD `create-ux-design` workflow | Standalone |
| "Wireframe a layout" | BMAD `create-excalidraw-wireframe` | Standalone |

### 18.8 Personalities (Optional Flavor)

**Location:** `.claude/personalities/`

20 personality modes available. Useful for design review sessions where different perspectives help:

| Personality | Best For |
|-------------|----------|
| `professional.md` | Formal design reviews, stakeholder demos |
| `zen.md` | Minimalist design sessions ("less is more") |
| `sarcastic.md` | Brutally honest UI critique |
| `dramatic.md` | Emphatic feedback on visual impact |

Activate by reading the personality file into context before the design session.
