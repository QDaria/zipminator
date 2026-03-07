/**
 * Analytics utility functions for tracking user interactions
 */

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

export function pageview(url: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID!, {
      page_path: url,
    })
  }
}

export function event({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    })
  }
}

export function trackCTA(location: string, ctaText: string): void {
  event({
    action: 'click_cta',
    category: 'engagement',
    label: `${location}: ${ctaText}`,
  })
}

export function trackNavigation(destination: string): void {
  event({
    action: 'click_navigation',
    category: 'navigation',
    label: destination,
  })
}

export function trackDemo(): void {
  event({
    action: 'request_demo',
    category: 'conversion',
    label: 'demo_request',
  })
}

export function trackGetStarted(): void {
  event({
    action: 'get_started',
    category: 'conversion',
    label: 'free_tier_signup',
  })
}

export function trackDownload(downloadType: string): void {
  event({
    action: 'download',
    category: 'engagement',
    label: downloadType,
  })
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
