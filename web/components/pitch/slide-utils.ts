/**
 * Shared animation presets and icon maps for pitch deck slides.
 *
 * Centralises the `fadeUp` motion helpers and the super-app module
 * icon lookup that were previously duplicated across 13+ slide files.
 */

import {
  MessageSquare,
  Phone,
  Shield,
  Globe,
  Mail,
  Cpu,
  Eye,
  Bot,
  Radio,
  Database,
  Zap,
  AlertTriangle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Animation presets
// ---------------------------------------------------------------------------

/**
 * Fade-up animation that triggers on mount (`animate`).
 * Use when the slide is already visible (e.g. current pitch slide).
 */
export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.5, delay },
  }
}

/**
 * Fade-up animation that triggers when the element scrolls into view.
 * Use for long-form pages where content may be below the fold.
 */
export function fadeUpInView(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
  }
}

// ---------------------------------------------------------------------------
// Icon maps
// ---------------------------------------------------------------------------

/**
 * Maps the string icon names used in `SUPER_APP_MODULES` and `THREAT_DATA`
 * (from `pitch-data.ts`) to their Lucide React components.
 */
export const MODULE_ICON_MAP: Record<string, typeof Shield> = {
  MessageSquare,
  Phone,
  Shield,
  Globe,
  Mail,
  Cpu,
  Eye,
  Bot,
  Radio,
  Database,
  Zap,
  AlertTriangle,
}
