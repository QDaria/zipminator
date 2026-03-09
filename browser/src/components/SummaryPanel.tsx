/**
 * SummaryPanel
 *
 * One-click page summarisation with:
 * - TL;DR / Key Points / Full Summary sections
 * - "Summarise selection" for selected text
 * - Copy to clipboard button
 * - Streaming display
 */

import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";

import { UseAIResult } from "../hooks/useAI";
import { PageContext, usePageContent } from "../hooks/usePageContent";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SummaryPanelProps {
  ai: UseAIResult;
  pageContext: PageContext | null;
  onExtractPage: () => Promise<PageContext | null>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SummaryPanel({ ai, pageContext, onExtractPage }: SummaryPanelProps) {
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSummarizePage = useCallback(async () => {
    let ctx = pageContext;
    if (!ctx) {
      ctx = await onExtractPage();
    }
    if (!ctx) return;

    setSummaryText(null);
    const result = await ai.summarize(ctx);
    if (result) setSummaryText(result);
  }, [ai, pageContext, onExtractPage]);

  const handleSummarizeSelection = useCallback(async () => {
    const selectedText = window.getSelection()?.toString().trim();
    const textToSummarise = selectionMode
      ? customText.trim()
      : selectedText ?? "";

    if (!textToSummarise) return;

    // Build a minimal fake PageContext around the selected text.
    const fakeCtx: PageContext = {
      url: window.location.href,
      title: "Selected text",
      content: textToSummarise,
      headings: [],
      word_count: textToSummarise.split(/\s+/).length,
    };

    setSummaryText(null);
    const result = await ai.summarize(fakeCtx);
    if (result) setSummaryText(result);
  }, [ai, selectionMode, customText]);

  const handleCopy = useCallback(async () => {
    if (!summaryText) return;
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [summaryText]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Actions */}
      <div className="p-3 border-b border-zinc-800 space-y-2">
        {/* Summarise full page */}
        <button
          onClick={handleSummarizePage}
          disabled={ai.generating}
          className="
            w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500
            text-white text-sm font-medium transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {ai.generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Summarising…
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Summarise this page
            </>
          )}
        </button>

        {/* Summarise selection toggle */}
        <button
          onClick={() => setSelectionMode((v) => !v)}
          disabled={ai.generating}
          className={`
            w-full py-2 rounded-xl text-sm font-medium transition-colors duration-150
            flex items-center justify-center gap-2
            ${selectionMode
              ? "bg-zinc-700 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }
          `}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
          Summarise selection
        </button>

        {/* Selection text area */}
        {selectionMode && (
          <div className="space-y-2">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste or type text to summarise…"
              rows={4}
              className="
                w-full bg-zinc-800 border border-zinc-700 rounded-xl
                px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500
                focus:outline-none focus:border-indigo-500 resize-none
              "
            />
            <button
              onClick={handleSummarizeSelection}
              disabled={!customText.trim() || ai.generating}
              className="
                w-full py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600
                text-white text-sm font-medium transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Summarise selection
            </button>
          </div>
        )}

        {/* Page info */}
        {pageContext && (
          <div className="px-1">
            <p className="text-xs text-zinc-500 truncate">
              <span className="text-zinc-400">Page:</span> {pageContext.title}
            </p>
            <p className="text-xs text-zinc-600 truncate">{pageContext.url}</p>
          </div>
        )}
      </div>

      {/* Summary output */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-zinc-700">
        {ai.error && (
          <div className="mb-3 p-3 bg-red-900/40 border border-red-700 rounded-xl text-xs text-red-300">
            {ai.error}
          </div>
        )}

        {!summaryText && !ai.generating && !ai.error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-zinc-600">
            <svg
              className="w-10 h-10 mb-3 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">Click "Summarise this page" to get started.</p>
          </div>
        )}

        {/* Streaming display */}
        {ai.generating && !summaryText && (
          <div className="space-y-3">
            <StreamingPlaceholder />
          </div>
        )}

        {summaryText && (
          <div className="space-y-1">
            <div className="prose prose-invert prose-sm max-w-none text-zinc-200">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-base font-semibold text-white mt-4 mb-2 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-semibold text-indigo-300 mt-4 mb-1.5 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-zinc-300 mt-3 mb-1 first:mt-0">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2 text-sm text-zinc-300 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1 text-sm text-zinc-300">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-zinc-300">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">{children}</strong>
                  ),
                }}
              >
                {summaryText}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Copy button */}
      {summaryText && !ai.generating && (
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={handleCopy}
            className="
              w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700
              text-zinc-300 text-sm font-medium transition-colors
              flex items-center justify-center gap-2
            "
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy summary
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streaming skeleton placeholder
// ---------------------------------------------------------------------------

function StreamingPlaceholder() {
  return (
    <div className="space-y-3 animate-pulse px-1">
      <div className="h-3 bg-zinc-800 rounded-full w-24" />
      <div className="space-y-2">
        <div className="h-2.5 bg-zinc-800 rounded-full" />
        <div className="h-2.5 bg-zinc-800 rounded-full w-5/6" />
        <div className="h-2.5 bg-zinc-800 rounded-full w-4/6" />
      </div>
      <div className="h-3 bg-zinc-800 rounded-full w-24 mt-4" />
      <div className="space-y-2">
        <div className="h-2.5 bg-zinc-800 rounded-full w-11/12" />
        <div className="h-2.5 bg-zinc-800 rounded-full w-3/4" />
        <div className="h-2.5 bg-zinc-800 rounded-full w-5/6" />
        <div className="h-2.5 bg-zinc-800 rounded-full w-2/3" />
      </div>
    </div>
  );
}
