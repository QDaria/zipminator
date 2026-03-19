/**
 * FileVault.tsx
 *
 * Pillar 1: Quantum Vault — Secure file self-destruct UI.
 *
 * Allows users to select a file and trigger DoD 5220.22-M 3-pass secure
 * deletion via the Tauri backend. The file is overwritten with zeros, ones,
 * and cryptographic random data before being deleted from disk.
 */

import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SelfDestructResult {
  path: string;
  passes: number;
  original_size: number;
  verified_deleted: boolean;
}

type DestroyState = "idle" | "confirming" | "destroying" | "done" | "error";

// ── Component ──────────────────────────────────────────────────────────────────

export default function FileVault() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [state, setState] = useState<DestroyState>("idle");
  const [result, setResult] = useState<SelfDestructResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        title: "Select file to self-destruct",
      });
      if (selected) {
        setFilePath(selected as string);
        setState("idle");
        setResult(null);
        setError(null);
      }
    } catch {
      // Dialog cancelled or plugin not available — fall through to manual input.
    }
  }, []);

  const requestDestroy = useCallback(() => {
    if (!filePath) return;
    setState("confirming");
  }, [filePath]);

  const confirmDestroy = useCallback(async () => {
    if (!filePath) return;
    setState("destroying");
    setError(null);
    setResult(null);

    try {
      const res = await invoke<SelfDestructResult>("self_destruct_file", {
        filePath,
      });
      setResult(res);
      setState("done");
    } catch (e) {
      setError(String(e));
      setState("error");
    }
  }, [filePath]);

  const reset = useCallback(() => {
    setFilePath(null);
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-4 text-white max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quantum Vault</h2>
        <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">
          DoD 5220.22-M
        </span>
      </div>

      <p className="text-sm text-gray-400">
        Securely destroy files with a 3-pass overwrite (zeros, ones, random)
        before deletion. This operation is irreversible.
      </p>

      {/* File selection */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Target file
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="/path/to/sensitive-file"
            value={filePath ?? ""}
            onChange={(e) => {
              setFilePath(e.target.value || null);
              setState("idle");
              setResult(null);
              setError(null);
            }}
            disabled={state === "destroying"}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={pickFile}
            disabled={state === "destroying"}
            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg"
          >
            Browse
          </button>
        </div>

        {/* Action buttons */}
        {state === "idle" && filePath && (
          <button
            onClick={requestDestroy}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Self-Destruct File
          </button>
        )}

        {/* Confirmation */}
        {state === "confirming" && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg space-y-3">
            <p className="text-sm text-red-300">
              This will permanently destroy{" "}
              <span className="font-mono text-white">{filePath}</span> with a
              3-pass secure overwrite. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDestroy}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg"
              >
                Confirm Destruction
              </button>
              <button
                onClick={() => setState("idle")}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* In progress */}
        {state === "destroying" && (
          <div className="flex items-center gap-3 py-3">
            <div className="animate-spin h-5 w-5 border-2 border-red-400 border-t-transparent rounded-full" />
            <span className="text-sm text-red-300">
              Overwriting file (3-pass DoD 5220.22-M)...
            </span>
          </div>
        )}

        {/* Success */}
        {state === "done" && result && (
          <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg space-y-2">
            <p className="text-sm text-green-300 font-medium">
              File securely destroyed
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>
                Path: <span className="font-mono text-white">{result.path}</span>
              </p>
              <p>Passes: {result.passes}</p>
              <p>Original size: {formatBytes(result.original_size)}</p>
              <p>
                Verified deleted:{" "}
                <span
                  className={
                    result.verified_deleted ? "text-green-400" : "text-red-400"
                  }
                >
                  {result.verified_deleted ? "Yes" : "No"}
                </span>
              </p>
            </div>
            <button
              onClick={reset}
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-2"
            >
              Destroy another file
            </button>
          </div>
        )}

        {/* Error */}
        {state === "error" && error && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg space-y-2">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setState("idle")}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Uses cryptographic random data from the QRNG entropy pool for Pass 3.
        System paths are blocked for safety.
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
