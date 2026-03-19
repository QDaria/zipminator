/**
 * AISidebar
 *
 * Main sidebar container. Slides in from the right side of the browser.
 *
 * Features:
 * - Toggle with Cmd+Shift+A (keyboard shortcut)
 * - Three tabs: Chat, Summary, Writing
 * - Dark theme (matches browser chrome)
 * - 200ms CSS slide-in/out animation
 * - Resizable (drag handle on the left edge)
 * - Collapses to a narrow icon strip on narrow windows (<640px)
 * - PQC badge when cloud mode is active
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { useAI } from "../hooks/useAI";
import { usePageContent } from "../hooks/usePageContent";
import { ChatPanel } from "./ChatPanel";
import { SummaryPanel } from "./SummaryPanel";
import { WritingAssist } from "./WritingAssist";
import { AISettings } from "./AISettings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "chat" | "summary" | "writing" | "settings";

interface AISidebarProps {
  /** Browser tab identifier (for history isolation). */
  tabId?: string;
  /** Tauri app-data directory (passed from App.tsx). */
  appDataDir?: string;
  /** If true, the sidebar starts open (uncontrolled mode). Default: false. */
  defaultOpen?: boolean;
  /**
   * Controlled open state. When provided the sidebar switches to controlled
   * mode and `defaultOpen` is ignored.
   */
  isOpen?: boolean;
  /** Called when the sidebar wants to toggle itself (controlled mode). */
  onToggle?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 280;
const MAX_WIDTH = 640;

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "chat",
    label: "Chat",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    id: "summary",
    label: "Summary",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: "writing",
    label: "Write",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AISidebar({
  tabId = "default",
  appDataDir = "",
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
}: AISidebarProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        // In controlled mode, call onToggle whenever the value would change.
        const next = typeof value === "function" ? value(open) : value;
        if (next !== open) onToggle?.();
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, open, onToggle]
  );
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [narrowWindow, setNarrowWindow] = useState(window.innerWidth < 640);

  const ai = useAI();
  const pageContent = usePageContent();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(DEFAULT_WIDTH);

  // ---------------------------------------------------------------------------
  // Keyboard shortcut: Cmd+Shift+A
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "a") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // Responsive: collapse to icon on narrow windows
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setNarrowWindow(window.innerWidth < 640);
    });
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  // ---------------------------------------------------------------------------
  // Resize handle drag logic
  // ---------------------------------------------------------------------------

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = width;
    },
    [width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = resizeStartX.current - e.clientX;
      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, resizeStartWidth.current + delta)
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => setIsResizing(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleExtractPage = useCallback(async () => {
    return pageContent.extract();
  }, [pageContent]);

  // ---------------------------------------------------------------------------
  // Render — collapsed (icon-only) toggle button
  // ---------------------------------------------------------------------------

  const toggleButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      className={`
        fixed right-0 top-1/2 -translate-y-1/2 z-50
        flex flex-col items-center gap-1 py-3 px-2
        bg-zinc-800 border border-zinc-700 border-r-0
        rounded-l-xl shadow-lg
        text-zinc-400 hover:text-white hover:bg-zinc-700
        transition-all duration-200
        ${open ? "opacity-0 pointer-events-none" : "opacity-100"}
      `}
      aria-label="Open AI sidebar (Cmd+Shift+A)"
      title="AI Sidebar (Cmd+Shift+A)"
    >
      {/* AI icon */}
      <span className="text-indigo-400 font-bold text-xs leading-none">AI</span>
      {/* Generating indicator */}
      {ai.generating && (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
      )}
    </button>
  );

  // ---------------------------------------------------------------------------
  // Render — full sidebar
  // ---------------------------------------------------------------------------

  const isCloud = ai.config?.mode === "cloud";

  return (
    <>
      {/* Floating toggle button (visible when sidebar is closed) */}
      {toggleButton}

      {/* Overlay for narrow windows */}
      {open && narrowWindow && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-0 right-0 h-full z-50
          bg-zinc-900 border-l border-zinc-800
          flex flex-col
          shadow-2xl shadow-black/50
          transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
          ${isResizing ? "select-none" : ""}
        `}
        style={{ width: narrowWindow ? "100vw" : width }}
        role="complementary"
        aria-label="AI Sidebar"
      >
        {/* Resize handle */}
        {!narrowWindow && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="
              absolute left-0 top-0 h-full w-1
              cursor-ew-resize hover:bg-indigo-600/50
              transition-colors duration-150
            "
            title="Drag to resize"
          />
        )}

        {/* Header */}
        <header className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">AI Sidebar</span>
            {isCloud && (
              <span className="px-1.5 py-0.5 bg-indigo-900/60 border border-indigo-700/50 rounded-full text-xs text-indigo-300 font-medium">
                PQC
              </span>
            )}
            {ai.config?.mode === "local" && (
              <span className="px-1.5 py-0.5 bg-green-900/40 border border-green-700/30 rounded-full text-xs text-green-400 font-medium">
                Local
              </span>
            )}
            {ai.generating && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Thinking…
              </span>
            )}
          </div>

          <button
            onClick={() => setOpen(false)}
            className="
              w-7 h-7 rounded-lg flex items-center justify-center
              text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800
              transition-colors duration-150
            "
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Tab bar */}
        <nav className="flex border-b border-zinc-800 bg-zinc-900">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2 px-1
                text-xs font-medium transition-colors duration-150
                border-b-2
                ${activeTab === tab.id
                  ? "text-indigo-400 border-indigo-500"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
                }
              `}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon}
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && (
            <ChatPanel
              tabId={tabId}
              ai={ai}
              pageContext={pageContent.context}
              onExtractPage={handleExtractPage}
            />
          )}

          {activeTab === "summary" && (
            <SummaryPanel
              ai={ai}
              pageContext={pageContent.context}
              onExtractPage={handleExtractPage}
            />
          )}

          {activeTab === "writing" && (
            <WritingAssist ai={ai} />
          )}

          {activeTab === "settings" && (
            <AISettings ai={ai} appDataDir={appDataDir} />
          )}
        </div>

        {/* Footer */}
        <footer className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/80">
          <p className="text-xs text-zinc-700 text-center">
            ZipBrowser AI &mdash;{" "}
            {ai.config?.mode === "local"
              ? "100% on-device"
              : ai.config?.mode === "cloud"
              ? "ML-KEM-768 encrypted"
              : "disabled"}
          </p>
        </footer>
      </div>
    </>
  );
}

export default AISidebar;
