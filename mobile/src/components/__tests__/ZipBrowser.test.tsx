/**
 * ZipBrowser.test.tsx
 *
 * Unit tests for the ZipBrowser component and its sub-components.
 * Uses react-test-renderer (not @testing-library/react-native) to stay
 * compatible with the ts-jest + Node test environment used by the rest of
 * this project's test suite.
 *
 * All React Native primitive components and react-native-webview are mocked
 * so tests run without a simulator.
 */

import React from 'react';
import { create, act } from 'react-test-renderer';

// ---------------------------------------------------------------------------
// Mock react-native (before any component imports)
// ---------------------------------------------------------------------------

const mockWebViewRef = {
  goBack: jest.fn(),
  goForward: jest.fn(),
  reload: jest.fn(),
  stopLoading: jest.fn(),
};

jest.mock('react-native', () => {
  const React = require('react');

  // Minimal stub for each RN component used in ZipBrowser tree
  const stub = (name: string) => {
    const C = (props: Record<string, unknown>) =>
      React.createElement(name, { ...props, testID: props.testID ?? props.accessibilityLabel });
    C.displayName = name;
    return C;
  };

  return {
    View: stub('View'),
    Text: stub('Text'),
    TextInput: stub('TextInput'),
    TouchableOpacity: stub('TouchableOpacity'),
    SafeAreaView: stub('SafeAreaView'),
    ScrollView: stub('ScrollView'),
    ActivityIndicator: stub('ActivityIndicator'),
    Switch: stub('Switch'),
    RefreshControl: stub('RefreshControl'),
    Platform: { OS: 'ios' },
    NativeModules: {},
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn(),
    })),
    EventEmitter: require('events').EventEmitter,
  };
});

// ---------------------------------------------------------------------------
// Mock react-native-webview
// ---------------------------------------------------------------------------

jest.mock('react-native-webview', () => {
  const React = require('react');
  const MockWebView = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<typeof mockWebViewRef>) => {
      React.useImperativeHandle(ref, () => mockWebViewRef);
      return React.createElement('WebView', {
        testID: 'mock-webview',
        source: props.source,
      });
    }
  );
  MockWebView.displayName = 'MockWebView';
  return { WebView: MockWebView };
});

// ---------------------------------------------------------------------------
// Mock BrowserService
// ---------------------------------------------------------------------------

const mockTab = {
  id: 'tab-test-1',
  url: 'https://duckduckgo.com',
  title: 'duckduckgo.com',
  pqcStatus: 'unknown' as const,
};

const mockPqcDetails = {
  level: 'classical' as 'pqc' | 'classical' | 'unknown',
  keyExchange: 'X25519',
  cipher: 'AES-256-GCM',
  issuer: "Let's Encrypt",
  hsts: true,
  certValid: true,
};

const proxyStatusHandlers: Array<(v: boolean) => void> = [];

const mockBrowserService = {
  createTab: jest.fn(() => ({ ...mockTab })),
  navigate: jest.fn((_tabId: string, rawUrl: string) => rawUrl),
  recordHistoryEntry: jest.fn(),
  updateTab: jest.fn(),
  getPqcStatus: jest.fn(() => Promise.resolve({ ...mockPqcDetails })),
  setProxyAvailable: jest.fn(),
  on: jest.fn((event: string, handler: (v: boolean) => void) => {
    if (event === 'proxyStatusChange') proxyStatusHandlers.push(handler);
  }),
  removeListener: jest.fn(),
  tabCount: 1,
  proxy: { host: '127.0.0.1', port: 18443, isAvailable: false },
  reset: jest.fn(),
};

jest.mock('../../services/BrowserService', () => ({
  browserService: mockBrowserService,
  normalizeUrl: jest.requireActual('../../services/BrowserService').normalizeUrl,
  extractDomain: jest.requireActual('../../services/BrowserService').extractDomain,
}));

// ---------------------------------------------------------------------------
// Mock ExpertiseContext
// ---------------------------------------------------------------------------

let mockMode: 'novice' | 'expert' = 'novice';

jest.mock('../../context/ExpertiseContext', () => ({
  useExpertise: () => ({ mode: mockMode, toggleMode: jest.fn(), setMode: jest.fn() }),
}));

// ---------------------------------------------------------------------------
// Import after all mocks
// ---------------------------------------------------------------------------

import ZipBrowser from '../ZipBrowser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively flatten the react-test-renderer tree into a list of nodes
 * so we can assert on rendered output.
 */
function collectNodes(node: unknown, result: unknown[] = []): unknown[] {
  if (!node || typeof node !== 'object') return result;
  result.push(node);
  const children = (node as { children?: unknown[] }).children;
  if (Array.isArray(children)) {
    for (const child of children) {
      collectNodes(child, result);
    }
  }
  return result;
}

function findByTestId(tree: unknown, testId: string): unknown | undefined {
  return collectNodes(tree).find(
    (n) => typeof n === 'object' && (n as { props?: { testID?: string } }).props?.testID === testId
  );
}

function findByAccessibilityLabel(tree: unknown, label: string | RegExp): unknown | undefined {
  return collectNodes(tree).find((n) => {
    if (typeof n !== 'object') return false;
    const al = (n as { props?: { accessibilityLabel?: string } }).props?.accessibilityLabel;
    if (!al) return false;
    if (label instanceof RegExp) return label.test(al);
    return al === label;
  });
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockMode = 'novice';
  proxyStatusHandlers.length = 0;
  mockBrowserService.createTab.mockReturnValue({ ...mockTab });
  mockBrowserService.getPqcStatus.mockResolvedValue({ ...mockPqcDetails });
  mockBrowserService.tabCount = 1;
});

// ---------------------------------------------------------------------------
// Rendering tests
// ---------------------------------------------------------------------------

describe('ZipBrowser — rendering', () => {
  it('renders without throwing', () => {
    expect(() => {
      act(() => { create(<ZipBrowser />); });
    }).not.toThrow();
  });

  it('renders the WebView element', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByTestId(tree, 'mock-webview')).toBeTruthy();
  });

  it('renders address bar with accessibilityLabel', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByAccessibilityLabel(tree, 'Address bar')).toBeTruthy();
  });

  it('renders PQC indicator with Security label', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByAccessibilityLabel(tree, /Security:/i)).toBeTruthy();
  });

  it('renders Go back navigation button', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByAccessibilityLabel(tree, 'Go back')).toBeTruthy();
  });

  it('renders Go forward navigation button', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByAccessibilityLabel(tree, 'Go forward')).toBeTruthy();
  });

  it('renders Refresh page button', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByAccessibilityLabel(tree, 'Refresh page')).toBeTruthy();
  });

  it('renders Go to home page button', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByAccessibilityLabel(tree, 'Go to home page')).toBeTruthy();
  });

  it('renders Open new tab button', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByAccessibilityLabel(tree, /Open new tab/i)).toBeTruthy();
  });

  it('calls browserService.createTab on initial render', () => {
    act(() => { create(<ZipBrowser />); });
    expect(mockBrowserService.createTab).toHaveBeenCalledTimes(1);
  });

  it('does not render PROXY: text in novice mode', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    // Walk tree and check no text node contains "PROXY:"
    const nodes = collectNodes(instance!.toJSON());
    const proxyNode = nodes.find((n) => {
      const children = (n as { children?: unknown[] }).children;
      if (!Array.isArray(children)) return false;
      return children.some((c) => typeof c === 'string' && c.includes('PROXY:'));
    });
    expect(proxyNode).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Expert mode
// ---------------------------------------------------------------------------

describe('ZipBrowser — expert mode', () => {
  beforeEach(() => { mockMode = 'expert'; });

  it('renders expert PQC indicator button in expert mode', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const tree = instance!.toJSON();
    expect(findByAccessibilityLabel(tree, /PQC status:/i)).toBeTruthy();
  });

  it('renders PROXY: text in expert mode footer', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const nodes = collectNodes(instance!.toJSON());
    const proxyNode = nodes.find((n) => {
      const children = (n as { children?: unknown[] }).children;
      if (!Array.isArray(children)) return false;
      return children.some((c) => typeof c === 'string' && c.includes('PROXY:'));
    });
    expect(proxyNode).toBeTruthy();
  });

  it('renders KEM: text in expert mode footer', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    const nodes = collectNodes(instance!.toJSON());
    const kemNode = nodes.find((n) => {
      const children = (n as { children?: unknown[] }).children;
      if (!Array.isArray(children)) return false;
      return children.some((c) => typeof c === 'string' && c.includes('KEM:'));
    });
    expect(kemNode).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Navigation button interactions
// ---------------------------------------------------------------------------

describe('ZipBrowser — navigation interactions', () => {
  it('pressing Home navigates to duckduckgo.com', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });

    const tree = instance!.toJSON();
    const homeBtn = findByAccessibilityLabel(tree, 'Go to home page') as {
      props: { onPress: () => void };
    };
    expect(homeBtn).toBeTruthy();

    act(() => { homeBtn.props.onPress(); });
    expect(mockBrowserService.navigate).toHaveBeenCalledWith(
      expect.any(String),
      'https://duckduckgo.com'
    );
  });

  it('pressing New Tab calls browserService.createTab a second time', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });

    const tree = instance!.toJSON();
    const newTabBtn = findByAccessibilityLabel(tree, /Open new tab/i) as {
      props: { onPress: () => void };
    };
    expect(newTabBtn).toBeTruthy();

    act(() => { newTabBtn.props.onPress(); });
    // createTab called once on init + once on press
    expect(mockBrowserService.createTab).toHaveBeenCalledTimes(2);
  });

  it('pressing Refresh does not throw', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });

    const tree = instance!.toJSON();
    const refreshBtn = findByAccessibilityLabel(tree, 'Refresh page') as {
      props: { onPress: () => void };
    };
    expect(() => act(() => { refreshBtn.props.onPress(); })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// PQC status handling
// ---------------------------------------------------------------------------

describe('ZipBrowser — PQC status', () => {
  it('calls getPqcStatus on mount', async () => {
    await act(async () => { create(<ZipBrowser />); });
    expect(mockBrowserService.getPqcStatus).toHaveBeenCalled();
  });

  it('calls updateTab with pqcStatus after getPqcStatus resolves', async () => {
    mockBrowserService.getPqcStatus.mockResolvedValueOnce({
      level: 'pqc' as 'pqc' | 'classical' | 'unknown',
      keyExchange: 'ML-KEM-768',
      cipher: 'AES-256-GCM',
      issuer: 'ZipProxy CA',
      hsts: true,
      certValid: true,
    });
    await act(async () => { create(<ZipBrowser />); });
    expect(mockBrowserService.updateTab).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ pqcStatus: 'pqc' })
    );
  });

  it('handles getPqcStatus rejection without crashing', async () => {
    mockBrowserService.getPqcStatus.mockRejectedValueOnce(new Error('Proxy unreachable'));
    await expect(
      act(async () => { create(<ZipBrowser />); })
    ).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Event subscriptions
// ---------------------------------------------------------------------------

describe('ZipBrowser — event subscriptions', () => {
  it('subscribes to proxyStatusChange on mount', () => {
    act(() => { create(<ZipBrowser />); });
    expect(mockBrowserService.on).toHaveBeenCalledWith(
      'proxyStatusChange',
      expect.any(Function)
    );
  });

  it('removes proxyStatusChange listener on unmount', () => {
    let instance: ReturnType<typeof create> | null = null;
    act(() => { instance = create(<ZipBrowser />); });
    act(() => { instance!.unmount(); });
    expect(mockBrowserService.removeListener).toHaveBeenCalledWith(
      'proxyStatusChange',
      expect.any(Function)
    );
  });
});
