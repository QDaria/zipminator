import React, { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { SecurityLevel, Bookmark } from "../types";

interface AddressBarProps {
  url: string;
  security: SecurityLevel;
  isLoading: boolean;
  onNavigate: (url: string) => void;
}

function SecurityIndicator({ security }: { security: SecurityLevel }) {
  if (security === "pqc") {
    return (
      <div className="security-indicator security-pqc" title="PQC TLS Active (Post-Quantum Secure)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1L2 4v4c0 3.5 2.5 6.4 6 7 3.5-.6 6-3.5 6-7V4L8 1z"
            fill="#22c55e"
            stroke="#166534"
            strokeWidth="0.5"
          />
          <path d="M6 8l1.5 1.5L10 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (security === "classical") {
    return (
      <div className="security-indicator security-classical" title="Classical TLS (HTTPS)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="7" width="10" height="7" rx="1" fill="#eab308" stroke="#854d0e" strokeWidth="0.5" />
          <path d="M5 7V5a3 3 0 016 0v2" stroke="#854d0e" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    );
  }

  return (
    <div className="security-indicator security-none" title="Not Secure">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
        <path d="M8 5v3.5M8 10.5v.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function AddressBar({
  url,
  security,
  isLoading,
  onNavigate,
}: AddressBarProps) {
  const [inputValue, setInputValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external URL changes (e.g. navigation by back/forward).
  useEffect(() => {
    if (!isFocused) {
      setInputValue(url);
    }
  }, [url, isFocused]);

  // Check bookmark status when URL changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await invoke<boolean>("is_bookmarked", { url });
        if (!cancelled) setIsBookmarked(result);
      } catch {
        // Not critical.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        onNavigate(trimmed);
        inputRef.current?.blur();
      }
    },
    [inputValue, onNavigate]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Select all text on focus for easy replacement.
    requestAnimationFrame(() => inputRef.current?.select());
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Revert to the actual URL if the user didn't submit.
    setInputValue(url);
  }, [url]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setInputValue(url);
        inputRef.current?.blur();
      }
    },
    [url]
  );

  const toggleBookmark = useCallback(async () => {
    try {
      if (isBookmarked) {
        const bookmarks = await invoke<Bookmark[]>("get_bookmarks");
        const match = bookmarks.find((b) => b.url === url);
        if (match) {
          await invoke<boolean>("remove_bookmark", { bookmarkId: match.id });
        }
        setIsBookmarked(false);
      } else {
        const title =
          document.title || new URL(url).hostname || url;
        await invoke<Bookmark>("add_bookmark", { url, title });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  }, [url, isBookmarked]);

  // Display a clean URL when not focused.
  const displayUrl = isFocused ? inputValue : cleanUrlForDisplay(url);

  return (
    <form className="address-bar" onSubmit={handleSubmit}>
      <SecurityIndicator security={security} />

      <input
        ref={inputRef}
        className="address-input"
        type="text"
        value={isFocused ? inputValue : displayUrl}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        placeholder="Search or enter URL"
        aria-label="Address bar"
      />

      {isLoading && <div className="address-loading-bar" />}

      <button
        type="button"
        className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
        onClick={toggleBookmark}
        aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        title={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 2h8a1 1 0 011 1v11.5l-4.5-3-4.5 3V3a1 1 0 011-1z"
            fill={isBookmarked ? "#3b82f6" : "none"}
            stroke={isBookmarked ? "#3b82f6" : "#94a3b8"}
            strokeWidth="1.5"
          />
        </svg>
      </button>
    </form>
  );
}

/** Strip the scheme and trailing slash for a cleaner display. */
function cleanUrlForDisplay(url: string): string {
  if (url === "about:blank") return "";
  try {
    const parsed = new URL(url);
    let display = parsed.hostname + parsed.pathname;
    if (display.endsWith("/")) {
      display = display.slice(0, -1);
    }
    if (parsed.search) {
      display += parsed.search;
    }
    return display;
  } catch {
    return url;
  }
}
