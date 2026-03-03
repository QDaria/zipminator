/**
 * VpnToggle.tsx
 *
 * Shield icon + on/off toggle for the Q-VPN (PQ-WireGuard) tunnel.
 *
 * States displayed:
 *   Disconnected — grey shield, toggle off
 *   Connecting   — grey shield, animated spinner
 *   Connected    — green shield with pulse, toggle on
 *   Rekeying     — green shield with faster pulse (rekey in progress)
 *   Error        — red shield, error message below toggle
 *
 * The component calls `vpn_connect` / `vpn_disconnect` Tauri commands and
 * listens for `vpn-state-changed` events to stay in sync.
 */

import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

// ── Types ──────────────────────────────────────────────────────────────────────

/** Matches the Rust `vpn::state::VpnState` tagged enum. */
interface VpnStatePayload {
  state: "Disconnected" | "Connecting" | "Connected" | "Rekeying" | "Error";
  detail?: string;
}

/** Matches the Rust `vpn::VpnStatus` snapshot. */
interface VpnStatus {
  state: VpnStatePayload;
  interface: string | null;
  metrics: VpnMetrics | null;
}

interface VpnMetrics {
  uptime_secs: number;
  bytes_sent: number;
  bytes_received: number;
  rekey_count: number;
}

interface VpnToggleProps {
  /** Called after a successful connect or disconnect. */
  onStateChange?: (connected: boolean) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatUptime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Shield SVG ─────────────────────────────────────────────────────────────────

function ShieldIcon({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`w-8 h-8 ${color} ${pulse ? "animate-pulse" : ""}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VpnToggle({ onStateChange }: VpnToggleProps) {
  const [status, setStatus] = useState<VpnStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial status from the VPN manager.
  const fetchStatus = useCallback(async () => {
    try {
      const s = await invoke<VpnStatus>("vpn_get_status");
      setStatus(s);
    } catch {
      // VPN manager not yet initialized — ignore.
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    let unlisten: UnlistenFn | undefined;

    (async () => {
      // Listen for real-time state changes emitted by VpnManager.
      unlisten = await listen<VpnStatePayload>("vpn-state-changed", (event) => {
        setStatus((prev) => ({
          state: event.payload,
          interface: prev?.interface ?? null,
          metrics: prev?.metrics ?? null,
        }));
        const connected = event.payload.state === "Connected" || event.payload.state === "Rekeying";
        onStateChange?.(connected);
      });
    })();

    return () => {
      unlisten?.();
    };
  }, [fetchStatus, onStateChange]);

  // Derive display properties from VPN state.
  const vpnState = status?.state.state ?? "Disconnected";
  const isConnected = vpnState === "Connected" || vpnState === "Rekeying";
  const isConnecting = vpnState === "Connecting";
  const isError = vpnState === "Error";

  const shieldColor = isConnected
    ? "text-green-400"
    : isError
    ? "text-red-400"
    : "text-gray-500";

  const handleToggle = async () => {
    if (busy || isConnecting) return;
    setBusy(true);
    setError(null);
    try {
      if (isConnected) {
        await invoke("vpn_disconnect");
      } else {
        // In a full implementation the config would come from stored settings.
        // This call will fail with a missing-config error until the user has
        // configured the VPN server endpoint via the VPN settings panel.
        await invoke("vpn_connect", {
          request: {
            server_endpoint: "",
            server_public_key_hex: "0".repeat(64),
            client_private_key_hex: "0".repeat(64),
            tunnel_address: "10.14.0.2/32",
            dns: ["1.1.1.1"],
            rekey_interval_secs: 300,
            kill_switch_enabled: true,
          },
        });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
      await fetchStatus();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {/* Shield icon */}
        <div className="relative flex-shrink-0">
          <ShieldIcon color={shieldColor} pulse={isConnected} />
          {isConnecting && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </div>

        {/* Label + toggle */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-white">
                {isConnecting ? "Connecting…" : isConnected ? "VPN Connected" : "VPN Off"}
              </span>
              {vpnState === "Rekeying" && (
                <span className="ml-2 text-xs text-yellow-400">rekeying</span>
              )}
              {status?.interface && (
                <p className="text-xs text-gray-400">{status.interface}</p>
              )}
            </div>

            {/* Toggle switch */}
            <button
              onClick={handleToggle}
              disabled={busy || isConnecting}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                isConnected ? "bg-green-600" : "bg-gray-600"
              }`}
              role="switch"
              aria-checked={isConnected}
              aria-label="Toggle Q-VPN"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  isConnected ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics when connected */}
      {isConnected && status?.metrics && (
        <div className="ml-12 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-400">Uptime</p>
            <p className="text-xs font-mono text-gray-200">
              {formatUptime(status.metrics.uptime_secs)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Sent</p>
            <p className="text-xs font-mono text-gray-200">
              {formatBytes(status.metrics.bytes_sent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Recv</p>
            <p className="text-xs font-mono text-gray-200">
              {formatBytes(status.metrics.bytes_received)}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {isError && status?.state.detail && (
        <p className="ml-12 text-xs text-red-400">{status.state.detail}</p>
      )}
      {error && <p className="ml-12 text-xs text-red-400">{error}</p>}
    </div>
  );
}
