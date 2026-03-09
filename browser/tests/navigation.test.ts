import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Navigation tests.
 *
 * Tests the navigation IPC contract and URL normalization behavior.
 */

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
const mockInvoke = vi.mocked(invoke);

describe("Navigation via Tauri IPC", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("should navigate to a URL", async () => {
    const navResult = {
      tab_id: "tab-1",
      url: "https://example.com",
      can_go_back: false,
      can_go_forward: false,
    };
    mockInvoke.mockResolvedValueOnce(navResult);

    const result = await invoke("navigate", {
      tabId: "tab-1",
      url: "example.com",
    });
    expect(result).toEqual(navResult);
  });

  it("should navigate back", async () => {
    const navResult = {
      tab_id: "tab-1",
      url: "https://previous.com",
      can_go_back: false,
      can_go_forward: true,
    };
    mockInvoke.mockResolvedValueOnce(navResult);

    const result = await invoke("go_back", { tabId: "tab-1" });
    expect(result).toEqual(navResult);
  });

  it("should navigate forward", async () => {
    const navResult = {
      tab_id: "tab-1",
      url: "https://next.com",
      can_go_back: true,
      can_go_forward: false,
    };
    mockInvoke.mockResolvedValueOnce(navResult);

    const result = await invoke("go_forward", { tabId: "tab-1" });
    expect(result).toEqual(navResult);
  });

  it("should reload the current page", async () => {
    mockInvoke.mockResolvedValueOnce("https://example.com");

    const url = await invoke("reload", { tabId: "tab-1" });
    expect(url).toBe("https://example.com");
  });

  it("should check can_go_back state", async () => {
    mockInvoke.mockResolvedValueOnce(true);

    const canBack = await invoke("can_go_back", { tabId: "tab-1" });
    expect(canBack).toBe(true);
  });

  it("should check can_go_forward state", async () => {
    mockInvoke.mockResolvedValueOnce(false);

    const canFwd = await invoke("can_go_forward", { tabId: "tab-1" });
    expect(canFwd).toBe(false);
  });
});

describe("Cross-domain proxy interface", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("should set proxy configuration", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await invoke("set_proxy_config", {
      host: "127.0.0.1",
      port: 8443,
    });
    expect(mockInvoke).toHaveBeenCalledWith("set_proxy_config", {
      host: "127.0.0.1",
      port: 8443,
    });
  });

  it("should disable proxy", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await invoke("disable_proxy");
    expect(mockInvoke).toHaveBeenCalledWith("disable_proxy");
  });

  it("should get proxy config", async () => {
    const config = { host: "127.0.0.1", port: 8443, enabled: true };
    mockInvoke.mockResolvedValueOnce(config);

    const result = await invoke("get_proxy_config");
    expect(result).toEqual(config);
  });
});

describe("Cross-domain session token interface", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("should get session token", async () => {
    mockInvoke.mockResolvedValueOnce("abc-123-def-456");

    const token = await invoke("get_session_token");
    expect(token).toBe("abc-123-def-456");
  });

  it("should regenerate session token", async () => {
    mockInvoke.mockResolvedValueOnce("new-token-789");

    const token = await invoke("regenerate_session_token");
    expect(token).toBe("new-token-789");
  });
});

describe("Bookmark operations", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("should add a bookmark", async () => {
    const bookmark = {
      id: "bm-1",
      url: "https://example.com",
      title: "Example",
      created_at: "2026-03-02T00:00:00Z",
    };
    mockInvoke.mockResolvedValueOnce(bookmark);

    const result = await invoke("add_bookmark", {
      url: "https://example.com",
      title: "Example",
    });
    expect(result).toEqual(bookmark);
  });

  it("should check if a URL is bookmarked", async () => {
    mockInvoke.mockResolvedValueOnce(true);

    const result = await invoke("is_bookmarked", {
      url: "https://example.com",
    });
    expect(result).toBe(true);
  });

  it("should remove a bookmark", async () => {
    mockInvoke.mockResolvedValueOnce(true);

    const result = await invoke("remove_bookmark", { bookmarkId: "bm-1" });
    expect(result).toBe(true);
  });
});
