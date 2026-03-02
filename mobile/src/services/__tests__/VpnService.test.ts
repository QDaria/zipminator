/**
 * VpnService.test.ts
 *
 * Unit tests for the TypeScript VpnService.
 * The React Native native module is mocked so tests run in Node / Jest
 * without requiring a physical device or simulator.
 */

import { NativeModules } from 'react-native';
import { VpnService, VpnServiceError, vpnService } from '../VpnService';
import type { VpnConfig, VpnState } from '../VpnService';

// ---------------------------------------------------------------------------
// Mock react-native
// ---------------------------------------------------------------------------

jest.mock('react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const EventEmitter = require('events').EventEmitter;
  return {
    NativeModules: {
      ZipVPNManager: {
        connect: jest.fn(),
        disconnect: jest.fn(),
        getStatus: jest.fn(),
        getStatistics: jest.fn(),
      },
    },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
      removeAllListeners: jest.fn(),
    })),
    Platform: {
      OS: 'ios',
    },
    EventEmitter,
  };
});

// ---------------------------------------------------------------------------
// Typed references to mock functions
// ---------------------------------------------------------------------------

// After jest.mock hoisting, NativeModules.ZipVPNManager contains jest.fn() mocks.
// We cast for convenience in tests.
const getMock = () => NativeModules.ZipVPNManager as {
  connect: jest.MockedFunction<(c: Record<string, unknown>) => Promise<{ status: string }>>;
  disconnect: jest.MockedFunction<() => Promise<{ status: string }>>;
  getStatus: jest.MockedFunction<() => Promise<{ state: string }>>;
  getStatistics: jest.MockedFunction<() => Promise<{
    bytesReceived: number;
    bytesSent: number;
    latencyMs: number;
    connectedSince?: number;
    lastRekeyAt?: number;
  }>>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeValidConfig(overrides: Partial<VpnConfig> = {}): VpnConfig {
  return {
    serverEndpoint: 'vpn.zipminator.io',
    serverPort: 51820,
    // 32 bytes of 0xAB encoded as base64
    serverPublicKey: Buffer.alloc(32, 0xab).toString('base64'),
    clientPrivateKey: Buffer.alloc(32, 0xcd).toString('base64'),
    tunnelAddress: '10.14.0.2/32',
    dns: ['1.1.1.1', '8.8.8.8'],
    rekeyIntervalSeconds: 300,
    ...overrides,
  };
}

/** Create a fresh VpnService instance to bypass the singleton for test isolation. */
function makeService(): VpnService {
  return new (VpnService as unknown as { new(): VpnService })();
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  const m = getMock();
  m.connect.mockResolvedValue({ status: 'connected' });
  m.disconnect.mockResolvedValue({ status: 'disconnected' });
  m.getStatus.mockResolvedValue({ state: 'connected' });
  m.getStatistics.mockResolvedValue({
    bytesReceived: 1024,
    bytesSent: 512,
    latencyMs: 12.5,
    connectedSince: Date.now() - 60_000,
    lastRekeyAt: Date.now() - 5_000,
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('VpnService — initial state', () => {
  it('starts in disconnected state', () => {
    const service = makeService();
    expect(service.state).toBe('disconnected');
  });

  it('isConnected returns false initially', () => {
    const service = makeService();
    expect(service.isConnected).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// connect()
// ---------------------------------------------------------------------------

describe('VpnService.connect()', () => {
  it('calls native connect with the full config', async () => {
    const service = makeService();
    const config = makeValidConfig();
    await service.connect(config);

    const m = getMock();
    expect(m.connect).toHaveBeenCalledTimes(1);
    const calledWith = m.connect.mock.calls[0][0] as Record<string, unknown>;
    expect(calledWith.serverEndpoint).toBe('vpn.zipminator.io');
    expect(calledWith.serverPort).toBe(51820);
    expect(calledWith.rekeyIntervalSeconds).toBe(300);
  });

  it('sets state to connected after successful connect', async () => {
    const service = makeService();
    await service.connect(makeValidConfig());
    expect(service.state).toBe('connected');
  });

  it('emits stateChange events: connecting then connected', async () => {
    const service = makeService();
    const states: VpnState[] = [];
    service.on('stateChange', (s: VpnState) => states.push(s));

    await service.connect(makeValidConfig());
    expect(states).toContain('connecting');
    expect(states[states.length - 1]).toBe('connected');
  });

  it('sets state to error when native connect rejects', async () => {
    getMock().connect.mockRejectedValueOnce(new Error('Network unreachable'));
    const service = makeService();
    await expect(service.connect(makeValidConfig())).rejects.toBeInstanceOf(VpnServiceError);
    expect(service.state).toBe('error');
  });

  it('is idempotent when already connected', async () => {
    const service = makeService();
    await service.connect(makeValidConfig());
    await service.connect(makeValidConfig());  // Second call — should be no-op
    expect(getMock().connect).toHaveBeenCalledTimes(1);
  });

  it('uses default rekeyIntervalSeconds of 300 when not specified', async () => {
    const service = makeService();
    const config = makeValidConfig();
    delete (config as Partial<VpnConfig>).rekeyIntervalSeconds;
    await service.connect(config);
    const calledWith = getMock().connect.mock.calls[0][0] as Record<string, unknown>;
    expect(calledWith.rekeyIntervalSeconds).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// disconnect()
// ---------------------------------------------------------------------------

describe('VpnService.disconnect()', () => {
  it('calls native disconnect', async () => {
    const service = makeService();
    await service.connect(makeValidConfig());
    await service.disconnect();
    expect(getMock().disconnect).toHaveBeenCalledTimes(1);
  });

  it('sets state to disconnected after disconnect', async () => {
    const service = makeService();
    await service.connect(makeValidConfig());
    await service.disconnect();
    expect(service.state).toBe('disconnected');
  });

  it('emits stateChange disconnected event', async () => {
    const service = makeService();
    await service.connect(makeValidConfig());
    const states: VpnState[] = [];
    service.on('stateChange', (s: VpnState) => states.push(s));
    await service.disconnect();
    expect(states).toContain('disconnected');
  });

  it('is idempotent when already disconnected', async () => {
    const service = makeService();
    await service.disconnect();
    expect(getMock().disconnect).not.toHaveBeenCalled();
  });

  it('transitions to disconnected even when native module rejects', async () => {
    getMock().disconnect.mockRejectedValueOnce(new Error('Extension crashed'));
    const service = makeService();
    await service.connect(makeValidConfig());
    await expect(service.disconnect()).rejects.toBeInstanceOf(VpnServiceError);
    expect(service.state).toBe('disconnected');
  });
});

// ---------------------------------------------------------------------------
// getStatus()
// ---------------------------------------------------------------------------

describe('VpnService.getStatus()', () => {
  it('returns connected state after connecting', async () => {
    const service = makeService();
    await service.connect(makeValidConfig());
    const status = await service.getStatus();
    expect(status.state).toBe('connected');
  });

  it('returns cached state when native module fails', async () => {
    getMock().getStatus.mockRejectedValueOnce(new Error('Bridge error'));
    const service = makeService();
    const status = await service.getStatus();
    expect(status.state).toBe('disconnected');  // falls back to cached state
  });
});

// ---------------------------------------------------------------------------
// getStatistics()
// ---------------------------------------------------------------------------

describe('VpnService.getStatistics()', () => {
  it('returns numeric byte counters', async () => {
    const service = makeService();
    const stats = await service.getStatistics();
    expect(stats.bytesReceived).toBe(1024);
    expect(stats.bytesSent).toBe(512);
    expect(stats.latencyMs).toBe(12.5);
  });

  it('converts connectedSince epoch ms to Date', async () => {
    const service = makeService();
    const stats = await service.getStatistics();
    expect(stats.connectedSince).toBeInstanceOf(Date);
  });

  it('converts lastRekeyAt epoch ms to Date', async () => {
    const service = makeService();
    const stats = await service.getStatistics();
    expect(stats.lastRekeyAt).toBeInstanceOf(Date);
  });

  it('returns undefined connectedSince when not in response', async () => {
    getMock().getStatistics.mockResolvedValueOnce({
      bytesReceived: 0,
      bytesSent: 0,
      latencyMs: 0,
    });
    const service = makeService();
    const stats = await service.getStatistics();
    expect(stats.connectedSince).toBeUndefined();
    expect(stats.lastRekeyAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Config validation
// ---------------------------------------------------------------------------

describe('VpnService — config validation', () => {
  it('throws VpnServiceError on empty serverEndpoint', async () => {
    const service = makeService();
    await expect(service.connect(makeValidConfig({ serverEndpoint: '' }))).rejects.toBeInstanceOf(
      VpnServiceError
    );
  });

  it('throws on invalid serverPort (0)', async () => {
    const service = makeService();
    await expect(service.connect(makeValidConfig({ serverPort: 0 }))).rejects.toBeInstanceOf(
      VpnServiceError
    );
  });

  it('throws on invalid serverPort (65536)', async () => {
    const service = makeService();
    await expect(service.connect(makeValidConfig({ serverPort: 65536 }))).rejects.toBeInstanceOf(
      VpnServiceError
    );
  });

  it('throws when serverPublicKey decodes to wrong byte length', async () => {
    const service = makeService();
    const shortKey = Buffer.alloc(16, 0xaa).toString('base64');  // 16 bytes, not 32
    await expect(service.connect(makeValidConfig({ serverPublicKey: shortKey }))).rejects.toBeInstanceOf(
      VpnServiceError
    );
  });

  it('throws on missing CIDR slash in tunnelAddress', async () => {
    const service = makeService();
    await expect(
      service.connect(makeValidConfig({ tunnelAddress: '10.14.0.2' }))
    ).rejects.toBeInstanceOf(VpnServiceError);
  });

  it('throws on empty dns array', async () => {
    const service = makeService();
    await expect(service.connect(makeValidConfig({ dns: [] }))).rejects.toBeInstanceOf(
      VpnServiceError
    );
  });

  it('throws when rekeyIntervalSeconds is below minimum (59)', async () => {
    const service = makeService();
    await expect(
      service.connect(makeValidConfig({ rekeyIntervalSeconds: 59 }))
    ).rejects.toBeInstanceOf(VpnServiceError);
  });

  it('throws when rekeyIntervalSeconds exceeds maximum (3601)', async () => {
    const service = makeService();
    await expect(
      service.connect(makeValidConfig({ rekeyIntervalSeconds: 3601 }))
    ).rejects.toBeInstanceOf(VpnServiceError);
  });

  it('accepts valid config without throwing', async () => {
    const service = makeService();
    await expect(service.connect(makeValidConfig())).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Event listener helpers
// ---------------------------------------------------------------------------

describe('VpnService — event listener helpers', () => {
  it('onStateChange returns an unsubscribe function that stops notifications', async () => {
    const service = makeService();
    const received: VpnState[] = [];
    const unsubscribe = service.onStateChange((s) => received.push(s));

    await service.connect(makeValidConfig());
    unsubscribe();

    await service.disconnect();
    // Disconnect emits 'disconnected' — but we unsubscribed, so it must not appear
    expect(received).not.toContain('disconnected');
  });

  it('onError handler receives error messages', () => {
    const service = makeService();
    const errors: string[] = [];
    service.onError((msg) => errors.push(msg));
    service.emit('error', 'test error message');
    expect(errors).toEqual(['test error message']);
  });
});

// ---------------------------------------------------------------------------
// isConnected
// ---------------------------------------------------------------------------

describe('VpnService.isConnected', () => {
  it('is false before connecting', () => {
    const service = makeService();
    expect(service.isConnected).toBe(false);
  });

  it('is true after successful connect', async () => {
    const service = makeService();
    await service.connect(makeValidConfig());
    expect(service.isConnected).toBe(true);
  });

  it('is false after disconnect', async () => {
    const service = makeService();
    await service.connect(makeValidConfig());
    await service.disconnect();
    expect(service.isConnected).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

describe('VpnService — singleton', () => {
  it('vpnService export is the same instance as getInstance()', () => {
    expect(vpnService).toBe(VpnService.getInstance());
  });
});
