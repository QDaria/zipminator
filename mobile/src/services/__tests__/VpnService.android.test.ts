/**
 * VpnService.android.test.ts — Jest tests for the Android VPN service facade.
 *
 * Mocks NativeModules.ZipVPN to isolate the TypeScript validation and
 * bridge logic from the Android native layer.
 */

import { NativeModules } from 'react-native';

// -------------------------------------------------------------------------
// Mock setup — must appear before any imports from the module under test
// -------------------------------------------------------------------------

// Mock the NativeEventEmitter before importing the module
jest.mock('react-native', () => {
  const mockZipVPN = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getStatus: jest.fn(),
    getStatistics: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  return {
    NativeModules: {
      ZipVPN: mockZipVPN,
    },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
      removeAllListeners: jest.fn(),
    })),
  };
});

// -------------------------------------------------------------------------
// Import module under test after mocks are set up
// -------------------------------------------------------------------------

import VpnService, { VpnConfig, VpnState } from '../VpnService.android';

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const VALID_CONFIG: VpnConfig = {
  serverEndpoint: 'vpn.example.com',
  serverPort: 51820,
  serverPublicKey: 'aabbccddeeff00112233445566778899aabbccddeeff001122334455667788aa',
  clientPrivateKey: '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
  tunnelAddress: '10.14.0.2/32',
  dns: ['1.1.1.1', '1.0.0.1'],
  rekeyIntervalMs: 300_000,
};

function getMock() {
  return NativeModules.ZipVPN as jest.Mocked<typeof NativeModules.ZipVPN>;
}

// -------------------------------------------------------------------------
// connect() — validation
// -------------------------------------------------------------------------

describe('VpnService.connect() — config validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMock().connect.mockResolvedValue(undefined);
  });

  test('accepts a fully valid config', async () => {
    await expect(VpnService.connect(VALID_CONFIG)).resolves.toBeUndefined();
    expect(getMock().connect).toHaveBeenCalledTimes(1);
  });

  test('accepts a minimal config (only required fields)', async () => {
    const minimal: VpnConfig = {
      serverEndpoint: 'vpn.minimal.test',
      serverPublicKey: 'a'.repeat(64),
      clientPrivateKey: 'b'.repeat(64),
    };
    await expect(VpnService.connect(minimal)).resolves.toBeUndefined();
  });

  test('rejects empty serverEndpoint', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverEndpoint: '' }),
    ).rejects.toThrow('serverEndpoint');
    expect(getMock().connect).not.toHaveBeenCalled();
  });

  test('rejects whitespace-only serverEndpoint', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverEndpoint: '   ' }),
    ).rejects.toThrow('serverEndpoint');
  });

  test('rejects serverPublicKey with wrong length (32 chars)', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverPublicKey: 'a'.repeat(32) }),
    ).rejects.toThrow('serverPublicKey');
    expect(getMock().connect).not.toHaveBeenCalled();
  });

  test('rejects serverPublicKey with wrong length (128 chars)', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverPublicKey: 'a'.repeat(128) }),
    ).rejects.toThrow('serverPublicKey');
  });

  test('rejects serverPublicKey with non-hex characters', async () => {
    const badKey = 'g'.repeat(64);  // 'g' is not hex
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverPublicKey: badKey }),
    ).rejects.toThrow('serverPublicKey');
  });

  test('rejects clientPrivateKey with wrong length', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, clientPrivateKey: 'f'.repeat(63) }),
    ).rejects.toThrow('clientPrivateKey');
  });

  test('rejects clientPrivateKey with non-hex characters', async () => {
    const badKey = 'z'.repeat(64);
    await expect(
      VpnService.connect({ ...VALID_CONFIG, clientPrivateKey: badKey }),
    ).rejects.toThrow('clientPrivateKey');
  });

  test('rejects serverPort = 0', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverPort: 0 }),
    ).rejects.toThrow('serverPort');
  });

  test('rejects serverPort = 65536', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverPort: 65536 }),
    ).rejects.toThrow('serverPort');
  });

  test('rejects serverPort = -1', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverPort: -1 }),
    ).rejects.toThrow('serverPort');
  });

  test('accepts serverPort = 1', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverPort: 1 }),
    ).resolves.toBeUndefined();
  });

  test('accepts serverPort = 65535', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, serverPort: 65535 }),
    ).resolves.toBeUndefined();
  });

  test('rejects rekeyIntervalMs below 60000', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, rekeyIntervalMs: 59_999 }),
    ).rejects.toThrow('rekeyIntervalMs');
  });

  test('accepts rekeyIntervalMs = 60000', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, rekeyIntervalMs: 60_000 }),
    ).resolves.toBeUndefined();
  });

  test('rejects initialPsk with wrong length', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, initialPsk: 'aa'.repeat(16) }), // 32 chars, not 64
    ).rejects.toThrow('initialPsk');
  });

  test('accepts valid initialPsk', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, initialPsk: '0'.repeat(64) }),
    ).resolves.toBeUndefined();
  });

  test('rejects empty dns array', async () => {
    await expect(
      VpnService.connect({ ...VALID_CONFIG, dns: [] }),
    ).rejects.toThrow('dns');
  });
});

// -------------------------------------------------------------------------
// connect() — native call shape
// -------------------------------------------------------------------------

describe('VpnService.connect() — native call forwarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMock().connect.mockResolvedValue(undefined);
  });

  test('passes serverEndpoint to native module', async () => {
    await VpnService.connect(VALID_CONFIG);
    const call = getMock().connect.mock.calls[0][0] as Record<string, unknown>;
    expect(call.serverEndpoint).toBe('vpn.example.com');
  });

  test('lowercases serverPublicKey', async () => {
    const config: VpnConfig = {
      ...VALID_CONFIG,
      serverPublicKey: 'AABBCCDDEEFF00112233445566778899AABBCCDDEEFF001122334455667788AA',
    };
    await VpnService.connect(config);
    const call = getMock().connect.mock.calls[0][0] as Record<string, unknown>;
    expect(call.serverPublicKey).toBe(config.serverPublicKey.toLowerCase());
  });

  test('lowercases clientPrivateKey', async () => {
    const config: VpnConfig = {
      ...VALID_CONFIG,
      clientPrivateKey: 'FFEEDDCCBBAA99887766554433221100FFEEDDCCBBAA99887766554433221100',
    };
    await VpnService.connect(config);
    const call = getMock().connect.mock.calls[0][0] as Record<string, unknown>;
    expect(call.clientPrivateKey).toBe(config.clientPrivateKey.toLowerCase());
  });

  test('passes optional fields when provided', async () => {
    const config: VpnConfig = {
      ...VALID_CONFIG,
      dns: ['8.8.8.8'],
      rekeyIntervalMs: 120_000,
      initialPsk: '1'.repeat(64),
    };
    await VpnService.connect(config);
    const call = getMock().connect.mock.calls[0][0] as Record<string, unknown>;
    expect(call.dns).toEqual(['8.8.8.8']);
    expect(call.rekeyIntervalMs).toBe(120_000);
    expect(call.initialPsk).toBe('1'.repeat(64));
  });

  test('omits undefined optional fields', async () => {
    const minimal: VpnConfig = {
      serverEndpoint: 'vpn.minimal.test',
      serverPublicKey: 'a'.repeat(64),
      clientPrivateKey: 'b'.repeat(64),
    };
    await VpnService.connect(minimal);
    const call = getMock().connect.mock.calls[0][0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('serverPort');
    expect(call).not.toHaveProperty('dns');
    expect(call).not.toHaveProperty('rekeyIntervalMs');
    expect(call).not.toHaveProperty('initialPsk');
  });
});

// -------------------------------------------------------------------------
// disconnect()
// -------------------------------------------------------------------------

describe('VpnService.disconnect()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMock().disconnect.mockResolvedValue(undefined);
  });

  test('calls native disconnect', async () => {
    await VpnService.disconnect();
    expect(getMock().disconnect).toHaveBeenCalledTimes(1);
  });

  test('resolves to undefined on success', async () => {
    await expect(VpnService.disconnect()).resolves.toBeUndefined();
  });

  test('propagates native errors', async () => {
    getMock().disconnect.mockRejectedValue(new Error('Service not running'));
    await expect(VpnService.disconnect()).rejects.toThrow('Service not running');
  });
});

// -------------------------------------------------------------------------
// getStatus()
// -------------------------------------------------------------------------

describe('VpnService.getStatus()', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns native status', async () => {
    getMock().getStatus.mockResolvedValue({ state: 'CONNECTED' });
    const status = await VpnService.getStatus();
    expect(status.state).toBe('CONNECTED');
  });

  test('returns DISCONNECTED state', async () => {
    getMock().getStatus.mockResolvedValue({ state: 'DISCONNECTED' });
    const status = await VpnService.getStatus();
    expect(status.state).toBe('DISCONNECTED');
  });

  test('returns REKEYING state', async () => {
    getMock().getStatus.mockResolvedValue({ state: 'REKEYING' });
    const status = await VpnService.getStatus();
    expect(status.state).toBe('REKEYING');
  });
});

// -------------------------------------------------------------------------
// getStatistics()
// -------------------------------------------------------------------------

describe('VpnService.getStatistics()', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns all statistics fields', async () => {
    const mockStats = {
      bytesIn: 1024,
      bytesOut: 512,
      connectedSince: 1700000000000,
      uptimeMs: 60000,
      state: 'CONNECTED' as VpnState,
    };
    getMock().getStatistics.mockResolvedValue(mockStats);
    const stats = await VpnService.getStatistics();
    expect(stats.bytesIn).toBe(1024);
    expect(stats.bytesOut).toBe(512);
    expect(stats.connectedSince).toBe(1700000000000);
    expect(stats.uptimeMs).toBe(60000);
    expect(stats.state).toBe('CONNECTED');
  });

  test('returns zero-uptime when disconnected', async () => {
    getMock().getStatistics.mockResolvedValue({
      bytesIn: 0,
      bytesOut: 0,
      connectedSince: 0,
      uptimeMs: 0,
      state: 'DISCONNECTED' as VpnState,
    });
    const stats = await VpnService.getStatistics();
    expect(stats.uptimeMs).toBe(0);
    expect(stats.connectedSince).toBe(0);
  });
});

// -------------------------------------------------------------------------
// onStateChange()
// -------------------------------------------------------------------------

describe('VpnService.onStateChange()', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns an unsubscribe function', () => {
    const unsubscribe = VpnService.onStateChange(() => {});
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  test('multiple listeners can be registered', () => {
    const received1: VpnState[] = [];
    const received2: VpnState[] = [];

    const unsub1 = VpnService.onStateChange((s) => received1.push(s));
    const unsub2 = VpnService.onStateChange((s) => received2.push(s));

    // Both should be registered without error
    expect(typeof unsub1).toBe('function');
    expect(typeof unsub2).toBe('function');

    unsub1();
    unsub2();
  });

  test('unsubscribe removes listener', () => {
    const received: VpnState[] = [];
    const unsub = VpnService.onStateChange((s) => received.push(s));
    unsub();
    // After unsubscribe, the listener set is empty — no error
    expect(received).toHaveLength(0);
  });
});

// -------------------------------------------------------------------------
// Module availability check
// -------------------------------------------------------------------------

describe('NativeModule availability', () => {
  test('ZipVPN native module is available in test environment', () => {
    expect(NativeModules.ZipVPN).toBeDefined();
  });

  test('NativeModule exposes expected methods', () => {
    const mod = NativeModules.ZipVPN;
    expect(typeof mod.connect).toBe('function');
    expect(typeof mod.disconnect).toBe('function');
    expect(typeof mod.getStatus).toBe('function');
    expect(typeof mod.getStatistics).toBe('function');
  });
});
