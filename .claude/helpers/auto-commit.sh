#!/usr/bin/env bash
# auto-commit.sh — Auto-commit modified tracked files on session Stop
# Safety: only stages tracked files, never pushes, skips if nothing changed
# Called from .claude/settings.json Stop hook
set -euo pipefail

ROOT="${ZIPMINATOR_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT"

# ─── Guard: skip if no changes at all ────────────────────────────────
CHANGED=$(git diff --name-only 2>/dev/null || true)
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null || true)

if [ -z "$CHANGED" ] && [ -z "$STAGED" ] && [ -z "$UNTRACKED" ]; then
  echo "auto-commit: no changes to commit"
  exit 0
fi

# ─── Stage tracked modifications ─────────────────────────────────────
git add -u -- . 2>/dev/null || true

# ─── Stage new untracked source files (code + docs only) ─────────────
echo "$UNTRACKED" | grep -E '\.(rs|py|dart|ts|tsx|js|jsx|toml|yaml|yml|json|sh|sql|html|css|scss|md|txt|cfg|ini)$' \
  | while IFS= read -r f; do
    [ -n "$f" ] && git add "$f" 2>/dev/null || true
  done

# Step 2: unstage files matching exclude patterns (binaries, caches, secrets, generated)
# Using git reset on pathspecs is more reliable than git add exclude globs
UNSTAGE_PATTERNS=(
  '*.lock'    '*.bin'     '*.png'     '*.jpg'     '*.svg'
  '*.dmg'     '*.whl'     '*.so'      '*.dylib'
  '.env'      '*.key'     '*.pem'
  'local.properties'      'key.properties*'
  '*/.gradle/*'            '*/.mypy_cache/*'        '*/__pycache__/*'
  '*/node_modules/*'       '*/build/*'              'target/*'
  '*/.playwright-mcp/*'    '_archive/*'             '_screenshots/*'
  '*/*.xcuserdatad/*'      '*/Pods/*'               '*/ephemeral/*'
  '*/e2e/screenshots/*'    'web/landing-page/*'    'web/test-results/*'
  '*/Podfile.lock'         '*/pubspec.lock'        '.playwright-mcp/*'
)
for pat in "${UNSTAGE_PATTERNS[@]}"; do
  git reset HEAD -- "$pat" 2>/dev/null || true
done

# Check if anything actually got staged
STAGED_NOW=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$STAGED_NOW" ]; then
  echo "auto-commit: nothing to stage after filtering"
  exit 0
fi

# ─── Count files by type for commit message ──────────────────────────
COUNT=$(echo "$STAGED_NOW" | wc -l | tr -d ' ')
RUST_COUNT=$(echo "$STAGED_NOW" | grep -c '\.rs$' || true)
PY_COUNT=$(echo "$STAGED_NOW" | grep -c '\.py$' || true)
DART_COUNT=$(echo "$STAGED_NOW" | grep -c '\.dart$' || true)
TS_COUNT=$(echo "$STAGED_NOW" | grep -c '\.\(ts\|tsx\)$' || true)
OTHER_COUNT=$((COUNT - RUST_COUNT - PY_COUNT - DART_COUNT - TS_COUNT))

# Build scope from dominant language
SCOPE=""
if [ "$RUST_COUNT" -gt 0 ] && [ "$RUST_COUNT" -ge "$PY_COUNT" ] && [ "$RUST_COUNT" -ge "$DART_COUNT" ] && [ "$RUST_COUNT" -ge "$TS_COUNT" ]; then
  SCOPE="rust"
elif [ "$PY_COUNT" -gt 0 ] && [ "$PY_COUNT" -ge "$RUST_COUNT" ] && [ "$PY_COUNT" -ge "$DART_COUNT" ] && [ "$PY_COUNT" -ge "$TS_COUNT" ]; then
  SCOPE="python"
elif [ "$DART_COUNT" -gt 0 ] && [ "$DART_COUNT" -ge "$RUST_COUNT" ] && [ "$DART_COUNT" -ge "$PY_COUNT" ] && [ "$DART_COUNT" -ge "$TS_COUNT" ]; then
  SCOPE="flutter"
elif [ "$TS_COUNT" -gt 0 ]; then
  SCOPE="web"
fi

# If multiple languages, use "multi"
LANG_COUNT=0
[ "$RUST_COUNT" -gt 0 ] && LANG_COUNT=$((LANG_COUNT + 1))
[ "$PY_COUNT" -gt 0 ] && LANG_COUNT=$((LANG_COUNT + 1))
[ "$DART_COUNT" -gt 0 ] && LANG_COUNT=$((LANG_COUNT + 1))
[ "$TS_COUNT" -gt 0 ] && LANG_COUNT=$((LANG_COUNT + 1))
[ "$LANG_COUNT" -gt 2 ] && SCOPE="multi"

# Format scope
[ -n "$SCOPE" ] && SCOPE="(${SCOPE})"

# ─── Commit ──────────────────────────────────────────────────────────
COMMIT_MSG="chore${SCOPE}: auto-commit ${COUNT} files from session

Files: ${RUST_COUNT} rs, ${PY_COUNT} py, ${DART_COUNT} dart, ${TS_COUNT} ts/tsx, ${OTHER_COUNT} other

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git commit -m "$COMMIT_MSG" 2>/dev/null || {
  echo "auto-commit: commit failed (pre-commit hook?), skipping"
  git reset HEAD -- . 2>/dev/null || true
  exit 0
}

echo "auto-commit: committed ${COUNT} files"
