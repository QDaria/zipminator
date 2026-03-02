/**
 * VpnService.android.ts — Android-specific VPN service facade.
 *
 * Uses the ZipVPN NativeModule (ZipVpnModule.kt) to control the Android
 * VpnService. Validates configuration before passing to native code and
 * handles the Android VPN permission dialog transparently.
 *
 * Usage:
 * ```ts
 * import VpnService from './VpnService';  // Platform-specific resolution
 *
 * const handle = await VpnService.connect({
 *   serverEndpoint: 'vpn.example.com',
 *   serverPublicKey: 'aabbcc...',   // 64-char hex (32 bytes, Curve25519)
 *   clientPrivateKey: 'ddeeff...',  // 64-char hex (32 bytes, Curve25519)
 * });
 *
 * const status = await VpnService.getStatus();
 * await VpnService.disconnect();
 * ```
 */

import { NativeEventEmitter, NativeModules } from 'react-native';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export type VpnState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'REKEYING'
  | 'ERROR';

/**
 * Configuration required to establish the PQ-WireGuard tunnel.
 */
export interface VpnConfig {
  /** IP address or hostname of the WireGuard server */
  serverEndpoint: string;

  /** UDP port of the WireGuard server (default: 51820, range: 1–65535) */
  serverPort?: number;

  /**
   * Server's Curve25519 public key as a 64-character lowercase hex string (32 bytes).
   * Example: "8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a"
   */
  serverPublicKey: string;

  /**
   * Client's Curve25519 private key as a 64-character lowercase hex string (32 bytes).
   * Treat this value as a secret; never log it.
   */
  clientPrivateKey: string;

  /** CIDR address assigned to the tunnel interface (default: "10.14.0.2/32") */
  tunnelAddress?: string;

  /** DNS servers to route through the tunnel (default: ["1.1.1.1", "1.0.0.1"]) */
  dns?: string[];

  /**
   * Milliseconds between PQ (Kyber768) rekeys.
   * Minimum: 60000 (1 minute). Default: 300000 (5 minutes).
   */
  rekeyIntervalMs?: number;

  /**
   * Initial WireGuard preshared key as 64-character hex (optional).
   * If omitted, a zero key is used for the first HKDF derivation.
   */
  initialPsk?: string;
}

export interface VpnStatus {
  state: VpnState;
}

export interface VpnStatistics {
  /** Bytes received through the VPN tunnel */
  bytesIn: number;
  /** Bytes sent through the VPN tunnel */
  bytesOut: number;
  /** Unix timestamp (ms) when the connection was established (0 if disconnected) */
  connectedSince: number;
  /** Uptime in milliseconds */
  uptimeMs: number;
  /** Current VPN state */
  state: VpnState;
}

export type VpnStateListener = (state: VpnState) => void;

// -------------------------------------------------------------------------
// Validation helpers
// -------------------------------------------------------------------------

const HEX_64_RE = /^[0-9a-fA-F]{64}$/;

/**
 * Validate a VpnConfig object.
 * @throws Error with a descriptive message if validation fails.
 */
function validateConfig(config: VpnConfig): void {
  if (!config.serverEndpoint || config.serverEndpoint.trim() === '') {
    throw new Error('serverEndpoint is required and must not be empty');
  }

  if (!HEX_64_RE.test(config.serverPublicKey)) {
    throw new Error(
      'serverPublicKey must be a 64-character hex string (32 bytes Curve25519 public key)',
    );
  }

  if (!HEX_64_RE.test(config.clientPrivateKey)) {
    throw new Error(
      'clientPrivateKey must be a 64-character hex string (32 bytes Curve25519 private key)',
    );
  }

  if (config.serverPort !== undefined) {
    if (
      !Number.isInteger(config.serverPort) ||
      config.serverPort < 1 ||
      config.serverPort > 65535
    ) {
      throw new Error(
        `serverPort must be an integer in range 1–65535, got ${config.serverPort}`,
      );
    }
  }

  if (config.rekeyIntervalMs !== undefined) {
    if (config.rekeyIntervalMs < 60_000) {
      throw new Error(
        `rekeyIntervalMs must be >= 60000 (1 minute), got ${config.rekeyIntervalMs}`,
      );
    }
  }

  if (config.initialPsk !== undefined && !HEX_64_RE.test(config.initialPsk)) {
    throw new Error('initialPsk must be a 64-character hex string (32 bytes)');
  }

  if (config.dns !== undefined) {
    if (!Array.isArray(config.dns) || config.dns.length === 0) {
      throw new Error('dns must be a non-empty array of IP address strings');
    }
  }
}

// -------------------------------------------------------------------------
// NativeModule interface (mirrors ZipVpnModule.kt public API)
// -------------------------------------------------------------------------

interface ZipVpnNativeModule {
  connect(config: Record<string, unknown>): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<VpnStatus>;
  getStatistics(): Promise<VpnStatistics>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

function getNativeModule(): ZipVpnNativeModule {
  const mod = NativeModules.ZipVPN as ZipVpnNativeModule | undefined;
  if (!mod) {
    throw new Error(
      'ZipVPN native module not found. Ensure ZipVpnPackage is registered in MainApplication.kt.',
    );
  }
  return mod;
}

// -------------------------------------------------------------------------
// Event emitter singleton
// -------------------------------------------------------------------------

let emitter: NativeEventEmitter | null = null;
const stateListeners: Set<VpnStateListener> = new Set();
let listenerCount = 0;

function getEmitter(): NativeEventEmitter {
  if (!emitter) {
    emitter = new NativeEventEmitter(NativeModules.ZipVPN);
  }
  return emitter;
}

// -------------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------------

/**
 * Establish a PQ-WireGuard VPN connection.
 *
 * On first call, Android will present the system VPN permission dialog.
 * After the user approves, the VPN starts. On subsequent calls (permission
 * already granted), the connection starts immediately.
 *
 * @param config  Validated tunnel configuration.
 * @throws Error  If config is invalid or the native module fails.
 */
async function connect(config: VpnConfig): Promise<void> {
  validateConfig(config);

  const nativeConfig: Record<string, unknown> = {
    serverEndpoint: config.serverEndpoint,
    serverPublicKey: config.serverPublicKey.toLowerCase(),
    clientPrivateKey: config.clientPrivateKey.toLowerCase(),
  };

  if (config.serverPort !== undefined) {
    nativeConfig.serverPort = config.serverPort;
  }
  if (config.tunnelAddress !== undefined) {
    nativeConfig.tunnelAddress = config.tunnelAddress;
  }
  if (config.dns !== undefined) {
    nativeConfig.dns = config.dns;
  }
  if (config.rekeyIntervalMs !== undefined) {
    nativeConfig.rekeyIntervalMs = config.rekeyIntervalMs;
  }
  if (config.initialPsk !== undefined) {
    nativeConfig.initialPsk = config.initialPsk.toLowerCase();
  }

  await getNativeModule().connect(nativeConfig);
}

/**
 * Disconnect the active VPN session and zeroize all key material.
 */
async function disconnect(): Promise<void> {
  await getNativeModule().disconnect();
}

/**
 * Get the current VPN state.
 */
async function getStatus(): Promise<VpnStatus> {
  return getNativeModule().getStatus();
}

/**
 * Get traffic statistics and uptime for the current session.
 */
async function getStatistics(): Promise<VpnStatistics> {
  return getNativeModule().getStatistics();
}

/**
 * Subscribe to VPN state change events.
 *
 * @param listener  Called whenever the VPN state changes.
 * @returns         A function that removes this listener when called.
 */
function onStateChange(listener: VpnStateListener): () => void {
  if (stateListeners.size === 0) {
    getEmitter().addListener('VpnStateChanged', (event: { state: VpnState }) => {
      stateListeners.forEach((l) => l(event.state));
    });
    listenerCount++;
    getNativeModule().addListener('VpnStateChanged');
  }

  stateListeners.add(listener);

  return () => {
    stateListeners.delete(listener);
    if (stateListeners.size === 0 && listenerCount > 0) {
      getNativeModule().removeListeners(listenerCount);
      listenerCount = 0;
    }
  };
}

// -------------------------------------------------------------------------
// Default export — matches iOS counterpart interface
// -------------------------------------------------------------------------

const VpnService = {
  connect,
  disconnect,
  getStatus,
  getStatistics,
  onStateChange,
};

export default VpnService;
