#!/usr/bin/env bash
# Copy the superficialTension static piece into public/superficial-tension/ for Vite.
# Default source: sibling folder websiteOtherFiles/superficialTension (adjust SUPERFICIAL_TENSION_SRC).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/superficial-tension"
DEFAULT_SRC="$(cd "$ROOT/../websiteOtherFiles/superficialTension" 2>/dev/null && pwd || true)"
SUPERFICIAL_TENSION_SRC="${SUPERFICIAL_TENSION_SRC:-$DEFAULT_SRC}"

if [[ -z "$SUPERFICIAL_TENSION_SRC" || ! -d "$SUPERFICIAL_TENSION_SRC" ]]; then
  echo "Set SUPERFICIAL_TENSION_SRC to your superficialTension project root (folder with index.html)." >&2
  exit 1
fi

mkdir -p "$DEST"
echo "Syncing: $SUPERFICIAL_TENSION_SRC -> $DEST"
rsync -a --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  --exclude='.gitignore' \
  "$SUPERFICIAL_TENSION_SRC/" "$DEST/"

echo "Done. Run: npm run build"
