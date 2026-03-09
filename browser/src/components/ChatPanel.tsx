/**
 * ChatPanel
 *
 * Chat interface with:
 * - User / assistant message bubbles
 * - Markdown rendering with code syntax highlighting
 * - Streaming token display
 * - "Ask about this page" toggle
 * - Persistent scrolling
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { UseAIResult } from "../hooks/useAI";
import { PageContext } from "../hooks/usePageContent";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** True while streaming this message's tokens. */
  streaming?: boolean;
}

interface ChatPanelProps {
  tabId: string;
  ai: UseAIResult;
  pageContext: PageContext | null;
  onExtractPage: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
      aria-label={`${isUser ? "You" : "AI"}: ${message.content.slice(0, 60)}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}

      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
          ${isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-zinc-800 text-zinc-100 rounded-tl-sm border border-zinc-700"
          }
        `}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg text-xs my-2 !p-3"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="bg-zinc-900 rounded px-1 py-0.5 text-xs font-mono text-indigo-300"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return (
                  <ul className="list-disc list-inside mb-2 space-y-1">
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol className="list-decimal list-inside mb-2 space-y-1">
                    {children}
                  </ol>
                );
              },
              strong({ children }) {
                return (
                  <strong className="font-semibold text-white">{children}</strong>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {message.streaming && (
          <span className="inline-block w-1.5 h-4 bg-indigo-400 animate-pulse ml-0.5 rounded-sm align-middle" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChatPanel({ tabId, ai, pageContext, onExtractPage }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [includePageContext, setIncludePageContext] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingIdRef = useRef<string | null>(null);

  // Scroll to bottom when messages change.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update the streaming message bubble as tokens arrive.
  useEffect(() => {
    if (ai.generating && streamingIdRef.current) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingIdRef.current
            ? { ...m, content: ai.streamingText, streaming: true }
            : m
        )
      );
    }
  }, [ai.streamingText, ai.generating]);

  // Mark streaming complete when done.
  useEffect(() => {
    if (!ai.generating && streamingIdRef.current) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingIdRef.current
            ? { ...m, streaming: false }
            : m
        )
      );
      streamingIdRef.current = null;
    }
  }, [ai.generating]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || ai.generating) return;

    const userMsg: Message = { id: uid(), role: "user", content: trimmed };
    const assistantId = uid();
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    streamingIdRef.current = assistantId;

    const ctx = includePageContext && pageContext ? pageContext : undefined;
    await ai.chat(tabId, trimmed, ctx);
  }, [input, ai, tabId, includePageContext, pageContext]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClear = useCallback(async () => {
    setMessages([]);
    await ai.clearHistory(tabId);
  }, [ai, tabId]);

  const handleAskAboutPage = useCallback(() => {
    if (!pageContext) {
      onExtractPage();
    }
    setIncludePageContext((v) => !v);
  }, [pageContext, onExtractPage]);

  // Auto-resize textarea.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  }, [input]);

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-zinc-700">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 text-zinc-500">
            <div className="w-12 h-12 rounded-full bg-indigo-900/40 flex items-center justify-center mb-3">
              <span className="text-2xl">AI</span>
            </div>
            <p className="text-sm font-medium text-zinc-400 mb-1">
              AI Assistant
            </p>
            <p className="text-xs">
              Ask anything, or enable "Ask about this page" to query the current site.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {ai.error && (
          <div className="mx-2 mb-3 p-3 bg-red-900/40 border border-red-700 rounded-xl text-xs text-red-300">
            {ai.error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Page context toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={handleAskAboutPage}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            transition-colors duration-150
            ${includePageContext
              ? "bg-indigo-700 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }
          `}
          title={
            includePageContext
              ? "Disable page context"
              : "Include current page as context"
          }
        >
          <span className="text-xs">{includePageContext ? "Page ON" : "Page OFF"}</span>
          {pageContext && (
            <span className="opacity-70 max-w-[120px] truncate hidden sm:inline">
              — {pageContext.title}
            </span>
          )}
        </button>
      </div>

      {/* Input bar */}
      <div className="border-t border-zinc-800 px-3 py-2 bg-zinc-900">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="
              flex-1 resize-none bg-zinc-800 border border-zinc-700
              rounded-xl px-3 py-2 text-sm text-zinc-100
              placeholder-zinc-500 focus:outline-none focus:border-indigo-500
              transition-colors duration-150 min-h-[38px] max-h-[160px]
            "
            disabled={ai.generating}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || ai.generating}
            className="
              flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600
              flex items-center justify-center
              hover:bg-indigo-500 disabled:opacity-40
              disabled:cursor-not-allowed transition-colors duration-150
            "
            aria-label="Send message"
          >
            {ai.generating ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="mt-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Clear history
          </button>
        )}
      </div>
    </div>
  );
}
