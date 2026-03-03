/**
 * PrivacyDashboard.tsx
 *
 * Overview panel shown in browser settings. Displays the current status of
 * every privacy protection and provides toggle controls.  Also shows the
 * most recent audit report, entropy pool status, and blocked tracker count.
 */

import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import VpnToggle from "./VpnToggle";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuditReport {
  timestamp: number;
  total_connections: number;
  pqc_connections: number;
  classical_connections: number;
  blocked_trackers: number;
  vpn_active: boolean;
  kill_switch_active: boolean;
  entropy_source: "Quantum" | "Fallback";
  violations: AuditViolation[];
  privacy_score: number;
}

interface AuditViolation {
  kind: string;
  description: string;
  destination: string | null;
  timestamp: number;
}

interface PrivacyStatus {
  fingerprint_resistance: boolean;
  cookie_rotation: boolean;
  telemetry_blocking: boolean;
  strict_pqc_mode: boolean;
  entropy_pool_bytes: number;
  entropy_source: "Quantum" | "Fallback";
  session_token: string;
  session_rotation_count: number;
  blocked_tracker_total: number;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProtectionRow({
  label,
  description,
  enabled,
  onToggle,
  critical = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  critical?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{label}</span>
          {critical && (
            <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">
              critical
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          enabled ? "bg-indigo-600" : "bg-gray-600"
        }`}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const grade =
    score >= 90
      ? "A"
      : score >= 75
      ? "B"
      : score >= 60
      ? "C"
      : score >= 40
      ? "D"
      : "F";

  const color =
    score >= 90
      ? "text-green-400"
      : score >= 75
      ? "text-blue-400"
      : score >= 60
      ? "text-yellow-400"
      : score >= 40
      ? "text-orange-400"
      : "text-red-400";

  const barColor =
    score >= 90
      ? "bg-green-500"
      : score >= 75
      ? "bg-blue-500"
      : score >= 60
      ? "bg-yellow-500"
      : score >= 40
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-4">
      <div className={`text-4xl font-bold ${color}`}>{grade}</div>
      <div className="flex-1">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Privacy Score</span>
          <span className={color}>{score}/100</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function EntropyStatus({
  source,
  poolBytes,
}: {
  source: "Quantum" | "Fallback";
  poolBytes: number;
}) {
  const isQuantum = source === "Quantum";
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          isQuantum ? "bg-green-400" : "bg-yellow-400"
        }`}
      />
      <div>
        <span className="text-sm font-medium text-white">
          {isQuantum ? "Quantum Entropy" : "OS CSPRNG (Fallback)"}
        </span>
        {isQuantum && (
          <span className="text-xs text-gray-400 ml-2">
            {(poolBytes / 1024).toFixed(0)} KB pool
          </span>
        )}
      </div>
    </div>
  );
}

function ViolationList({ violations }: { violations: AuditViolation[] }) {
  if (violations.length === 0) {
    return (
      <p className="text-sm text-green-400">No violations detected</p>
    );
  }

  return (
    <ul className="space-y-1">
      {violations.map((v, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="text-red-400 mt-0.5">!</span>
          <div>
            <span className="text-red-300">{v.kind}:</span>{" "}
            <span className="text-gray-300">{v.description}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PrivacyDashboard() {
  const [status, setStatus] = useState<PrivacyStatus | null>(null);
  const [latestReport, setLatestReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAudit, setRunningAudit] = useState(false);
  const [alwaysOnVpn, setAlwaysOnVpn] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const s = await invoke<PrivacyStatus>("privacy_get_status");
      setStatus(s);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const fetchLatestReport = useCallback(async () => {
    try {
      const r = await invoke<AuditReport | null>("privacy_get_latest_audit");
      setLatestReport(r);
    } catch (e) {
      console.error("Failed to fetch audit report:", e);
    }
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    (async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchLatestReport()]);
      setLoading(false);

      // Listen for audit-complete events from Tauri.
      unlisten = await listen<AuditReport>("privacy-audit-complete", (event) => {
        setLatestReport(event.payload);
      });
    })();

    return () => {
      unlisten?.();
    };
  }, [fetchStatus, fetchLatestReport]);

  // ── Actions ────────────────────────────────────────────────────────────

  const toggleProtection = async (name: string, enabled: boolean) => {
    try {
      await invoke("privacy_toggle_protection", { name, enabled });
      await fetchStatus();
    } catch (e) {
      setError(String(e));
    }
  };

  const runAudit = async () => {
    setRunningAudit(true);
    try {
      const report = await invoke<AuditReport>("privacy_run_audit");
      setLatestReport(report);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunningAudit(false);
    }
  };

  const rotateSession = async () => {
    try {
      await invoke("privacy_rotate_session");
      await fetchStatus();
    } catch (e) {
      setError(String(e));
    }
  };

  const toggleAlwaysOnVpn = async (enabled: boolean) => {
    try {
      await invoke("vpn_set_always_on", { enabled });
      setAlwaysOnVpn(enabled);
    } catch (e) {
      setError(String(e));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading privacy status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchStatus}
          className="mt-2 text-sm text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Privacy Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">
          All privacy protections run locally. No data is sent to ZipBrowser
          servers.
        </p>
      </div>

      {/* Privacy score */}
      {latestReport && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-4">
          <ScoreMeter score={latestReport.privacy_score} />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-400">
                {latestReport.pqc_connections}
              </div>
              <div className="text-xs text-gray-400">PQC connections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {latestReport.blocked_trackers}
              </div>
              <div className="text-xs text-gray-400">Trackers blocked</div>
            </div>
            <div>
              <div
                className={`text-2xl font-bold ${
                  latestReport.violations.length > 0
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {latestReport.violations.length}
              </div>
              <div className="text-xs text-gray-400">Violations</div>
            </div>
          </div>
        </div>
      )}

      {/* Entropy status */}
      {status && (
        <EntropyStatus
          source={status.entropy_source}
          poolBytes={status.entropy_pool_bytes}
        />
      )}

      {/* Q-VPN section */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="font-medium text-gray-200 mb-4">Q-VPN (PQ-WireGuard)</h3>
        <VpnToggle />
        {/* Always-on VPN toggle */}
        <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-white">Always-on VPN</span>
            <p className="text-xs text-gray-400 mt-0.5">
              Auto-connect the VPN tunnel every time ZipBrowser launches.
            </p>
          </div>
          <button
            onClick={() => toggleAlwaysOnVpn(!alwaysOnVpn)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
              alwaysOnVpn ? "bg-green-600" : "bg-gray-600"
            }`}
            role="switch"
            aria-checked={alwaysOnVpn}
            aria-label="Toggle always-on VPN"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                alwaysOnVpn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Protection toggles */}
      {status && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium text-gray-200 mb-3">Protections</h3>
          <ProtectionRow
            label="Fingerprint Resistance"
            description="Adds QRNG noise to Canvas, WebGL, and AudioContext APIs to defeat tracking."
            enabled={status.fingerprint_resistance}
            onToggle={(v) => toggleProtection("fingerprint_resistance", v)}
          />
          <ProtectionRow
            label="Cookie Rotation"
            description="Automatically rotates third-party cookies every 30 minutes."
            enabled={status.cookie_rotation}
            onToggle={(v) => toggleProtection("cookie_rotation", v)}
          />
          <ProtectionRow
            label="Telemetry Blocking"
            description="Blocks known tracking domains and common tracker URL patterns."
            enabled={status.telemetry_blocking}
            onToggle={(v) => toggleProtection("telemetry_blocking", v)}
          />
          <ProtectionRow
            label="Strict PQC Mode"
            description="Refuse all connections that cannot negotiate post-quantum key exchange."
            enabled={status.strict_pqc_mode}
            onToggle={(v) => toggleProtection("strict_pqc_mode", v)}
            critical
          />
        </div>
      )}

      {/* Audit violations */}
      {latestReport && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium text-gray-200 mb-3">
            Latest Audit Violations
          </h3>
          <ViolationList violations={latestReport.violations} />
          <p className="text-xs text-gray-500 mt-3">
            Audit at{" "}
            {new Date(latestReport.timestamp * 1000).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Session info */}
      {status && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium text-gray-200 mb-3">Session</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Token</span>
              <span className="font-mono text-xs text-gray-300 truncate max-w-xs">
                {status.session_token.slice(0, 16)}…
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rotations (this session)</span>
              <span className="text-gray-300">
                {status.session_rotation_count}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Trackers blocked (total)</span>
              <span className="text-green-400">
                {status.blocked_tracker_total}
              </span>
            </div>
          </div>
          <button
            onClick={rotateSession}
            className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 underline"
          >
            Rotate session token now
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={runAudit}
          disabled={runningAudit}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {runningAudit ? "Running audit..." : "Run Privacy Audit"}
        </button>
        <button
          onClick={fetchStatus}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
