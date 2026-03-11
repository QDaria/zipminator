#!/usr/bin/env bash
#
# prepare-release.sh -- Prepare Zipminator for a tagged release
#
# Usage:
#   ./scripts/prepare-release.sh [version]
#
# Example:
#   ./scripts/prepare-release.sh 1.0.0-beta.1
#
# What it does:
#   1. Validates the environment (tools, clean git state)
#   2. Runs the full test suite (Rust, Flutter, Web, Mobile)
#   3. Optionally bumps version numbers across all manifests
#   4. Builds release artifacts (Rust, Flutter, Web)
#   5. Generates a changelog from git log
#   6. Prints a summary with checksums
#
# What it does NOT do:
#   - Create git tags
#   - Push to remote
#   - Create GitHub releases
#   Those steps are intentionally manual.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-}"
DRY_RUN="${DRY_RUN:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[release]${NC} $*"; }
ok()   { echo -e "${GREEN}[  OK  ]${NC} $*"; }
warn() { echo -e "${YELLOW}[ WARN ]${NC} $*"; }
fail() { echo -e "${RED}[FAILED]${NC} $*"; exit 1; }

# ---------- 0. Parse args ----------

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    echo "  e.g. $0 1.0.0-beta.1"
    exit 1
fi

log "Preparing Zipminator v${VERSION}"
log "Repo root: ${REPO_ROOT}"
echo ""

# ---------- 1. Environment checks ----------

log "Checking prerequisites..."

command -v cargo   >/dev/null 2>&1 || fail "cargo not found"
command -v flutter >/dev/null 2>&1 || fail "flutter not found"
command -v node    >/dev/null 2>&1 || fail "node not found"
command -v npm     >/dev/null 2>&1 || fail "npm not found"
command -v git     >/dev/null 2>&1 || fail "git not found"

ok "All required tools found"

cd "$REPO_ROOT"

# Check for uncommitted changes (warn but do not block)
if ! git diff --quiet HEAD 2>/dev/null; then
    warn "Working tree has uncommitted changes"
fi

CURRENT_BRANCH=$(git branch --show-current)
log "Current branch: ${CURRENT_BRANCH}"
echo ""

# ---------- 2. Run test suite ----------

TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local name="$1"
    shift
    log "Running: ${name}"
    if "$@" 2>&1; then
        ok "${name}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        warn "${name} FAILED (continuing)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

if [ "$SKIP_TESTS" != "true" ]; then
    log "=== Test Suite ==="
    echo ""

    run_test "Rust workspace tests" cargo test --workspace --manifest-path "${REPO_ROOT}/Cargo.toml"

    run_test "Flutter analyze" flutter analyze --no-fatal-infos "${REPO_ROOT}/app"

    run_test "Flutter tests" flutter test "${REPO_ROOT}/app"

    run_test "Web build" bash -c "cd '${REPO_ROOT}/web' && npm run build"

    # Web vitest (if available)
    if [ -f "${REPO_ROOT}/web/node_modules/.bin/vitest" ]; then
        run_test "Web vitest" bash -c "cd '${REPO_ROOT}/web' && npx vitest run"
    fi

    # Mobile tests (if node_modules exist)
    if [ -d "${REPO_ROOT}/mobile/node_modules" ]; then
        run_test "Mobile tests" bash -c "cd '${REPO_ROOT}/mobile' && npm test -- --passWithNoTests"
    fi

    log "Test summary: ${TESTS_PASSED} passed, ${TESTS_FAILED} failed"
    if [ "$TESTS_FAILED" -gt 0 ]; then
        warn "Some tests failed. Review before tagging."
    fi
    echo ""
else
    warn "Tests skipped (SKIP_TESTS=true)"
    echo ""
fi

# ---------- 3. Bump version numbers ----------

bump_version() {
    local file="$1"
    local pattern="$2"
    local replacement="$3"

    if [ ! -f "$file" ]; then
        warn "File not found: ${file}"
        return
    fi

    if [ "$DRY_RUN" = "true" ]; then
        log "[dry-run] Would update ${file}: ${pattern} -> ${replacement}"
        return
    fi

    if grep -q "$pattern" "$file" 2>/dev/null; then
        sed -i '' "s|${pattern}|${replacement}|g" "$file"
        ok "Updated ${file}"
    else
        warn "Pattern not found in ${file}: ${pattern}"
    fi
}

log "=== Version Bump ==="
echo ""

# Rust workspace (Cargo.toml)
bump_version "${REPO_ROOT}/Cargo.toml" \
    'version = "1.0.0"' \
    "version = \"${VERSION}\""

# Tauri browser Cargo.toml
bump_version "${REPO_ROOT}/browser/src-tauri/Cargo.toml" \
    'version = "0.1.0"' \
    "version = \"0.1.0-beta.1\""

# Tauri config
bump_version "${REPO_ROOT}/browser/src-tauri/tauri.conf.json" \
    '"version": "0.2.0"' \
    "\"version\": \"0.2.0-beta.1\""

# Web package.json
bump_version "${REPO_ROOT}/web/package.json" \
    '"version": "1.0.0"' \
    "\"version\": \"${VERSION}\""

# Flutter pubspec.yaml
bump_version "${REPO_ROOT}/app/pubspec.yaml" \
    'version: 1.0.0+1' \
    "version: ${VERSION}+1"

# Mobile package.json
bump_version "${REPO_ROOT}/mobile/package.json" \
    '"version": "1.0.0"' \
    "\"version\": \"${VERSION}\""

echo ""

# ---------- 4. Build release artifacts ----------

log "=== Build Artifacts ==="
echo ""

ARTIFACTS=()

# Rust release build
log "Building Rust (release)..."
if cargo build --release --manifest-path "${REPO_ROOT}/Cargo.toml" 2>&1; then
    ok "Rust release build"
else
    warn "Rust release build failed"
fi

# Check for existing DMG
DMG_PATH="${REPO_ROOT}/target/release/bundle/dmg/Zipminator_0.2.0_aarch64.dmg"
if [ -f "$DMG_PATH" ]; then
    ARTIFACTS+=("$DMG_PATH")
    ok "DMG found: ${DMG_PATH} ($(du -h "$DMG_PATH" | cut -f1))"
else
    warn "DMG not found at ${DMG_PATH}. Run Tauri build separately if needed."
fi

# Flutter build (macOS)
log "Building Flutter (macOS release)..."
if (cd "${REPO_ROOT}/app" && flutter build macos --release) 2>&1; then
    MACOS_APP="${REPO_ROOT}/app/build/macos/Build/Products/Release/zipminator.app"
    if [ -d "$MACOS_APP" ]; then
        ARTIFACTS+=("$MACOS_APP")
        ok "Flutter macOS app: ${MACOS_APP}"
    fi
else
    warn "Flutter macOS build failed"
fi

# Web build (already done in test step, just verify)
WEB_BUILD="${REPO_ROOT}/web/.next"
if [ -d "$WEB_BUILD" ]; then
    ok "Web build exists: ${WEB_BUILD}"
fi

echo ""

# ---------- 5. Generate changelog ----------

log "=== Changelog ==="
echo ""

CHANGELOG_FILE="${REPO_ROOT}/docs/releases/CHANGELOG-v${VERSION}.md"

{
    echo "# Changelog for v${VERSION}"
    echo ""
    echo "Generated: $(date -u '+%Y-%m-%d %H:%M UTC')"
    echo "Branch: ${CURRENT_BRANCH}"
    echo "Commit: $(git rev-parse --short HEAD)"
    echo ""
    echo "## Commits"
    echo ""
    git log --oneline --since="2026-01-01" --format="- %h %s"
    echo ""
    echo "## Stats"
    echo ""
    echo "- Total commits since 2026-01-01: $(git log --oneline --since="2026-01-01" | wc -l | tr -d ' ')"
    echo "- Files changed: $(git diff --stat HEAD~27 HEAD 2>/dev/null | tail -1 || echo 'N/A')"
    echo ""
} > "$CHANGELOG_FILE"

ok "Changelog written to: ${CHANGELOG_FILE}"
echo ""

# ---------- 6. Summary ----------

log "=== Release Summary ==="
echo ""
echo "  Version:     v${VERSION}"
echo "  Branch:      ${CURRENT_BRANCH}"
echo "  Commit:      $(git rev-parse --short HEAD)"
echo "  Tests:       ${TESTS_PASSED} passed, ${TESTS_FAILED} failed"
echo ""

if [ ${#ARTIFACTS[@]} -gt 0 ]; then
    echo "  Artifacts:"
    for artifact in "${ARTIFACTS[@]}"; do
        if [ -f "$artifact" ]; then
            CHECKSUM=$(shasum -a 256 "$artifact" | cut -d' ' -f1)
            SIZE=$(du -h "$artifact" | cut -f1)
            echo "    ${artifact}"
            echo "      Size:   ${SIZE}"
            echo "      SHA256: ${CHECKSUM}"
        elif [ -d "$artifact" ]; then
            echo "    ${artifact} (directory)"
        fi
    done
    echo ""
fi

echo "  Files to bump (if DRY_RUN was true, re-run without it):"
echo "    - Cargo.toml (workspace version)"
echo "    - browser/src-tauri/Cargo.toml"
echo "    - browser/src-tauri/tauri.conf.json"
echo "    - web/package.json"
echo "    - app/pubspec.yaml"
echo "    - mobile/package.json"
echo ""

log "Next steps (manual):"
echo "  1. Review version bumps: git diff"
echo "  2. Commit: git commit -am 'chore: bump version to v${VERSION}'"
echo "  3. Tag:    git tag -a v${VERSION} -m 'Zipminator v${VERSION}'"
echo "  4. Push:   git push origin main --tags"
echo "  5. Create GitHub release: gh release create v${VERSION} --title 'v${VERSION}' --notes-file docs/releases/v${VERSION}.md"
if [ -f "$DMG_PATH" ]; then
    echo "  6. Upload DMG: gh release upload v${VERSION} '${DMG_PATH}'"
fi
echo ""
ok "Release preparation complete."
