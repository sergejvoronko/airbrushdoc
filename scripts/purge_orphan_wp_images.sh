#!/usr/bin/env bash
# Purge orphaned WordPress images (public/images/wp, public/images/wp-uploads).
# DRY-RUN by default. Pass --apply to actually delete.
#
# An image is KEPT if its filename (basename) appears anywhere in:
#   - dist/        (rendered HTML/XML/CSS/JS/TXT/JSON — final source of truth)
#   - src/         (markdown content + components, in case build is stale)
#   - public/      (raw tool HTML, sitemaps, etc.; excludes the image dirs themselves)
# Otherwise it is ORPHANED.
#
# Basename matching is intentionally conservative: a name referenced in ANY
# location keeps ALL files sharing that basename. Favors false-keeps over data loss.

set -euo pipefail
cd "$(dirname "$0")/.."

APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

IMG_DIRS=(public/images/wp public/images/wp-uploads)
TMP=$(mktemp -d)
REFS="$TMP/refs.txt"        # all referenced basenames (sorted, unique)
CAND="$TMP/candidates.txt"  # every file on disk in target dirs
ORPH="$TMP/orphans.txt"     # files to delete

trap 'rm -rf "$TMP"' EXIT

echo "==> Collecting reference text (dist, src, public minus image dirs)..."
# Concatenate searchable text. public scanned except the two big image trees.
{
  find dist -type f \( -name '*.html' -o -name '*.xml' -o -name '*.css' -o -name '*.js' -o -name '*.txt' -o -name '*.json' \) -print0 2>/dev/null
  find src  -type f \( -name '*.md' -o -name '*.mdx' -o -name '*.astro' -o -name '*.ts' -o -name '*.json' \) -print0 2>/dev/null
  find public -type f \( -name '*.html' -o -name '*.xml' -o -name '*.txt' -o -name '*.json' -o -name '*.css' \) \
       -not -path 'public/images/wp/*' -not -path 'public/images/wp-uploads/*' -print0 2>/dev/null
} > "$TMP/filelist.0"

# Pull every wp/wp-uploads image path token, reduce to basenames.
# Matches /images/wp... and /images/wp-uploads... with common extensions.
xargs -0 grep -rhoE '/images/wp[^"'"'"' )]*\.(webp|jpe?g|png|gif|svg|avif)' < "$TMP/filelist.0" 2>/dev/null \
  | sed 's#.*/##' | sort -u > "$REFS" || true

echo "    referenced basenames: $(wc -l < "$REFS")"

echo "==> Enumerating candidate files on disk..."
find "${IMG_DIRS[@]}" -type f > "$CAND"
echo "    files on disk: $(wc -l < "$CAND")"

echo "==> Classifying..."
: > "$ORPH"
kept=0
while IFS= read -r f; do
  b="${f##*/}"
  if grep -qxF "$b" "$REFS"; then
    kept=$((kept+1))
  else
    printf '%s\n' "$f" >> "$ORPH"
  fi
done < "$CAND"

orphan_count=$(wc -l < "$ORPH")
orphan_size=$(du -ch $(cat "$ORPH") 2>/dev/null | tail -1 | cut -f1)
total_size=$(du -ch $(cat "$CAND") 2>/dev/null | tail -1 | cut -f1)

echo
echo "================ SUMMARY ================"
echo "  on disk      : $(wc -l < "$CAND") files  ($total_size)"
echo "  kept (refd)  : $kept files"
echo "  ORPHANED     : $orphan_count files  ($orphan_size)"
echo "========================================"

# Persist the orphan list outside TMP so it survives for review.
REPORT="scripts/orphan-wp-images.txt"
cp "$ORPH" "$REPORT"
echo "  Full orphan list written to: $REPORT"
echo "  Sample:"
head -10 "$REPORT" | sed 's/^/    /'

if [[ $APPLY -eq 1 ]]; then
  echo
  echo "==> --apply set: DELETING $orphan_count files..."
  xargs -d '\n' rm -f < "$ORPH"
  echo "    done. Rebuild to confirm: source ~/.nvm/nvm.sh && nvm use 22 && npm run build"
else
  echo
  echo "DRY-RUN only. Nothing deleted. Re-run with --apply to delete the $orphan_count files above."
fi
