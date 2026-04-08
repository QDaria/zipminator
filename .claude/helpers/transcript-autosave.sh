#!/usr/bin/env bash
# transcript-autosave.sh — Append each exchange to a growing HTML transcript
# Called from .claude/settings.json Stop hook
# Output: docs/guides/session-transcripts/YYYY-MM-DD-<session-id>.html
set -euo pipefail

ROOT="${ZIPMINATOR_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
TRANSCRIPT_DIR="$ROOT/docs/guides/session-transcripts"
OFFSET_DIR="$HOME/.claude/session-data"

# ─── Read stdin JSON (Claude Code pipes hook context) ───────────────
INPUT=$(timeout 2 cat 2>/dev/null || true)

# ─── Find the JSONL transcript file ─────────────────────────────────
TRANSCRIPT_PATH=""
if [ -n "$INPUT" ]; then
  TRANSCRIPT_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('transcript_path', d.get('session_id', '')))
except: pass
" 2>/dev/null || true)
fi

# Fallback: find by session ID in project dir
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  PROJECT_KEY=$(echo "$ROOT" | sed 's|^/||' | tr '/' '-')
  SESSION_DIR="$HOME/.claude/projects/-${PROJECT_KEY}"
  if [ -d "$SESSION_DIR" ]; then
    TRANSCRIPT_PATH=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1 || true)
  fi
fi

# Last fallback: check CLAUDE_SESSION_ID env
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  if [ -n "${CLAUDE_SESSION_ID:-}" ]; then
    PROJECT_KEY=$(echo "$ROOT" | sed 's|^/||' | tr '/' '-')
    TRANSCRIPT_PATH="$HOME/.claude/projects/-${PROJECT_KEY}/${CLAUDE_SESSION_ID}.jsonl"
  fi
fi

[ -z "$TRANSCRIPT_PATH" ] && exit 0
[ ! -f "$TRANSCRIPT_PATH" ] && exit 0

# ─── Derive session ID and output file ──────────────────────────────
SESSION_ID=$(basename "$TRANSCRIPT_PATH" .jsonl)
SHORT_ID=$(echo "$SESSION_ID" | cut -c1-8)
TODAY=$(date +%Y-%m-%d)

# Check if an HTML file for this session already exists (handles date rollover)
EXISTING=$(ls "$TRANSCRIPT_DIR"/*-"${SHORT_ID}.html" 2>/dev/null | head -1 || true)
if [ -n "$EXISTING" ]; then
  HTML_FILE="$EXISTING"
else
  HTML_FILE="$TRANSCRIPT_DIR/${TODAY}-${SHORT_ID}.html"
fi

OFFSET_FILE="$OFFSET_DIR/${SESSION_ID}.transcript-html-offset"

mkdir -p "$TRANSCRIPT_DIR" "$OFFSET_DIR"

# ─── Check offset (skip already-processed lines) ────────────────────
OFFSET=0
[ -f "$OFFSET_FILE" ] && OFFSET=$(cat "$OFFSET_FILE" 2>/dev/null || echo 0)

TOTAL=$(wc -l < "$TRANSCRIPT_PATH" 2>/dev/null | tr -d ' ')
[ "$TOTAL" -le "$OFFSET" ] && exit 0  # No new lines

# ─── Process new lines with python3 ─────────────────────────────────
FRAGMENT=$(tail -n +"$((OFFSET + 1))" "$TRANSCRIPT_PATH" | python3 -c '
import sys, json, html as h

def esc(s):
    """HTML-escape and convert newlines to <br>."""
    if not s:
        return ""
    s = h.escape(str(s))
    # Convert markdown code fences to <pre><code>
    import re
    def code_block(m):
        lang = m.group(1) or ""
        code = m.group(2)
        return f"<pre><code>{code}</code></pre>"
    s = re.sub(r"```(\w*)\n(.*?)```", code_block, s, flags=re.DOTALL)
    # Convert inline code
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = s.replace("\n", "<br>")
    return s

def fmt_tool(name, inp):
    """Format a tool_use block."""
    if isinstance(inp, dict):
        # Show key params, truncate long values
        parts = []
        for k, v in inp.items():
            sv = str(v)
            if len(sv) > 200:
                sv = sv[:200] + "..."
            parts.append(f"{k}: {sv}")
        detail = ", ".join(parts[:5])
    else:
        detail = str(inp)[:300]
    return f"<div class=\"tool\">[{h.escape(name)}] <code>{h.escape(detail)}</code></div>"

def fmt_tool_result(content):
    """Format a tool_result block."""
    text = ""
    if isinstance(content, list):
        for c in content:
            if isinstance(c, dict) and c.get("type") == "text":
                text += c.get("text", "")
    elif isinstance(content, str):
        text = content
    if len(text) > 2000:
        text = text[:2000] + "\n... (truncated)"
    return f"<div class=\"tool\">[Result] <pre>{h.escape(text)}</pre></div>"

fragments = []
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        msg = json.loads(line)
    except json.JSONDecodeError:
        continue

    msg_type = msg.get("type", "")

    # Human message
    if msg_type == "human" or (msg_type == "user"):
        role_data = msg.get("message", msg)
        if role_data.get("role") == "user":
            content = role_data.get("content", "")
            if isinstance(content, list):
                texts = []
                for c in content:
                    if isinstance(c, dict):
                        if c.get("type") == "text":
                            texts.append(c.get("text", ""))
                        elif c.get("type") == "tool_result":
                            texts.append(fmt_tool_result(c.get("content", "")))
                content = "<br>".join(texts) if texts else ""
            else:
                content = esc(content)
            if content:
                fragments.append(f"<div class=\"msg human\"><div class=\"role\">You</div>{content}</div>")

    # Assistant message
    elif msg_type == "assistant":
        role_data = msg.get("message", msg)
        if role_data.get("role") == "assistant":
            content_parts = role_data.get("content", [])
            if isinstance(content_parts, str):
                fragments.append(f"<div class=\"msg assistant\"><div class=\"role\">Claude</div>{esc(content_parts)}</div>")
            elif isinstance(content_parts, list):
                for part in content_parts:
                    if not isinstance(part, dict):
                        continue
                    ptype = part.get("type", "")
                    if ptype == "text":
                        text = part.get("text", "")
                        if text.strip():
                            fragments.append(f"<div class=\"msg assistant\"><div class=\"role\">Claude</div>{esc(text)}</div>")
                    elif ptype == "thinking":
                        fragments.append("<div class=\"msg thinking\"><div class=\"role\">Thinking</div>...</div>")
                    elif ptype == "tool_use":
                        fragments.append(fmt_tool(part.get("name", "tool"), part.get("input", {})))
                    elif ptype == "tool_result":
                        fragments.append(fmt_tool_result(part.get("content", "")))

if fragments:
    print("\n".join(fragments))
' 2>/dev/null || true)

# Nothing new to write
[ -z "$FRAGMENT" ] && { echo "$TOTAL" > "$OFFSET_FILE"; exit 0; }

# ─── Create or append HTML ──────────────────────────────────────────
if [ ! -f "$HTML_FILE" ]; then
  # Extract first user message for title (first 80 chars)
  FIRST_MSG=$(echo "$FRAGMENT" | python3 -c "
import sys, re
for line in sys.stdin:
    m = re.search(r'class=\"role\">You</div>(.*?)</div>', line)
    if m:
        text = re.sub(r'<[^>]+>', '', m.group(1))[:80]
        print(text)
        break
" 2>/dev/null || echo "Session $SHORT_ID")

  # Write full HTML document
  cat > "$HTML_FILE" << HTMLEOF
<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${TODAY} | ${FIRST_MSG}</title><style>
body{font-family:'DM Sans',-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:20px;background:#0a0a0f;color:#e0e0e0}
h1{color:#22d3ee;font-size:1.4em;border-bottom:1px solid #333;padding-bottom:10px}
.meta{color:#888;font-size:.85em;margin-bottom:20px}
.msg{margin:16px 0;padding:12px 16px;border-radius:8px;overflow-wrap:break-word}
.human{background:#1a1a2e;border-left:3px solid #22d3ee}
.assistant{background:#111118;border-left:3px solid #34d399}
.system{background:#0d0d14;border-left:3px solid #555;color:#777;font-size:.8em;max-height:60px;overflow:hidden;cursor:pointer}
.system:hover{max-height:none}
.thinking{background:#0d0d1a;border-left:3px solid #a78bfa;color:#999;font-size:.85em;max-height:80px;overflow:hidden;cursor:pointer}
.thinking:hover{max-height:none}
.role{font-weight:700;font-size:.75em;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.human .role{color:#22d3ee}.assistant .role{color:#34d399}.system .role{color:#666}.thinking .role{color:#a78bfa}
pre{background:#0d0d14;padding:10px;border-radius:4px;overflow-x:auto;font-size:.85em;white-space:pre-wrap}
code{font-family:'JetBrains Mono',monospace}
.tool{color:#f59e0b;font-size:.8em;margin:4px 0;padding:6px;background:#0d0d14;border-radius:4px}
a{color:#22d3ee}
@media print{body{background:#fff;color:#000}.msg{border:1px solid #ccc}}
</style></head><body>
<h1>${TODAY} — ${FIRST_MSG}</h1>
<div class="meta">Session: <code>${SESSION_ID}</code><br>Started: $(date '+%Y-%m-%d %H:%M')<br>
Resume: <code>claude --resume ${SESSION_ID}</code></div>
${FRAGMENT}
</body></html>
HTMLEOF

else
  # Append: remove closing tags, add fragment, re-close
  # Use python for reliable multiline handling
  python3 -c "
import sys
html_file = sys.argv[1]
fragment = sys.argv[2]
with open(html_file, 'r') as f:
    content = f.read()
# Remove closing tags
content = content.rstrip()
if content.endswith('</html>'):
    content = content[:-7].rstrip()
if content.endswith('</body>'):
    content = content[:-7].rstrip()
# Append
with open(html_file, 'w') as f:
    f.write(content)
    f.write('\n')
    f.write(fragment)
    f.write('\n</body></html>\n')
" "$HTML_FILE" "$FRAGMENT" 2>/dev/null || true
fi

# ─── Update offset ──────────────────────────────────────────────────
echo "$TOTAL" > "$OFFSET_FILE"
