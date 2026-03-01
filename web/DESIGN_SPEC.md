# Zipminator Landing Page Design Specification
## Inspired by qBraid Quantum Platform Design Language

**Last Updated:** 2025-11-05
**Based on:** qBraid website analysis
**Target Framework:** React + Tailwind CSS v4

---

## 1. Color Palette

### Primary Colors
```css
/* Quantum Purple (Primary Brand) */
--quantum-purple-50: #f5f3ff
--quantum-purple-100: #ede9fe
--quantum-purple-200: #ddd6fe
--quantum-purple-300: #c4b5fd
--quantum-purple-400: #a78bfa
--quantum-purple-500: #8b5cf6  /* Primary */
--quantum-purple-600: #7c3aed  /* Primary Dark */
--quantum-purple-700: #6d28d9
--quantum-purple-800: #5b21b6
--quantum-purple-900: #4c1d95

/* Electric Blue (Accent) */
--electric-blue-400: #60a5fa
--electric-blue-500: #3b82f6
--electric-blue-600: #2563eb
--electric-blue-700: #1d4ed8

/* Magenta/Pink (Quantum Effect) */
--quantum-pink-400: #e879f9
--quantum-pink-500: #d946ef
--quantum-pink-600: #c026d3
```

### Background Colors (Dark Mode Primary)
```css
/* Dark Theme (Primary) */
--bg-primary: #0a0a0f      /* Deep space black */
--bg-secondary: #131318    /* Card/section background */
--bg-tertiary: #1a1a24     /* Elevated elements */
--bg-gradient-start: #1a0b2e  /* Purple-tinted dark */
--bg-gradient-end: #0f0617    /* Deep purple-black */

/* Light Theme (Optional) */
--bg-light-primary: #ffffff
--bg-light-secondary: #f9fafb
--bg-light-tertiary: #f3f4f6
```

### Text Colors
```css
--text-primary: #ffffff       /* Headings, primary text */
--text-secondary: #e5e7eb     /* Body text */
--text-muted: #9ca3af         /* Secondary info */
--text-accent: #8b5cf6        /* Links, highlights */
```

### Tailwind CSS Custom Theme
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        quantum: {
          purple: {
            50: '#f5f3ff',
            500: '#8b5cf6',
            600: '#7c3aed',
            900: '#4c1d95',
          },
          blue: {
            500: '#3b82f6',
            600: '#2563eb',
          },
          pink: {
            500: '#d946ef',
            600: '#c026d3',
          }
        },
        space: {
          black: '#0a0a0f',
          900: '#131318',
          800: '#1a1a24',
        }
      }
    }
  }
}
```

---

## 2. Typography

### Font Families
```css
/* Primary Font Stack */
--font-sans: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace

/* Tailwind Config */
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### Type Scale
```css
/* Hero/Display */
--text-display-xl: 4.5rem    /* 72px - Hero headlines */
--text-display-lg: 3.75rem   /* 60px - Section heroes */
--text-display-md: 3rem      /* 48px - Major sections */

/* Headings */
--text-h1: 2.25rem           /* 36px - text-4xl */
--text-h2: 1.875rem          /* 30px - text-3xl */
--text-h3: 1.5rem            /* 24px - text-2xl */
--text-h4: 1.25rem           /* 20px - text-xl */

/* Body */
--text-lg: 1.125rem          /* 18px - text-lg */
--text-base: 1rem            /* 16px - text-base */
--text-sm: 0.875rem          /* 14px - text-sm */
--text-xs: 0.75rem           /* 12px - text-xs */
```

### Tailwind Typography Classes
```javascript
// Hero Section
className="text-6xl md:text-7xl lg:text-8xl font-bold"

// Section Titles
className="text-4xl md:text-5xl font-bold"

// Subsection Titles
className="text-2xl md:text-3xl font-semibold"

// Body Text
className="text-lg md:text-xl leading-relaxed"

// Small Text
className="text-sm text-gray-400"
```

### Line Heights & Spacing
```css
--leading-tight: 1.1      /* Headlines */
--leading-snug: 1.375     /* Subheadings */
--leading-normal: 1.5     /* Body text */
--leading-relaxed: 1.75   /* Long-form content */

/* Letter Spacing */
--tracking-tight: -0.02em  /* Large headings */
--tracking-normal: 0em     /* Body */
--tracking-wide: 0.05em    /* Uppercase labels */
```

---

## 3. Layout Patterns

### Container System
```javascript
// Max Width Containers
const containers = {
  sm: "max-w-3xl",      // 768px - Forms, narrow content
  md: "max-w-5xl",      // 1024px - Standard sections
  lg: "max-w-6xl",      // 1152px - Wide sections
  xl: "max-w-7xl",      // 1280px - Full-width sections
  full: "max-w-full",   // 100% - Hero, full-bleed
}

// Padding/Spacing
const spacing = {
  section: "py-16 md:py-24 lg:py-32",     // Vertical section spacing
  container: "px-4 md:px-6 lg:px-8",      // Horizontal padding
  element: "space-y-8 md:space-y-12",     // Element spacing
}
```

### Hero Section Structure
```jsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-space-black">
  {/* Background Effects */}
  <div className="absolute inset-0 bg-gradient-to-br from-quantum-purple-900/20 to-transparent" />

  {/* Quantum Grid/Particles */}
  <div className="absolute inset-0 opacity-30">
    {/* Animated background */}
  </div>

  {/* Content */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
    {/* Badge/Label */}
    <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-quantum-purple-500/10 border border-quantum-purple-500/20">
      <span className="text-sm font-medium text-quantum-purple-400">
        Quantum-Secure Encryption
      </span>
    </div>

    {/* Headline */}
    <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
      <span className="bg-gradient-to-r from-white via-quantum-purple-300 to-quantum-pink-400 bg-clip-text text-transparent">
        The One-Stop Platform
      </span>
    </h1>

    {/* Subheadline */}
    <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
      Post-quantum encryption for files, messages, and cloud storage.
    </p>

    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button className="px-8 py-4 bg-quantum-purple-600 hover:bg-quantum-purple-700 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105">
        Get Started Free
      </button>
      <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg font-semibold text-lg border border-white/20 transition-all duration-200">
        View Documentation
      </button>
    </div>
  </div>
</section>
```

### Grid Systems
```javascript
// 2-Column Layout
className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"

// 3-Column Layout (Features)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"

// 4-Column Layout (Tech Stack)
className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"

// Asymmetric Layout (Content + Image)
className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
// Content: className="lg:col-span-5"
// Image: className="lg:col-span-7"
```

### Section Spacing
```javascript
// Standard Section
className="py-16 md:py-24 lg:py-32"

// Compact Section
className="py-12 md:py-16 lg:py-20"

// Dense Section (Between related content)
className="py-8 md:py-12"
```

---

## 4. UI Components

### Button Styles
```jsx
// Primary Button
const PrimaryButton = ({ children, ...props }) => (
  <button
    className="px-6 py-3 bg-quantum-purple-600 hover:bg-quantum-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-quantum-purple-500/50"
    {...props}
  >
    {children}
  </button>
)

// Secondary Button (Ghost)
const SecondaryButton = ({ children, ...props }) => (
  <button
    className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
    {...props}
  >
    {children}
  </button>
)

// Outline Button
const OutlineButton = ({ children, ...props }) => (
  <button
    className="px-6 py-3 bg-transparent border-2 border-quantum-purple-500 text-quantum-purple-400 hover:bg-quantum-purple-500/10 font-semibold rounded-lg transition-all duration-200"
    {...props}
  >
    {children}
  </button>
)

// Icon Button
const IconButton = ({ icon, ...props }) => (
  <button
    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10"
    {...props}
  >
    {icon}
  </button>
)
```

### Card Designs
```jsx
// Standard Feature Card
const FeatureCard = ({ icon, title, description }) => (
  <div className="group p-6 md:p-8 bg-space-900 rounded-xl border border-white/10 hover:border-quantum-purple-500/50 transition-all duration-300 backdrop-blur-sm">
    {/* Icon */}
    <div className="w-12 h-12 mb-4 bg-quantum-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-quantum-purple-500/20 transition-all duration-300">
      {icon}
    </div>

    {/* Title */}
    <h3 className="text-xl font-semibold mb-3 text-white">
      {title}
    </h3>

    {/* Description */}
    <p className="text-gray-400 leading-relaxed">
      {description}
    </p>
  </div>
)

// Glowing Card (Featured)
const GlowCard = ({ children }) => (
  <div className="relative p-8 bg-gradient-to-br from-quantum-purple-900/20 to-space-900 rounded-2xl border border-quantum-purple-500/30 shadow-2xl shadow-quantum-purple-500/20 overflow-hidden">
    {/* Glow Effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-quantum-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </div>
)

// Stat Card
const StatCard = ({ value, label }) => (
  <div className="text-center p-6 bg-space-900/50 rounded-lg backdrop-blur-sm border border-white/5">
    <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-quantum-purple-400 to-quantum-pink-400 bg-clip-text text-transparent">
      {value}
    </div>
    <div className="text-sm text-gray-400 uppercase tracking-wide">
      {label}
    </div>
  </div>
)
```

### Navigation Structure
```jsx
const Navigation = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-space-black/80 backdrop-blur-lg border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Zipminator" className="h-8 w-auto" />
          <span className="text-xl font-bold">Zipminator</span>
        </div>

        {/* Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#security" className="text-gray-300 hover:text-white transition-colors">Security</a>
          <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
          <a href="#docs" className="text-gray-300 hover:text-white transition-colors">Docs</a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Sign In
          </button>
          <button className="px-4 py-2 bg-quantum-purple-600 hover:bg-quantum-purple-700 rounded-lg text-sm font-medium transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  </nav>
)
```

### Footer Layout
```jsx
const Footer = () => (
  <footer className="bg-space-900 border-t border-white/10">
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
      {/* Main Footer Content */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
        {/* Brand Column */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.svg" alt="Zipminator" className="h-8 w-auto" />
            <span className="text-xl font-bold">Zipminator</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Quantum-secure encryption for the modern world.
          </p>
          {/* Social Links */}
          <div className="flex gap-3">
            {/* Social icons */}
          </div>
        </div>

        {/* Link Columns */}
        <div>
          <h4 className="font-semibold mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
          </ul>
        </div>

        {/* More columns... */}
      </div>

      {/* Bottom Bar */}
      <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-400">
          © 2025 Zipminator. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Cookies</a>
        </div>
      </div>
    </div>
  </footer>
)
```

---

## 5. Visual Elements

### Gradients
```css
/* Background Gradients */
.bg-quantum-gradient {
  background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
}

.bg-space-gradient {
  background: linear-gradient(180deg, #0a0a0f 0%, #1a0b2e 100%);
}

.bg-hero-gradient {
  background: radial-gradient(ellipse at top, #5b21b620 0%, transparent 50%);
}

/* Text Gradients */
.text-quantum-gradient {
  background: linear-gradient(90deg, #ffffff 0%, #8b5cf6 50%, #d946ef 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Tailwind Classes */
className="bg-gradient-to-r from-quantum-purple-600 to-quantum-pink-500"
className="bg-gradient-to-br from-white via-quantum-purple-300 to-quantum-pink-400 bg-clip-text text-transparent"
```

### Border Radius
```javascript
// Standard Radius
rounded: "4px"      // Small elements
roundedMd: "6px"    // Buttons, inputs
roundedLg: "8px"    // Cards
roundedXl: "12px"   // Large cards
rounded2xl: "16px"  // Hero cards
rounded3xl: "24px"  // Feature sections
roundedFull: "9999px"  // Pills, badges
```

### Shadows & Depth
```css
/* Shadow System */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.2);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.3);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.4);

/* Glow Shadows (Quantum Effect) */
--shadow-purple-glow: 0 0 20px rgba(139, 92, 246, 0.3);
--shadow-pink-glow: 0 0 20px rgba(217, 70, 239, 0.3);

/* Tailwind Classes */
className="shadow-lg shadow-quantum-purple-500/50"
className="shadow-2xl shadow-quantum-pink-500/20"
className="hover:shadow-xl hover:shadow-quantum-purple-500/40 transition-shadow duration-300"
```

### Animations & Transitions
```css
/* Transition Durations */
--duration-fast: 150ms
--duration-base: 200ms
--duration-slow: 300ms
--duration-slower: 500ms

/* Easing Functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)

/* Common Transitions */
.transition-all {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-colors {
  transition: color 200ms, background-color 200ms, border-color 200ms;
}

.transition-transform {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Animation Examples
```jsx
// Hover Scale
className="transition-transform duration-200 hover:scale-105 active:scale-95"

// Fade In
className="animate-fade-in opacity-0"
// CSS: @keyframes fade-in { to { opacity: 1; } }

// Slide Up
className="animate-slide-up translate-y-4 opacity-0"
// CSS: @keyframes slide-up { to { transform: translateY(0); opacity: 1; } }

// Pulse Glow
className="animate-pulse-glow"
// CSS: @keyframes pulse-glow {
//   0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
//   50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
// }
```

### Icons & Illustrations
```javascript
// Icon Library: Lucide React (recommended)
import {
  Shield,
  Lock,
  Zap,
  Cloud,
  Key,
  Activity,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

// Icon Sizes
const iconSizes = {
  sm: "w-4 h-4",    // 16px - Inline text
  md: "w-6 h-6",    // 24px - Buttons
  lg: "w-8 h-8",    // 32px - Feature cards
  xl: "w-12 h-12",  // 48px - Section icons
  "2xl": "w-16 h-16" // 64px - Hero icons
}

// Icon Colors
className="text-quantum-purple-500"
className="text-quantum-pink-400"
className="text-white"
```

---

## 6. Content Patterns

### Section Title Format
```jsx
const SectionHeader = ({ badge, title, description }) => (
  <div className="text-center max-w-3xl mx-auto mb-16">
    {/* Badge/Label */}
    {badge && (
      <div className="inline-flex items-center px-4 py-2 mb-4 rounded-full bg-quantum-purple-500/10 border border-quantum-purple-500/20">
        <span className="text-sm font-medium text-quantum-purple-400">
          {badge}
        </span>
      </div>
    )}

    {/* Title */}
    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
      {title}
    </h2>

    {/* Description */}
    {description && (
      <p className="text-xl text-gray-400 leading-relaxed">
        {description}
      </p>
    )}
  </div>
)

// Usage
<SectionHeader
  badge="Quantum Security"
  title="Connect to QPUs, GPUs, CPUs"
  description="All of these providers, all in one place."
/>
```

### CTA Placement Patterns
```javascript
// Hero CTA: Center, large, dual buttons
// Section CTA: End of section, single primary button
// Card CTA: Bottom right, text link with arrow
// Footer CTA: Full-width banner above footer

// Example: Section CTA
const SectionCTA = () => (
  <div className="text-center mt-12">
    <button className="px-8 py-4 bg-quantum-purple-600 hover:bg-quantum-purple-700 rounded-lg font-semibold text-lg inline-flex items-center gap-2 transition-all duration-200 transform hover:scale-105">
      Get Started
      <ArrowRight className="w-5 h-5" />
    </button>
  </div>
)
```

### Social Proof Positioning
```jsx
// Logo Cloud (After hero or in dedicated section)
const LogoCloud = () => (
  <section className="py-12 bg-space-900/50">
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      <p className="text-center text-sm text-gray-400 mb-8 uppercase tracking-wide">
        Trusted by quantum innovators
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
        {/* Partner logos */}
      </div>
    </div>
  </section>
)

// Testimonial Section
const Testimonials = () => (
  <section className="py-16 md:py-24">
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Testimonial cards */}
      </div>
    </div>
  </section>
)
```

### Feature Presentation Style
```jsx
// Alternating Layout Pattern
const FeatureSection = ({ features }) => (
  <section className="py-16 md:py-24">
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-24">
      {features.map((feature, index) => (
        <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
          {/* Content */}
          <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
            <div className="inline-flex items-center px-3 py-1 mb-4 rounded-full bg-quantum-purple-500/10 border border-quantum-purple-500/20">
              <span className="text-xs font-medium text-quantum-purple-400 uppercase tracking-wide">
                {feature.badge}
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              {feature.title}
            </h3>
            <p className="text-lg text-gray-400 mb-6 leading-relaxed">
              {feature.description}
            </p>
            <ul className="space-y-3">
              {feature.points.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-quantum-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-quantum-purple-900/20 to-space-900 border border-quantum-purple-500/30 overflow-hidden">
              {/* Feature illustration/screenshot */}
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
)
```

---

## 7. Quantum Aesthetic

### Quantum Concept Visualization

#### Network/Lattice Patterns
```jsx
// Quantum Grid Background
const QuantumGrid = () => (
  <div className="absolute inset-0 opacity-20">
    <svg className="w-full h-full">
      <defs>
        <pattern id="quantum-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(139, 92, 246, 0.3)" />
          <line x1="0" y1="20" x2="40" y2="20" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="0.5" />
          <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#quantum-grid)" />
    </svg>
  </div>
)

// Hexagonal Lattice
const HexLattice = () => (
  <div className="absolute inset-0 opacity-10">
    {/* SVG hexagonal pattern */}
  </div>
)
```

#### Particle Effects
```jsx
// Floating Particles (CSS Animation)
const ParticleField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 bg-quantum-purple-400 rounded-full animate-float"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${5 + Math.random() * 10}s`,
        }}
      />
    ))}
  </div>
)

// CSS
@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  50% {
    transform: translate(20px, -20px) scale(1.5);
    opacity: 0.8;
  }
}
```

#### Quantum State Visualization
```jsx
// Glowing Orbs (Qubits)
const QuantumOrb = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  return (
    <div className={`relative ${sizes[size]}`}>
      {/* Core */}
      <div className="absolute inset-0 bg-gradient-to-br from-quantum-purple-400 to-quantum-pink-500 rounded-full blur-xl opacity-60 animate-pulse-glow" />
      <div className="absolute inset-2 bg-gradient-to-br from-quantum-purple-500 to-quantum-pink-600 rounded-full" />

      {/* Inner glow */}
      <div className="absolute inset-4 bg-white rounded-full opacity-40" />
    </div>
  )
}
```

### Color Schemes (Quantum Theme)
```javascript
// Primary Quantum Palette
const quantumColors = {
  // Deep purple (quantum computing)
  primary: '#7c3aed',
  primaryDark: '#6d28d9',

  // Electric blue (qubits)
  secondary: '#3b82f6',
  secondaryLight: '#60a5fa',

  // Magenta/pink (entanglement)
  accent: '#d946ef',
  accentLight: '#e879f9',

  // Cyan (superposition)
  highlight: '#06b6d4',
  highlightLight: '#22d3ee',
}

// Gradient Combinations
const quantumGradients = {
  purplePink: 'from-quantum-purple-600 to-quantum-pink-500',
  blueGreen: 'from-quantum-blue-500 to-cyan-400',
  multiState: 'from-quantum-purple-500 via-quantum-pink-500 to-quantum-blue-500',
}
```

### Quantum-Inspired Components
```jsx
// Entangled Particles Connection
const EntangledParticles = () => (
  <svg className="w-full h-64" viewBox="0 0 400 200">
    {/* Particle 1 */}
    <circle cx="100" cy="100" r="20" fill="url(#particle-gradient-1)" className="animate-pulse" />

    {/* Particle 2 */}
    <circle cx="300" cy="100" r="20" fill="url(#particle-gradient-2)" className="animate-pulse" />

    {/* Entanglement Line */}
    <path
      d="M 120 100 Q 200 50, 280 100"
      stroke="url(#entanglement-gradient)"
      strokeWidth="2"
      fill="none"
      className="animate-dash"
      strokeDasharray="5,5"
    />

    <defs>
      <linearGradient id="particle-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>
      <linearGradient id="particle-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="entanglement-gradient">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="50%" stopColor="#d946ef" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
  </svg>
)

// Quantum Circuit Visualization
const QuantumCircuit = () => (
  <div className="relative p-8 bg-space-900/50 rounded-xl border border-quantum-purple-500/30">
    {/* Circuit lines */}
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="text-xs text-gray-400">q[{i}]</div>
          <div className="flex-1 h-0.5 bg-quantum-purple-500/30 relative">
            {/* Gates */}
            <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-quantum-purple-600 rounded border border-quantum-purple-400 flex items-center justify-center text-xs">
              H
            </div>
            <div className="absolute top-1/2 left-3/4 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-quantum-pink-600 rounded border border-quantum-pink-400 flex items-center justify-center text-xs">
              X
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
```

---

## 8. Implementation Checklist

### Phase 1: Foundation
- [ ] Set up Tailwind CSS v4 with custom theme
- [ ] Configure color palette (quantum colors)
- [ ] Set up typography system (Inter font)
- [ ] Create base layout components (Container, Section)
- [ ] Implement dark mode (default)

### Phase 2: Core Components
- [ ] Build button component system
- [ ] Create card components (Feature, Glow, Stat)
- [ ] Implement navigation bar
- [ ] Build footer component
- [ ] Create section header component

### Phase 3: Hero Section
- [ ] Design hero layout (full-screen, centered)
- [ ] Add quantum background effects
- [ ] Implement gradient text
- [ ] Add animated particles
- [ ] Build CTA button group

### Phase 4: Feature Sections
- [ ] Create feature grid layouts
- [ ] Build alternating feature sections
- [ ] Add quantum visualizations
- [ ] Implement hover effects
- [ ] Add icons and illustrations

### Phase 5: Visual Effects
- [ ] Add background gradients
- [ ] Implement glow effects
- [ ] Create particle animations
- [ ] Add quantum grid patterns
- [ ] Build entanglement visualizations

### Phase 6: Content Sections
- [ ] Logo cloud (partners)
- [ ] Testimonials section
- [ ] Stats/metrics section
- [ ] FAQ section
- [ ] Contact/demo CTA

### Phase 7: Polish
- [ ] Add scroll animations (AOS/Framer Motion)
- [ ] Optimize responsive breakpoints
- [ ] Test accessibility
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## 9. Tech Stack Recommendations

### Core
- **Framework**: React 18+ or Next.js 14+
- **Styling**: Tailwind CSS v4
- **TypeScript**: Required for type safety

### Animation Libraries
- **Framer Motion**: Complex animations, page transitions
- **AOS (Animate On Scroll)**: Simple scroll-triggered animations
- **React Spring**: Physics-based animations

### Icons & Graphics
- **Lucide React**: Icon library (preferred)
- **React Icons**: Alternative icon library
- **Heroicons**: Tailwind-native icons

### 3D/Advanced Effects
- **Three.js** + **React Three Fiber**: 3D quantum visualizations
- **Particles.js**: Particle effects
- **Canvas Confetti**: Celebration effects

### Performance
- **Next.js Image**: Optimized image loading
- **React Lazy**: Code splitting
- **Intersection Observer**: Lazy loading sections

---

## 10. Example Page Structure

```jsx
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { Security } from '@/components/Security'
import { Integration } from '@/components/Integration'
import { Pricing } from '@/components/Pricing'
import { Testimonials } from '@/components/Testimonials'
import { FAQ } from '@/components/FAQ'
import { CTA } from '@/components/CTA'

export default function LandingPage() {
  return (
    <main className="bg-space-black text-white">
      {/* Hero Section */}
      <Hero />

      {/* Logo Cloud */}
      <LogoCloud />

      {/* Features Grid */}
      <Features />

      {/* Security Deep Dive */}
      <Security />

      {/* Integration Options */}
      <Integration />

      {/* Stats Section */}
      <Stats />

      {/* Pricing */}
      <Pricing />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <CTA />
    </main>
  )
}
```

---

## 11. Accessibility Notes

- **Color Contrast**: Ensure minimum 4.5:1 ratio for text
- **Focus States**: Visible focus rings on interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **ARIA Labels**: Proper labeling for screen readers
- **Semantic HTML**: Use correct heading hierarchy
- **Motion**: Respect `prefers-reduced-motion` setting

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Performance Targets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Lighthouse Score**: 90+ (all categories)

### Optimization Strategies
- Lazy load below-the-fold sections
- Optimize images (WebP, AVIF)
- Minimize JavaScript bundle
- Use Next.js Image component
- Implement skeleton screens
- Preload critical assets

---

## Notes from qBraid Analysis

**Key Takeaways:**
1. **Dark-first design** with deep space backgrounds
2. **Purple/pink/blue quantum color scheme**
3. **Large, bold typography** with gradient text effects
4. **Generous spacing** between sections
5. **Glowing effects** on interactive elements
6. **Grid-based layouts** with clean alignment
7. **Quantum-themed visuals** (particles, grids, circuits)
8. **Social proof** prominently displayed
9. **Clear CTAs** with high contrast
10. **Professional, modern aesthetic** balancing tech and approachability

**Content Strategy:**
- Focus on "one-stop platform" messaging
- Emphasize provider/technology integrations
- Use case-driven feature presentation
- Trust signals (logos, testimonials)
- Developer-friendly documentation links

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Author:** Research Agent Analysis
**Status:** Ready for Implementation
