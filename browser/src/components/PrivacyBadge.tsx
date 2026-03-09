/**
 * PrivacyBadge.tsx
 *
 * Small shield icon shown in the browser status bar.
 *
 * Color semantics:
 *   Green  — all protections active (VPN + PQC proxy + fingerprint resistance)
 *   Yellow — one or more non-critical protections disabled
 *   Red    — critical protection missing (no VPN or no PQC proxy)
 *
 * Clicking the badge opens a compact popover with the current page's privacy
 * status.  Pressing Escape or clicking outside closes the popover.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BadgeStatus {
  /** Overall privacy score 0–100. */
  score: number;
  vpn_active: boolean;
  kill_switch_active: boolean;
  pqc_active: boolean;
  fingerprint_resistance: boolean;
  cookie_rotation: boolean;
  telemetry_blocking: boolean;
  blocked_count_this_page: number;
  current_domain: string;
  entropy_source: "Quantum" | "Fallback";
}

type BadgeColor = "green" | "yellow" | "red";

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeColor(status: BadgeStatus): BadgeColor {
  // Red: missing critical protections.
  if (!status.vpn_active || !status.pqc_active) return "red";
  // Yellow: some protections disabled.
  if (!status.fingerprint_resistance || !status.cookie_rotation || !status.telemetry_blocking) {
    return "yellow";
  }
  return "green";
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
};

const BG_CLASSES: Record<BadgeColor, string> = {
  green: "border-green-700 bg-green-950",
  yellow: "border-yellow-700 bg-yellow-950",
  red: "border-red-700 bg-red-950",
};

// ── Shield SVG ─────────────────────────────────────────────────────────────────

function ShieldIcon({ color }: { color: BadgeColor }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`w-5 h-5 ${COLOR_CLASSES[color]}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 1.5a.75.75 0 01.64.358l1.432 2.359A21.8 21.8 0 0020.07 5.6l.48.168a.75.75 0 01.45.917L20.07 9.26a22.13 22.13 0 01-.15 9.578l-.072.261a.75.75 0 01-.555.536l-.456.091a21.867 21.867 0 01-6.838.003l-.454-.09a.75.75 0 01-.555-.537l-.073-.26a22.133 22.133 0 01-.15-9.579l-.93-2.575a.75.75 0 01.45-.917l.48-.168a21.8 21.8 0 005.999-1.383L11.36 1.858A.75.75 0 0112 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── Status row ─────────────────────────────────────────────────────────────────

function StatusRow({
  label,
  active,
  value,
}: {
  label: string;
  active: boolean;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {value && <span className="text-xs text-gray-300">{value}</span>}
        <div
          className={`w-2 h-2 rounded-full ${
            active ? "bg-green-400" : "bg-red-400"
          }`}
        />
      </div>
    </div>
  );
}

// ── Popover ───────────────────────────────────────────────────────────────────

function BadgePopover({
  status,
  color,
  onClose,
}: {
  status: BadgeStatus;
  color: BadgeColor;
  onClose: () => void;
}) {
  const grade =
    status.score >= 90
      ? "A"
      : status.score >= 75
      ? "B"
      : status.score >= 60
      ? "C"
      : status.score >= 40
      ? "D"
      : "F";

  const messages: Record<BadgeColor, string> = {
    green: "All protections active",
    yellow: "Some protections disabled",
    red: "Critical protection missing",
  };

  return (
    <div
      className={`absolute bottom-8 right-0 w-72 rounded-xl border shadow-2xl p-4 ${BG_CLASSES[color]} z-50`}
      role="dialog"
      aria-label="Privacy status"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldIcon color={color} />
          <span className={`text-sm font-medium ${COLOR_CLASSES[color]}`}>
            {messages[color]}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-xs"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Current domain */}
      {status.current_domain && (
        <div className="text-xs text-gray-400 mb-3 truncate">
          {status.current_domain}
        </div>
      )}

      {/* Score */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-2xl font-bold ${COLOR_CLASSES[color]}`}>
          {grade}
        </div>
        <div className="flex-1">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${
                color === "green"
                  ? "bg-green-500"
                  : color === "yellow"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${status.score}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Score {status.score}/100</p>
        </div>
      </div>

      {/* Status rows */}
      <div className="border-t border-gray-700 pt-2 divide-y divide-gray-800">
        <StatusRow label="VPN Tunnel" active={status.vpn_active} />
        <StatusRow label="Kill Switch" active={status.kill_switch_active} />
        <StatusRow label="PQC Proxy" active={status.pqc_active} />
        <StatusRow label="Fingerprint Guard" active={status.fingerprint_resistance} />
        <StatusRow label="Cookie Rotation" active={status.cookie_rotation} />
        <StatusRow label="Tracker Blocker" active={status.telemetry_blocking} />
        <StatusRow
          label="Entropy Source"
          active={status.entropy_source === "Quantum"}
          value={status.entropy_source === "Quantum" ? "Quantum" : "OS CSPRNG"}
        />
      </div>

      {/* Blocked count */}
      <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-400">Blocked this page</span>
        <span className="text-xs text-green-400 font-medium">
          {status.blocked_count_this_page} trackers
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PrivacyBadge() {
  const [status, setStatus] = useState<BadgeStatus | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await invoke<BadgeStatus>("privacy_get_badge_status");
      setStatus(s);
    } catch {
      // Backend not ready yet; keep previous status.
    }
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let interval: ReturnType<typeof setInterval>;

    (async () => {
      await fetchStatus();

      // Update on audit events.
      unlisten = await listen("privacy-audit-complete", () => {
        fetchStatus();
      });

      // Poll every 5 seconds for badge updates.
      interval = setInterval(fetchStatus, 5000);
    })();

    return () => {
      unlisten?.();
      clearInterval(interval);
    };
  }, [fetchStatus]);

  // Close popover on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  const color: BadgeColor = status ? computeColor(status) : "red";

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-700 transition-colors ${
          open ? "bg-gray-700" : ""
        }`}
        title="Privacy status"
        aria-label={`Privacy status: ${color}`}
        aria-expanded={open}
      >
        <ShieldIcon color={color} />
        {status && (
          <span className={`text-xs font-medium ${COLOR_CLASSES[color]}`}>
            {status.blocked_count_this_page > 0
              ? `${status.blocked_count_this_page} blocked`
              : color === "green"
              ? "Protected"
              : color === "yellow"
              ? "Partial"
              : "At Risk"}
          </span>
        )}
      </button>

      {open && status && (
        <BadgePopover
          status={status}
          color={color}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
