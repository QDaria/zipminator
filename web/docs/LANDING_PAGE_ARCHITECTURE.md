# Zipminator Landing Page Architecture

## Executive Summary

This document defines the complete architecture for the Zipminator landing page, inspired by qBraid's design language but tailored for quantum-secure encryption. The design emphasizes dark aesthetics, purple/violet quantum-themed gradients, and enterprise credibility.

---

## 1. Section Breakdown & Component Hierarchy

### 1.1 Navigation Bar (Fixed)
**Component**: `<Navigation />`
- **Position**: Fixed top, glass-morphic dark background
- **Elements**:
  - QDaria parent company logo (left)
  - Zipminator product logo (left-center)
  - Nav links: Features, Providers, How It Works, Docs, Pricing
  - CTA buttons: "Try Demo" (secondary), "Get Started" (primary gradient)
- **Behavior**: Blur-on-scroll, hide-on-scroll-down pattern

### 1.2 Hero Section
**Component**: `<Hero />`
- **Layout**: Full viewport height, centered content
- **Elements**:
  - Animated quantum particle background (Three.js)
  - Headline: "Post-Quantum Encryption Platform"
  - Subheadline: "NIST-approved Kyber768 powered by real 156-qubit IBM quantum hardware"
  - Primary CTA: "Start Free Trial" (gradient button)
  - Secondary CTA: "See Demo" (ghost button)
  - Trust badge: "Implements NIST FIPS 203"
  - Animated metrics: "127 Qubits • 99.99% Uptime • Enterprise-Ready"
- **Animations**:
  - Fade-in headline with stagger
  - Particle system (purple/violet)
  - Rotating quantum bit visualization

### 1.3 Stats Bar
**Component**: `<StatsBar />`
- **Layout**: Full-width, dark gradient background
- **Metrics**:
  - "127 IBM Qubits" (with quantum icon)
  - "NIST FIPS 203" (with certification badge)
  - "99.99% Uptime" (with checkmark)
  - "Enterprise Grade" (with shield icon)
- **Animation**: CountUp on scroll into view

### 1.4 Provider Showcase
**Component**: `<ProviderShowcase />`
- **Headline**: "Built on Quantum-Grade Infrastructure"
- **Layout**: Grid of provider logos (IBM, NIST, quantum hardware providers)
- **Elements**:
  - IBM Quantum logo (prominent, with "156-qubit" badge)
  - NIST logo (with "FIPS 203" badge)
  - Optional: Amazon Braket, Rigetti, IonQ
  - "Hardware-backed entropy" callout
- **Animation**: Logo fade-in on scroll, hover glow effects

### 1.5 Trust Signals Section
**Component**: `<TrustSignals />`
- **Headline**: "Enterprise Trust & Compliance"
- **Layout**: 3-column grid
- **Cards**:
  1. **NIST FIPS 203**: "Implements Kyber768 post-quantum cryptography"
  2. **Quantum-Secure**: "True quantum entropy from 156-qubit IBM hardware"
  3. **Zero-Knowledge**: "Military-grade encryption with quantum randomness"
- **Design**: Dark cards with purple accent borders, icons, hover lift effect

### 1.6 How It Works Section
**Component**: `<HowItWorks />`
- **Layout**: Vertical timeline or horizontal step flow (qBraid style)
- **Steps**:
  1. **Quantum Entropy Harvesting**: Visual of IBM quantum computer → entropy pool
  2. **Kyber768 Key Generation**: NIST FIPS 203 algorithm visualization
  3. **Secure Encryption**: Lock icon with quantum particles
  4. **Distribution & Storage**: Encrypted data flow diagram
- **Visuals**:
  - Purple gradient arrows between steps
  - Animated quantum circuit diagrams (simplified)
  - Code snippets in each step (optional)
- **Animation**: Scroll-triggered step reveals, particle flows

### 1.7 Key Features Grid
**Component**: `<KeyFeatures />`
- **Headline**: "Quantum-Secure by Design"
- **Layout**: 2x3 or 3x2 grid (responsive)
- **Features**:
  1. **NIST FIPS 203**: "Implements Kyber768 post-quantum cryptography"
  2. **Quantum Entropy**: "Real 156-qubit IBM hardware randomness"
  3. **Zero Trust Architecture**: "End-to-end quantum-secure encryption"
  4. **High Performance**: "Optimized Rust core, 10,000+ ops/sec"
  5. **Cross-Platform**: "Rust, Python, Node.js, WebAssembly"
  6. **Enterprise Ready**: "SLA-backed uptime, audit logs, compliance"
- **Card Design**:
  - Dark background with subtle gradient border
  - Icon (Lucide React)
  - Title + description
  - "Learn more →" link
- **Animation**: Staggered fade-in, hover scale + glow

### 1.8 Interactive Demo Section (qBraid-style)
**Component**: `<InteractiveDemoComparison />`
- **Headline**: "See Quantum Security in Action"
- **Layout**: Side-by-side comparison or tabbed interface
- **Tabs**:
  1. **Entropy Quality**: Visualize quantum vs pseudo-random
  2. **Performance**: Benchmark charts (Rust vs OpenSSL)
  3. **Security Analysis**: NIST compliance checklist
- **Visuals**:
  - Live code playground (optional)
  - Animated visualizations (Three.js entropy patterns)
  - Performance graphs (Chart.js or D3)
- **CTA**: "Try Full Demo" button

### 1.9 Use Cases Section
**Component**: `<UseCases />`
- **Headline**: "Trusted by Security-First Teams"
- **Layout**: Carousel or grid with hover cards
- **Categories**:
  1. **Financial Services**: "Quantum-secure transactions"
  2. **Healthcare**: "HIPAA-compliant patient data encryption"
  3. **Government**: "Classified communications security"
  4. **Enterprise SaaS**: "Customer data protection"
- **Card Elements**:
  - Icon or illustration
  - Industry name
  - 2-3 sentence use case
  - "Read case study →" (optional)
- **Animation**: Horizontal scroll carousel on mobile, hover reveal on desktop

### 1.10 Pricing Tiers (if applicable)
**Component**: `<PricingTiers />`
- **Layout**: 3-column grid (Free, Pro, Enterprise)
- **Tiers**:
  - **Free Tier**: "10K requests/month, quantum entropy pool access"
  - **Pro Tier**: "$99/mo, 1M requests, priority support"
  - **Enterprise**: "Custom, dedicated quantum hardware, SLA"
- **Design**: qBraid-style pricing cards with gradient highlights on "Pro" tier

### 1.11 Call-to-Action Section
**Component**: `<CTA />`
- **Headline**: "Ready for Quantum-Secure Encryption?"
- **Subheadline**: "Join enterprises protecting data with NIST FIPS 203 quantum security"
- **CTA Buttons**:
  - "Start Free Trial" (large gradient button)
  - "Schedule Demo" (secondary)
- **Background**: Full-width dark gradient with subtle particle animation

### 1.12 Footer
**Component**: `<Footer />`
- **Layout**: Multi-column grid
- **Columns**:
  1. **Product**: Features, Pricing, Docs, API Reference
  2. **Company**: About QDaria, Careers, Blog, Contact
  3. **Resources**: Case Studies, Security, Compliance, Support
  4. **Legal**: Privacy, Terms, Licenses
- **Bottom Bar**:
  - QDaria parent company branding
  - Social links (GitHub, Twitter, LinkedIn)
  - Copyright notice
- **Design**: Dark background, subtle dividers, purple accent links

---

## 2. Design System

### 2.1 Color Palette

#### Primary Colors (Quantum Theme)
```css
--quantum-purple: #8B5CF6    /* Primary brand color */
--quantum-violet: #A855F7    /* Accent gradients */
--quantum-indigo: #6366F1    /* Secondary accents */
--quantum-fuchsia: #D946EF   /* Highlight accents */
```

#### Background Colors (Dark Mode)
```css
--bg-primary: #0A0A0F        /* Main background (near-black) */
--bg-secondary: #13131A      /* Card backgrounds */
--bg-tertiary: #1C1C26       /* Elevated surfaces */
--bg-gradient-start: #0A0A0F
--bg-gradient-end: #1A0B2E   /* Purple-tinted dark */
```

#### Text Colors
```css
--text-primary: #FFFFFF      /* Headlines */
--text-secondary: #A1A1AA    /* Body text (zinc-400) */
--text-muted: #71717A        /* Captions (zinc-500) */
--text-accent: #A855F7       /* Links, CTAs */
```

#### Accent & Borders
```css
--border-primary: #27272A    /* Default borders (zinc-800) */
--border-accent: #8B5CF6     /* Active/hover borders */
--glow-purple: rgba(139, 92, 246, 0.4)  /* Box shadows, glows */
--glow-violet: rgba(168, 85, 247, 0.3)
```

#### Gradient Definitions
```css
--gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)
--gradient-secondary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
--gradient-background: linear-gradient(180deg, #0A0A0F 0%, #1A0B2E 100%)
--gradient-card: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)
```

### 2.2 Typography

#### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace
--font-display: 'Inter', sans-serif  /* Headings */
```

#### Font Sizes (Tailwind-inspired scale)
```css
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
--text-4xl: 2.25rem     /* 36px */
--text-5xl: 3rem        /* 48px */
--text-6xl: 3.75rem     /* 60px */
--text-7xl: 4.5rem      /* 72px */
```

#### Font Weights
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
```

#### Line Heights
```css
--leading-tight: 1.25
--leading-snug: 1.375
--leading-normal: 1.5
--leading-relaxed: 1.625
```

### 2.3 Spacing System

**Base Unit**: 4px (following Tailwind convention)

```css
--spacing-1: 0.25rem   /* 4px */
--spacing-2: 0.5rem    /* 8px */
--spacing-3: 0.75rem   /* 12px */
--spacing-4: 1rem      /* 16px */
--spacing-6: 1.5rem    /* 24px */
--spacing-8: 2rem      /* 32px */
--spacing-12: 3rem     /* 48px */
--spacing-16: 4rem     /* 64px */
--spacing-24: 6rem     /* 96px */
--spacing-32: 8rem     /* 128px */
```

**Component Spacing**:
- Section padding (vertical): `--spacing-24` (96px desktop), `--spacing-16` (64px mobile)
- Section padding (horizontal): `--spacing-8` (32px desktop), `--spacing-4` (16px mobile)
- Card padding: `--spacing-6` (24px)
- Grid gaps: `--spacing-6` to `--spacing-8`

### 2.4 Layout System

#### Container Widths
```css
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1536px
--container-max: 1600px  /* Maximum content width */
```

#### Breakpoints (Mobile-First)
```css
sm: 640px   /* Tablets */
md: 768px   /* Small laptops */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Extra large screens */
```

#### Grid Systems
**Feature Grid**: 12-column CSS Grid
```css
.feature-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  grid-template-columns: repeat(4, 1fr);
}
```

**Card Grid**: Auto-fit with minmax
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}
```

### 2.5 Border Radius
```css
--radius-sm: 0.375rem   /* 6px - small buttons, badges */
--radius-md: 0.5rem     /* 8px - cards, inputs */
--radius-lg: 0.75rem    /* 12px - large cards */
--radius-xl: 1rem       /* 16px - modals, hero sections */
--radius-full: 9999px   /* Fully rounded (pills) */
```

### 2.6 Shadows & Glows

#### Box Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5)
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6)
```

#### Quantum Glows (for interactive elements)
```css
--glow-purple-sm: 0 0 10px rgba(139, 92, 246, 0.4)
--glow-purple-md: 0 0 20px rgba(139, 92, 246, 0.5)
--glow-purple-lg: 0 0 30px rgba(139, 92, 246, 0.6)
--glow-violet: 0 0 25px rgba(168, 85, 247, 0.5)
```

### 2.7 Animation Tokens

#### Timing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

#### Duration
```css
--duration-fast: 150ms
--duration-normal: 300ms
--duration-slow: 500ms
--duration-slower: 1000ms
```

---

## 3. Animation Strategy

### 3.1 Hero Animations

**Quantum Particle Background** (Three.js + React Three Fiber)
- Particle count: 5000-10000 points
- Colors: Purple/violet gradient (#8B5CF6 → #D946EF)
- Behavior: Slow drift with mouse parallax, pulse on hover
- Performance: GPU-accelerated, 60fps target

**Headline Animations** (Framer Motion)
```typescript
const headlineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}
```

**Quantum Bit Visualization**
- 3D rotating qubit sphere (Three.js)
- Purple wireframe with pulsing core
- Rotation: 2 RPM constant
- Glow effect on approach

### 3.2 Scroll-Triggered Animations

**Intersection Observer Pattern**
- Trigger: 20% of element in viewport
- Direction: Bottom-up fade + slide
- Stagger: 100ms delay between children

**Section Fade-In**
```typescript
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      staggerChildren: 0.1
    }
  }
}
```

### 3.3 Interactive Hover Effects

**Card Hover States**
```css
.feature-card {
  transition: transform 300ms ease, box-shadow 300ms ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 20px 25px rgba(0, 0, 0, 0.6),
    0 0 30px rgba(139, 92, 246, 0.4); /* Purple glow */
}
```

**Button Hover**
```css
.cta-button {
  background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%);
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.cta-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
}
```

**Link Hover (Underline Animation)**
```css
.nav-link {
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #8B5CF6, #D946EF);
  transition: width 300ms ease;
}

.nav-link:hover::after {
  width: 100%;
}
```

### 3.4 Quantum-Themed Particle Effects

**Background Particles** (React Three Fiber)
```typescript
// Shader material for particles
const particleShader = {
  vertexShader: `
    varying vec3 vColor;
    attribute float size;
    attribute vec3 color;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;

      float alpha = 1.0 - (dist * 2.0);
      gl_FragColor = vec4(vColor, alpha * 0.6);
    }
  `
}
```

**Entanglement Lines** (SVG/Canvas)
- Connect random particles with gradient lines
- Opacity based on distance (max 300px)
- Purple (#8B5CF6) to violet (#A855F7) gradient
- Animate on scroll or mouse movement

### 3.5 Loading States & Transitions

**Page Load Animation**
```typescript
const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 }
}
```

**Skeleton Loaders**
- Use for async content (demo results, stats)
- Gradient shimmer effect (purple-tinted)
- Match component dimensions

---

## 4. Interactive Elements

### 4.1 Navigation

**Desktop Navigation**
- Hover: Underline animation (purple gradient)
- Active: Full underline + text color change to `--quantum-purple`
- Scroll behavior: Hide on scroll down, show on scroll up

**Mobile Navigation**
- Hamburger menu: Animated to X icon
- Slide-in drawer from right
- Blur overlay backdrop
- Touch-friendly tap targets (min 44px)

### 4.2 CTA Buttons

**Primary Button** (Gradient)
```typescript
<button className="
  bg-gradient-to-r from-purple-600 to-fuchsia-600
  hover:from-purple-500 hover:to-fuchsia-500
  transform hover:scale-105
  shadow-lg hover:shadow-purple-500/50
  transition-all duration-200
">
  Get Started
</button>
```

**Secondary Button** (Ghost/Outline)
```typescript
<button className="
  border-2 border-purple-600
  text-purple-400
  hover:bg-purple-600/10
  hover:border-purple-500
  transition-all duration-200
">
  Learn More
</button>
```

### 4.3 Feature Cards

**Card Structure**
```typescript
<div className="
  group
  bg-zinc-900/50
  border border-zinc-800
  rounded-xl p-6
  hover:border-purple-600
  hover:-translate-y-2
  hover:shadow-xl hover:shadow-purple-500/20
  transition-all duration-300
">
  <Icon className="text-purple-500 mb-4" />
  <h3 className="text-white font-semibold">Feature Title</h3>
  <p className="text-zinc-400">Description</p>
  <a className="text-purple-400 hover:text-purple-300 mt-4 inline-flex items-center">
    Learn more <ArrowRight className="ml-2" />
  </a>
</div>
```

### 4.4 Interactive Demo Section

**Tabs Component**
- Active tab: Purple gradient underline + background
- Inactive tabs: Hover state with subtle glow
- Content: Smooth cross-fade transition (300ms)

**Code Playground** (Optional)
```typescript
// Monaco editor or Sandpack
- Theme: Dark with purple syntax highlighting
- Live preview: Show encryption output
- Copy button with success animation
```

### 4.5 Stats Counter Animation

**Count-Up on Scroll**
```typescript
import { useInView } from 'framer-motion'
import { useEffect, useState } from 'react'

const StatCounter = ({ end, suffix }: { end: number, suffix: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (inView) {
      // Animate count from 0 to end
      const duration = 2000
      const steps = 60
      const increment = end / steps

      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
    }
  }, [inView, end])

  return <span ref={ref}>{count}{suffix}</span>
}
```

---

## 5. Layout Patterns & Responsive Design

### 5.1 Container System

**Base Container**
```typescript
const Container = ({ children, className }: ContainerProps) => (
  <div className={cn(
    "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    className
  )}>
    {children}
  </div>
)
```

### 5.2 Section Spacing Pattern

```typescript
const Section = ({ children, className }: SectionProps) => (
  <section className={cn(
    "py-16 md:py-24 lg:py-32",
    className
  )}>
    <Container>
      {children}
    </Container>
  </section>
)
```

### 5.3 Grid Layouts

**Feature Grid (3 columns)**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
  {features.map(feature => (
    <FeatureCard key={feature.id} {...feature} />
  ))}
</div>
```

**Two-Column Layout (Content + Visual)**
```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
  <div>
    <h2>Content</h2>
    <p>Description</p>
  </div>
  <div>
    <Image or 3D Visual />
  </div>
</div>
```

### 5.4 Responsive Breakpoints Strategy

**Mobile (< 640px)**
- Single column layouts
- Stack navigation (hamburger menu)
- Touch-friendly buttons (min 44px height)
- Reduced particle count (2000 particles)

**Tablet (640px - 1024px)**
- 2-column grids
- Reduced spacing (16px → 24px sections)
- Simplified animations (reduce motion for performance)

**Desktop (> 1024px)**
- Full 3-column grids
- Maximum particle effects
- Hover states enabled
- Parallax effects

**Large Desktop (> 1536px)**
- Constrain max-width to 1600px
- Increase padding to prevent edge-to-edge content
- Larger typography scale

---

## 6. QDaria Branding Integration

### 6.1 Parent Company References

**Navigation Bar**
```typescript
<nav className="flex items-center justify-between">
  <div className="flex items-center gap-6">
    {/* QDaria parent company logo */}
    <Link href="https://qdaria.com" className="text-zinc-400 hover:text-white">
      <QDariaLogo className="h-6" />
    </Link>

    {/* Separator */}
    <div className="h-6 w-px bg-zinc-700" />

    {/* Zipminator product logo */}
    <Link href="/" className="text-white font-bold text-xl">
      <ZipminatorLogo className="h-8" />
    </Link>
  </div>
  {/* ... rest of nav */}
</nav>
```

**Footer Branding**
```typescript
<footer>
  <div className="border-t border-zinc-800 pt-8">
    <p className="text-zinc-500 text-sm">
      Zipminator is a product of{' '}
      <a href="https://qdaria.com" className="text-purple-400 hover:text-purple-300">
        QDaria
      </a>
      , the quantum security company.
    </p>
  </div>
</footer>
```

### 6.2 Brand Hierarchy

**Visual Weight**
1. **Primary**: Zipminator product name/logo (large, prominent)
2. **Secondary**: QDaria parent company (subtle, top-left or footer)
3. **Tertiary**: Technology partners (IBM, NIST in "Powered by" section)

**Color Coordination**
- QDaria: Use zinc-400 text (subtle, not competing with Zipminator purple)
- Zipminator: Primary purple/violet branding
- Partners: Monochrome logos with purple accent on hover

---

## 7. Component Architecture (Technical Implementation)

### 7.1 Component File Structure
```
landing-page/
├── app/
│   ├── layout.tsx              # Root layout with fonts, metadata
│   ├── page.tsx                # Main landing page orchestrator
│   └── globals.css             # Tailwind + custom CSS variables
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx      # Fixed header with glass effect
│   │   ├── Footer.tsx          # Multi-column footer
│   │   └── Container.tsx       # Responsive container wrapper
│   ├── sections/
│   │   ├── Hero.tsx            # Hero with 3D background
│   │   ├── StatsBar.tsx        # Animated stats row
│   │   ├── ProviderShowcase.tsx # Logo grid
│   │   ├── TrustSignals.tsx    # 3-card trust section
│   │   ├── HowItWorks.tsx      # Step-by-step flow
│   │   ├── KeyFeatures.tsx     # Feature grid
│   │   ├── InteractiveDemo.tsx # Tabbed demo section
│   │   ├── UseCases.tsx        # Industry use case cards
│   │   └── CTA.tsx             # Final call-to-action
│   ├── ui/
│   │   ├── Button.tsx          # Reusable button variants
│   │   ├── Card.tsx            # Base card component
│   │   ├── Badge.tsx           # Trust badges, labels
│   │   └── Tabs.tsx            # Tabbed interface
│   └── three/
│       ├── QuantumBackground.tsx  # Particle system
│       ├── QubitVisualization.tsx # Rotating qubit
│       └── shaders/
│           ├── particleShader.ts
│           └── glowShader.ts
├── lib/
│   ├── constants.ts            # Feature data, stats, etc.
│   ├── utils.ts                # cn() utility, etc.
│   └── analytics.ts            # Event tracking
└── public/
    ├── logos/
    │   ├── qdaria.svg
    │   ├── zipminator.svg
    │   ├── ibm.svg
    │   └── nist.svg
    └── images/
```

### 7.2 Component Props Interfaces

**Hero Component**
```typescript
interface HeroProps {
  headline: string
  subheadline: string
  primaryCTA: {
    text: string
    href: string
  }
  secondaryCTA: {
    text: string
    href: string
  }
  stats: Array<{
    value: string
    label: string
  }>
}
```

**Feature Card**
```typescript
interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  link?: {
    text: string
    href: string
  }
}
```

### 7.3 Data Management (Constants)

**lib/constants.ts**
```typescript
export const FEATURES = [
  {
    id: 'nist-fips-203',
    icon: ShieldCheck,
    title: 'Implements NIST FIPS 203',
    description: 'Kyber768 post-quantum cryptography implementation',
    link: { text: 'View compliance', href: '/docs/compliance' }
  },
  {
    id: 'quantum-entropy',
    icon: Atom,
    title: 'True Quantum Entropy',
    description: 'Real randomness from 156-qubit IBM quantum hardware',
    link: { text: 'How it works', href: '/docs/quantum-entropy' }
  },
  // ... more features
]

export const PROVIDERS = [
  { name: 'IBM Quantum', logo: '/logos/ibm.svg', badge: '127 Qubits' },
  { name: 'NIST', logo: '/logos/nist.svg', badge: 'FIPS 203' },
  // ... more providers
]

export const STATS = [
  { value: '127', suffix: ' Qubits', label: 'IBM Quantum Hardware' },
  { value: '99.99', suffix: '%', label: 'Uptime SLA' },
  { value: '10,000', suffix: '+', label: 'Ops/Second' },
]
```

### 7.4 Animation Hooks

**useScrollReveal.ts**
```typescript
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export const useScrollReveal = (options = {}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
    ...options
  })

  return { ref, isInView }
}

// Usage
const { ref, isInView } = useScrollReveal()
<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 40 }}
  animate={isInView ? { opacity: 1, y: 0 } : {}}
/>
```

---

## 8. Performance Optimization

### 8.1 Image Optimization
- Use Next.js `<Image />` component for all images
- Serve WebP/AVIF with fallbacks
- Lazy load below-the-fold images
- Provider logos: SVG preferred (scalable, small)

### 8.2 Three.js Optimization
- Limit particle count on mobile (2000 vs 10000)
- Use `useFrame` throttling for animations
- Dispose geometries and materials on unmount
- Implement frustum culling for offscreen particles

### 8.3 Code Splitting
```typescript
// Lazy load heavy components
const InteractiveDemo = dynamic(() => import('@/components/sections/InteractiveDemo'), {
  loading: () => <DemoSkeleton />,
  ssr: false // Client-side only (Three.js)
})
```

### 8.4 Font Loading
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})
```

---

## 9. Accessibility (A11y)

### 9.1 Keyboard Navigation
- All interactive elements focusable via Tab
- Focus indicators: Purple outline (2px solid, 4px offset)
- Skip-to-content link for screen readers

### 9.2 ARIA Labels
```typescript
<button
  aria-label="Start free trial"
  aria-describedby="trial-description"
>
  Get Started
</button>
```

### 9.3 Color Contrast
- Ensure WCAG AA compliance (4.5:1 for text)
- Test purple text on dark backgrounds
- Use lighter purple (#A855F7) for small text

### 9.4 Reduced Motion
```typescript
const prefersReducedMotion = useReducedMotion()

<motion.div
  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
/>
```

---

## 10. SEO & Metadata

### 10.1 Page Metadata
```typescript
export const metadata: Metadata = {
  title: 'Zipminator - Post-Quantum Encryption Platform | NIST FIPS 203',
  description: 'Enterprise-grade quantum-secure encryption powered by IBM 156-qubit hardware and NIST FIPS 203 Kyber768. Protect your data against quantum threats.',
  keywords: ['post-quantum cryptography', 'Kyber768', 'NIST FIPS 203', 'quantum encryption', 'IBM quantum'],
  openGraph: {
    title: 'Zipminator - Quantum-Secure Encryption',
    description: 'NIST FIPS 203 post-quantum cryptography with real quantum entropy',
    images: ['/og-image.png'],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zipminator - Post-Quantum Encryption',
    description: 'Protect your data with quantum-secure cryptography',
    images: ['/twitter-card.png']
  }
}
```

### 10.2 Structured Data (JSON-LD)
```typescript
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Zipminator",
  "applicationCategory": "SecurityApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
}
```

---

## 11. Analytics & Conversion Tracking

### 11.1 Event Tracking
```typescript
// lib/analytics.ts
export const trackCTA = (ctaName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cta_click', {
      cta_name: ctaName,
      page_location: window.location.href
    })
  }
}

// Usage in components
<Button onClick={() => trackCTA('hero-get-started')}>
  Get Started
</Button>
```

### 11.2 Conversion Goals
1. **Primary**: "Start Free Trial" clicks
2. **Secondary**: "Schedule Demo" clicks
3. **Tertiary**: Documentation page visits
4. **Engagement**: Scroll depth (25%, 50%, 75%, 100%)

---

## 12. Development Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Design system implementation (colors, typography, spacing)
- [ ] Base component library (Button, Card, Container)
- [ ] Navigation + Footer
- [ ] Hero section with basic layout

### Phase 2: Core Sections (Week 2)
- [ ] StatsBar with CountUp animation
- [ ] ProviderShowcase
- [ ] TrustSignals cards
- [ ] KeyFeatures grid

### Phase 3: Advanced Features (Week 3)
- [ ] QuantumBackground (Three.js particles)
- [ ] HowItWorks timeline/flow
- [ ] InteractiveDemo section
- [ ] UseCases carousel

### Phase 4: Polish & Optimization (Week 4)
- [ ] Scroll-triggered animations (Framer Motion)
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Performance optimization (Lighthouse 90+ score)
- [ ] A11y audit and fixes
- [ ] SEO metadata and structured data

### Phase 5: Launch Prep
- [ ] Analytics integration
- [ ] A/B testing setup (if applicable)
- [ ] Cross-browser testing
- [ ] Production deployment (Vercel/Netlify)

---

## 13. Design Inspiration Summary (from qBraid)

### Key Takeaways from qBraid Screenshot:

1. **Dark, Tech-Forward Aesthetic**
   - Near-black backgrounds (#0A0A0F range)
   - Purple/violet accents as primary brand color
   - High contrast white text for readability

2. **Provider Logo Section**
   - Monochrome logos on dark background
   - Grid layout with equal spacing
   - Subtle hover glow effects

3. **Visual Hierarchy**
   - Large, bold headlines (60-72px)
   - Generous whitespace between sections
   - Clear visual separation with gradients

4. **Interactive Elements**
   - Tabbed interfaces for comparisons
   - Code examples with syntax highlighting
   - Animated visualizations (charts, diagrams)

5. **Trust Signals**
   - Prominent display of partner logos
   - Certification badges
   - Quantifiable metrics (uptime, performance)

6. **Call-to-Action Patterns**
   - Gradient buttons for primary actions
   - Ghost/outline buttons for secondary actions
   - Strategic placement at hero and section ends

---

## 14. Unique Zipminator Differentiators

### vs qBraid (Quantum Cloud Platform):
- **Zipminator**: Security-first, encryption-focused
- **Emphasis**: NIST compliance, quantum entropy harvesting
- **Visuals**: Lock/shield iconography vs qBraid's cloud/compute icons
- **Tone**: Enterprise security vs quantum computing education

### Brand Personality:
- **Trustworthy**: Enterprise-grade, compliance-certified
- **Cutting-Edge**: Quantum technology, advanced cryptography
- **Accessible**: Clear explanations of complex tech
- **Transparent**: Open-source, auditable implementations

---

## Appendix: Quick Reference

### Color Variables (CSS)
```css
:root {
  /* Quantum Purple Palette */
  --quantum-purple: #8B5CF6;
  --quantum-violet: #A855F7;
  --quantum-indigo: #6366F1;
  --quantum-fuchsia: #D946EF;

  /* Backgrounds */
  --bg-primary: #0A0A0F;
  --bg-secondary: #13131A;
  --bg-tertiary: #1C1C26;

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-muted: #71717A;

  /* Borders */
  --border-primary: #27272A;
  --border-accent: #8B5CF6;

  /* Glows */
  --glow-purple: rgba(139, 92, 246, 0.4);
  --glow-violet: rgba(168, 85, 247, 0.3);
}
```

### Tailwind Class Shortcuts
```typescript
// Gradient button
className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"

// Feature card
className="bg-zinc-900/50 border border-zinc-800 hover:border-purple-600 hover:-translate-y-2 transition-all duration-300"

// Section container
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32"
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-05
**Author**: System Architecture Designer
**Status**: Ready for Implementation
