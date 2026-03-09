/**
 * Shared animation presets and icon maps for pitch deck slides.
 *
 * Centralises the `fadeUp` motion helpers and the super-app module
 * icon lookup that were previously duplicated across 13+ slide files.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
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

/**
 * Scale-up entrance animation for chart containers.
 */
export function chartEntrance(delay = 0) {
  return {
    initial: { opacity: 0, y: 20, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
  }
}

/**
 * Staggered fade-in for list items (cards, bars, etc.)
 */
export function staggerItem(index: number, baseDelay = 0.1) {
  return {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: baseDelay + index * 0.06 },
  }
}

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------

/**
 * Hook that animates a number from 0 to `target` with easeOutCubic.
 * Returns the current display value as a string.
 */
export function useAnimatedCounter(
  target: number,
  options: { duration?: number; suffix?: string; decimals?: number } = {},
) {
  const { duration = 1200, suffix = '', decimals = 0 } = options
  const [display, setDisplay] = useState('0' + suffix)
  const ref = useRef<HTMLElement>(null)
  const hasAnimated = useRef(false)

  const animate = useCallback(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target

      if (decimals > 0) {
        setDisplay(current.toFixed(decimals) + suffix)
      } else {
        setDisplay(Math.floor(current).toLocaleString() + suffix)
      }

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        if (decimals > 0) {
          setDisplay(target.toFixed(decimals) + suffix)
        } else {
          setDisplay(target.toLocaleString() + suffix)
        }
      }
    }

    requestAnimationFrame(tick)
  }, [target, duration, suffix, decimals])

  useEffect(() => {
    const el = ref.current
    if (!el) {
      animate()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) animate()
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [animate])

  return { display, ref }
}

// ---------------------------------------------------------------------------
// Chart responsive height helper
// ---------------------------------------------------------------------------
export function getChartHeight(base = 280): number {
  if (typeof window === 'undefined') return base
  return window.innerWidth < 640 ? Math.round(base * 0.75) : base
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
