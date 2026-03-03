/**
 * BrowserService.ts
 *
 * Service layer for the ZipBrowser mobile component.
 * Manages tab lifecycle, navigation history, and PQC proxy status queries.
 *
 * Architecture:
 *   ZipBrowser.tsx ↔ BrowserService ↔ PQC proxy (127.0.0.1:18443)
 *                                   ↔ native bridge (TODO: real module)
 *
 * For MVP, getPqcStatus() uses a mock that returns ML-KEM-768 for HTTPS
 * domains and classical for HTTP. The native bridge integration is marked
 * with TODO comments and follows the same pattern as VpnService.ts.
 */

import { EventEmitter } from 'events';
import type {
  Tab,
  HistoryEntry,
  PqcStatus,
  PqcStatusLevel,
  ProxyConfig,
} from '../types/browser';

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class BrowserServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'BrowserServiceError';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _tabCounter = 0;

function generateTabId(): string {
  _tabCounter += 1;
  return `tab-${Date.now()}-${_tabCounter}`;
}

/**
 * Normalise a user-typed URL string.
 * - Adds "https://" if no scheme is present.
 * - Trims whitespace.
 * - Returns the raw string if it looks like a search query (contains spaces).
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'https://duckduckgo.com';

  // Contains spaces and no scheme → treat as DuckDuckGo search
  if (trimmed.includes(' ') && !trimmed.startsWith('http')) {
    const encoded = encodeURIComponent(trimmed);
    return `https://duckduckgo.com/?q=${encoded}`;
  }

  // Already has a scheme
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // No scheme — assume HTTPS
  return `https://${trimmed}`;
}

/**
 * Build the proxied URL for a given destination URL.
 * For MVP: The WebView connects directly (the proxy handles CONNECT at the
 * network layer). This function constructs the URL the WebView loads.
 * When the native PQC proxy module is integrated, this may return a
 * proxy:// scheme or inject CONNECT tunnel headers.
 */
export function buildProxiedUrl(url: string, proxy: ProxyConfig): string {
  // TODO(phase9): When native proxy module is available, route via
  //   http://127.0.0.1:${proxy.port}/proxy?url=${encodeURIComponent(url)}
  // For MVP, load the URL directly and report PQC status via side-channel.
  if (!proxy.isAvailable) return url;
  return url;
}

/**
 * Extract the hostname from a URL, returning the full URL on parse failure.
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Mock PQC status resolution.
 * HTTPS URLs are assumed to be PQC when the proxy is available.
 * TODO(phase9): Replace with actual proxy telemetry from native bridge.
 */
async function mockPqcStatus(url: string, proxyAvailable: boolean): Promise<PqcStatus> {
  const isHttps = url.startsWith('https://');
  const level: PqcStatusLevel = proxyAvailable && isHttps ? 'pqc' : isHttps ? 'classical' : 'unknown';

  return {
    level,
    keyExchange: level === 'pqc' ? 'ML-KEM-768' : level === 'classical' ? 'X25519' : 'unknown',
    cipher: isHttps ? 'AES-256-GCM' : 'plaintext',
    issuer: isHttps ? 'ZipProxy CA (self)' : 'none',
    hsts: isHttps,
    certValid: isHttps,
  };
}

// ---------------------------------------------------------------------------
// BrowserService
// ---------------------------------------------------------------------------

const MAX_HISTORY = 500;

/**
 * Singleton service managing browser state: tabs, history, and PQC status.
 *
 * Usage:
 * ```typescript
 * import { browserService } from './services/BrowserService';
 *
 * const tab = browserService.createTab();
 * const proxied = browserService.navigate(tab.id, 'https://example.com');
 * ```
 */
export class BrowserService extends EventEmitter {

  private _proxy: ProxyConfig = {
    host: '127.0.0.1',
    port: 18443,
    isAvailable: false,  // Conservative default; probe on init
  };

  private _tabs: Map<string, Tab> = new Map();
  private _activeTabId: string | null = null;
  private _history: HistoryEntry[] = [];
  private static _instance?: BrowserService;

  // ----- Singleton -----

  public static getInstance(): BrowserService {
    if (!BrowserService._instance) {
      BrowserService._instance = new BrowserService();
    }
    return BrowserService._instance;
  }

  /** @internal - Use getInstance() in production, new BrowserService() in tests. */
  public constructor() {
    super();
    this._probeProxy();
  }

  // ----- Proxy -----

  /**
   * Probe whether the local PQC proxy is reachable.
   * Sets _proxy.isAvailable based on result.
   * TODO(phase9): Replace with native module availability check.
   */
  private _probeProxy(): void {
    // MVP: assume proxy unavailable until native bridge reports readiness
    // In production this would call NativeModules.ZipProxyManager.isRunning()
    this._proxy = { ...this._proxy, isAvailable: false };
  }

  /** Update proxy availability (called by native bridge events). */
  public setProxyAvailable(available: boolean): void {
    this._proxy = { ...this._proxy, isAvailable: available };
    this.emit('proxyStatusChange', available);
  }

  /** Current proxy configuration snapshot. */
  public get proxy(): Readonly<ProxyConfig> {
    return this._proxy;
  }

  // ----- Navigation -----

  /**
   * Navigate a tab to the given URL.
   * Normalizes the URL, builds the proxied variant, and records history.
   *
   * @param tabId - The tab to navigate. Creates a new tab if not found.
   * @param rawUrl - User-typed URL or search query.
   * @returns The final URL the WebView should load.
   */
  public navigate(tabId: string, rawUrl: string): string {
    const url = normalizeUrl(rawUrl);
    const proxied = buildProxiedUrl(url, this._proxy);

    let tab = this._tabs.get(tabId);
    if (!tab) {
      tab = this._createTabObject(url);
      this._tabs.set(tab.id, tab);
      this._activeTabId = tab.id;
    } else {
      tab = { ...tab, url, title: extractDomain(url), pqcStatus: 'unknown' };
      this._tabs.set(tabId, tab);
    }

    this.emit('navigate', { tabId: tab.id, url, proxied });
    return proxied;
  }

  // ----- History -----

  /**
   * Record a navigation event in history.
   * Called by the component when the WebView fires onNavigationStateChange.
   */
  public recordHistoryEntry(url: string, title: string): void {
    const entry: HistoryEntry = {
      url,
      title: title || extractDomain(url),
      visitedAt: new Date(),
    };

    this._history.unshift(entry);

    // Cap history to prevent unbounded growth
    if (this._history.length > MAX_HISTORY) {
      this._history = this._history.slice(0, MAX_HISTORY);
    }
  }

  /** Return a copy of the history entries (newest first). */
  public getHistory(): HistoryEntry[] {
    return [...this._history];
  }

  /** Clear all history entries. */
  public clearHistory(): void {
    this._history = [];
    this.emit('historyCleared');
  }

  // ----- PQC Status -----

  /**
   * Query the PQC status for a given URL.
   *
   * For MVP: returns a mock based on scheme + proxy availability.
   * TODO(phase9): Call NativeModules.ZipProxyManager.getTlsInfo(domain)
   *
   * @param url - The URL to check.
   * @returns PqcStatus with key exchange, cipher, issuer, and HSTS details.
   */
  public async getPqcStatus(url: string): Promise<PqcStatus> {
    try {
      return await mockPqcStatus(url, this._proxy.isAvailable);
    } catch (error) {
      throw new BrowserServiceError(
        `Failed to get PQC status for ${url}: ${error instanceof Error ? error.message : String(error)}`,
        'PQC_STATUS_ERROR'
      );
    }
  }

  // ----- Tab management -----

  /**
   * Create a new browser tab starting at the default URL.
   * The new tab becomes the active tab.
   */
  public createTab(initialUrl = 'https://duckduckgo.com'): Tab {
    const tab = this._createTabObject(initialUrl);
    this._tabs.set(tab.id, tab);
    this._activeTabId = tab.id;
    this.emit('tabCreated', tab);
    return tab;
  }

  /**
   * Close a tab by ID.
   * If the closed tab was active, the most recently created remaining tab
   * becomes active (or null if no tabs remain).
   */
  public closeTab(id: string): void {
    if (!this._tabs.has(id)) return;

    this._tabs.delete(id);

    if (this._activeTabId === id) {
      const remaining = [...this._tabs.keys()];
      this._activeTabId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
    }

    this.emit('tabClosed', id);
  }

  /**
   * Switch the active tab.
   * @throws {BrowserServiceError} If the tab ID does not exist.
   */
  public switchTab(id: string): void {
    if (!this._tabs.has(id)) {
      throw new BrowserServiceError(`Tab ${id} not found`, 'TAB_NOT_FOUND');
    }
    this._activeTabId = id;
    this.emit('tabSwitch', id);
  }

  /**
   * Update a tab's PQC status and title (called after page load).
   */
  public updateTab(id: string, updates: Partial<Pick<Tab, 'title' | 'pqcStatus' | 'favicon' | 'url'>>): void {
    const tab = this._tabs.get(id);
    if (!tab) return;
    this._tabs.set(id, { ...tab, ...updates });
    this.emit('tabUpdated', id, updates);
  }

  /** All open tabs as an ordered array (insertion order). */
  public getTabs(): Tab[] {
    return [...this._tabs.values()];
  }

  /** The currently active tab, or null if no tabs are open. */
  public getActiveTab(): Tab | null {
    if (!this._activeTabId) return null;
    return this._tabs.get(this._activeTabId) ?? null;
  }

  /** Number of open tabs. */
  public get tabCount(): number {
    return this._tabs.size;
  }

  // ----- Internals -----

  private _createTabObject(url: string): Tab {
    return {
      id: generateTabId(),
      url,
      title: extractDomain(url),
      pqcStatus: 'unknown',
    };
  }

  /** Reset all state (useful for tests). */
  public reset(): void {
    this._tabs.clear();
    this._activeTabId = null;
    this._history = [];
    this.removeAllListeners();
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const browserService = BrowserService.getInstance();
export default browserService;
