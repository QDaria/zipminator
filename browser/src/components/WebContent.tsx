import { useRef, useCallback, useState } from "react";
import type { Tab, SecurityLevel } from "../types";

interface WebContentProps {
  tab: Tab | null;
  onTitleChange: (tabId: string, title: string) => void;
  onFaviconChange: (tabId: string, favicon: string) => void;
  onSecurityChange: (tabId: string, security: SecurityLevel) => void;
  onLoadStart: (tabId: string) => void;
  onLoadEnd: (tabId: string) => void;
  onLoadError: (tabId: string) => void;
  onNavigate: (tabId: string, url: string) => void;
}

/**
 * WebContent wraps the page display area.
 *
 * In a Tauri v2 app, the actual web content is rendered by the system webview
 * which is managed by the Tauri window. This component serves as the container
 * and communication layer between the browser chrome and the content area.
 *
 * In a full Tauri deployment, this would use `<webview>` or multi-window
 * management. For the browser chrome development phase, it renders an iframe
 * to demonstrate the architecture. The Tauri backend handles the actual
 * webview proxy configuration.
 */
export function WebContent({
  tab,
  onTitleChange,
  onFaviconChange: _onFaviconChange,
  onSecurityChange: _onSecurityChange,
  onLoadStart,
  onLoadEnd,
  onLoadError,
  onNavigate: _onNavigate,
}: WebContentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [loadTimeMs, setLoadTimeMs] = useState<number | null>(null);

  const currentUrl = tab?.url ?? "about:blank";
  const tabId = tab?.id ?? "";

  // Track page load timing.
  const handleLoadStart = useCallback(() => {
    if (!tabId) return;
    setLoadStartTime(performance.now());
    setLoadTimeMs(null);
    onLoadStart(tabId);
  }, [tabId, onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    if (!tabId) return;
    if (loadStartTime !== null) {
      setLoadTimeMs(Math.round(performance.now() - loadStartTime));
    }
    onLoadEnd(tabId);

    // Attempt to extract title from iframe (subject to same-origin policy).
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.title) {
        onTitleChange(tabId, doc.title);
      }
    } catch {
      // Cross-origin: title extraction not possible from iframe.
      // In production Tauri, the Rust backend captures this via webview events.
    }
  }, [tabId, loadStartTime, onLoadEnd, onTitleChange]);

  const handleLoadError = useCallback(() => {
    if (!tabId) return;
    setLoadTimeMs(null);
    onLoadError(tabId);
  }, [tabId, onLoadError]);

  // Determine if the URL is safe to render.
  const isSafeUrl =
    currentUrl.startsWith("https://") ||
    currentUrl.startsWith("http://") ||
    currentUrl === "about:blank";

  if (!tab) {
    return (
      <div className="web-content web-content-empty">
        <div className="empty-state">
          <h2>ZipBrowser</h2>
          <p>Post-quantum secure browsing</p>
        </div>
      </div>
    );
  }

  if (currentUrl === "about:blank") {
    return (
      <div className="web-content web-content-newtab">
        <div className="newtab-page">
          <h1 className="newtab-title">ZipBrowser</h1>
          <p className="newtab-subtitle">Quantum-safe browsing starts here</p>
          {loadTimeMs !== null && (
            <p className="load-time-display">{loadTimeMs}ms</p>
          )}
        </div>
      </div>
    );
  }

  if (!isSafeUrl) {
    return (
      <div className="web-content web-content-error">
        <div className="error-state">
          <h2>Cannot display this page</h2>
          <p>The URL scheme is not supported: {currentUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="web-content">
      <iframe
        ref={iframeRef}
        className="web-content-iframe"
        src={currentUrl}
        title={tab.title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={handleLoadEnd}
        onLoadStart={handleLoadStart}
        onError={handleLoadError}
      />
      {tab.loading === "loading" && (
        <div className="web-content-loading-overlay">
          <div className="loading-spinner-large" />
        </div>
      )}
    </div>
  );
}
