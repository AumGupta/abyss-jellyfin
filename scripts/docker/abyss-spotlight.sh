#!/usr/bin/env bash
set -euo pipefail

# Abyss theme - docker init script
# for use with linuxserver/jellyfin via custom-cont-init.d
#
# place at: config/custom-cont-init.d/abyss-spotlight.sh
# make executable: chmod +x config/custom-cont-init.d/abyss-spotlight.sh
# mount in compose: ./config/custom-cont-init.d:/custom-cont-init.d

REPO="AumGupta/abyss-jellyfin"
BRANCH="main"
RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
WEB_DIR="/usr/share/jellyfin/web"
UI_DIR="${WEB_DIR}/ui"

SPOTLIGHT_FILES=(
    "scripts/spotlight/spotlight.html"
    "scripts/spotlight/spotlight.css"
    "scripts/spotlight/spotlight-loader.js"
)

log() { echo "**** [abyss] $* ****"; }

log "Applying Abyss Spotlight theme"

if [ ! -d "$WEB_DIR" ]; then
    log "ERROR: Web directory not found at ${WEB_DIR}"
    log "If using a non-linuxserver image, set WEB_DIR to your web directory path"
    exit 1
fi

STAGE_DIR="/tmp/abyss-stage"
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"
trap 'rm -rf "$STAGE_DIR"' EXIT

for file in "${SPOTLIGHT_FILES[@]}"; do
    dest="${STAGE_DIR}/$(basename "$file")"
    if curl -fsSL "${RAW}/${file}" -o "$dest"; then
        log "Downloaded: $(basename "$file")"
    else
        log "ERROR: Failed to download $(basename "$file") - check internet connection"
        exit 1
    fi
done

mkdir -p "$UI_DIR"
for f in spotlight.html spotlight.css spotlight-loader.js; do
    src="${STAGE_DIR}/${f}"
    dest="${UI_DIR}/${f}"
    if ! cmp -s "$src" "$dest" 2>/dev/null; then
        cp -f "$src" "$dest"
        log "Updated: ${f}"
    else
        log "Unchanged: ${f} (skipped)"
    fi
done

for chunk_file in "$WEB_DIR"/home-html.*.chunk.js; do
    [ -f "$chunk_file" ] || continue
    if [ -f "${chunk_file}.bak" ] && grep -Eq "featurediframe|abyss-spotlight-frame" "$chunk_file"; then
        cp -f "${chunk_file}.bak" "$chunk_file"
        if cmp -s "${chunk_file}.bak" "$chunk_file"; then
            rm -f "${chunk_file}.bak"
            log "Restored legacy home chunk backup"
        else
            log "ERROR: Could not verify restored home chunk: ${chunk_file}"
            exit 1
        fi
    fi
done

INDEX_FILE="${WEB_DIR}/index.html"
LOADER_TAG='<script src="ui/spotlight-loader.js" data-abyss-spotlight></script>'
if [ ! -f "$INDEX_FILE" ]; then
    log "ERROR: Jellyfin index not found at ${INDEX_FILE}"
    exit 1
fi

html=$(<"$INDEX_FILE")
html=${html//$LOADER_TAG/}
if [[ "$html" != *"</body>"* ]]; then
    log "ERROR: index.html has no closing body tag"
    exit 1
fi
html=${html/<\/body>/${LOADER_TAG}<\/body>}
temp_index="${INDEX_FILE}.abyss.tmp"
cp -p "$INDEX_FILE" "$temp_index"
printf '%s\n' "$html" > "$temp_index"
mv -f "$temp_index" "$INDEX_FILE"
log "Spotlight loader installed"

log "Abyss Spotlight theme applied successfully"
