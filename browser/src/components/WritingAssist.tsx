/**
 * WritingAssist
 *
 * Writing assistance panel with:
 * - Paste or type source text
 * - Action buttons: Rewrite, Simplify, Expand, Fix Grammar, Translate
 * - Tone selector: Professional, Casual, Academic, Creative
 * - Side-by-side original vs. result view
 * - "Insert into page" to send text to active form field
 * - Copy result
 */

import React, { useState, useCallback } from "react";

import { UseAIResult, WritingAction, WritingTone } from "../hooks/useAI";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WritingAssistProps {
  ai: UseAIResult;
}

interface ActionConfig {
  value: WritingAction;
  label: string;
  description: string;
}

interface ToneConfig {
  value: WritingTone;
  label: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ACTIONS: ActionConfig[] = [
  { value: "rewrite", label: "Rewrite", description: "Improve clarity and flow" },
  { value: "simplify", label: "Simplify", description: "Make easier to read" },
  { value: "expand", label: "Expand", description: "Add detail and depth" },
  { value: "fix_grammar", label: "Fix Grammar", description: "Correct errors" },
  { value: "translate", label: "Translate", description: "Convert language" },
];

const TONES: ToneConfig[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "creative", label: "Creative" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WritingAssist({ ai }: WritingAssistProps) {
  const [sourceText, setSourceText] = useState("");
  const [resultText, setResultText] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<WritingAction>("rewrite");
  const [selectedTone, setSelectedTone] = useState<WritingTone>("professional");
  const [copied, setCopied] = useState(false);
  const [insertFeedback, setInsertFeedback] = useState(false);
  const [showSideBySide, setShowSideBySide] = useState(false);

  const handleTransform = useCallback(async () => {
    if (!sourceText.trim() || ai.generating) return;
    setResultText(null);
    setShowSideBySide(false);

    const result = await ai.rewrite(sourceText.trim(), selectedAction, selectedTone);
    if (result) {
      setResultText(result);
      setShowSideBySide(true);
    }
  }, [ai, sourceText, selectedAction, selectedTone]);

  const handleCopy = useCallback(async () => {
    if (!resultText) return;
    await navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [resultText]);

  // Attempt to insert the result text into the page's focused form field.
  const handleInsertIntoPage = useCallback(() => {
    if (!resultText) return;

    // Find the focused element in the parent document (if available).
    const target =
      (window.opener?.document?.activeElement as HTMLInputElement) ??
      (parent?.document?.activeElement as HTMLInputElement);

    if (
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
    ) {
      if (target.isContentEditable) {
        document.execCommand("insertText", false, resultText);
      } else {
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        const current = target.value;
        target.value =
          current.slice(0, start) + resultText + current.slice(end);
        target.dispatchEvent(new Event("input", { bubbles: true }));
      }
      setInsertFeedback(true);
      setTimeout(() => setInsertFeedback(false), 2000);
    } else {
      // Fall back to clipboard copy.
      handleCopy();
    }
  }, [resultText, handleCopy]);

  const handleClear = useCallback(() => {
    setSourceText("");
    setResultText(null);
    setShowSideBySide(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full bg-zinc-900 overflow-y-auto">
      {/* Action selector */}
      <div className="px-3 pt-3 pb-2 border-b border-zinc-800">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Action
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {ACTIONS.map((action) => (
            <button
              key={action.value}
              onClick={() => setSelectedAction(action.value)}
              title={action.description}
              className={`
                py-1.5 px-2 rounded-lg text-xs font-medium text-center
                transition-colors duration-150 border
                ${selectedAction === action.value
                  ? "bg-indigo-700 border-indigo-600 text-white"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tone selector */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Tone
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={`
                py-1 px-2.5 rounded-full text-xs font-medium
                transition-colors duration-150
                ${selectedTone === tone.value
                  ? "bg-indigo-800 text-indigo-200"
                  : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                }
              `}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source text */}
      <div className="px-3 py-2 flex-1 flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Original text
            </label>
            {sourceText && (
              <button
                onClick={handleClear}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste or type text here…"
            rows={showSideBySide ? 5 : 10}
            className="
              w-full bg-zinc-800 border border-zinc-700 rounded-xl
              px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500
              focus:outline-none focus:border-indigo-500
              resize-none transition-colors duration-150
            "
          />
        </div>

        {/* Transform button */}
        <button
          onClick={handleTransform}
          disabled={!sourceText.trim() || ai.generating}
          className="
            w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500
            text-white text-sm font-medium transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {ai.generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Transforming…
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {ACTIONS.find((a) => a.value === selectedAction)?.label ?? "Transform"}
            </>
          )}
        </button>

        {/* Error */}
        {ai.error && (
          <div className="p-3 bg-red-900/40 border border-red-700 rounded-xl text-xs text-red-300">
            {ai.error}
          </div>
        )}

        {/* Streaming preview */}
        {ai.generating && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1 font-medium">Result (streaming…)</p>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {ai.streamingText}
              <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse ml-0.5 rounded-sm align-middle" />
            </p>
          </div>
        )}

        {/* Side-by-side result */}
        {resultText && !ai.generating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Result
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="
                    text-xs text-zinc-500 hover:text-zinc-300
                    flex items-center gap-1 transition-colors
                  "
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3">
              <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {resultText}
              </p>
            </div>

            {/* Insert into page */}
            <button
              onClick={handleInsertIntoPage}
              className="
                w-full py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600
                text-zinc-200 text-xs font-medium transition-colors
                flex items-center justify-center gap-1.5
              "
            >
              {insertFeedback ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Inserted!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                  </svg>
                  Insert into page
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
