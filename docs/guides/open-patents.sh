#!/bin/bash
# Open patent HTML files for Cmd+P PDF generation
# Usage:
#   ./docs/guides/open-patents.sh          # Open ALL patents (all tabs)
#   ./docs/guides/open-patents.sh 1        # Patent 1 only
#   ./docs/guides/open-patents.sh 2        # Patent 2 only
#   ./docs/guides/open-patents.sh 3        # Patent 3 only

DIR="$(cd "$(dirname "$0")/../ip" && pwd)"

open_patent() {
  local p="$1"
  local dir="$DIR/$p"
  echo "Opening $p..."
  for f in "$dir"/sammendrag.html "$dir"/beskrivelse.html "$dir"/patentkrav.html "$dir"/provisional-*.html; do
    [ -f "$f" ] && open "$f"
  done
  # Also open fax cover if it exists (Patent 1 only)
  [ -f "$dir/uspto-fax-cover-sheet.html" ] && open "$dir/uspto-fax-cover-sheet.html"
}

case "${1:-all}" in
  1) open_patent "patent-1-quantum-anonymization" ;;
  2) open_patent "patent-2-csi-entropy-puek" ;;
  3) open_patent "patent-3-che-are-provenance" ;;
  all)
    open_patent "patent-1-quantum-anonymization"
    open_patent "patent-2-csi-entropy-puek"
    open_patent "patent-3-che-are-provenance"
    ;;
  *) echo "Usage: $0 [1|2|3|all]" ;;
esac
