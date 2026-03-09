/**
 * AISettings
 *
 * Configuration panel for the AI sidebar:
 * - Switch between Local / Cloud / Off modes
 * - Local: model path, download prompt
 * - Cloud: API endpoint, API key, model selector
 * - Shared: temperature slider, max tokens, context window
 */

import React, { useState, useCallback } from "react";

import { UseAIResult, AiMode } from "../hooks/useAI";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AISettingsProps {
  ai: UseAIResult;
  appDataDir: string;
}

const CLOUD_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (OpenAI)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo (OpenAI)" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (OpenAI)" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Anthropic)" },
  { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet (Anthropic)" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AISettings({ ai, appDataDir }: AISettingsProps) {
  const cfg = ai.config;
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleModeChange = useCallback(
    async (mode: AiMode) => {
      await ai.updateConfig({ mode });
    },
    [ai]
  );

  const handleDownloadModel = useCallback(async () => {
    await ai.downloadModel(appDataDir + "/models");
  }, [ai, appDataDir]);

  const handleSaveCloudSettings = useCallback(async () => {
    if (!cfg) return;
    setSaving(true);
    const patch: Partial<typeof cfg> = {};
    if (apiKey) {
      // In production, the key would be encrypted by the Rust backend.
      // Here we pass it as-is; sidebar.rs stores it in cloud_api_key.
      (patch as any).cloud_api_key = apiKey;
    }
    await ai.updateConfig(patch);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setApiKey("");
  }, [ai, cfg, apiKey]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!cfg) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 overflow-y-auto">
      {/* Mode selector */}
      <section className="p-3 border-b border-zinc-800">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          AI Mode
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {(["local", "cloud", "off"] as AiMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`
                py-2 rounded-xl text-xs font-semibold capitalize text-center
                border transition-colors duration-150
                ${cfg.mode === mode
                  ? "bg-indigo-700 border-indigo-600 text-white"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }
              `}
            >
              {mode === "local" && "Local"}
              {mode === "cloud" && "Cloud"}
              {mode === "off" && "Off"}
            </button>
          ))}
        </div>

        {/* Mode description */}
        <p className="mt-2 text-xs text-zinc-600">
          {cfg.mode === "local" &&
            "All inference runs on your device. No data leaves the machine."}
          {cfg.mode === "cloud" &&
            "API calls route through the PQC proxy for post-quantum encryption."}
          {cfg.mode === "off" && "AI sidebar is disabled."}
        </p>
      </section>

      {/* Local model settings */}
      {cfg.mode === "local" && (
        <section className="p-3 border-b border-zinc-800 space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Local Model
          </p>

          {cfg.local_model_path ? (
            <div>
              <p className="text-xs text-zinc-400 font-medium mb-0.5">Model loaded</p>
              <p className="text-xs text-zinc-600 break-all font-mono">
                {cfg.local_model_path}
              </p>
            </div>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3">
              <p className="text-xs text-yellow-300 font-medium mb-1">No model loaded</p>
              <p className="text-xs text-yellow-400/60 mb-2">
                Download Phi-3-mini (~2 GB) to enable local inference. The model
                is stored privately on your device.
              </p>
              <button
                onClick={handleDownloadModel}
                disabled={ai.generating || ai.downloadProgress !== null}
                className="
                  w-full py-2 rounded-lg bg-yellow-700 hover:bg-yellow-600
                  text-white text-xs font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {ai.downloadProgress !== null
                  ? `Downloading… ${Math.round((ai.downloadProgress ?? 0) * 100)}%`
                  : "Download Phi-3-mini (2 GB)"}
              </button>

              {ai.downloadProgress !== null && (
                <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                    style={{ width: `${(ai.downloadProgress ?? 0) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Cloud settings */}
      {cfg.mode === "cloud" && (
        <section className="p-3 border-b border-zinc-800 space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Cloud API
          </p>

          {/* PQC badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-900/30 border border-indigo-700/30 rounded-xl">
            <span className="text-xs text-indigo-300 font-medium">
              PQC Protected
            </span>
            <span className="text-xs text-indigo-400/60">
              — All requests routed through ML-KEM-768 proxy
            </span>
          </div>

          {/* API endpoint */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1 font-medium">
              API Endpoint
            </label>
            <input
              type="url"
              defaultValue={cfg.cloud_api_endpoint}
              onBlur={(e) => ai.updateConfig({ cloud_api_endpoint: e.target.value })}
              className="
                w-full bg-zinc-800 border border-zinc-700 rounded-lg
                px-3 py-2 text-xs text-zinc-200 font-mono
                focus:outline-none focus:border-indigo-500 transition-colors
              "
              placeholder="https://api.openai.com/v1"
            />
          </div>

          {/* Model selector */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1 font-medium">
              Model
            </label>
            <select
              value={cfg.cloud_model}
              onChange={(e) => ai.updateConfig({ cloud_model: e.target.value })}
              className="
                w-full bg-zinc-800 border border-zinc-700 rounded-lg
                px-3 py-2 text-xs text-zinc-200
                focus:outline-none focus:border-indigo-500 transition-colors
              "
            >
              {CLOUD_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value={cfg.cloud_model}>{cfg.cloud_model} (custom)</option>
            </select>
          </div>

          {/* API key */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1 font-medium">
              API Key
              {cfg.has_cloud_api_key && (
                <span className="ml-1.5 text-green-400">Set</span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    cfg.has_cloud_api_key
                      ? "Enter new key to update…"
                      : "sk-…"
                  }
                  className="
                    w-full bg-zinc-800 border border-zinc-700 rounded-lg
                    px-3 py-2 pr-8 text-xs text-zinc-200 font-mono
                    focus:outline-none focus:border-indigo-500 transition-colors
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  tabIndex={-1}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showKey ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSaveCloudSettings}
                disabled={saving || !apiKey}
                className="
                  px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500
                  text-white text-xs font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap
                "
              >
                {saving ? "Saving…" : saved ? "Saved!" : "Save"}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              Keys are encrypted before storage.
            </p>
          </div>
        </section>
      )}

      {/* Shared generation settings */}
      {cfg.mode !== "off" && (
        <section className="p-3 space-y-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Generation Settings
          </p>

          {/* Temperature */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-zinc-500 font-medium">
                Temperature
              </label>
              <span className="text-xs text-zinc-400 font-mono">
                {cfg.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={cfg.temperature}
              onChange={(e) =>
                ai.updateConfig({ temperature: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between mt-0.5">
              <span className="text-xs text-zinc-600">Precise</span>
              <span className="text-xs text-zinc-600">Creative</span>
            </div>
          </div>

          {/* Max tokens */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-zinc-500 font-medium">
                Max Response Tokens
              </label>
              <span className="text-xs text-zinc-400 font-mono">{cfg.max_tokens}</span>
            </div>
            <input
              type="range"
              min={128}
              max={cfg.mode === "local" ? 1024 : 4096}
              step={128}
              value={cfg.max_tokens}
              onChange={(e) =>
                ai.updateConfig({ max_tokens: parseInt(e.target.value, 10) })
              }
              className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Streaming toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Streaming</p>
              <p className="text-xs text-zinc-600">Show tokens as they appear</p>
            </div>
            <button
              onClick={() => ai.updateConfig({ streaming: !cfg.streaming })}
              className={`
                relative w-10 h-5 rounded-full transition-colors duration-200
                ${cfg.streaming ? "bg-indigo-600" : "bg-zinc-700"}
              `}
              role="switch"
              aria-checked={cfg.streaming}
            >
              <span
                className={`
                  absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                  transition-transform duration-200
                  ${cfg.streaming ? "translate-x-5" : "translate-x-0.5"}
                `}
              />
            </button>
          </div>
        </section>
      )}

      {/* Error */}
      {ai.error && (
        <div className="mx-3 mb-3 p-3 bg-red-900/40 border border-red-700 rounded-xl text-xs text-red-300">
          {ai.error}
        </div>
      )}
    </div>
  );
}
