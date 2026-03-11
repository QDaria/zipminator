# Zipminator Landing Page - Component Hierarchy

## Visual Component Tree

```
app/page.tsx (Main Landing Page)
│
├── <Navigation /> (Fixed Header)
│   ├── QDaria Logo (parent company)
│   ├── Zipminator Logo (product)
│   ├── Nav Links (Features, Providers, How It Works, Docs, Pricing)
│   └── CTA Buttons (Try Demo, Get Started)
│
├── <Hero /> (Viewport Height)
│   ├── <QuantumBackground /> (Three.js particle system)
│   ├── Headline + Subheadline
│   ├── Primary CTA (Start Free Trial)
│   ├── Secondary CTA (See Demo)
│   ├── Trust Badge (NIST FIPS 203)
│   └── Animated Metrics (156 Qubits, 99.99% Uptime, Enterprise-Ready)
│
├── <StatsBar />
│   ├── Stat: 156 IBM Qubits
│   ├── Stat: NIST FIPS 203
│   ├── Stat: 99.99% Uptime
│   └── Stat: Enterprise Grade
│
├── <ProviderShowcase />
│   ├── Headline: "Built on Quantum-Grade Infrastructure"
│   └── Logo Grid
│       ├── IBM Quantum (with "156-qubit" badge)
│       ├── NIST (with "FIPS 203" badge)
│       └── Optional Partners (Amazon Braket, Rigetti, IonQ)
│
├── <TrustSignals /> (3-Column Grid)
│   ├── Card: NIST FIPS 203
│   ├── Card: Quantum-Secure
│   └── Card: Zero-Knowledge
│
├── <HowItWorks /> (Timeline/Step Flow)
│   ├── Step 1: Quantum Entropy Harvesting
│   ├── Step 2: Kyber768 Key Generation
│   ├── Step 3: Secure Encryption
│   └── Step 4: Distribution & Storage
│
├── <KeyFeatures /> (2x3 or 3x2 Grid)
│   ├── Feature: NIST FIPS 203
│   ├── Feature: Quantum Entropy
│   ├── Feature: Zero Trust Architecture
│   ├── Feature: High Performance
│   ├── Feature: Cross-Platform
│   └── Feature: Enterprise Ready
│
├── <InteractiveDemo /> (Tabbed Interface)
│   ├── Tab: Entropy Quality Visualization
│   ├── Tab: Performance Benchmarks
│   └── Tab: Security Analysis
│
├── <UseCases /> (Carousel/Grid)
│   ├── Card: Financial Services
│   ├── Card: Healthcare
│   ├── Card: Government
│   └── Card: Enterprise SaaS
│
├── <PricingTiers /> (Optional - 3 Columns)
│   ├── Free Tier
│   ├── Pro Tier
│   └── Enterprise Tier
│
├── <CTA /> (Full-Width Section)
│   ├── Headline: "Ready for Quantum-Secure Encryption?"
│   ├── Primary CTA: "Start Free Trial"
│   └── Secondary CTA: "Schedule Demo"
│
└── <Footer /> (Multi-Column Grid)
    ├── Column: Product Links
    ├── Column: Company Links
    ├── Column: Resources
    ├── Column: Legal
    └── Bottom Bar (QDaria branding, social links, copyright)
```

---

## Component Dependencies

### Core UI Components (Reusable)
```
components/ui/
├── Button.tsx           → Used in Hero, CTA, Navigation
├── Card.tsx             → Used in TrustSignals, KeyFeatures, UseCases
├── Badge.tsx            → Used in ProviderShowcase, Stats
├── Tabs.tsx             → Used in InteractiveDemo
└── Container.tsx        → Wraps all sections
```

### Three.js Components
```
components/three/
├── QuantumBackground.tsx    → Hero background
├── QubitVisualization.tsx   → Hero accent (optional)
└── shaders/
    ├── particleShader.ts    → Particle rendering
    └── glowShader.ts        → Glow effects
```

### Animation Hooks
```
lib/hooks/
├── useScrollReveal.ts       → Scroll-triggered animations
├── useParallax.ts           → Mouse/scroll parallax
└── useCountUp.ts            → Number counter animations
```

---

## Data Flow Architecture

```
lib/constants.ts (Static Data)
    ↓
Component Props
    ↓
Rendered UI
    ↓
User Interactions
    ↓
lib/analytics.ts (Event Tracking)
```

### Example: Feature Card Data Flow
```typescript
// 1. Data Definition (constants.ts)
export const FEATURES = [
  { id: 'nist', icon: ShieldCheck, title: 'NIST FIPS 203', ... }
]

// 2. Component Consumption (KeyFeatures.tsx)
import { FEATURES } from '@/lib/constants'

export const KeyFeatures = () => (
  <div className="grid ...">
    {FEATURES.map(feature => (
      <FeatureCard key={feature.id} {...feature} />
    ))}
  </div>
)

// 3. Render (FeatureCard.tsx)
export const FeatureCard = ({ icon: Icon, title, description, link }) => (
  <Card onClick={() => trackEvent('feature_click', title)}>
    <Icon />
    <h3>{title}</h3>
    <p>{description}</p>
  </Card>
)
```

---

## Animation Orchestration

### Page Load Sequence
```
1. Navigation      → Fade in (0s delay)
2. Hero Headline   → Slide up (0.2s delay)
3. Hero CTA        → Fade + scale (0.4s delay)
4. Quantum BG      → Particle spawn (0s, continuous)
5. Stats Bar       → Count up (on scroll into view)
6. Sections        → Bottom-up reveal (on scroll, 100ms stagger)
```

### Scroll-Triggered Events
```
Viewport Position → Component State → Animation Trigger

Example:
User scrolls → StatsBar enters viewport → useInView triggers → CountUp animation starts
```

---

## Responsive Layout Matrix

| Component           | Mobile (<640px)    | Tablet (640-1024px) | Desktop (>1024px)      |
|---------------------|--------------------|---------------------|------------------------|
| Navigation          | Hamburger menu     | Horizontal nav      | Full nav + CTAs        |
| Hero                | Single column      | Single column       | Content + visual       |
| StatsBar            | 2x2 grid           | 4 columns           | 4 columns              |
| ProviderShowcase    | 2x2 grid           | 3x2 grid            | 6 columns              |
| TrustSignals        | 1 column           | 3 columns           | 3 columns              |
| HowItWorks          | Vertical timeline  | 2x2 grid            | Horizontal flow        |
| KeyFeatures         | 1 column           | 2 columns           | 3 columns              |
| InteractiveDemo     | Stacked tabs       | Side tabs           | Side tabs + large view |
| UseCases            | Carousel (swipe)   | 2 columns           | 4 columns              |
| PricingTiers        | Vertical stack     | 3 columns           | 3 columns              |
| Footer              | 1 column           | 2x2 grid            | 4 columns              |

---

## Performance Budget

| Asset Type       | Budget      | Notes                                    |
|------------------|-------------|------------------------------------------|
| Total JS         | < 200 KB    | Code splitting, dynamic imports          |
| Total CSS        | < 50 KB     | Tailwind purge, critical CSS inline      |
| Images           | < 500 KB    | WebP/AVIF, lazy loading                  |
| Fonts            | < 100 KB    | Subset Inter, preload critical           |
| **Total Page**   | **< 1 MB**  | **First load**                           |
| Three.js Bundle  | < 150 KB    | Tree-shake unused modules                |
| Framer Motion    | < 80 KB     | Import only used components              |

### Lighthouse Score Targets
- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 100

---

## State Management

### Global State (Minimal)
- Theme preference (dark mode - default, light mode - optional)
- Navigation menu open/closed (mobile)
- Demo tab active index

### Local Component State
- Scroll position (for animations)
- Particle system state (Three.js)
- Form inputs (if contact/demo forms added)

**No Global State Library Required** (React Context or props sufficient)

---

## Critical User Journeys

### Journey 1: Awareness → Trial Signup
```
1. Land on Hero
2. Read headline ("Post-Quantum Encryption Platform")
3. Scroll through trust signals (NIST, IBM logos)
4. View "How It Works" section
5. Click "Start Free Trial" CTA
```

### Journey 2: Technical Evaluation
```
1. Land on Hero
2. Click "See Demo" in Hero
3. Explore InteractiveDemo section (entropy visualization)
4. Read KeyFeatures (performance, cross-platform)
5. Click "View Documentation" link
```

### Journey 3: Enterprise Decision-Maker
```
1. Land on Hero
2. Scan StatsBar (99.99% uptime, enterprise-grade)
3. Review TrustSignals (NIST FIPS 203, zero-knowledge)
4. Check UseCases (financial services, healthcare)
5. Click "Schedule Demo" for sales call
```

---

## Conversion Optimization Strategy

### Primary CTAs (Purple Gradient Buttons)
- Hero: "Start Free Trial"
- CTA Section: "Start Free Trial"
- Navigation: "Get Started"

### Secondary CTAs (Ghost Buttons)
- Hero: "See Demo"
- Features: "Learn More" links
- CTA Section: "Schedule Demo"

### Micro-Conversions
- Documentation link clicks
- Feature card interactions
- Provider logo hovers (track interest in IBM/NIST)
- Scroll depth (engagement metric)

---

## Accessibility Checklist

- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators visible (purple outline)
- [ ] ARIA labels on icon-only buttons
- [ ] Skip-to-content link for screen readers
- [ ] Semantic HTML (h1, nav, main, section, footer)
- [ ] Reduced motion support (prefers-reduced-motion)
- [ ] Form labels (if forms added)
- [ ] Video captions (if videos added)

---

## Browser Support Matrix

| Browser          | Version   | Support Level    |
|------------------|-----------|------------------|
| Chrome           | 100+      | Full             |
| Firefox          | 100+      | Full             |
| Safari           | 15+       | Full             |
| Edge             | 100+      | Full             |
| Chrome Mobile    | 100+      | Full             |
| Safari Mobile    | 15+       | Full             |
| Samsung Internet | 15+       | Partial (no 3D)  |
| Opera            | 85+       | Full             |

**Graceful Degradation**:
- Browsers without WebGL: Static gradient background instead of particles
- Browsers with reduced motion: Disable scroll animations
- Older browsers: Fallback to standard CSS gradients

---

## Content Strategy

### Tone of Voice
- **Professional**: Enterprise-grade, secure, compliant
- **Confident**: Cutting-edge quantum technology
- **Clear**: Demystify complex cryptography
- **Action-Oriented**: Strong CTAs, benefit-focused

### Key Messaging
1. **Hero**: "Post-quantum security is here. NIST FIPS 203. Quantum-powered."
2. **Trust**: "Built on IBM's 156-qubit quantum hardware, implementing NIST FIPS 203."
3. **Performance**: "10,000+ operations/second. Zero compromise on speed."
4. **Simplicity**: "One API. Every platform. Quantum-secure by default."

---

## Next Steps for Implementation

1. **Set up design tokens** (CSS variables in globals.css)
2. **Build UI component library** (Button, Card, Badge, Tabs)
3. **Implement Navigation + Footer** (static sections first)
4. **Create Hero section** (with placeholder for 3D background)
5. **Add sections incrementally** (StatsBar → ProviderShowcase → TrustSignals → etc.)
6. **Integrate Three.js** (QuantumBackground particle system)
7. **Add scroll animations** (Framer Motion, useScrollReveal hook)
8. **Responsive testing** (mobile, tablet, desktop)
9. **Performance optimization** (Lighthouse, bundle analysis)
10. **Launch prep** (analytics, SEO, deployment)

---

**Document Version**: 1.0
**Companion to**: LANDING_PAGE_ARCHITECTURE.md
**Last Updated**: 2025-11-05
