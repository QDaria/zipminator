# Architecture Documentation - Zipminator-PQC Landing Page

## System Overview

Modern, performant landing page built with Next.js 14, inspired by qBraid's design philosophy.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Chrome     │  │   Firefox    │  │    Safari    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         └──────────────────┴──────────────────┘                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      CDN (Vercel Edge)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Static Assets: Images, Fonts, CSS, JS (Cached)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Next.js 14 Application                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    App Router                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │  layout.tsx│  │  page.tsx  │  │ globals.css│        │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  React Components                        │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  Navigation, Hero, Features, CTA, Footer        │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Animation Libraries                        │  │
│  │  ┌──────────────┐  ┌──────────────┐                     │  │
│  │  │Framer Motion │  │   Three.js   │                     │  │
│  │  └──────────────┘  └──────────────┘                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Framework
- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety

### Styling
- **Tailwind CSS v4**: Utility-first CSS framework
- **PostCSS**: CSS processing
- **Custom theme**: Quantum-inspired color palette

### Animation
- **Framer Motion**: React animation library
- **Three.js**: 3D quantum background visualization
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components for Three.js

### Icons & Assets
- **Lucide React**: Icon library
- **Next/Image**: Optimized image loading
- **Next/Font**: Google Fonts optimization

### Development
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **npm/bun/pnpm**: Package management

## Component Architecture

### Component Hierarchy

```
App (layout.tsx)
├── Navigation
│   ├── Logo & QDaria Branding
│   ├── Navigation Links
│   ├── Product Dropdown
│   └── Mobile Menu
│
├── Main (page.tsx)
│   ├── Hero
│   │   ├── QuantumBackground (Three.js)
│   │   ├── Headline & Subheadline
│   │   ├── CTA Buttons
│   │   └── Key Stats Cards
│   │
│   ├── ProviderShowcase
│   │   ├── Section Header
│   │   ├── Provider Grid (5 cards)
│   │   └── Feature Highlights
│   │
│   ├── TrustSignals
│   │   ├── Client Logos
│   │   └── Certification Badges
│   │
│   ├── KeyFeatures
│   │   ├── Main Features (3 cards)
│   │   └── Additional Features (3 items)
│   │
│   ├── HowItWorks
│   │   ├── Step 1: Quantum Entropy
│   │   ├── Step 2: Kyber768 Encryption
│   │   ├── Step 3: Quantum Security
│   │   └── Technical Specs
│   │
│   ├── StatsBar
│   │   └── Performance Metrics (4 items)
│   │
│   ├── UseCases
│   │   ├── Industry Cards (4 major)
│   │   └── Additional Use Cases (2 items)
│   │
│   └── CTA
│       ├── Final Call-to-Action
│       ├── CTA Buttons
│       └── Trust Indicators
│
└── Footer
    ├── QDaria Branding
    ├── Footer Sections (4 columns)
    ├── Social Links
    └── Legal & Compliance
```

### Component Patterns

#### 1. Container Pattern
```typescript
// All sections use consistent container
<div className="container-custom">
  {/* Content */}
</div>
```

#### 2. Card Pattern
```typescript
// Reusable quantum-styled card
<div className="card-quantum">
  {/* Card content */}
</div>
```

#### 3. Animation Pattern
```typescript
// Framer Motion scroll animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  {/* Animated content */}
</motion.div>
```

## Design System

### Color Palette

```css
/* Quantum Blue (Primary) */
quantum-50:  #f0f4ff
quantum-100: #e0e9ff
quantum-200: #c7d7fe
quantum-300: #a5bbfc
quantum-400: #8196f8
quantum-500: #6366f1 (Base)
quantum-600: #4f46e5
quantum-700: #4338ca
quantum-800: #3730a3
quantum-900: #312e81
quantum-950: #1e1b4b

/* Purple Accents */
purple-500: #a855f7
purple-600: #9333ea
purple-700: #7e22ce

/* Background */
gray-950: #030712 (Primary background)
gray-900: #111827
gray-800: #1f2937
```

### Typography

```css
/* Font Families */
--font-inter: 'Inter', system-ui, sans-serif
--font-mono: 'JetBrains Mono', monospace

/* Sizes */
Hero H1: 5xl (mobile) → 7xl (desktop)
Section H2: 4xl → 5xl
Card H3: 2xl
Body: xl (lead) → base
```

### Spacing

```css
/* Section Padding */
.section-padding: py-20 lg:py-32

/* Container */
.container-custom: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

### Effects

```css
/* Quantum Glow */
.quantum-glow {
  box-shadow: 0 0 15px rgba(99,102,241,0.3);
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(to right, quantum-400, purple-400, pink-400);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Quantum Border */
.quantum-border {
  border: 1px solid rgba(99,102,241,0.2);
}
```

## Performance Optimizations

### 1. Image Optimization
- Next.js Image component with automatic optimization
- WebP/AVIF formats
- Lazy loading
- Responsive images

### 2. Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Tree-shaking unused code

### 3. CSS Optimization
- Tailwind CSS purging
- CSS minification
- Critical CSS inlining

### 4. JavaScript Optimization
- Minification
- Tree-shaking
- Module preloading

### 5. Caching Strategy
```
Static Assets: max-age=31536000 (1 year)
HTML: no-cache
API: stale-while-revalidate
```

### 6. Three.js Optimization
- Limited particle count (5000)
- Efficient geometry updates
- RequestAnimationFrame throttling

## Data Flow

### 1. Static Site Generation (SSG)

```
Build Time:
├── Generate static HTML for all routes
├── Pre-render all components
├── Optimize images
└── Generate static assets

Runtime:
├── Serve pre-rendered HTML
├── Hydrate React components
├── Initialize animations
└── Load Three.js background
```

### 2. Client-Side Interactions

```
User Action → Event Handler → State Update → Re-render
                    ↓
            Analytics Tracking (optional)
```

### 3. Navigation Flow

```
User clicks link → Smooth scroll (internal) or Navigation (external)
                          ↓
                  Update URL (if applicable)
                          ↓
                  Track analytics event
```

## Deployment Architecture

### Vercel (Recommended)

```
GitHub Repository
       ↓
  Git Push (main branch)
       ↓
  Vercel Build Trigger
       ↓
  ┌──────────────────┐
  │   Build Phase    │
  │  - npm install   │
  │  - npm run build │
  │  - Optimize      │
  └────────┬─────────┘
           ↓
  ┌──────────────────┐
  │  Deploy to Edge  │
  │  - 300+ regions  │
  │  - Instant cache │
  └────────┬─────────┘
           ↓
  Production URL: zipminator.zip
```

### CDN Distribution

```
User Request (Los Angeles)
       ↓
Edge Node (LA) → Cache Hit? → Serve cached content
       ↓ (Miss)
Origin Server → Generate → Cache → Return
```

## Security Architecture

### 1. HTTPS Enforcement
- Automatic SSL via Vercel/Netlify
- HSTS headers
- Redirect HTTP → HTTPS

### 2. Security Headers
```typescript
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000
Referrer-Policy: origin-when-cross-origin
```

### 3. Content Security Policy
```typescript
// Future implementation
CSP: default-src 'self'; script-src 'self' 'unsafe-inline';
```

### 4. XSS Protection
- React's automatic escaping
- No dangerouslySetInnerHTML usage
- Input sanitization (future forms)

## Monitoring & Analytics

### 1. Performance Monitoring
- Vercel Analytics
- Web Vitals tracking
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)

### 2. User Analytics
- Google Analytics (optional)
- Event tracking for:
  - CTA clicks
  - Navigation
  - Demo requests
  - Downloads

### 3. Error Tracking
- Sentry integration (future)
- Error boundaries
- Console error monitoring

## Scalability Considerations

### Current Scale
- Static site: Unlimited scalability
- CDN: Global edge distribution
- No backend: No server bottlenecks

### Future Growth
1. **Add API endpoints**: Next.js API routes
2. **Database integration**: User accounts, demos
3. **Real-time features**: WebSocket connections
4. **Internationalization**: Multi-language support

## Maintenance & Updates

### Update Frequency
- Dependencies: Monthly security updates
- Content: As needed
- Features: Quarterly releases

### Version Control
```
main (production)
  ↓
develop (staging)
  ↓
feature/* (development)
```

### CI/CD Pipeline
```
PR Created → Tests Run → Code Review → Merge
                                        ↓
                                   Deploy to Staging
                                        ↓
                                   QA Approval
                                        ↓
                                   Deploy to Production
```

## Accessibility (WCAG 2.1 AA)

### Current Implementation
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Color contrast compliance
- Alt text for images

### Future Improvements
- Screen reader testing
- Focus management
- Skip navigation links
- ARIA live regions

## Browser Support

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android Chrome 90+)

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced experience with JavaScript enabled
- Graceful fallback for older browsers

## File Structure

```
landing-page/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/                # React components
│   ├── Navigation.tsx
│   ├── Hero.tsx
│   ├── QuantumBackground.tsx
│   ├── ProviderShowcase.tsx
│   ├── TrustSignals.tsx
│   ├── KeyFeatures.tsx
│   ├── HowItWorks.tsx
│   ├── StatsBar.tsx
│   ├── UseCases.tsx
│   ├── CTA.tsx
│   └── Footer.tsx
├── lib/                       # Utilities
│   ├── utils.ts              # Helper functions
│   ├── constants.ts          # Configuration
│   └── analytics.ts          # Analytics utilities
├── public/                    # Static assets
│   ├── images/
│   └── fonts/
├── styles/                    # Additional styles
├── package.json              # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind config
├── next.config.js           # Next.js config
├── README.md                # Documentation
├── DEPLOYMENT.md            # Deployment guide
└── ARCHITECTURE.md          # This file
```

## Key Design Decisions

### 1. Why Next.js?
- Server-side rendering for SEO
- Static site generation for performance
- Built-in optimization features
- Vercel deployment integration

### 2. Why Tailwind CSS?
- Rapid development
- Consistent design system
- Small bundle size (purging)
- Easy customization

### 3. Why Three.js?
- Impressive quantum visualization
- Hardware-accelerated
- Widely supported
- Performance with WebGL

### 4. Why Framer Motion?
- Declarative animations
- React-friendly
- Performance optimized
- Rich feature set

## Future Enhancements

1. **Interactive Demo**: Live encryption demo
2. **Pricing Calculator**: Cost estimation tool
3. **Blog Integration**: Technical articles
4. **Customer Testimonials**: Video testimonials
5. **Live Chat**: Support integration
6. **API Playground**: Interactive API testing
7. **Documentation Search**: Algolia integration
8. **Newsletter Signup**: Email collection
9. **Multi-language**: i18n support
10. **Dark/Light Mode Toggle**: Theme switching
