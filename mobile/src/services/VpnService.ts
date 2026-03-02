/**
 * VpnService.ts
 *
 * TypeScript service layer for the PQ-WireGuard VPN.
 * Wraps the `ZipVPNManager` React Native native module and exposes a
 * strongly-typed, event-driven API to the application layer.
 *
 * Architecture:
 *   JavaScript ↔ NativeModules.ZipVPNManager (bridge) ↔ VPNManager.swift
 *               ↔ PacketTunnelProvider.swift (NE extension)
 *               ↔ PQWireGuard.swift + KyberBridge.swift
 *               ↔ Rust ML-KEM-768 (zipminator-core)
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { EventEmitter } from 'events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** VPN state machine states — mirrors VPNState.swift enum. */
export type VpnState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'rekeying'
  | 'error';

/** Configuration passed to `connect()`. All keys are required unless marked optional. */
export interface VpnConfig {
  /** Hostname or IP address of the WireGuard server. */
  serverEndpoint: string;
  /** UDP port of the WireGuard server (typically 51820). */
  serverPort: number;
  /** 32-byte WireGuard Curve25519 server public key, base64-encoded. */
  serverPublicKey: string;
  /** 32-byte WireGuard Curve25519 client private key, base64-encoded. */
  clientPrivateKey: string;
  /** CIDR address for the virtual tunnel interface, e.g. "10.14.0.2/32". */
  tunnelAddress: string;
  /** DNS server addresses to use inside the tunnel. */
  dns: string[];
  /** How often (in seconds) to run the Kyber rekey. Defaults to 300. */
  rekeyIntervalSeconds?: number;
}

/** VPN connection status snapshot. */
export interface VpnStatus {
  state: VpnState;
}

/** Live traffic and session statistics. */
export interface VpnStatistics {
  /** Total bytes received through the tunnel since connection. */
  bytesReceived: number;
  /** Total bytes sent through the tunnel since connection. */
  bytesSent: number;
  /** Round-trip latency to the VPN gateway in milliseconds. */
  latencyMs: number;
  /**
   * Timestamp when the tunnel was established.
   * Undefined when the VPN is not connected.
   */
  connectedSince?: Date;
  /**
   * Timestamp of the most recent successful ML-KEM-768 rekey.
   * Undefined if no rekey has occurred yet in this session.
   */
  lastRekeyAt?: Date;
}

/** Events emitted by `VpnService`. */
export interface VpnServiceEvents {
  /** Emitted whenever the VPN state changes. */
  stateChange: (state: VpnState) => void;
  /** Emitted when an error occurs that did not start from a user action. */
  error: (message: string) => void;
}

// ---------------------------------------------------------------------------
// Native module binding
// ---------------------------------------------------------------------------

interface NativeVPNManager {
  connect(config: Record<string, unknown>): Promise<{ status: string }>;
  disconnect(): Promise<{ status: string }>;
  getStatus(): Promise<{ state: string }>;
  getStatistics(): Promise<{
    bytesReceived: number;
    bytesSent: number;
    latencyMs: number;
    connectedSince?: number;  // Unix epoch ms
    lastRekeyAt?: number;     // Unix epoch ms
  }>;
}

/** Access the native ZipVPNManager module. Throws if not linked. */
function getNativeModule(): NativeVPNManager {
  const mod = NativeModules.ZipVPNManager as NativeVPNManager | undefined;
  if (!mod) {
    throw new VpnServiceError(
      'ZipVPNManager native module is not linked. ' +
      'Ensure the ZipVPN extension target is added to the Xcode project ' +
      'and that you are running on a physical device or supported simulator.'
    );
  }
  return mod;
}

// ---------------------------------------------------------------------------
// VpnServiceError
// ---------------------------------------------------------------------------

export class VpnServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'VpnServiceError';
  }
}

// ---------------------------------------------------------------------------
// VpnService
// ---------------------------------------------------------------------------

/**
 * Singleton service managing the PQ-WireGuard VPN connection.
 *
 * Usage:
 * ```typescript
 * import { vpnService } from './services/VpnService';
 *
 * vpnService.on('stateChange', (state) => console.log('VPN:', state));
 *
 * await vpnService.connect({
 *   serverEndpoint: 'vpn.zipminator.io',
 *   serverPort: 51820,
 *   serverPublicKey: '<base64>',
 *   clientPrivateKey: '<base64>',
 *   tunnelAddress: '10.14.0.2/32',
 *   dns: ['1.1.1.1', '8.8.8.8'],
 * });
 * ```
 */
export class VpnService extends EventEmitter {

  private _state: VpnState = 'disconnected';
  private _nativeEventEmitter?: NativeEventEmitter;
  private _stateChangeSubscription?: ReturnType<NativeEventEmitter['addListener']>;
  private _currentConfig?: VpnConfig;
  private static _instance?: VpnService;

  // ----- Singleton -----

  /** Return the application-wide singleton instance. */
  public static getInstance(): VpnService {
    if (!VpnService._instance) {
      VpnService._instance = new VpnService();
    }
    return VpnService._instance;
  }

  /** @internal - Use getInstance() for production, or `new VpnService()` in tests. */
  public constructor() {
    super();
    this._setupNativeEventListener();
  }

  // ----- Public API -----

  /**
   * Establish a PQ-WireGuard VPN connection.
   *
   * The connection is established in two phases:
   *   1. WireGuard tunnel (Curve25519) negotiated by the iOS NE extension.
   *   2. ML-KEM-768 rekey inside the tunnel → hybrid preshared key applied.
   *
   * @throws {VpnServiceError} If config is invalid or the native module fails.
   */
  public async connect(config: VpnConfig): Promise<void> {
    this._validateConfig(config);

    if (this._state === 'connected' || this._state === 'connecting') {
      // Already connected or connecting — idempotent
      return;
    }

    this._currentConfig = config;
    this._setState('connecting');

    const nativeConfig: Record<string, unknown> = {
      serverEndpoint: config.serverEndpoint,
      serverPort: config.serverPort,
      serverPublicKey: config.serverPublicKey,
      clientPrivateKey: config.clientPrivateKey,
      tunnelAddress: config.tunnelAddress,
      dns: config.dns,
      rekeyIntervalSeconds: config.rekeyIntervalSeconds ?? 300,
    };

    try {
      const result = await getNativeModule().connect(nativeConfig);
      // State will be updated via the native event listener when the tunnel is up.
      // If the native module returns synchronously (simulator), apply the state directly.
      if (result.status === 'connected') {
        this._setState('connected');
      }
    } catch (error) {
      this._setState('error');
      throw new VpnServiceError(
        `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
        'CONNECT_FAILED'
      );
    }
  }

  /**
   * Disconnect the VPN tunnel and zeroize all key material.
   *
   * @throws {VpnServiceError} If the native module returns an error.
   */
  public async disconnect(): Promise<void> {
    if (this._state === 'disconnected') {
      return;  // Already disconnected — idempotent
    }

    try {
      await getNativeModule().disconnect();
      this._setState('disconnected');
      this._currentConfig = undefined;
    } catch (error) {
      // Even if native disconnect fails, reflect disconnected in JS state
      this._setState('disconnected');
      this._currentConfig = undefined;
      throw new VpnServiceError(
        `Disconnect error: ${error instanceof Error ? error.message : String(error)}`,
        'DISCONNECT_FAILED'
      );
    }
  }

  /**
   * Query the current VPN state from the native layer.
   * Returns the JS-cached state if the native module is unavailable.
   */
  public async getStatus(): Promise<VpnStatus> {
    try {
      const raw = await getNativeModule().getStatus();
      const state = raw.state as VpnState;
      this._setState(state);
      return { state };
    } catch {
      return { state: this._state };
    }
  }

  /**
   * Return live tunnel statistics.
   *
   * @returns A `VpnStatistics` object with byte counters and timestamps.
   * @throws {VpnServiceError} If the native module is not available.
   */
  public async getStatistics(): Promise<VpnStatistics> {
    const raw = await getNativeModule().getStatistics();
    return {
      bytesReceived: raw.bytesReceived,
      bytesSent: raw.bytesSent,
      latencyMs: raw.latencyMs,
      connectedSince: raw.connectedSince !== undefined
        ? new Date(raw.connectedSince)
        : undefined,
      lastRekeyAt: raw.lastRekeyAt !== undefined
        ? new Date(raw.lastRekeyAt)
        : undefined,
    };
  }

  /** The current VPN state, cached locally to avoid async latency. */
  public get state(): VpnState {
    return this._state;
  }

  /** Whether the VPN is currently connected. */
  public get isConnected(): boolean {
    return this._state === 'connected';
  }

  // ----- EventEmitter typed helpers -----

  /** Listen for state changes. Returns an unsubscribe function. */
  public onStateChange(handler: (state: VpnState) => void): () => void {
    this.addListener('stateChange', handler);
    return () => this.removeListener('stateChange', handler);
  }

  /** Listen for errors. Returns an unsubscribe function. */
  public onError(handler: (message: string) => void): () => void {
    this.addListener('error', handler);
    return () => this.removeListener('error', handler);
  }

  // ----- Internals -----

  private _setState(newState: VpnState): void {
    if (newState === this._state) return;
    this._state = newState;
    this.emit('stateChange', newState);
  }

  private _validateConfig(config: VpnConfig): void {
    if (!config.serverEndpoint || config.serverEndpoint.trim() === '') {
      throw new VpnServiceError('serverEndpoint is required', 'INVALID_CONFIG');
    }
    if (!Number.isInteger(config.serverPort) || config.serverPort <= 0 || config.serverPort > 65535) {
      throw new VpnServiceError('serverPort must be a valid port number (1-65535)', 'INVALID_CONFIG');
    }
    if (!config.serverPublicKey || config.serverPublicKey.trim() === '') {
      throw new VpnServiceError('serverPublicKey is required', 'INVALID_CONFIG');
    }
    // Validate base64 and 32-byte length
    const pkBytes = _base64ToByteCount(config.serverPublicKey);
    if (pkBytes !== 32) {
      throw new VpnServiceError(
        `serverPublicKey must decode to 32 bytes, got ${pkBytes}`,
        'INVALID_CONFIG'
      );
    }
    if (!config.clientPrivateKey || config.clientPrivateKey.trim() === '') {
      throw new VpnServiceError('clientPrivateKey is required', 'INVALID_CONFIG');
    }
    if (!config.tunnelAddress || !config.tunnelAddress.includes('/')) {
      throw new VpnServiceError('tunnelAddress must be in CIDR format (e.g. 10.14.0.2/32)', 'INVALID_CONFIG');
    }
    if (!Array.isArray(config.dns) || config.dns.length === 0) {
      throw new VpnServiceError('dns must be a non-empty array of IP addresses', 'INVALID_CONFIG');
    }
    const rekey = config.rekeyIntervalSeconds ?? 300;
    if (rekey < 60 || rekey > 3600) {
      throw new VpnServiceError(
        'rekeyIntervalSeconds must be between 60 and 3600',
        'INVALID_CONFIG'
      );
    }
  }

  /**
   * Subscribe to the `ZipVPNStateChange` event emitted by the native module
   * so the JS state stays in sync with the extension process.
   */
  private _setupNativeEventListener(): void {
    // Only set up native event emitter on iOS where the module exists
    if (Platform.OS !== 'ios') return;

    try {
      const mod = NativeModules.ZipVPNManager;
      if (!mod) return;

      this._nativeEventEmitter = new NativeEventEmitter(mod);
      this._stateChangeSubscription = this._nativeEventEmitter.addListener(
        'ZipVPNStateChange',
        (event: { state: string }) => {
          const state = event.state as VpnState;
          this._setState(state);
        }
      );
    } catch {
      // Native module not available (e.g., running in Jest without mock)
    }
  }

  /** Clean up native event subscriptions. Call when the service is no longer needed. */
  public destroy(): void {
    this._stateChangeSubscription?.remove();
    this._nativeEventEmitter = undefined;
    this.removeAllListeners();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode a base64 string and return the byte count of the decoded data.
 * Returns 0 for invalid base64.
 */
function _base64ToByteCount(b64: string): number {
  try {
    // Strip padding to compute raw length
    const stripped = b64.replace(/=+$/, '');
    // Each base64 character represents 6 bits; 4 chars = 3 bytes
    const remainder = stripped.length % 4;
    const byteCount = Math.floor(stripped.length * 3 / 4)
      - (remainder === 2 ? 1 : 0)  // 2 trailing chars = 1 byte
      - (remainder === 3 ? 0 : 0);
    return byteCount;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Application-wide VpnService singleton. */
export const vpnService = VpnService.getInstance();

export default vpnService;
