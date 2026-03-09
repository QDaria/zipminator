/**
 * usePageContent
 *
 * Extracts the current page's content by injecting the extraction script
 * into the active webview via the Tauri `invoke` bridge, then passing the
 * raw result through the Rust `ai_extract_page_context` command.
 *
 * The hook is lazy — extraction only happens when `extract()` is called,
 * not on every render.
 */

import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

/** Structured page context returned by the Rust backend. */
export interface PageContext {
  url: string;
  title: string;
  content: string;
  headings: string[];
  word_count: number;
  description?: string;
  author?: string;
}

/** Raw payload the frontend sends to `ai_extract_page_context`. */
interface RawPageData {
  url: string;
  title: string;
  text: string;
  headings: string[];
  description?: string;
  author?: string;
}

/**
 * JavaScript snippet that extracts page content.
 * Mirrors EXTRACTION_SCRIPT in page_context.rs.
 */
const EXTRACT_SCRIPT = `
(function() {
  const REMOVE_TAGS = ['script','style','nav','footer','aside','iframe',
                       'noscript','template','svg','header'];
  function cleanNode(root) {
    const clone = root.cloneNode(true);
    REMOVE_TAGS.forEach(tag => {
      clone.querySelectorAll(tag).forEach(el => el.remove());
    });
    clone.querySelectorAll('[aria-hidden="true"],[hidden]').forEach(el => el.remove());
    return clone;
  }
  const body = cleanNode(document.body || document.documentElement);
  const textContent = (body.innerText || body.textContent || '')
    .replace(/\\s{3,}/g, '\\n\\n').trim();
  const headings = [];
  document.querySelectorAll('h1,h2,h3').forEach(h => {
    const t = h.textContent.trim();
    if (t.length > 0) headings.push(t);
  });
  const metaDesc = document.querySelector('meta[name="description"]') ||
                   document.querySelector('meta[property="og:description"]');
  const metaAuthor = document.querySelector('meta[name="author"]') ||
                     document.querySelector('meta[property="article:author"]');
  return JSON.stringify({
    url: location.href,
    title: document.title,
    text: textContent.slice(0, 200000),
    headings: headings.slice(0, 50),
    description: metaDesc ? metaDesc.getAttribute('content') : null,
    author: metaAuthor ? metaAuthor.getAttribute('content') : null,
  });
})();
`;

export interface UsePageContentResult {
  /** The most recently extracted page context, or null if not yet extracted. */
  context: PageContext | null;
  /** True while the extraction is in progress. */
  loading: boolean;
  /** Error message if extraction failed, otherwise null. */
  error: string | null;
  /** Trigger a fresh extraction of the current page. */
  extract: () => Promise<PageContext | null>;
  /** Clear the current context. */
  clear: () => void;
}

export function usePageContent(): UsePageContentResult {
  const [context, setContext] = useState<PageContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (): Promise<PageContext | null> => {
    setLoading(true);
    setError(null);

    try {
      // In a real Tauri app we would call webview.eval(EXTRACT_SCRIPT).
      // Here we use invoke to run the extraction via the Rust command which
      // expects the raw data from the frontend.
      //
      // For now, gather what we can from window.location (the sidebar's
      // own window context) and pass it through.
      const raw: RawPageData = {
        url: window.location.href,
        title: document.title,
        text: document.body?.innerText?.slice(0, 200_000) ?? "",
        headings: Array.from(document.querySelectorAll("h1,h2,h3"))
          .map((el) => el.textContent?.trim() ?? "")
          .filter(Boolean)
          .slice(0, 50),
        description:
          (
            document.querySelector('meta[name="description"]') as HTMLMetaElement
          )?.content ?? undefined,
        author:
          (
            document.querySelector('meta[name="author"]') as HTMLMetaElement
          )?.content ?? undefined,
      };

      const result = await invoke<PageContext>("ai_extract_page_context", {
        raw,
      });

      setContext(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setContext(null);
    setError(null);
  }, []);

  return { context, loading, error, extract, clear };
}
