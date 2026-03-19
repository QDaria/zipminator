import { useCallback, useEffect, useState } from "react";
import { TabBar } from "./components/TabBar";
import { AddressBar } from "./components/AddressBar";
import { NavigationControls } from "./components/NavigationControls";
import { WebContent } from "./components/WebContent";
import { StatusBar } from "./components/StatusBar";
import { AISidebar } from "./components/AISidebar";
import { useTabs } from "./hooks/useTabs";
import { useNavigation } from "./hooks/useNavigation";
import type { SecurityLevel } from "./types";

export default function App() {
  const {
    tabs,
    activeTabId,
    createTab,
    closeTab,
    setActiveTab,
    setActiveTabByIndex,
    duplicateTab,
    togglePinTab,
    reorderTab,
    updateTabMeta,
    refreshTabs,
  } = useTabs();

  const {
    canGoBack,
    canGoForward,
    isLoading,
    navigate,
    goBack,
    goForward,
    reload,
    updateNavigationState,
  } = useNavigation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadTimeMs, setLoadTimeMs] = useState<number | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  // Update navigation button state whenever the active tab changes.
  useEffect(() => {
    if (activeTabId) {
      updateNavigationState(activeTabId);
    }
  }, [activeTabId, updateNavigationState]);

  // Keyboard shortcuts.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd+T: New tab
      if (meta && e.key === "t") {
        e.preventDefault();
        createTab();
        return;
      }

      // Cmd+W: Close active tab
      if (meta && e.key === "w") {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
        return;
      }

      // Cmd+R: Reload
      if (meta && e.key === "r") {
        e.preventDefault();
        if (activeTabId) handleReload();
        return;
      }

      // Cmd+L: Focus address bar
      if (meta && e.key === "l") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(".address-input");
        input?.focus();
        return;
      }

      // Cmd+[: Back
      if (meta && e.key === "[") {
        e.preventDefault();
        handleBack();
        return;
      }

      // Cmd+]: Forward
      if (meta && e.key === "]") {
        e.preventDefault();
        handleForward();
        return;
      }

      // Cmd+1-9: Switch to tab by index
      if (meta && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        setActiveTabByIndex(parseInt(e.key, 10));
        return;
      }

      // Cmd+Shift+B: Toggle sidebar
      if (meta && e.shiftKey && e.key === "B") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }

      // Cmd+Shift+A: Toggle AI sidebar
      if (meta && e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, createTab, closeTab, setActiveTabByIndex]);

  const handleNavigate = useCallback(
    async (url: string) => {
      if (!activeTabId) return;
      const result = await navigate(activeTabId, url);
      if (result) {
        await refreshTabs();
      }
    },
    [activeTabId, navigate, refreshTabs]
  );

  const handleBack = useCallback(async () => {
    if (!activeTabId) return;
    const result = await goBack(activeTabId);
    if (result) await refreshTabs();
  }, [activeTabId, goBack, refreshTabs]);

  const handleForward = useCallback(async () => {
    if (!activeTabId) return;
    const result = await goForward(activeTabId);
    if (result) await refreshTabs();
  }, [activeTabId, goForward, refreshTabs]);

  const handleReload = useCallback(async () => {
    if (!activeTabId) return;
    await reload(activeTabId);
    await refreshTabs();
  }, [activeTabId, reload, refreshTabs]);

  const handleTitleChange = useCallback(
    async (tabId: string, title: string) => {
      await updateTabMeta({ tab_id: tabId, title });
    },
    [updateTabMeta]
  );

  const handleFaviconChange = useCallback(
    async (tabId: string, favicon: string) => {
      await updateTabMeta({ tab_id: tabId, favicon });
    },
    [updateTabMeta]
  );

  const handleSecurityChange = useCallback(
    async (tabId: string, security: SecurityLevel) => {
      await updateTabMeta({ tab_id: tabId, security });
    },
    [updateTabMeta]
  );

  const handleLoadStart = useCallback((_tabId: string) => {
    setLoadStartTime(performance.now());
    setLoadTimeMs(null);
  }, []);

  const handleLoadEnd = useCallback(
    (_tabId: string) => {
      if (loadStartTime !== null) {
        setLoadTimeMs(Math.round(performance.now() - loadStartTime));
      }
    },
    [loadStartTime]
  );

  const handleLoadError = useCallback((_tabId: string) => {
    setLoadTimeMs(null);
  }, []);

  return (
    <div className="browser-shell">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onCloseTab={closeTab}
        onNewTab={() => createTab()}
        onReorderTab={reorderTab}
        onDuplicateTab={duplicateTab}
        onTogglePinTab={togglePinTab}
      />

      <div className="toolbar">
        <NavigationControls
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          isLoading={isLoading}
          onBack={handleBack}
          onForward={handleForward}
          onReload={handleReload}
        />
        <AddressBar
          url={activeTab?.url ?? ""}
          security={activeTab?.security ?? "none"}
          isLoading={isLoading}
          onNavigate={handleNavigate}
        />
        {/* AI sidebar toggle button */}
        <button
          className={`ai-toggle-btn${sidebarOpen ? " ai-toggle-btn--active" : ""}`}
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? "Close AI sidebar" : "Open AI sidebar (Cmd+Shift+A)"}
          title="AI Sidebar (Cmd+Shift+A)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12a10 10 0 0 1 10-10z" />
            <path d="M8 12h.01M12 12h.01M16 12h.01" />
          </svg>
          <span className="ai-toggle-label">AI</span>
        </button>
      </div>

      <div className="content-area">
        <WebContent
          tab={activeTab}
          onTitleChange={handleTitleChange}
          onFaviconChange={handleFaviconChange}
          onSecurityChange={handleSecurityChange}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onLoadError={handleLoadError}
          onNavigate={(tabId, url) => navigate(tabId, url)}
        />
      </div>

      {/* AI sidebar — rendered outside content-area so it overlays correctly */}
      <AISidebar
        tabId={activeTabId ?? "default"}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      <StatusBar
        security={activeTab?.security ?? "none"}
        loadTimeMs={loadTimeMs}
      />
    </div>
  );
}
