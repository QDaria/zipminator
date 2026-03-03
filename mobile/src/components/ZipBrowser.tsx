/**
 * ZipBrowser.tsx
 *
 * Mobile WebView browser with PQC proxy integration for Zipminator.
 *
 * Architecture:
 *   ZipBrowser
 *     ├── AddressBar   (URL input + lock icon)
 *     ├── PqcIndicator (shield badge, expert TLS panel)
 *     ├── WebView      (react-native-webview, routed via BrowserService)
 *     └── NavigationBar (back/fwd/refresh/home/tabs)
 *
 * Mode behaviour:
 *   Novice: Clean Chrome-like UI; shield icon only; domain in address bar.
 *   Expert: Full URL; PQC badge; expandable TLS detail panel; proxy metrics.
 *
 * PQC proxy:
 *   For MVP, WebView loads URLs directly. The BrowserService probes the
 *   local proxy (127.0.0.1:18443) and provides PQC status via mock.
 *   Phase 9 replaces the mock with a real native bridge call.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useExpertise } from '../context/ExpertiseContext';
import { browserService } from '../services/BrowserService';
import type { Tab, PqcStatus } from '../types/browser';
import AddressBar from './browser/AddressBar';
import NavigationBar from './browser/NavigationBar';
import PqcIndicator from './browser/PqcIndicator';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOME_URL = 'https://duckduckgo.com';

// ---------------------------------------------------------------------------
// Loading progress bar
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  isLoading: boolean;
  progress?: number;
}

function ProgressBar({ isLoading, progress }: ProgressBarProps) {
  if (!isLoading) return null;
  const pct = progress !== undefined ? Math.round(progress * 100) : undefined;
  return (
    <View className="h-0.5 bg-white/10 w-full">
      <View
        className="h-full bg-quantum-500 transition-all"
        style={{ width: pct !== undefined ? `${pct}%` : '40%' }}
        accessibilityLabel={`Loading ${pct !== undefined ? `${pct}%` : 'page'}`}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Expert metrics footer
// ---------------------------------------------------------------------------

interface ExpertFooterProps {
  tab: Tab;
  pqcDetails: PqcStatus | null;
  proxyAvailable: boolean;
}

function ExpertFooter({ tab, pqcDetails, proxyAvailable }: ExpertFooterProps) {
  return (
    <View className="bg-black border-t border-white/5 px-4 py-2">
      <View className="flex-row justify-between items-center">
        <Text className="text-gray-600 font-mono text-[10px]">
          PROXY: {proxyAvailable ? '127.0.0.1:18443 ✓' : 'OFFLINE'}
        </Text>
        <Text className="text-gray-600 font-mono text-[10px]">
          KEM: {pqcDetails?.keyExchange ?? 'unknown'}
        </Text>
        <Text className="text-gray-600 font-mono text-[10px]">
          TAB: {tab.id.slice(-6)}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ZipBrowser
// ---------------------------------------------------------------------------

export default function ZipBrowser() {
  const { mode } = useExpertise();
  const isExpert = mode === 'expert';
  const webViewRef = useRef<WebView>(null);

  // Active tab (initialised lazily on first render)
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    browserService.createTab(HOME_URL)
  );

  // Current URL driving the WebView
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);

  // Navigation controls from WebView state
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<number | undefined>(undefined);
  const [pageTitle, setPageTitle] = useState('');

  // PQC status
  const [pqcDetails, setPqcDetails] = useState<PqcStatus | null>(null);
  const [proxyAvailable, setProxyAvailable] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // ---- Effects -----

  // Listen for proxy availability changes
  useEffect(() => {
    const handler = (available: boolean) => setProxyAvailable(available);
    browserService.on('proxyStatusChange', handler);
    return () => { browserService.removeListener('proxyStatusChange', handler); };
  }, []);

  // Fetch PQC status when URL changes
  useEffect(() => {
    let cancelled = false;
    browserService.getPqcStatus(currentUrl).then((status) => {
      if (cancelled) return;
      setPqcDetails(status);
      // Update tab PQC status
      browserService.updateTab(activeTab.id, { pqcStatus: status.level });
      setActiveTab((prev) => ({ ...prev, pqcStatus: status.level }));
    }).catch(() => {
      // Silently ignore — PQC status is advisory only
    });
    return () => { cancelled = true; };
  }, [currentUrl, activeTab.id]);

  // ---- Navigation handlers -----

  const handleAddressSubmit = useCallback((rawUrl: string) => {
    const proxied = browserService.navigate(activeTab.id, rawUrl);
    setCurrentUrl(proxied);
  }, [activeTab.id]);

  const handleGoBack = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  const handleGoForward = useCallback(() => {
    webViewRef.current?.goForward();
  }, []);

  const handleRefresh = useCallback(() => {
    if (isLoading) {
      webViewRef.current?.stopLoading();
    } else {
      webViewRef.current?.reload();
    }
  }, [isLoading]);

  const handleHome = useCallback(() => {
    const proxied = browserService.navigate(activeTab.id, HOME_URL);
    setCurrentUrl(proxied);
  }, [activeTab.id]);

  const handleNewTab = useCallback(() => {
    const newTab = browserService.createTab(HOME_URL);
    setActiveTab(newTab);
    setCurrentUrl(HOME_URL);
    setCanGoBack(false);
    setCanGoForward(false);
    setPqcDetails(null);
  }, []);

  const handlePullRefresh = useCallback(() => {
    setRefreshing(true);
    webViewRef.current?.reload();
    // The WebView's onLoadEnd will fire when complete
    // We reset refreshing after a short window to avoid stuck spinner
    const timer = setTimeout(() => setRefreshing(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ---- WebView event handlers -----

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsLoading(navState.loading);

    if (navState.url) {
      setCurrentUrl(navState.url);
      setActiveTab((prev) => ({ ...prev, url: navState.url }));
    }

    if (navState.title) {
      setPageTitle(navState.title);
      browserService.recordHistoryEntry(navState.url ?? currentUrl, navState.title);
      browserService.updateTab(activeTab.id, { title: navState.title, url: navState.url ?? currentUrl });
      setActiveTab((prev) => ({ ...prev, title: navState.title ?? prev.title }));
    }
  }, [activeTab.id, currentUrl]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setLoadProgress(0.05);
  }, []);

  const handleLoadProgress = useCallback(({ nativeEvent }: { nativeEvent: { progress: number } }) => {
    setLoadProgress(nativeEvent.progress);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setLoadProgress(undefined);
    setRefreshing(false);
  }, []);

  // ---- Render -----

  const tabCount = browserService.tabCount;

  return (
    <SafeAreaView className="flex-1 bg-black">

      {/* Header: address bar + PQC indicator */}
      <View className="flex-row items-center bg-black/90 border-b border-white/10 px-2 py-2">
        <PqcIndicator
          status={activeTab.pqcStatus}
          details={pqcDetails ?? undefined}
          isExpert={isExpert}
        />

        <AddressBar
          url={currentUrl}
          pqcStatus={activeTab.pqcStatus}
          isExpert={isExpert}
          isLoading={isLoading}
          onSubmit={handleAddressSubmit}
        />
      </View>

      {/* Loading progress bar */}
      <ProgressBar isLoading={isLoading} progress={loadProgress} />

      {/* WebView with pull-to-refresh */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
            tintColor="#7c3aed"
            colors={['#7c3aed']}
          />
        }
        scrollEnabled={false}
      >
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          className="flex-1"
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={handleLoadStart}
          onLoadProgress={handleLoadProgress}
          onLoadEnd={handleLoadEnd}
          // Security settings
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={false}
          // Android: render in hardware
          androidLayerType="hardware"
          // Pull-to-refresh handled by parent ScrollView
          bounces={false}
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          // Accessibility
          accessibilityLabel={`Browser showing ${pageTitle || currentUrl}`}
        />
      </ScrollView>

      {/* Expert mode metrics footer */}
      {isExpert && (
        <ExpertFooter
          tab={activeTab}
          pqcDetails={pqcDetails}
          proxyAvailable={proxyAvailable}
        />
      )}

      {/* Bottom navigation bar */}
      <NavigationBar
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        tabCount={tabCount}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onRefresh={handleRefresh}
        onHome={handleHome}
        onNewTab={handleNewTab}
      />

    </SafeAreaView>
  );
}
