#!/usr/bin/env bash
# feedback-loop.sh -- Continuous improvement: pretrain + train + metrics
# Usage: feedback-loop.sh [--pretrain] [--train] [--report] [--full]
set -euo pipefail

ROOT="${ZIPMINATOR_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

do_pretrain() {
  echo -e "${BLUE}[1/4] Bootstrapping learning from repo...${NC}"
  npx ruflo@latest hooks pretrain --source "$ROOT" --depth 3 2>/dev/null || \
  npx claude-flow@alpha hooks pretrain --source "$ROOT" --depth 3 2>/dev/null || \
  echo -e "${YELLOW}  pretrain skipped (ruflo not available)${NC}"
}

do_train() {
  echo -e "${BLUE}[2/4] Neural training on session patterns...${NC}"
  npx ruflo@latest neural train --pattern-type all --epochs 50 2>/dev/null || \
  npx claude-flow@alpha neural train --pattern-type all --epochs 50 2>/dev/null || \
  echo -e "${YELLOW}  neural train skipped${NC}"
}

do_report() {
  echo -e "${BLUE}[3/4] Learning metrics report...${NC}"
  echo ""
  npx ruflo@latest hooks metrics 2>/dev/null || echo "  metrics: unavailable"
  echo ""
  npx ruflo@latest hooks intelligence stats 2>/dev/null || echo "  intelligence: unavailable"
  echo ""
  npx ruflo@latest neural patterns 2>/dev/null || echo "  patterns: unavailable"
}

do_analyze() {
  echo -e "${BLUE}[4/4] Analyzing session patterns...${NC}"
  LOG_FILE="$ROOT/.claude-flow/metrics/model-routing.log"
  if [ -f "$LOG_FILE" ]; then
    echo -e "${YELLOW}Model routing distribution (last 50 decisions):${NC}"
    tail -50 "$LOG_FILE" | awk '{print $2}' | sort | uniq -c | sort -rn | sed 's/^/  /'
    echo ""
    echo -e "${YELLOW}Most-routed files:${NC}"
    tail -50 "$LOG_FILE" | awk '{print $3}' | sed 's/file=//' | sort | uniq -c | sort -rn | head -5 | sed 's/^/  /'
  else
    echo "  No routing log yet. Run model-router.sh to start collecting data."
  fi
  echo ""
  echo -e "${GREEN}Feedback loop complete. Run /self-improve in Claude Code for full analysis.${NC}"
}

case "${1:---full}" in
  --pretrain) do_pretrain ;;
  --train)    do_train ;;
  --report)   do_report ;;
  --full)     do_pretrain; do_train; do_report; do_analyze ;;
  *)          echo "Usage: feedback-loop.sh [--pretrain|--train|--report|--full]" ;;
esac
