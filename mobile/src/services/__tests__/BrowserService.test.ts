/**
 * BrowserService.test.ts
 *
 * Unit tests for BrowserService.
 * Tests proxy URL construction, URL normalisation, history management,
 * tab lifecycle, and PQC status (mocked).
 *
 * No React Native native modules are used by BrowserService directly,
 * so no jest.mock('react-native') is needed here.
 */

import {
  BrowserService,
  BrowserServiceError,
  normalizeUrl,
  buildProxiedUrl,
  extractDomain,
} from '../BrowserService';
import type { ProxyConfig } from '../../types/browser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService(): BrowserService {
  const svc = new BrowserService();
  // Reset static tab counter side-effects by using fresh instances
  svc.reset();
  return svc;
}

const availableProxy: ProxyConfig = {
  host: '127.0.0.1',
  port: 18443,
  isAvailable: true,
};

const unavailableProxy: ProxyConfig = {
  host: '127.0.0.1',
  port: 18443,
  isAvailable: false,
};

// ---------------------------------------------------------------------------
// normalizeUrl
// ---------------------------------------------------------------------------

describe('normalizeUrl()', () => {
  it('adds https:// when no scheme present', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('preserves https:// scheme', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('preserves http:// scheme', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('converts search query with spaces to DuckDuckGo URL', () => {
    const result = normalizeUrl('quantum cryptography');
    expect(result).toContain('duckduckgo.com');
    expect(result).toContain('quantum');
  });

  it('returns duckduckgo home for empty string', () => {
    expect(normalizeUrl('')).toBe('https://duckduckgo.com');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
  });
});

// ---------------------------------------------------------------------------
// buildProxiedUrl
// ---------------------------------------------------------------------------

describe('buildProxiedUrl()', () => {
  it('returns the URL unchanged when proxy is unavailable', () => {
    const url = 'https://example.com';
    expect(buildProxiedUrl(url, unavailableProxy)).toBe(url);
  });

  it('returns the URL when proxy is available (MVP pass-through)', () => {
    const url = 'https://example.com';
    // MVP: proxy intercepts at network layer, URL is passed through
    expect(buildProxiedUrl(url, availableProxy)).toBe(url);
  });
});

// ---------------------------------------------------------------------------
// extractDomain
// ---------------------------------------------------------------------------

describe('extractDomain()', () => {
  it('extracts hostname from a full URL', () => {
    expect(extractDomain('https://www.example.com/path?q=1')).toBe('www.example.com');
  });

  it('returns the raw string if URL parsing fails', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url');
  });
});

// ---------------------------------------------------------------------------
// navigate()
// ---------------------------------------------------------------------------

describe('BrowserService.navigate()', () => {
  it('normalises a bare domain and returns a URL', () => {
    const svc = makeService();
    const tab = svc.createTab();
    const result = svc.navigate(tab.id, 'example.com');
    expect(result).toBe('https://example.com');
  });

  it('creates a new tab when tabId is not found', () => {
    const svc = makeService();
    const countBefore = svc.tabCount;
    svc.navigate('nonexistent-tab', 'example.com');
    expect(svc.tabCount).toBeGreaterThan(countBefore);
  });

  it('emits a navigate event with url and proxied', () => {
    const svc = makeService();
    const tab = svc.createTab();
    const events: unknown[] = [];
    svc.on('navigate', (payload) => events.push(payload));
    svc.navigate(tab.id, 'example.com');
    expect(events).toHaveLength(1);
    expect((events[0] as { url: string }).url).toBe('https://example.com');
  });
});

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

describe('BrowserService — history', () => {
  it('starts with empty history', () => {
    const svc = makeService();
    expect(svc.getHistory()).toHaveLength(0);
  });

  it('records a history entry', () => {
    const svc = makeService();
    svc.recordHistoryEntry('https://example.com', 'Example');
    const history = svc.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].url).toBe('https://example.com');
    expect(history[0].title).toBe('Example');
    expect(history[0].visitedAt).toBeInstanceOf(Date);
  });

  it('inserts entries newest-first', () => {
    const svc = makeService();
    svc.recordHistoryEntry('https://first.com', 'First');
    svc.recordHistoryEntry('https://second.com', 'Second');
    const history = svc.getHistory();
    expect(history[0].url).toBe('https://second.com');
    expect(history[1].url).toBe('https://first.com');
  });

  it('clears history and emits historyCleared', () => {
    const svc = makeService();
    svc.recordHistoryEntry('https://example.com', 'Example');
    const events: unknown[] = [];
    svc.on('historyCleared', () => events.push(true));
    svc.clearHistory();
    expect(svc.getHistory()).toHaveLength(0);
    expect(events).toHaveLength(1);
  });

  it('caps history at MAX_HISTORY entries (tested via many inserts)', () => {
    const svc = makeService();
    // Insert 505 entries (over the 500 cap)
    for (let i = 0; i < 505; i++) {
      svc.recordHistoryEntry(`https://site${i}.com`, `Site ${i}`);
    }
    expect(svc.getHistory().length).toBeLessThanOrEqual(500);
  });

  it('uses domain as title when empty title is given', () => {
    const svc = makeService();
    svc.recordHistoryEntry('https://example.com/path', '');
    const history = svc.getHistory();
    expect(history[0].title).toBe('example.com');
  });
});

// ---------------------------------------------------------------------------
// Tab management
// ---------------------------------------------------------------------------

describe('BrowserService — tabs', () => {
  it('creates a tab with the default URL', () => {
    const svc = makeService();
    const tab = svc.createTab();
    expect(tab.id).toBeTruthy();
    expect(tab.url).toBe('https://duckduckgo.com');
    expect(tab.pqcStatus).toBe('unknown');
  });

  it('created tab becomes the active tab', () => {
    const svc = makeService();
    const tab = svc.createTab();
    expect(svc.getActiveTab()?.id).toBe(tab.id);
  });

  it('tabCount increments on createTab', () => {
    const svc = makeService();
    svc.createTab();
    svc.createTab();
    expect(svc.tabCount).toBe(2);
  });

  it('closeTab removes the tab and decrements count', () => {
    const svc = makeService();
    const tab = svc.createTab();
    svc.closeTab(tab.id);
    expect(svc.tabCount).toBe(0);
    expect(svc.getActiveTab()).toBeNull();
  });

  it('closing active tab switches to remaining tab', () => {
    const svc = makeService();
    const tab1 = svc.createTab();
    const tab2 = svc.createTab();
    svc.closeTab(tab2.id);
    expect(svc.getActiveTab()?.id).toBe(tab1.id);
  });

  it('switchTab changes the active tab', () => {
    const svc = makeService();
    const tab1 = svc.createTab();
    const tab2 = svc.createTab();
    svc.switchTab(tab1.id);
    expect(svc.getActiveTab()?.id).toBe(tab1.id);
    svc.switchTab(tab2.id);
    expect(svc.getActiveTab()?.id).toBe(tab2.id);
  });

  it('switchTab throws BrowserServiceError for unknown tab', () => {
    const svc = makeService();
    expect(() => svc.switchTab('ghost-tab')).toThrow(BrowserServiceError);
  });

  it('closeTab is a no-op for unknown tab ID', () => {
    const svc = makeService();
    svc.createTab();
    expect(() => svc.closeTab('ghost-tab')).not.toThrow();
    expect(svc.tabCount).toBe(1);
  });

  it('updateTab merges partial updates', () => {
    const svc = makeService();
    const tab = svc.createTab();
    svc.updateTab(tab.id, { title: 'Updated Title', pqcStatus: 'pqc' });
    const updated = svc.getTabs().find((t) => t.id === tab.id);
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.pqcStatus).toBe('pqc');
  });

  it('emits tabCreated event on createTab', () => {
    const svc = makeService();
    const events: unknown[] = [];
    svc.on('tabCreated', (tab) => events.push(tab));
    svc.createTab();
    expect(events).toHaveLength(1);
  });

  it('emits tabClosed event on closeTab', () => {
    const svc = makeService();
    const tab = svc.createTab();
    const events: string[] = [];
    svc.on('tabClosed', (id: string) => events.push(id));
    svc.closeTab(tab.id);
    expect(events).toContain(tab.id);
  });
});

// ---------------------------------------------------------------------------
// PQC status
// ---------------------------------------------------------------------------

describe('BrowserService.getPqcStatus()', () => {
  it('returns unknown level for http:// URL', async () => {
    const svc = makeService();
    const status = await svc.getPqcStatus('http://example.com');
    expect(status.level).toBe('unknown');
  });

  it('returns classical for https:// URL when proxy is unavailable', async () => {
    const svc = makeService();
    // Proxy starts unavailable by default
    const status = await svc.getPqcStatus('https://example.com');
    expect(status.level).toBe('classical');
  });

  it('returns pqc for https:// URL when proxy is available', async () => {
    const svc = makeService();
    svc.setProxyAvailable(true);
    const status = await svc.getPqcStatus('https://example.com');
    expect(status.level).toBe('pqc');
    expect(status.keyExchange).toBe('ML-KEM-768');
  });

  it('returns HSTS true for https:// URLs', async () => {
    const svc = makeService();
    const status = await svc.getPqcStatus('https://example.com');
    expect(status.hsts).toBe(true);
  });

  it('returns cipher AES-256-GCM for https:// URLs', async () => {
    const svc = makeService();
    const status = await svc.getPqcStatus('https://example.com');
    expect(status.cipher).toBe('AES-256-GCM');
  });
});

// ---------------------------------------------------------------------------
// Proxy availability
// ---------------------------------------------------------------------------

describe('BrowserService — proxy', () => {
  it('proxy starts unavailable', () => {
    const svc = makeService();
    expect(svc.proxy.isAvailable).toBe(false);
  });

  it('setProxyAvailable updates proxy state', () => {
    const svc = makeService();
    svc.setProxyAvailable(true);
    expect(svc.proxy.isAvailable).toBe(true);
  });

  it('setProxyAvailable emits proxyStatusChange event', () => {
    const svc = makeService();
    const events: boolean[] = [];
    svc.on('proxyStatusChange', (v: boolean) => events.push(v));
    svc.setProxyAvailable(true);
    svc.setProxyAvailable(false);
    expect(events).toEqual([true, false]);
  });

  it('proxy host is 127.0.0.1', () => {
    const svc = makeService();
    expect(svc.proxy.host).toBe('127.0.0.1');
  });

  it('proxy port is 18443', () => {
    const svc = makeService();
    expect(svc.proxy.port).toBe(18443);
  });
});

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

describe('BrowserService — singleton', () => {
  it('browserService export is the same instance as getInstance()', () => {
    const { browserService } = require('../BrowserService');
    expect(browserService).toBe(BrowserService.getInstance());
  });
});
