//! Page context extraction.
//!
//! Provides utilities to extract the current page's text content from the
//! Tauri WebView, clean it, and trim it to fit within the model's context window.
//!
//! The actual DOM extraction is performed by injecting a small JavaScript
//! snippet into the webview via Tauri's `eval` API and returning the result
//! through a Tauri event channel.

use serde::{Deserialize, Serialize};

/// Threshold in characters at which we start truncating page content.
/// One token ≈ 4 characters (English prose), so 16 000 chars ≈ 4 096 tokens.
const CHARS_PER_TOKEN_APPROX: usize = 4;

/// Structured representation of a page's extractable content.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PageContext {
    /// The page URL at extraction time.
    pub url: String,
    /// Document `<title>` value.
    pub title: String,
    /// Cleaned prose text (scripts, styles, and nav elements stripped).
    pub content: String,
    /// All H1–H3 headings found on the page, in document order.
    pub headings: Vec<String>,
    /// Approximate word count of the cleaned content.
    pub word_count: usize,
    /// Meta description, if available.
    pub description: Option<String>,
    /// Byline / author if detectable (OpenGraph or `<meta name="author">`).
    pub author: Option<String>,
}

impl PageContext {
    /// Build a `PageContext` from raw extracted data, trimming `content` to
    /// at most `max_tokens` tokens.
    pub fn new(
        url: impl Into<String>,
        title: impl Into<String>,
        raw_content: impl Into<String>,
        headings: Vec<String>,
        description: Option<String>,
        author: Option<String>,
        max_tokens: usize,
    ) -> Self {
        let content_raw = raw_content.into();
        let max_chars = max_tokens * CHARS_PER_TOKEN_APPROX;
        let content = if content_raw.len() > max_chars {
            // Truncate at a word boundary.
            truncate_at_word_boundary(&content_raw, max_chars)
        } else {
            content_raw
        };

        let word_count = content.split_whitespace().count();

        Self {
            url: url.into(),
            title: title.into(),
            content,
            headings,
            word_count,
            description,
            author,
        }
    }

    /// Return `true` if the page has meaningful extractable content.
    pub fn has_content(&self) -> bool {
        self.word_count > 10
    }

    /// Build a compact context string suitable for inclusion in a prompt.
    ///
    /// Format:
    /// ```text
    /// Page: <title>
    /// URL: <url>
    /// Author: <author>       (if present)
    /// Description: <desc>    (if present)
    /// Headings: h1 > h2 > h3
    ///
    /// Content:
    /// <content>
    /// ```
    pub fn to_prompt_context(&self) -> String {
        let mut parts = Vec::new();

        parts.push(format!("Page: {}", self.title));
        parts.push(format!("URL: {}", self.url));

        if let Some(author) = &self.author {
            parts.push(format!("Author: {author}"));
        }
        if let Some(desc) = &self.description {
            parts.push(format!("Description: {desc}"));
        }

        if !self.headings.is_empty() {
            parts.push(format!("Headings: {}", self.headings.join(" > ")));
        }

        parts.push(String::new());
        parts.push("Content:".to_string());
        parts.push(self.content.clone());

        parts.join("\n")
    }
}

/// Truncate `text` to at most `max_chars`, snapping to the nearest word
/// boundary and appending `…` to signal truncation.
fn truncate_at_word_boundary(text: &str, max_chars: usize) -> String {
    if text.len() <= max_chars {
        return text.to_string();
    }

    // Find the last whitespace before the limit.
    let slice = &text[..max_chars];
    let cut = slice.rfind(char::is_whitespace).unwrap_or(max_chars);
    format!("{}…", &text[..cut].trim_end())
}

/// The JavaScript snippet injected into the webview to extract page content.
///
/// Returns a JSON string with keys: url, title, text, headings, description, author.
pub const EXTRACTION_SCRIPT: &str = r#"
(function() {
    // Remove unwanted elements before extracting text.
    const REMOVE_TAGS = ['script','style','nav','footer','aside','iframe',
                         'noscript','template','svg','header'];

    function cleanNode(root) {
        const clone = root.cloneNode(true);
        REMOVE_TAGS.forEach(tag => {
            clone.querySelectorAll(tag).forEach(el => el.remove());
        });
        // Also remove hidden elements.
        clone.querySelectorAll('[aria-hidden="true"],[hidden]').forEach(el => el.remove());
        return clone;
    }

    const body = cleanNode(document.body || document.documentElement);
    const textContent = (body.innerText || body.textContent || '')
        .replace(/\s{3,}/g, '\n\n')
        .trim();

    const headings = [];
    document.querySelectorAll('h1,h2,h3').forEach(h => {
        const t = h.textContent.trim();
        if (t.length > 0) headings.push(t);
    });

    const metaDesc = (document.querySelector('meta[name="description"]') ||
                      document.querySelector('meta[property="og:description"]'));
    const metaAuthor = (document.querySelector('meta[name="author"]') ||
                        document.querySelector('meta[property="article:author"]'));

    return JSON.stringify({
        url: location.href,
        title: document.title,
        text: textContent.slice(0, 200000), // 200 KB raw cap
        headings: headings.slice(0, 50),    // max 50 headings
        description: metaDesc ? metaDesc.getAttribute('content') : null,
        author: metaAuthor ? metaAuthor.getAttribute('content') : null,
    });
})();
"#;

/// Raw payload returned by the webview after running [`EXTRACTION_SCRIPT`].
#[derive(Debug, Deserialize)]
pub struct RawPageData {
    pub url: String,
    pub title: String,
    pub text: String,
    pub headings: Vec<String>,
    pub description: Option<String>,
    pub author: Option<String>,
}

impl RawPageData {
    /// Convert into a [`PageContext`], trimming content to `max_tokens`.
    pub fn into_page_context(self, max_tokens: usize) -> PageContext {
        PageContext::new(
            self.url,
            self.title,
            self.text,
            self.headings,
            self.description,
            self.author,
            max_tokens,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn truncation_at_word_boundary() {
        let text = "hello world foo bar baz";
        let result = truncate_at_word_boundary(text, 12);
        // "hello world" is 11 chars, next boundary is before "foo"
        assert!(result.starts_with("hello world"));
        assert!(result.ends_with('…'));
    }

    #[test]
    fn no_truncation_when_short() {
        let text = "short text";
        let result = truncate_at_word_boundary(text, 1000);
        assert_eq!(result, "short text");
    }

    #[test]
    fn context_has_content() {
        let ctx = PageContext::new(
            "https://example.com",
            "Test Page",
            "This is a long enough piece of content for the test.",
            vec!["Heading One".to_string()],
            None,
            None,
            4096,
        );
        assert!(ctx.has_content());
        assert!(ctx.word_count > 0);
    }

    #[test]
    fn prompt_context_includes_all_fields() {
        let ctx = PageContext::new(
            "https://example.com",
            "My Page",
            "Body text here.",
            vec!["H1 Title".to_string()],
            Some("A page about something".to_string()),
            Some("Alice".to_string()),
            4096,
        );
        let prompt = ctx.to_prompt_context();
        assert!(prompt.contains("My Page"));
        assert!(prompt.contains("Alice"));
        assert!(prompt.contains("H1 Title"));
        assert!(prompt.contains("Body text here."));
    }

    #[test]
    fn word_count_computed() {
        let ctx = PageContext::new(
            "https://x.com",
            "T",
            "one two three",
            vec![],
            None,
            None,
            4096,
        );
        assert_eq!(ctx.word_count, 3);
    }
}
