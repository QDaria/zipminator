import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { VpnState, EntropyStatus, SecurityLevel } from "../types";

interface StatusBarProps {
  security: SecurityLevel;
  loadTimeMs: number | null;
}

export function StatusBar({ security, loadTimeMs }: StatusBarProps) {
  const [vpnState, setVpnState] = useState<VpnState>({
    connected: false,
    server_location: null,
    protocol: null,
    uptime_secs: 0,
  });
  const [entropyStatus, setEntropyStatus] =
    useState<EntropyStatus>("unknown");

  // Poll VPN and entropy status periodically.
  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const vpn = await invoke<VpnState>("get_vpn_state");
        if (!cancelled) setVpnState(vpn);
      } catch {
        // VPN state not available yet.
      }
      try {
        const entropy = await invoke<EntropyStatus>("get_entropy_status");
        if (!cancelled) setEntropyStatus(entropy);
      } catch {
        // Entropy status not available yet.
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Listen for VPN state change events from the embedded-vpn domain.
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    (async () => {
      unlisten = await listen<VpnState>("vpn-state-changed", (event) => {
        setVpnState(event.payload);
      });
    })();

    return () => {
      unlisten?.();
    };
  }, []);

  const vpnLabel = vpnState.connected
    ? `VPN: ${vpnState.server_location ?? "Connected"}`
    : "VPN: Off";

  const vpnClass = vpnState.connected
    ? "status-item status-vpn-connected"
    : "status-item status-vpn-disconnected";

  const pqcLabel =
    security === "pqc"
      ? "PQC TLS"
      : security === "classical"
        ? "TLS"
        : "Not Secure";

  const pqcClass =
    security === "pqc"
      ? "status-item status-pqc-active"
      : security === "classical"
        ? "status-item status-pqc-classical"
        : "status-item status-pqc-none";

  const entropyLabel =
    entropyStatus === "available"
      ? "QRNG: Ready"
      : entropyStatus === "harvesting"
        ? "QRNG: Harvesting"
        : entropyStatus === "depleted"
          ? "QRNG: Depleted"
          : "QRNG: --";

  const entropyClass =
    entropyStatus === "available"
      ? "status-item status-entropy-available"
      : entropyStatus === "harvesting"
        ? "status-item status-entropy-harvesting"
        : "status-item status-entropy-other";

  return (
    <div className="status-bar">
      <div className={vpnClass}>
        <span className="status-dot" />
        {vpnLabel}
        {vpnState.connected && vpnState.protocol && (
          <span className="status-detail"> ({vpnState.protocol})</span>
        )}
      </div>

      <div className={pqcClass}>
        <span className="status-dot" />
        {pqcLabel}
      </div>

      {loadTimeMs !== null && (
        <div className="status-item status-load-time">
          {loadTimeMs}ms
        </div>
      )}

      <div className="status-spacer" />

      <div className={entropyClass}>
        <span className="status-dot" />
        {entropyLabel}
      </div>
    </div>
  );
}
