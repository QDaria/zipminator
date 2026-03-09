/**
 * useAI
 *
 * Central AI state management hook. Wraps all Tauri `invoke` calls to the
 * AI sidebar backend commands and manages:
 *
 * - AI mode (local / cloud / off)
 * - Streaming token accumulation
 * - Generation status
 * - Error state
 * - AI configuration read/write
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { PageContext } from "./usePageContent";

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
// Event names (must match sidebar.rs)
// ---------------------------------------------------------------------------

const EVENT_AI_TOKEN = "ai-token-generated";
const EVENT_AI_START = "ai-generation-start";
const EVENT_AI_DONE = "ai-generation-done";
const EVENT_MODEL_DOWNLOAD = "ai-model-download";
const EVENT_AI_ERROR = "ai-error";

// ---------------------------------------------------------------------------
// Hook
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
  // Set up Tauri event listeners on mount, clean up on unmount.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const unlistenToken = await listen<TokenEvent>(EVENT_AI_TOKEN, (event) => {
        if (!mounted) return;
        const { token, done } = event.payload;
        streamBufferRef.current += token;
        setStreamingText(streamBufferRef.current);
        if (done) {
          setGenerating(false);
        }
      });

      const unlistenStart = await listen(EVENT_AI_START, () => {
        if (!mounted) return;
        streamBufferRef.current = "";
        setStreamingText("");
        setGenerating(true);
        setError(null);
      });

      const unlistenDone = await listen(EVENT_AI_DONE, () => {
        if (!mounted) return;
        setGenerating(false);
      });

      const unlistenDownload = await listen<{
        downloaded: number;
        total?: number;
      }>(EVENT_MODEL_DOWNLOAD, (event) => {
        if (!mounted) return;
        const { downloaded, total } = event.payload;
        if (total && total > 0) {
          setDownloadProgress(downloaded / total);
        }
      });

      const unlistenError = await listen<{ message: string }>(
        EVENT_AI_ERROR,
        (event) => {
          if (!mounted) return;
          setError(event.payload.message);
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
      const cfg = await invoke<AiConfigPublic>("ai_get_config");
      setConfig(cfg);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  const chat = useCallback(
    async (
      tabId: string,
      message: string,
      pageContext?: PageContext
    ): Promise<string | null> => {
      setError(null);
      try {
        const response = await invoke<AiResponse>("ai_chat", {
          request: { tab_id: tabId, message, page_context: pageContext ?? null },
        });
        return response.text;
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
        const response = await invoke<AiResponse>("ai_summarize", {
          request: { page_context: pageContext },
        });
        return response.text;
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
        const response = await invoke<AiResponse>("ai_rewrite", {
          request: { text, action, tone: tone ?? null },
        });
        return response.text;
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
      await invoke("ai_clear_history", { tabId });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const updateConfig = useCallback(
    async (partial: Partial<AiConfigPublic>): Promise<void> => {
      if (!config) return;
      const merged = { ...config, ...partial };
      try {
        const updated = await invoke<AiConfigPublic>("ai_set_config", {
          newConfig: merged,
        });
        setConfig(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [config]
  );

  const downloadModel = useCallback(
    async (destDir: string): Promise<string | null> => {
      setDownloadProgress(0);
      setError(null);
      try {
        const path = await invoke<string>("ai_download_model", { destDir });
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
      setError(null);
      try {
        const path = await invoke<string>("ai_load_model", { modelPath });
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
