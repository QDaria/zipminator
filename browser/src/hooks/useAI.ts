/**
 * useAI
 *
 * Central AI state management hook. Wraps Tauri `invoke` calls with graceful
 * HTTP fallback so the sidebar works in both Tauri desktop and web/dev mode.
 *
 * Priority:
 *   1. Tauri invoke (when running inside the desktop app)
 *   2. FastAPI HTTP fallback at http://localhost:8000 (web/dev mode)
 *   3. Error state with descriptive message (no backend at all)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { PageContext } from "./usePageContent";

// ---------------------------------------------------------------------------
// Tauri detection
// ---------------------------------------------------------------------------

/** True when the app is running inside a Tauri webview. */
const IS_TAURI =
  typeof window !== "undefined" &&
  typeof (window as Window & { __TAURI__?: unknown }).__TAURI__ !== "undefined";

type UnlistenFn = () => void;

// ---------------------------------------------------------------------------
// Types mirroring the Rust types
// ---------------------------------------------------------------------------

export type AiMode = "local" | "cloud" | "off";

export interface AiConfigPublic {
  mode: AiMode;
  local_model_path?: string;
  cloud_api_endpoint: string;
  has_cloud_api_key: boolean;
  cloud_model: string;
  max_tokens: number;
  temperature: number;
  context_window: number;
  streaming: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiResponse {
  text: string;
  mode: AiMode;
}

/** Streaming token event emitted by the Rust backend. */
interface TokenEvent {
  token: string;
  done: boolean;
}

export type WritingAction =
  | "rewrite"
  | "simplify"
  | "expand"
  | "fix_grammar"
  | "translate";

export type WritingTone =
  | "professional"
  | "casual"
  | "academic"
  | "creative";

// ---------------------------------------------------------------------------
// Default config (used in non-Tauri / pre-load mode)
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: AiConfigPublic = {
  mode: "off",
  cloud_api_endpoint: "http://localhost:8000/api/ai",
  has_cloud_api_key: false,
  cloud_model: "gpt-4o",
  max_tokens: 512,
  temperature: 0.7,
  context_window: 4096,
  streaming: false,
};

// ---------------------------------------------------------------------------
// Event names (must match sidebar.rs)
// ---------------------------------------------------------------------------

const EVENT_AI_TOKEN = "ai-token-generated";
const EVENT_AI_START = "ai-generation-start";
const EVENT_AI_DONE = "ai-generation-done";
const EVENT_MODEL_DOWNLOAD = "ai-model-download";
const EVENT_AI_ERROR = "ai-error";

// ---------------------------------------------------------------------------
// Tauri bridge helpers — dynamic import so the file compiles without Tauri
// ---------------------------------------------------------------------------

async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

async function listenToEvent<T>(
  event: string,
  handler: (payload: T) => void
): Promise<UnlistenFn> {
  const { listen } = await import("@tauri-apps/api/event");
  return listen<T>(event, (e) => handler(e.payload));
}

// ---------------------------------------------------------------------------
// FastAPI HTTP fallback
// ---------------------------------------------------------------------------

const API_BASE = "http://localhost:8000";

async function httpChat(
  message: string,
  pageContext?: PageContext
): Promise<string> {
  const body: Record<string, unknown> = { message };
  if (pageContext) body.page_context = pageContext;

  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`AI chat failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { text?: string; response?: string };
  return data.text ?? data.response ?? "(empty response)";
}

async function httpSummarize(pageContext: PageContext): Promise<string> {
  const res = await fetch(`${API_BASE}/api/ai/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page_context: pageContext }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Summarize failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { text?: string; summary?: string };
  return data.text ?? data.summary ?? "(empty response)";
}

// ---------------------------------------------------------------------------
// Hook interface
// ---------------------------------------------------------------------------

export interface UseAIResult {
  config: AiConfigPublic | null;
  configLoading: boolean;

  /** True while the AI is generating a response. */
  generating: boolean;

  /** Accumulated streaming text for the current generation (resets per call). */
  streamingText: string;

  /** Download progress [0–1], or null when no download is active. */
  downloadProgress: number | null;

  /** Last error message, or null. */
  error: string | null;

  /** Send a chat message. Returns full response text. */
  chat: (
    tabId: string,
    message: string,
    pageContext?: PageContext
  ) => Promise<string | null>;

  /** Summarise a page. Returns structured summary text. */
  summarize: (pageContext: PageContext) => Promise<string | null>;

  /** Rewrite text. Returns transformed text. */
  rewrite: (
    text: string,
    action: WritingAction,
    tone?: WritingTone
  ) => Promise<string | null>;

  /** Clear chat history for a tab. */
  clearHistory: (tabId: string) => Promise<void>;

  /** Reload config from the backend. */
  refreshConfig: () => Promise<void>;

  /** Update AI configuration. */
  updateConfig: (config: Partial<AiConfigPublic>) => Promise<void>;

  /** Start model download. */
  downloadModel: (destDir: string) => Promise<string | null>;

  /** Load a local model from path. */
  loadModel: (modelPath: string) => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useAI(): UseAIResult {
  const [config, setConfig] = useState<AiConfigPublic | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Accumulate streaming tokens in a ref to avoid stale closure issues.
  const streamBufferRef = useRef("");
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  // ---------------------------------------------------------------------------
  // Tauri event listeners (only in Tauri mode)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!IS_TAURI) return;

    let mounted = true;

    const setup = async () => {
      const unlistenToken = await listenToEvent<TokenEvent>(
        EVENT_AI_TOKEN,
        ({ token, done }) => {
          if (!mounted) return;
          streamBufferRef.current += token;
          setStreamingText(streamBufferRef.current);
          if (done) setGenerating(false);
        }
      );

      const unlistenStart = await listenToEvent<unknown>(EVENT_AI_START, () => {
        if (!mounted) return;
        streamBufferRef.current = "";
        setStreamingText("");
        setGenerating(true);
        setError(null);
      });

      const unlistenDone = await listenToEvent<unknown>(EVENT_AI_DONE, () => {
        if (!mounted) return;
        setGenerating(false);
      });

      const unlistenDownload = await listenToEvent<{
        downloaded: number;
        total?: number;
      }>(EVENT_MODEL_DOWNLOAD, ({ downloaded, total }) => {
        if (!mounted) return;
        if (total && total > 0) setDownloadProgress(downloaded / total);
      });

      const unlistenError = await listenToEvent<{ message: string }>(
        EVENT_AI_ERROR,
        ({ message }) => {
          if (!mounted) return;
          setError(message);
          setGenerating(false);
        }
      );

      unlistenRefs.current = [
        unlistenToken,
        unlistenStart,
        unlistenDone,
        unlistenDownload,
        unlistenError,
      ];
    };

    setup().catch(console.error);

    return () => {
      mounted = false;
      unlistenRefs.current.forEach((fn) => fn());
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Load config on mount
  // ---------------------------------------------------------------------------

  const refreshConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      if (IS_TAURI) {
        const cfg = await invokeCommand<AiConfigPublic>("ai_get_config");
        setConfig(cfg);
      } else {
        // In web/dev mode, try the FastAPI backend; fall back to default config.
        try {
          const res = await fetch(`${API_BASE}/api/ai/config`);
          if (res.ok) {
            const cfg = (await res.json()) as AiConfigPublic;
            setConfig(cfg);
          } else {
            setConfig(DEFAULT_CONFIG);
          }
        } catch {
          // No backend running — use a sensible default so the UI renders.
          setConfig(DEFAULT_CONFIG);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setConfig(DEFAULT_CONFIG);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // ---------------------------------------------------------------------------
  // Commands — Tauri first, then HTTP fallback
  // ---------------------------------------------------------------------------

  const chat = useCallback(
    async (
      tabId: string,
      message: string,
      pageContext?: PageContext
    ): Promise<string | null> => {
      setError(null);
      try {
        if (IS_TAURI) {
          const response = await invokeCommand<AiResponse>("ai_chat", {
            request: { tab_id: tabId, message, page_context: pageContext ?? null },
          });
          return response.text;
        }
        // HTTP fallback
        return await httpChat(message, pageContext);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setGenerating(false);
        return null;
      }
    },
    []
  );

  const summarize = useCallback(
    async (pageContext: PageContext): Promise<string | null> => {
      setError(null);
      try {
        if (IS_TAURI) {
          const response = await invokeCommand<AiResponse>("ai_summarize", {
            request: { page_context: pageContext },
          });
          return response.text;
        }
        // HTTP fallback
        return await httpSummarize(pageContext);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setGenerating(false);
        return null;
      }
    },
    []
  );

  const rewrite = useCallback(
    async (
      text: string,
      action: WritingAction,
      tone?: WritingTone
    ): Promise<string | null> => {
      setError(null);
      try {
        if (IS_TAURI) {
          const response = await invokeCommand<AiResponse>("ai_rewrite", {
            request: { text, action, tone: tone ?? null },
          });
          return response.text;
        }
        // HTTP fallback — minimal implementation
        const res = await fetch(`${API_BASE}/api/ai/rewrite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, action, tone: tone ?? null }),
        });
        if (!res.ok) throw new Error(`Rewrite failed (${res.status})`);
        const data = (await res.json()) as { text?: string };
        return data.text ?? "(empty response)";
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setGenerating(false);
        return null;
      }
    },
    []
  );

  const clearHistory = useCallback(async (tabId: string): Promise<void> => {
    try {
      if (IS_TAURI) {
        await invokeCommand("ai_clear_history", { tabId });
      }
      // In web mode there's no persistent history — nothing to clear.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const updateConfig = useCallback(
    async (partial: Partial<AiConfigPublic>): Promise<void> => {
      const current = config ?? DEFAULT_CONFIG;
      const merged = { ...current, ...partial };
      try {
        if (IS_TAURI) {
          const updated = await invokeCommand<AiConfigPublic>("ai_set_config", {
            newConfig: merged,
          });
          setConfig(updated);
        } else {
          // Optimistic local update in web mode.
          setConfig(merged);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [config]
  );

  const downloadModel = useCallback(
    async (destDir: string): Promise<string | null> => {
      if (!IS_TAURI) {
        setError("Model download is only available in the desktop app.");
        return null;
      }
      setDownloadProgress(0);
      setError(null);
      try {
        const path = await invokeCommand<string>("ai_download_model", {
          destDir,
        });
        setDownloadProgress(null);
        await refreshConfig();
        return path;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setDownloadProgress(null);
        return null;
      }
    },
    [refreshConfig]
  );

  const loadModel = useCallback(
    async (modelPath: string): Promise<string | null> => {
      if (!IS_TAURI) {
        setError("Loading a local model is only available in the desktop app.");
        return null;
      }
      setError(null);
      try {
        const path = await invokeCommand<string>("ai_load_model", { modelPath });
        await refreshConfig();
        return path;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      }
    },
    [refreshConfig]
  );

  return {
    config,
    configLoading,
    generating,
    streamingText,
    downloadProgress,
    error,
    chat,
    summarize,
    rewrite,
    clearHistory,
    refreshConfig,
    updateConfig,
    downloadModel,
    loadModel,
  };
}
