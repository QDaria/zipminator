import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { NavigationResult } from "../types";

export interface UseNavigationReturn {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  navigate: (tabId: string, url: string) => Promise<NavigationResult | null>;
  goBack: (tabId: string) => Promise<NavigationResult | null>;
  goForward: (tabId: string) => Promise<NavigationResult | null>;
  reload: (tabId: string) => Promise<string | null>;
  updateNavigationState: (tabId: string) => Promise<void>;
}

export function useNavigation(): UseNavigationReturn {
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateNavigationState = useCallback(async (tabId: string) => {
    try {
      const back = await invoke<boolean>("can_go_back", { tabId });
      const forward = await invoke<boolean>("can_go_forward", { tabId });
      setCanGoBack(back);
      setCanGoForward(forward);
    } catch (err) {
      console.error("Failed to update nav state:", err);
    }
  }, []);

  const navigate = useCallback(
    async (
      tabId: string,
      url: string
    ): Promise<NavigationResult | null> => {
      try {
        setIsLoading(true);
        const result = await invoke<NavigationResult>("navigate", {
          tabId,
          url,
        });
        setCanGoBack(result.can_go_back);
        setCanGoForward(result.can_go_forward);
        return result;
      } catch (err) {
        console.error("Navigation failed:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const goBack = useCallback(
    async (tabId: string): Promise<NavigationResult | null> => {
      try {
        setIsLoading(true);
        const result = await invoke<NavigationResult | null>("go_back", {
          tabId,
        });
        if (result) {
          setCanGoBack(result.can_go_back);
          setCanGoForward(result.can_go_forward);
        }
        return result;
      } catch (err) {
        console.error("Go back failed:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const goForward = useCallback(
    async (tabId: string): Promise<NavigationResult | null> => {
      try {
        setIsLoading(true);
        const result = await invoke<NavigationResult | null>("go_forward", {
          tabId,
        });
        if (result) {
          setCanGoBack(result.can_go_back);
          setCanGoForward(result.can_go_forward);
        }
        return result;
      } catch (err) {
        console.error("Go forward failed:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reload = useCallback(async (tabId: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      const url = await invoke<string>("reload", { tabId });
      return url;
    } catch (err) {
      console.error("Reload failed:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    canGoBack,
    canGoForward,
    isLoading,
    navigate,
    goBack,
    goForward,
    reload,
    updateNavigationState,
  };
}
