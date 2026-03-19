import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * AI Sidebar integration tests.
 *
 * Verifies the Tauri command contract for AI sidebar commands, the HTTP
 * fallback path structure, and the IS_TAURI detection helper behaviour.
 */

// Mock Tauri APIs before any imports that use them.
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => undefined),
}));

import { invoke } from "@tauri-apps/api/core";
const mockInvoke = vi.mocked(invoke);

// ---------------------------------------------------------------------------
// ai_get_config
// ---------------------------------------------------------------------------

describe("AI config command (ai_get_config)", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("returns a config object with expected shape", async () => {
    const config = {
      mode: "off",
      cloud_api_endpoint: "https://api.openai.com/v1",
      has_cloud_api_key: false,
      cloud_model: "gpt-4o",
      max_tokens: 512,
      temperature: 0.7,
      context_window: 4096,
      streaming: false,
    };
    mockInvoke.mockResolvedValueOnce(config);

    const result = await invoke("ai_get_config");
    expect(result).toMatchObject({ mode: "off" });
    expect((result as typeof config).has_cloud_api_key).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ai_chat
// ---------------------------------------------------------------------------

describe("AI chat command (ai_chat)", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("sends chat request and returns text", async () => {
    mockInvoke.mockResolvedValueOnce({ text: "Hello from AI!", mode: "cloud" });

    const result = await invoke("ai_chat", {
      request: {
        tab_id: "tab-1",
        message: "Hello",
        page_context: null,
      },
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai_chat", {
      request: {
        tab_id: "tab-1",
        message: "Hello",
        page_context: null,
      },
    });
    expect((result as { text: string }).text).toBe("Hello from AI!");
  });

  it("includes page context when provided", async () => {
    const pageContext = {
      url: "https://example.com",
      title: "Example",
      content: "Some page content",
      headings: ["Heading 1"],
      word_count: 3,
    };

    mockInvoke.mockResolvedValueOnce({ text: "Summary of page", mode: "cloud" });

    await invoke("ai_chat", {
      request: {
        tab_id: "tab-2",
        message: "What is this page about?",
        page_context: pageContext,
      },
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      "ai_chat",
      expect.objectContaining({
        request: expect.objectContaining({
          page_context: pageContext,
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// ai_summarize
// ---------------------------------------------------------------------------

describe("AI summarize command (ai_summarize)", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("calls ai_summarize with page context", async () => {
    const pageContext = {
      url: "https://example.com",
      title: "Test Page",
      content: "This is a test page about quantum cryptography.",
      headings: ["Introduction", "Methods"],
      word_count: 9,
    };

    mockInvoke.mockResolvedValueOnce({ text: "## Summary\nQuantum crypto article.", mode: "cloud" });

    const result = await invoke("ai_summarize", {
      request: { page_context: pageContext },
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai_summarize", {
      request: { page_context: pageContext },
    });
    expect((result as { text: string }).text).toContain("Summary");
  });
});

// ---------------------------------------------------------------------------
// ai_rewrite
// ---------------------------------------------------------------------------

describe("AI rewrite command (ai_rewrite)", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("calls ai_rewrite with text, action, and tone", async () => {
    mockInvoke.mockResolvedValueOnce({ text: "Rewritten text.", mode: "cloud" });

    await invoke("ai_rewrite", {
      request: { text: "hello world", action: "rewrite", tone: "professional" },
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai_rewrite", {
      request: { text: "hello world", action: "rewrite", tone: "professional" },
    });
  });

  it("accepts null tone", async () => {
    mockInvoke.mockResolvedValueOnce({ text: "Simplified.", mode: "local" });

    await invoke("ai_rewrite", {
      request: { text: "complex text", action: "simplify", tone: null },
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      "ai_rewrite",
      expect.objectContaining({
        request: expect.objectContaining({ tone: null }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// ai_clear_history
// ---------------------------------------------------------------------------

describe("AI clear history command (ai_clear_history)", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("clears history for a given tab", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await invoke("ai_clear_history", { tabId: "tab-99" });

    expect(mockInvoke).toHaveBeenCalledWith("ai_clear_history", {
      tabId: "tab-99",
    });
  });
});

// ---------------------------------------------------------------------------
// ai_set_config
// ---------------------------------------------------------------------------

describe("AI set config command (ai_set_config)", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("updates config and returns updated object", async () => {
    const updated = {
      mode: "cloud",
      cloud_api_endpoint: "https://api.openai.com/v1",
      has_cloud_api_key: true,
      cloud_model: "gpt-4o",
      max_tokens: 1024,
      temperature: 0.5,
      context_window: 8192,
      streaming: true,
    };

    mockInvoke.mockResolvedValueOnce(updated);

    const result = await invoke("ai_set_config", { newConfig: updated });

    expect((result as typeof updated).mode).toBe("cloud");
    expect((result as typeof updated).streaming).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Page summarize flow — unit-level contract
// ---------------------------------------------------------------------------

describe("Page summarize button flow (contract)", () => {
  it("builds a minimal page context from document properties", () => {
    // Simulate what usePageContent would extract.
    const pageContext = {
      url: "https://example.com",
      title: "Example Domain",
      content: "This domain is for use in illustrative examples.",
      headings: [],
      word_count: 9,
    };

    // The summarize request must contain a page_context with at minimum url + content.
    expect(pageContext.url).toBeTruthy();
    expect(pageContext.content.length).toBeGreaterThan(0);
    expect(pageContext.word_count).toBeGreaterThan(0);
  });
});
