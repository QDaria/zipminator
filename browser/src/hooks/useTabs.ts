import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Tab, TabMetaUpdate } from "../types";

export interface UseTabsReturn {
  tabs: Tab[];
  activeTabId: string | null;
  createTab: (url?: string) => Promise<Tab>;
  closeTab: (tabId: string) => Promise<void>;
  setActiveTab: (tabId: string) => Promise<void>;
  setActiveTabByIndex: (index: number) => Promise<void>;
  duplicateTab: (tabId: string) => Promise<void>;
  togglePinTab: (tabId: string) => Promise<void>;
  reorderTab: (fromIndex: number, toIndex: number) => Promise<void>;
  updateTabMeta: (update: TabMetaUpdate) => Promise<void>;
  refreshTabs: () => Promise<void>;
}

export function useTabs(): UseTabsReturn {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const refreshTabs = useCallback(async () => {
    try {
      const fetchedTabs = await invoke<Tab[]>("get_tabs");
      setTabs(fetchedTabs);
      const active = await invoke<Tab | null>("get_active_tab");
      setActiveTabId(active?.id ?? null);
    } catch (err) {
      console.error("Failed to refresh tabs:", err);
    }
  }, []);

  const createTab = useCallback(
    async (url = "about:blank"): Promise<Tab> => {
      const tab = await invoke<Tab>("create_tab", { url });
      await refreshTabs();
      return tab;
    },
    [refreshTabs]
  );

  const closeTab = useCallback(
    async (tabId: string) => {
      await invoke<string | null>("close_tab", { tabId });
      await refreshTabs();
    },
    [refreshTabs]
  );

  const setActiveTab = useCallback(
    async (tabId: string) => {
      await invoke<boolean>("set_active_tab", { tabId });
      setActiveTabId(tabId);
      await refreshTabs();
    },
    [refreshTabs]
  );

  const setActiveTabByIndex = useCallback(
    async (index: number) => {
      const newId = await invoke<string | null>("set_active_tab_by_index", {
        index,
      });
      if (newId) {
        setActiveTabId(newId);
      }
      await refreshTabs();
    },
    [refreshTabs]
  );

  const duplicateTab = useCallback(
    async (tabId: string) => {
      await invoke<Tab | null>("duplicate_tab", { tabId });
      await refreshTabs();
    },
    [refreshTabs]
  );

  const togglePinTab = useCallback(
    async (tabId: string) => {
      await invoke<boolean>("toggle_pin_tab", { tabId });
      await refreshTabs();
    },
    [refreshTabs]
  );

  const reorderTab = useCallback(
    async (fromIndex: number, toIndex: number) => {
      await invoke<boolean>("reorder_tab", { fromIndex, toIndex });
      await refreshTabs();
    },
    [refreshTabs]
  );

  const updateTabMeta = useCallback(
    async (update: TabMetaUpdate) => {
      await invoke<void>("update_tab_meta", { update });
      await refreshTabs();
    },
    [refreshTabs]
  );

  // Load tabs on mount.
  useEffect(() => {
    refreshTabs();
  }, [refreshTabs]);

  return {
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
  };
}
