#!/usr/bin/env python3
"""Convert Claude Code JSONL sessions to HTML transcripts.

Scans all JSONL session files for the zipminator project,
converts missing ones to styled HTML, and rebuilds the index.
"""

import json
import os
import sys
import html
from datetime import datetime, timezone
from pathlib import Path

PROJECT_DIR = Path("/Users/mos/dev/qdaria/zipminator")
SESSIONS_DIR = Path.home() / ".claude/projects/-Users-mos-dev-qdaria-zipminator"
OUTPUT_DIR = PROJECT_DIR / "docs/guides/session-transcripts"

CSS = """body{font-family:'DM Sans',-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:20px;background:#0a0a0f;color:#e0e0e0}
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
@media print{body{background:#fff;color:#000}.msg{border:1px solid #ccc}}"""


def escape(text):
    """HTML-escape text, truncating extremely long content."""
    if text is None:
        return ""
    text = str(text)
    if len(text) > 50000:
        text = text[:50000] + "\n... (truncated)"
    return html.escape(text)


def extract_text_from_content(content):
    """Extract displayable text from message content (string or list)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text":
                    parts.append(block.get("text", ""))
                elif block.get("type") == "thinking":
                    # Return thinking separately
                    pass
                elif block.get("type") == "tool_use":
                    name = block.get("name", "tool")
                    inp = block.get("input", {})
                    if isinstance(inp, dict):
                        summary = ", ".join(f"{k}: {str(v)[:80]}" for k, v in inp.items() if k not in ("content",))
                    else:
                        summary = str(inp)[:200]
                    parts.append(f"[TOOL: {name}({summary})]")
                elif block.get("type") == "tool_result":
                    result_content = block.get("content", "")
                    if isinstance(result_content, list):
                        for rc in result_content:
                            if isinstance(rc, dict) and rc.get("type") == "text":
                                parts.append(rc.get("text", "")[:2000])
                    elif isinstance(result_content, str):
                        parts.append(result_content[:2000])
            elif isinstance(block, str):
                parts.append(block)
        return "\n".join(parts)
    return str(content)


def extract_thinking(content):
    """Extract thinking blocks from content list."""
    if not isinstance(content, list):
        return None
    for block in content:
        if isinstance(block, dict) and block.get("type") == "thinking":
            return block.get("thinking", "")
    return None


def extract_tool_uses(content):
    """Extract tool use blocks from content list."""
    tools = []
    if not isinstance(content, list):
        return tools
    for block in content:
        if isinstance(block, dict) and block.get("type") == "tool_use":
            name = block.get("name", "tool")
            inp = block.get("input", {})
            if isinstance(inp, dict):
                summary = ", ".join(f"{k}: {str(v)[:120]}" for k, v in inp.items() if k not in ("content",))
            else:
                summary = str(inp)[:300]
            tools.append((name, summary))
    return tools


def parse_session(jsonl_path):
    """Parse a JSONL session file into structured data."""
    messages = []
    session_id = jsonl_path.stem
    first_ts = None
    first_user_msg = None
    msg_counts = {"human": 0, "assistant": 0}

    with open(jsonl_path, "r", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            entry_type = entry.get("type", "")

            # Skip non-message types
            if entry_type in ("permission-mode", "file-history-snapshot", "summary"):
                continue

            # Handle user/assistant messages
            if entry_type in ("user", "human"):
                msg = entry.get("message", {})
                content = msg.get("content", "")
                ts = entry.get("timestamp", "")
                if first_ts is None and ts:
                    first_ts = ts
                text = extract_text_from_content(content)
                if first_user_msg is None and text.strip():
                    first_user_msg = text.strip()[:120]
                messages.append({"role": "human", "text": text, "ts": ts})
                msg_counts["human"] += 1

            elif entry_type == "assistant":
                msg = entry.get("message", {})
                content = msg.get("content", "")
                ts = entry.get("timestamp", "")

                # Extract thinking
                thinking = extract_thinking(content)
                if thinking:
                    messages.append({"role": "thinking", "text": thinking, "ts": ts})

                # Extract tool uses
                tools = extract_tool_uses(content)
                for name, summary in tools:
                    messages.append({"role": "tool", "text": f"[{name}] {summary}", "ts": ts})

                # Extract text content
                text = extract_text_from_content(content)
                # Remove tool annotations from text
                clean_lines = [l for l in text.split("\n") if not l.startswith("[TOOL:")]
                clean_text = "\n".join(clean_lines).strip()
                if clean_text:
                    messages.append({"role": "assistant", "text": clean_text, "ts": ts})
                    msg_counts["assistant"] += 1

            elif entry_type == "tool_result":
                content = entry.get("content", "")
                text = extract_text_from_content(content)
                if text.strip():
                    messages.append({"role": "tool_result", "text": text[:3000], "ts": ""})

    return {
        "session_id": session_id,
        "first_ts": first_ts,
        "first_user_msg": first_user_msg or "(no user message)",
        "messages": messages,
        "msg_counts": msg_counts,
        "size_kb": jsonl_path.stat().st_size // 1024,
    }


def render_html(session_data):
    """Render session data to HTML string."""
    sid = session_data["session_id"]
    first_ts = session_data["first_ts"] or ""
    title_msg = session_data["first_user_msg"]

    # Parse date
    date_str = "unknown"
    if first_ts:
        try:
            dt = datetime.fromisoformat(first_ts.replace("Z", "+00:00"))
            date_str = dt.strftime("%Y-%m-%d %H:%M")
        except Exception:
            date_str = first_ts[:16]

    date_prefix = date_str[:10] if date_str != "unknown" else "unknown"

    parts = [
        '<!DOCTYPE html><html><head><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
        f'<title>{date_prefix} | {escape(title_msg[:80])}</title><style>',
        CSS,
        '</style></head><body>',
        f'<h1>{date_prefix} — {escape(title_msg[:100])}</h1>',
        f'<div class="meta">Session: <code>{sid}</code><br>Started: {date_str}<br>',
        f'Resume: <code>claude --resume {sid}</code></div>',
    ]

    for msg in session_data["messages"]:
        role = msg["role"]
        text = msg["text"]

        if role == "human":
            parts.append(f'<div class="msg human"><div class="role">You</div>{escape(text)}</div>')
        elif role == "assistant":
            # Convert markdown code blocks to <pre>
            escaped = escape(text)
            # Simple code block rendering
            parts.append(f'<div class="msg assistant"><div class="role">Claude</div>{escaped}</div>')
        elif role == "thinking":
            truncated = text[:500] + "..." if len(text) > 500 else text
            parts.append(f'<div class="msg thinking"><div class="role">Thinking</div>{escape(truncated)}</div>')
        elif role == "tool":
            parts.append(f'<div class="tool">{escape(text)}</div>')
        elif role == "tool_result":
            parts.append(f'<div class="msg human"><div class="role">You</div><div class="tool">[Result] <pre>{escape(text)}</pre></div></div>')

    parts.append('</body></html>')
    return "\n".join(parts)


def get_existing_transcript_ids():
    """Get set of session IDs that already have transcripts."""
    ids = set()
    for f in OUTPUT_DIR.glob("*.html"):
        name = f.stem
        if name == "index":
            continue
        # Handle both formats: short-id and date-prefix-id
        if "-" in name and name[:4].isdigit():
            # Format: 2026-04-08-19a07601 -> extract the UUID part
            parts = name.split("-")
            if len(parts) >= 4:
                # Could be a short ID or full UUID start
                potential_id = "-".join(parts[3:])
                ids.add(potential_id)
                ids.add(name)
        else:
            # Short hex ID like cd54459b
            ids.add(name)
    return ids


def session_id_has_transcript(session_id, existing_ids):
    """Check if a session ID (full UUID) already has a transcript."""
    short = session_id[:8]
    for eid in existing_ids:
        if eid == short or eid.startswith(short) or session_id.startswith(eid):
            return True
    # Also check for date-prefixed files
    for f in OUTPUT_DIR.glob(f"*{short}*.html"):
        return True
    return False


def build_index(all_sessions):
    """Build the index.html file listing all sessions."""
    # Sort by date, newest first
    all_sessions.sort(key=lambda s: s.get("first_ts", "") or "", reverse=True)

    rows = []
    for s in all_sessions:
        sid = s["session_id"]
        short = sid[:8]
        ts = s.get("first_ts", "")
        date_str = "unknown"
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                date_str = dt.strftime("%Y-%m-%d %H:%M")
            except Exception:
                date_str = ts[:16]

        h = s["msg_counts"]["human"]
        a = s["msg_counts"]["assistant"]
        sz = s["size_kb"]
        fname = s.get("filename", f"{short}.html")
        title = escape(s["first_user_msg"][:60])

        rows.append(
            f'<tr><td>{date_str}</td><td><code>{short}</code></td>'
            f'<td title="{title}">{h}+{a}</td><td>{sz}KB</td>'
            f'<td><a href="{fname}">Open</a></td></tr>'
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    index_html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Zipminator Sessions</title><style>
{CSS}
table{{width:100%;border-collapse:collapse}}
th,td{{padding:8px 12px;text-align:left;border-bottom:1px solid #222}}
th{{color:#22d3ee;font-size:.85em}}tr:hover{{background:#1a1a2e}}
</style></head><body>
<h1>Zipminator Session Transcripts</h1>
<div class="meta">Generated: {now}<br>{len(all_sessions)} sessions</div>
<table><tr><th>Time</th><th>ID</th><th>Msgs</th><th>Size</th><th></th></tr>
{"".join(rows)}
</table>
</body></html>"""
    return index_html


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Find all session JSONL files (not agent files)
    jsonl_files = sorted(
        [f for f in SESSIONS_DIR.glob("*.jsonl") if not f.name.startswith("agent-")],
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )

    print(f"Found {len(jsonl_files)} session JSONL files")

    # Get existing transcript IDs
    existing_ids = get_existing_transcript_ids()
    print(f"Found {len(existing_ids)} existing transcripts")

    # Filter to sessions that need conversion (> 5KB to skip trivial ones)
    min_size = 5 * 1024  # 5KB minimum
    to_convert = []
    already_have = []

    for f in jsonl_files:
        sid = f.stem
        if f.stat().st_size < min_size:
            continue
        if session_id_has_transcript(sid, existing_ids):
            already_have.append(f)
        else:
            to_convert.append(f)

    print(f"Sessions to convert: {len(to_convert)}")
    print(f"Sessions already have transcripts: {len(already_have)}")

    # Convert missing sessions
    all_session_meta = []
    converted = 0

    for jsonl_path in to_convert:
        sid = jsonl_path.stem
        short = sid[:8]
        print(f"  Converting {short}... ({jsonl_path.stat().st_size // 1024}KB)", end="", flush=True)

        try:
            session_data = parse_session(jsonl_path)

            # Determine filename
            ts = session_data.get("first_ts", "")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    date_prefix = dt.strftime("%Y-%m-%d")
                    fname = f"{date_prefix}-{short}.html"
                except Exception:
                    fname = f"{short}.html"
            else:
                fname = f"{short}.html"

            session_data["filename"] = fname

            html_content = render_html(session_data)
            out_path = OUTPUT_DIR / fname
            out_path.write_text(html_content, encoding="utf-8")

            all_session_meta.append(session_data)
            converted += 1
            print(f" -> {fname} ({len(session_data['messages'])} msgs)")

        except Exception as e:
            print(f" ERROR: {e}")

    # Also collect metadata from existing transcripts for the index
    for jsonl_path in already_have:
        sid = jsonl_path.stem
        try:
            # Quick parse just for metadata
            first_ts = None
            first_user_msg = None
            human_count = 0
            assistant_count = 0

            with open(jsonl_path, "r", errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    entry_type = entry.get("type", "")
                    if entry_type in ("user", "human"):
                        human_count += 1
                        ts = entry.get("timestamp", "")
                        if first_ts is None and ts:
                            first_ts = ts
                        msg = entry.get("message", {})
                        content = msg.get("content", "")
                        if first_user_msg is None:
                            text = extract_text_from_content(content)
                            if text.strip():
                                first_user_msg = text.strip()[:120]
                    elif entry_type == "assistant":
                        assistant_count += 1

            short = sid[:8]
            # Find existing filename
            fname = f"{short}.html"
            for f in OUTPUT_DIR.glob(f"*{short}*.html"):
                fname = f.name
                break

            all_session_meta.append({
                "session_id": sid,
                "first_ts": first_ts,
                "first_user_msg": first_user_msg or "(no user message)",
                "msg_counts": {"human": human_count, "assistant": assistant_count},
                "size_kb": jsonl_path.stat().st_size // 1024,
                "filename": fname,
            })
        except Exception:
            pass

    # Rebuild index
    print(f"\nRebuilding index with {len(all_session_meta)} sessions...")
    index_html = build_index(all_session_meta)
    (OUTPUT_DIR / "index.html").write_text(index_html, encoding="utf-8")

    print(f"\nDone! Converted {converted} new sessions.")
    print(f"Total sessions in index: {len(all_session_meta)}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
