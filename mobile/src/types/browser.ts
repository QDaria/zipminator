/**
 * browser.ts
 *
 * Type definitions for the ZipBrowser mobile component.
 * Shared between ZipBrowser.tsx, BrowserService, AddressBar, NavigationBar,
 * and PqcIndicator.
 */

// ── PQC Security Status ──────────────────────────────────────────────────────

/**
 * High-level PQC/TLS status for the current page.
 *   'pqc'       — ML-KEM-768 key exchange confirmed via proxy
 *   'classical' — TLS handshake completed with classical ECDHE/X25519
 *   'unknown'   — Proxy unreachable or status not yet determined
 */
export type PqcStatusLevel = 'pqc' | 'classical' | 'unknown';

/**
 * Detailed TLS session info returned by the PQC proxy.
 * Used in expert mode to display cryptographic telemetry.
 */
export interface PqcStatus {
  /** PQC or classical classification. */
  level: PqcStatusLevel;
  /** Key exchange algorithm, e.g. "ML-KEM-768", "X25519", "ECDHE-P256". */
  keyExchange: string;
  /** Symmetric cipher suite, e.g. "AES-256-GCM". */
  cipher: string;
  /** Certificate issuer common name. */
  issuer: string;
  /** Whether Strict-Transport-Security (HSTS) is present. */
  hsts: boolean;
  /** Whether the certificate is valid (not expired, not self-signed). */
  certValid: boolean;
}

// ── Tab ──────────────────────────────────────────────────────────────────────

/**
 * Represents a single browser tab.
 * Tab identity is stable across navigation (id never changes after creation).
 */
export interface Tab {
  /** Unique identifier (UUID-style). */
  id: string;
  /** Current URL of the tab. */
  url: string;
  /** Page title from the WebView's document.title. */
  title: string;
  /** Optional favicon data URI or https URL. */
  favicon?: string;
  /** PQC security status for the tab's current domain. */
  pqcStatus: PqcStatusLevel;
}

// ── History ──────────────────────────────────────────────────────────────────

/**
 * A single history entry, written when the user navigates to a new URL.
 */
export interface HistoryEntry {
  /** Full URL visited. */
  url: string;
  /** Page title at time of visit. */
  title: string;
  /** Timestamp of the visit. */
  visitedAt: Date;
}

// ── Navigation state ─────────────────────────────────────────────────────────

/**
 * Navigation controls state derived from the WebView ref.
 * Passed down to NavigationBar to enable/disable buttons.
 */
export interface NavState {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  /** Load progress (0–1). Not all WebView versions support this. */
  progress?: number;
}

// ── Proxy configuration ──────────────────────────────────────────────────────

/**
 * PQC proxy endpoint configuration.
 * For MVP, this points to the local proxy at 127.0.0.1:18443.
 * In production, the native bridge sets these values.
 */
export interface ProxyConfig {
  host: string;
  port: number;
  /** Whether the proxy is currently reachable. */
  isAvailable: boolean;
}
