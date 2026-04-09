#!/usr/bin/env bash
# Copy the static Superficial Tension build into public/superficial-tension/ for local
# dev or same-origin iframe (VITE_SUPERFICIAL_TENSION_URL=same-origin).
# The portfolio .gitignore excludes this folder (large JPG/MP4); production usually
# embeds https://superficial-tension.vercel.app/ instead.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST="$ROOT/public/superficial-tension"
SRC="${SUPERFICIAL_TENSION_ROOT:-$HOME/Desktop/websiteOtherFiles/superficialTension}"

if [[ ! -f "$SRC/index.html" ]]; then
  echo "Expected $SRC/index.html — set SUPERFICIAL_TENSION_ROOT to your superficialTension repo." >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete \
  --exclude '.git' \
  --exclude '.vercel' \
  --exclude 'node_modules' \
  --exclude '.DS_Store' \
  "$SRC/" "$DEST/"

echo "Synced to $DEST"
echo "Use VITE_SUPERFICIAL_TENSION_URL=same-origin in .env.local and npm run dev"
