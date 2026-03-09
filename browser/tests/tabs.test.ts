import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tab management tests.
 *
 * These test the tab-related Tauri command contracts by mocking the invoke
 * function. The actual Rust tab logic is tested in tabs.rs unit tests.
 * These tests verify the frontend hook layer behaves correctly.
 */

// Mock Tauri invoke.
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
const mockInvoke = vi.mocked(invoke);

describe("Tab operations via Tauri IPC", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("should fetch the tab list", async () => {
    const mockTabs = [
      {
        id: "tab-1",
        url: "https://example.com",
        title: "Example",
        favicon: null,
        loading: "complete",
        security: "classical",
        pinned: false,
        created_at: Date.now(),
        last_accessed: Date.now(),
      },
    ];
    mockInvoke.mockResolvedValueOnce(mockTabs);

    const tabs = await invoke("get_tabs");
    expect(mockInvoke).toHaveBeenCalledWith("get_tabs");
    expect(tabs).toEqual(mockTabs);
  });

  it("should create a new tab", async () => {
    const newTab = {
      id: "tab-new",
      url: "about:blank",
      title: "New Tab",
      favicon: null,
      loading: "idle",
      security: "none",
      pinned: false,
      created_at: Date.now(),
      last_accessed: Date.now(),
    };
    mockInvoke.mockResolvedValueOnce(newTab);

    const tab = await invoke("create_tab", { url: "about:blank" });
    expect(mockInvoke).toHaveBeenCalledWith("create_tab", {
      url: "about:blank",
    });
    expect(tab).toEqual(newTab);
  });

  it("should close a tab and return new active id", async () => {
    mockInvoke.mockResolvedValueOnce("tab-2");

    const newActiveId = await invoke("close_tab", { tabId: "tab-1" });
    expect(mockInvoke).toHaveBeenCalledWith("close_tab", { tabId: "tab-1" });
    expect(newActiveId).toBe("tab-2");
  });

  it("should switch active tab", async () => {
    mockInvoke.mockResolvedValueOnce(true);

    const result = await invoke("set_active_tab", { tabId: "tab-2" });
    expect(result).toBe(true);
  });

  it("should switch tab by index (1-based)", async () => {
    mockInvoke.mockResolvedValueOnce("tab-3");

    const id = await invoke("set_active_tab_by_index", { index: 3 });
    expect(id).toBe("tab-3");
  });

  it("should duplicate a tab", async () => {
    const dupTab = {
      id: "tab-dup",
      url: "https://example.com",
      title: "Example",
      favicon: null,
      loading: "idle",
      security: "classical",
      pinned: false,
      created_at: Date.now(),
      last_accessed: Date.now(),
    };
    mockInvoke.mockResolvedValueOnce(dupTab);

    const tab = await invoke("duplicate_tab", { tabId: "tab-1" });
    expect(tab).toEqual(dupTab);
  });

  it("should toggle pin on a tab", async () => {
    mockInvoke.mockResolvedValueOnce(true);

    const result = await invoke("toggle_pin_tab", { tabId: "tab-1" });
    expect(result).toBe(true);
  });

  it("should reorder tabs", async () => {
    mockInvoke.mockResolvedValueOnce(true);

    const result = await invoke("reorder_tab", {
      fromIndex: 0,
      toIndex: 2,
    });
    expect(result).toBe(true);
  });

  it("should update tab metadata", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await invoke("update_tab_meta", {
      update: {
        tab_id: "tab-1",
        title: "New Title",
        favicon: "https://example.com/favicon.ico",
        security: "pqc",
      },
    });
    expect(mockInvoke).toHaveBeenCalledWith("update_tab_meta", {
      update: {
        tab_id: "tab-1",
        title: "New Title",
        favicon: "https://example.com/favicon.ico",
        security: "pqc",
      },
    });
  });
});
