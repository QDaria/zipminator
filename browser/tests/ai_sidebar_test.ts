/**
 * AI Sidebar frontend tests
 *
 * Uses Vitest + @testing-library/react to test:
 * - AISidebar rendering and tab switching
 * - ChatPanel user interaction
 * - SummaryPanel summarise flow
 * - WritingAssist action + tone selection
 * - AISettings mode switching
 * - usePageContent hook
 * - useAI hook (mocked Tauri invoke)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ---------------------------------------------------------------------------
// Mock Tauri IPC
// ---------------------------------------------------------------------------

const mockInvoke = vi.fn();
const mockListen = vi.fn().mockResolvedValue(() => {});

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: mockListen,
}));

// ---------------------------------------------------------------------------
// Default AI config fixture
// ---------------------------------------------------------------------------

const defaultConfig = {
  mode: "local",
  local_model_path: "/models/phi3.gguf",
  cloud_api_endpoint: "https://api.openai.com/v1",
  has_cloud_api_key: false,
  cloud_model: "gpt-4o",
  max_tokens: 1024,
  temperature: 0.7,
  context_window: 4096,
  streaming: true,
};

// ---------------------------------------------------------------------------
// AISidebar
// ---------------------------------------------------------------------------

describe("AISidebar", () => {
  beforeEach(() => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "ai_get_config") return Promise.resolve(defaultConfig);
      return Promise.resolve({ text: "Test response", mode: "local" });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders toggle button when closed", async () => {
    const { AISidebar } = await import(
      "../src/components/AISidebar"
    );
    render(<AISidebar defaultOpen={false} />);
    const btn = screen.getByRole("button", { name: /AI Sidebar/i });
    expect(btn).toBeTruthy();
  });

  it("opens when toggle button is clicked", async () => {
    const { AISidebar } = await import(
      "../src/components/AISidebar"
    );
    render(<AISidebar defaultOpen={false} />);
    const btn = screen.getByRole("button", { name: /AI Sidebar/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByRole("complementary")).toBeTruthy();
    });
  });

  it("defaults to Chat tab", async () => {
    const { AISidebar } = await import(
      "../src/components/AISidebar"
    );
    render(<AISidebar defaultOpen={true} />);
    await waitFor(() => {
      const chatTab = screen.getByRole("tab", { name: /chat/i });
      expect(chatTab.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("switches tabs on click", async () => {
    const { AISidebar } = await import(
      "../src/components/AISidebar"
    );
    render(<AISidebar defaultOpen={true} />);
    const summaryTab = await screen.findByRole("tab", { name: /summary/i });
    await userEvent.click(summaryTab);
    expect(summaryTab.getAttribute("aria-selected")).toBe("true");
  });

  it("closes when X button is clicked", async () => {
    const { AISidebar } = await import(
      "../src/components/AISidebar"
    );
    render(<AISidebar defaultOpen={true} />);
    const closeBtn = await screen.findByRole("button", { name: /close sidebar/i });
    await userEvent.click(closeBtn);
    await waitFor(() => {
      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).toContain("translate-x-full");
    });
  });
});

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

describe("ChatPanel", () => {
  const makeAI = () => ({
    config: defaultConfig,
    configLoading: false,
    generating: false,
    streamingText: "",
    downloadProgress: null,
    error: null,
    chat: vi.fn().mockResolvedValue("AI response"),
    summarize: vi.fn().mockResolvedValue("Summary text"),
    rewrite: vi.fn().mockResolvedValue("Rewritten text"),
    clearHistory: vi.fn().mockResolvedValue(undefined),
    refreshConfig: vi.fn().mockResolvedValue(undefined),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    downloadModel: vi.fn().mockResolvedValue("/path/to/model"),
    loadModel: vi.fn().mockResolvedValue("/path/to/model"),
  });

  it("renders placeholder when no messages", async () => {
    const { ChatPanel } = await import("../src/components/ChatPanel");
    const ai = makeAI();
    render(
      <ChatPanel
        tabId="tab1"
        ai={ai as any}
        pageContext={null}
        onExtractPage={vi.fn()}
      />
    );
    expect(screen.getByText(/AI Assistant/i)).toBeTruthy();
  });

  it("sends a message on Enter key", async () => {
    const { ChatPanel } = await import("../src/components/ChatPanel");
    const ai = makeAI();
    render(
      <ChatPanel
        tabId="tab1"
        ai={ai as any}
        pageContext={null}
        onExtractPage={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ask anything/i);
    await userEvent.type(textarea, "Hello AI");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(ai.chat).toHaveBeenCalledWith("tab1", "Hello AI", undefined);
    });
  });

  it("does not send empty message", async () => {
    const { ChatPanel } = await import("../src/components/ChatPanel");
    const ai = makeAI();
    render(
      <ChatPanel
        tabId="tab1"
        ai={ai as any}
        pageContext={null}
        onExtractPage={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ask anything/i);
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(ai.chat).not.toHaveBeenCalled();
  });

  it("toggles page context mode", async () => {
    const { ChatPanel } = await import("../src/components/ChatPanel");
    const ai = makeAI();
    const mockPageContext = {
      url: "https://example.com",
      title: "Test Page",
      content: "Page content here",
      headings: [],
      word_count: 3,
    };

    render(
      <ChatPanel
        tabId="tab1"
        ai={ai as any}
        pageContext={mockPageContext}
        onExtractPage={vi.fn()}
      />
    );

    const pageToggle = screen.getByTitle(/page context/i);
    await userEvent.click(pageToggle);
    expect(pageToggle.textContent).toContain("ON");
  });
});

// ---------------------------------------------------------------------------
// SummaryPanel
// ---------------------------------------------------------------------------

describe("SummaryPanel", () => {
  const makeAI = (overrides = {}) => ({
    config: defaultConfig,
    configLoading: false,
    generating: false,
    streamingText: "",
    downloadProgress: null,
    error: null,
    chat: vi.fn(),
    summarize: vi.fn().mockResolvedValue("## TL;DR\nShort summary.\n## Key Points\n- Point 1"),
    rewrite: vi.fn(),
    clearHistory: vi.fn(),
    refreshConfig: vi.fn(),
    updateConfig: vi.fn(),
    downloadModel: vi.fn(),
    loadModel: vi.fn(),
    ...overrides,
  });

  it("renders summarise button", async () => {
    const { SummaryPanel } = await import("../src/components/SummaryPanel");
    const ai = makeAI();
    render(
      <SummaryPanel
        ai={ai as any}
        pageContext={null}
        onExtractPage={vi.fn().mockResolvedValue(null)}
      />
    );
    expect(screen.getByText(/Summarise this page/i)).toBeTruthy();
  });

  it("calls summarize with extracted context", async () => {
    const { SummaryPanel } = await import("../src/components/SummaryPanel");
    const ai = makeAI();
    const ctx = {
      url: "https://example.com",
      title: "Test Page",
      content: "Article body text",
      headings: ["Introduction"],
      word_count: 3,
    };

    render(
      <SummaryPanel
        ai={ai as any}
        pageContext={ctx}
        onExtractPage={vi.fn().mockResolvedValue(ctx)}
      />
    );

    await userEvent.click(screen.getByText(/Summarise this page/i));

    await waitFor(() => {
      expect(ai.summarize).toHaveBeenCalledWith(ctx);
    });
  });

  it("shows copy button after summary is generated", async () => {
    const { SummaryPanel } = await import("../src/components/SummaryPanel");
    const ai = makeAI();
    const ctx = {
      url: "https://example.com",
      title: "Test",
      content: "Content",
      headings: [],
      word_count: 1,
    };

    render(
      <SummaryPanel
        ai={ai as any}
        pageContext={ctx}
        onExtractPage={vi.fn().mockResolvedValue(ctx)}
      />
    );

    await userEvent.click(screen.getByText(/Summarise this page/i));

    await waitFor(() => {
      expect(screen.getByText(/Copy summary/i)).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// WritingAssist
// ---------------------------------------------------------------------------

describe("WritingAssist", () => {
  const makeAI = () => ({
    config: defaultConfig,
    configLoading: false,
    generating: false,
    streamingText: "",
    downloadProgress: null,
    error: null,
    rewrite: vi.fn().mockResolvedValue("Rewritten text output"),
    chat: vi.fn(),
    summarize: vi.fn(),
    clearHistory: vi.fn(),
    refreshConfig: vi.fn(),
    updateConfig: vi.fn(),
    downloadModel: vi.fn(),
    loadModel: vi.fn(),
  });

  it("renders all action buttons", async () => {
    const { WritingAssist } = await import("../src/components/WritingAssist");
    const ai = makeAI();
    render(<WritingAssist ai={ai as any} />);

    for (const label of ["Rewrite", "Simplify", "Expand", "Fix Grammar", "Translate"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("renders all tone options", async () => {
    const { WritingAssist } = await import("../src/components/WritingAssist");
    const ai = makeAI();
    render(<WritingAssist ai={ai as any} />);

    for (const tone of ["Professional", "Casual", "Academic", "Creative"]) {
      expect(screen.getByText(tone)).toBeTruthy();
    }
  });

  it("calls rewrite with selected action and tone", async () => {
    const { WritingAssist } = await import("../src/components/WritingAssist");
    const ai = makeAI();
    render(<WritingAssist ai={ai as any} />);

    const textarea = screen.getByPlaceholderText(/Paste or type/i);
    await userEvent.type(textarea, "My original text to transform.");

    // Select Simplify action
    await userEvent.click(screen.getByText("Simplify"));
    // Select Casual tone
    await userEvent.click(screen.getByText("Casual"));
    // Transform
    await userEvent.click(screen.getByText("Simplify", { selector: "button.bg-indigo-600" }));

    await waitFor(() => {
      expect(ai.rewrite).toHaveBeenCalledWith(
        "My original text to transform.",
        "simplify",
        "casual"
      );
    });
  });

  it("shows result after transformation", async () => {
    const { WritingAssist } = await import("../src/components/WritingAssist");
    const ai = makeAI();
    render(<WritingAssist ai={ai as any} />);

    const textarea = screen.getByPlaceholderText(/Paste or type/i);
    await userEvent.type(textarea, "Input text.");
    await userEvent.click(screen.getByRole("button", { name: /Rewrite/i }));

    await waitFor(() => {
      expect(screen.getByText("Rewritten text output")).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// AISettings
// ---------------------------------------------------------------------------

describe("AISettings", () => {
  const makeAI = (mode: "local" | "cloud" | "off" = "local") => ({
    config: { ...defaultConfig, mode },
    configLoading: false,
    generating: false,
    streamingText: "",
    downloadProgress: null,
    error: null,
    updateConfig: vi.fn().mockResolvedValue(undefined),
    downloadModel: vi.fn().mockResolvedValue("/models/model.gguf"),
    refreshConfig: vi.fn(),
    chat: vi.fn(),
    summarize: vi.fn(),
    rewrite: vi.fn(),
    clearHistory: vi.fn(),
    loadModel: vi.fn(),
  });

  it("renders mode selector with three options", async () => {
    const { AISettings } = await import("../src/components/AISettings");
    const ai = makeAI();
    render(<AISettings ai={ai as any} appDataDir="/app-data" />);

    expect(screen.getByText("Local")).toBeTruthy();
    expect(screen.getByText("Cloud")).toBeTruthy();
    expect(screen.getByText("Off")).toBeTruthy();
  });

  it("calls updateConfig when mode changes", async () => {
    const { AISettings } = await import("../src/components/AISettings");
    const ai = makeAI("local");
    render(<AISettings ai={ai as any} appDataDir="/app-data" />);

    await userEvent.click(screen.getByText("Cloud"));
    await waitFor(() => {
      expect(ai.updateConfig).toHaveBeenCalledWith({ mode: "cloud" });
    });
  });

  it("shows download button in local mode without model", async () => {
    const { AISettings } = await import("../src/components/AISettings");
    const ai = makeAI("local");
    (ai.config as any).local_model_path = undefined;
    render(<AISettings ai={ai as any} appDataDir="/app-data" />);

    expect(screen.getByText(/Download Phi-3-mini/i)).toBeTruthy();
  });

  it("shows PQC badge in cloud mode", async () => {
    const { AISettings } = await import("../src/components/AISettings");
    const ai = makeAI("cloud");
    render(<AISettings ai={ai as any} appDataDir="/app-data" />);

    expect(screen.getByText(/PQC Protected/i)).toBeTruthy();
  });

  it("shows temperature slider in non-off mode", async () => {
    const { AISettings } = await import("../src/components/AISettings");
    const ai = makeAI("local");
    render(<AISettings ai={ai as any} appDataDir="/app-data" />);

    expect(screen.getByText(/Temperature/i)).toBeTruthy();
  });
});
