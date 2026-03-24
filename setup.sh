#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Abyss Jellyfin Theme - Linux Installer / Uninstaller
# Port of https://github.com/AumGupta/abyss-jellyfin/blob/main/setup.ps1
# ==============================================================================

REPO="AumGupta/abyss-jellyfin"
BRANCH="main"
RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
REPO_URL="https://github.com/${REPO}"

SPOTLIGHT_FILES=(
    "scripts/spotlight/spotlight.html"
    "scripts/spotlight/spotlight.css"
    "scripts/spotlight/home-html.chunk.js"
)

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------

cyan="\033[0;36m"
green="\033[0;32m"
yellow="\033[0;33m"
red="\033[0;31m"
gray="\033[0;90m"
reset="\033[0m"

step() { echo -e "${cyan}  $*${reset}"; }
ok()   { echo -e "${green}  [+] $*${reset}"; }
warn() { echo -e "${yellow}  [!] $*${reset}"; }
fail() { echo -e "${red}  [X] $*${reset}"; }
skip() { echo -e "${gray}  [-] $*${reset}"; }
info() { echo -e "${gray}      $*${reset}"; }

exit_error() {
    echo ""
    [[ -n "${1:-}" ]] && fail "$1"
    read -rp "  Press Enter to exit: "
    exit 1
}

check_dependencies() {
    local missing=()
    for cmd in curl python3; do
        command -v "$cmd" &>/dev/null || missing+=("$cmd")
    done
    if [[ ${#missing[@]} -gt 0 ]]; then
        fail "Missing required dependencies: ${missing[*]}"
        info "Install them and re-run this script."
        exit 1
    fi
}

show_header() {
    clear
    echo ""
    echo -e "${cyan}  ================================================${reset}"
    echo -e "  Abyss Theme - $1"
    echo -e "${gray}  ${REPO_URL}${reset}"
    echo -e "${cyan}  ================================================${reset}"
    echo ""
}

# ------------------------------------------------------------------------------
# Locate Jellyfin web directory
# ------------------------------------------------------------------------------

get_jellyfin_web_dir() {
    local candidates=(
        "/usr/share/jellyfin/web"
        "/usr/lib/jellyfin/web"
        "/var/lib/jellyfin/web"
        "/opt/jellyfin/web"
    )

    for p in "${candidates[@]}"; do
        if [[ -d "$p" ]]; then
            echo "$p"
            return
        fi
    done

    warn "Could not auto-detect Jellyfin web directory."
    echo -e "${yellow}  Enter the full path to your jellyfin-web folder:${reset}"
    info "Example: /usr/share/jellyfin/web"
    read -rp "  Path: " path
    if [[ ! -d "$path" ]]; then
        exit_error "Directory not found: $path"
    fi
    echo "$path"
}

# ------------------------------------------------------------------------------
# Download files
# ------------------------------------------------------------------------------

download_file() {
    local repo_path="$1"
    local dest_path="$2"
    local dest_dir
    dest_dir="$(dirname "$dest_path")"

    mkdir -p "$dest_dir"

    local url="${RAW}/${repo_path}"
    if curl -fsSL "$url" -o "$dest_path"; then
        ok "Downloaded: $(basename "$dest_path")"
    else
        exit_error "Failed to download ${repo_path} - check your internet connection."
    fi
}

sync_spotlight_files() {
    local abyss_dir="$1"
    step "Checking spotlight files..."
    echo ""

    local all_present=true
    for file in "${SPOTLIGHT_FILES[@]}"; do
        local dest="${abyss_dir}/$(basename "$file")"
        [[ ! -f "$dest" ]] && all_present=false
    done

    if $all_present; then
        ok "All spotlight files already present."
    else
        step "Downloading spotlight files..."
        echo ""
        for file in "${SPOTLIGHT_FILES[@]}"; do
            local dest="${abyss_dir}/$(basename "$file")"
            if [[ ! -f "$dest" ]]; then
                download_file "$file" "$dest"
            else
                skip "Already exists: $(basename "$file")"
            fi
        done
    fi
    echo ""
}

# ------------------------------------------------------------------------------
# Authenticate
# ------------------------------------------------------------------------------

# Globals set by connect_jellyfin (avoids subshell/TTY issue)
ABYSS_TOKEN=""
ABYSS_USER_NAME=""
ABYSS_USER_ID=""

connect_jellyfin() {
    local server_url="$1"
    local max_tries=3
    local _response=""

    local auth_header='MediaBrowser Client="Abyss Setup", Device="Setup", DeviceId="abyss-setup", Version="1.0"'

    for ((try=1; try<=max_tries; try++)); do
        echo -e "${yellow}  Jellyfin admin credentials${reset}"
        echo -n "  Username: "
        read -r _username
        echo -n "  Password: "
        read -rs _password
        echo ""

        # Pass credentials via stdin to avoid exposure in process listings (ps/proc)
        local body
        body=$(printf '%s\n%s' "$_username" "$_password" | python3 -c "
import json, sys
lines = sys.stdin.read().split('\n', 1)
u, p = lines[0], lines[1] if len(lines) > 1 else ''
print(json.dumps({'Username': u, 'Pw': p}))
")

        _response=$(curl -fsSL \
            -X POST "${server_url}/Users/AuthenticateByName" \
            -H "Content-Type: application/json" \
            -H "X-Emby-Authorization: ${auth_header}" \
            -d "$body" 2>/dev/null) && break || true

        if ((try == max_tries)); then
            exit_error "Authentication failed after ${max_tries} attempts."
        fi

        echo ""
        fail "Invalid credentials. Attempt ${try} of ${max_tries}"
        echo ""
    done

    # Write to globals - cannot use subshell return as it breaks interactive read
    ABYSS_TOKEN=$(    echo "$_response" | python3 -c "import json,sys; print(json.load(sys.stdin)['AccessToken'])")
    ABYSS_USER_NAME=$(echo "$_response" | python3 -c "import json,sys; print(json.load(sys.stdin)['User']['Name'])")
    ABYSS_USER_ID=$(  echo "$_response" | python3 -c "import json,sys; print(json.load(sys.stdin)['User']['Id'])")
}

get_api_header() {
    local token="$1"
    echo "MediaBrowser Client=\"Abyss Setup\", Device=\"Setup\", DeviceId=\"abyss-setup\", Version=\"1.0\", Token=\"${token}\""
}

# ------------------------------------------------------------------------------
# Install
# ------------------------------------------------------------------------------

install_abyss() {
    show_header "Installer"

    # Server URL
    echo -e "${yellow}  Jellyfin server URL${reset}"
    echo -e "${gray}  Press ENTER to use default (http://localhost:8096)${reset}"
    read -rp "  URL: " input_url
    local server_url="${input_url:-http://localhost:8096}"
    server_url="${server_url%/}"
    ok "Server: ${server_url}"
    echo ""

    # Authenticate
    step "Authenticating..."
    echo ""
    connect_jellyfin "$server_url"
    local token="$ABYSS_TOKEN"
    local user_name="$ABYSS_USER_NAME"
    local user_id="$ABYSS_USER_ID"

    local api_header
    api_header=$(get_api_header "$token")

    echo ""
    ok "Authenticated as: ${user_name}"
    echo ""

    # Locate web dir
    step "Locating Jellyfin web directory..."
    local web_dir
    web_dir=$(get_jellyfin_web_dir)
    local abyss_dir="${web_dir}/abyss"

    if [[ ! -d "$abyss_dir" ]]; then
        mkdir -p "$abyss_dir"
        ok "Created: ${abyss_dir}"
    else
        ok "Found: ${abyss_dir}"
    fi
    echo ""

    # Download spotlight files
    sync_spotlight_files "$abyss_dir"

    # Apply CSS
    step "Applying Abyss CSS..."
    local css="@import url('https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/abyss.css');\n/* Customise Abyss: https://aumgupta.github.io/abyss-jellyfin/ */"
    local branding
    branding=$(curl -fsSL \
        -X GET "${server_url}/Branding/Configuration" \
        -H "X-Emby-Authorization: ${api_header}" 2>/dev/null) || true

    if [[ -n "$branding" ]]; then
        local updated_branding
        updated_branding=$(echo "$branding" | python3 -c "
import sys, json
d = json.load(sys.stdin)
d['CustomCss'] = sys.argv[1]
print(json.dumps(d))
" "$(printf '%b' "$css")")

        curl -fsSL \
            -X POST "${server_url}/System/Configuration/Branding" \
            -H "Content-Type: application/json" \
            -H "X-Emby-Authorization: ${api_header}" \
            -d "$updated_branding" >/dev/null 2>&1 \
            && ok "Abyss CSS applied." \
            || { fail "Failed to apply CSS."; info "Add manually: Dashboard > General > Custom CSS"; }
    else
        fail "Could not fetch branding config."
        info "Add manually in Dashboard > General > Custom CSS:"
        info "@import url('https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/abyss.css');"
    fi
    echo ""

    # Configure display prefs
    step "Configuring theme settings..."
    local display_prefs
    display_prefs=$(curl -fsSL \
        -X GET "${server_url}/DisplayPreferences/usersettings?userId=${user_id}&client=emby" \
        -H "X-Emby-Authorization: ${api_header}" 2>/dev/null) || true

    if [[ -n "$display_prefs" ]]; then
        local updated_prefs
        updated_prefs=$(echo "$display_prefs" | python3 -c "
import sys, json
d = json.load(sys.stdin)
p = d.setdefault('CustomPrefs', {})
p['dashboardTheme'] = 'dark'
p['homesection0']   = 'resume'
p['homesection1']   = 'nextup'
p['homesection2']   = 'smalllibrarytiles'
p['homesection3']   = 'latestmedia'
for i in range(4, 10):
    p[f'homesection{i}'] = 'none'
print(json.dumps(d))
")

        curl -fsSL \
            -X POST "${server_url}/DisplayPreferences/usersettings?userId=${user_id}&client=emby" \
            -H "Content-Type: application/json" \
            -H "X-Emby-Authorization: ${api_header}" \
            -d "$updated_prefs" >/dev/null 2>&1 \
            && ok "Dashboard theme set to Dark." && ok "Home screen sections configured." \
            || warn "Could not configure theme settings. Set manually in Settings > Display."
    else
        warn "Could not fetch display preferences."
    fi
    echo ""

    # Install spotlight
    step "Installing Spotlight add-on..."
    echo ""

    local ui_dir="${web_dir}/ui"
    if [[ ! -d "$ui_dir" ]]; then
        mkdir -p "$ui_dir"
        ok "Created ui folder."
    else
        skip "ui folder exists."
    fi

    for f in "spotlight.html" "spotlight.css"; do
        local src="${abyss_dir}/${f}"
        local dest="${ui_dir}/${f}"
        [[ ! -f "$src" ]] && exit_error "Missing file: ${f} - try running setup again to re-download."
        cp -f "$src" "$dest"
        ok "Copied: ${f}"
    done

    # Find chunk file
    local chunk_file
    chunk_file=$(find "$web_dir" -maxdepth 1 -name "home-html.*.chunk.js" | head -1)

    if [[ -z "$chunk_file" ]]; then
        warn "Could not find home-html.*.chunk.js automatically."
        read -rp "  Enter the exact filename: " chunk_name
        chunk_file="${web_dir}/${chunk_name}"
        [[ ! -f "$chunk_file" ]] && exit_error "Chunk file not found: ${chunk_file}"
    fi
    ok "Found chunk: $(basename "$chunk_file")"

    if [[ ! -f "${chunk_file}.bak" ]]; then
        cp -f "$chunk_file" "${chunk_file}.bak"
        ok "Backup created."
    else
        skip "Backup already exists."
    fi

    local chunk_src="${abyss_dir}/home-html.chunk.js"
    [[ ! -f "$chunk_src" ]] && exit_error "Missing home-html.chunk.js - try running setup again."
    cp -f "$chunk_src" "$chunk_file"
    ok "Chunk patched."
    echo ""

    # Restart
    step "Restarting Jellyfin..."
    curl -fsSL \
        -X POST "${server_url}/System/Restart" \
        -H "X-Emby-Authorization: ${api_header}" >/dev/null 2>&1 \
        && ok "Restart triggered. Wait a few seconds then refresh." \
        || warn "Could not restart automatically. Please restart Jellyfin manually."

    # Done
    echo ""
    echo -e "${cyan}  ================================================${reset}"
    echo -e "${green}  Installation complete!${reset}"
    echo -e "${cyan}  ================================================${reset}"
    echo ""
    echo "  Next steps:"
    echo -e "${red}    1. Delete browser cache${reset}"
    echo -e "${yellow}    2. Hard refresh your browser (Ctrl+F5)${reset}"
    echo -e "${gray}    3. Relaunch Jellyfin Media Player if using the desktop app${reset}"
    echo ""
    echo -e "${yellow}  Important: Go to Settings > Display > Theme and set it to Dark${reset}"
    info "Abyss requires the Dark base theme to display correctly."
    echo ""
    echo -e "${green}  Tip: Turn on 'Show Backdrops' in display settings for best experience.${reset}"
    echo ""
    read -rp "  Press Enter to exit: "
}

# ------------------------------------------------------------------------------
# Uninstall
# ------------------------------------------------------------------------------

uninstall_abyss() {
    show_header "Uninstaller"

    echo -e "${yellow}  Jellyfin server URL${reset}"
    echo -e "${gray}  Press ENTER to use default (http://localhost:8096)${reset}"
    read -rp "  URL: " input_url
    local server_url="${input_url:-http://localhost:8096}"
    server_url="${server_url%/}"
    ok "Server: ${server_url}"
    echo ""

    step "Authenticating..."
    echo ""
    connect_jellyfin "$server_url"
    local token="$ABYSS_TOKEN"

    local api_header
    api_header=$(get_api_header "$token")

    echo ""

    # Locate web dir
    step "Locating Jellyfin web directory..."
    local web_dir
    web_dir=$(get_jellyfin_web_dir)
    ok "Found: ${web_dir}"
    echo ""

    # Clear CSS
    step "Clearing custom CSS..."
    local branding
    branding=$(curl -fsSL \
        -X GET "${server_url}/Branding/Configuration" \
        -H "X-Emby-Authorization: ${api_header}" 2>/dev/null) || true

    if [[ -n "$branding" ]]; then
        local updated_branding
        updated_branding=$(echo "$branding" | python3 -c "
import sys, json
d = json.load(sys.stdin)
d['CustomCss'] = ''
print(json.dumps(d))
")
        curl -fsSL \
            -X POST "${server_url}/System/Configuration/Branding" \
            -H "Content-Type: application/json" \
            -H "X-Emby-Authorization: ${api_header}" \
            -d "$updated_branding" >/dev/null 2>&1 \
            && ok "Custom CSS cleared." \
            || { fail "Failed to clear CSS."; info "Clear manually in Dashboard > General > Custom CSS."; }
    fi
    echo ""

    # Restore chunk
    step "Restoring home-html chunk..."
    local chunk_file
    chunk_file=$(find "$web_dir" -maxdepth 1 -name "home-html.*.chunk.js" | head -1)

    if [[ -z "$chunk_file" ]]; then
        warn "Could not find home-html.*.chunk.js automatically."
        read -rp "  Enter the exact filename: " chunk_name
        chunk_file="${web_dir}/${chunk_name}"
        [[ ! -f "$chunk_file" ]] && exit_error "Chunk file not found: ${chunk_file}"
    fi

    if [[ -f "${chunk_file}.bak" ]]; then
        cp -f "${chunk_file}.bak" "$chunk_file"
        rm -f "${chunk_file}.bak"
        ok "Chunk restored."
        ok "Backup removed."
    else
        warn "No backup found. Chunk could not be restored."
        info "You may need to reinstall Jellyfin web."
    fi
    echo ""

    # Remove spotlight files
    step "Removing spotlight files..."
    local ui_dir="${web_dir}/ui"
    for f in "spotlight.html" "spotlight.css"; do
        local path="${ui_dir}/${f}"
        if [[ -f "$path" ]]; then
            rm -f "$path"
            ok "Removed: ${f}"
        else
            skip "Not found: ${f}"
        fi
    done

    if [[ -d "$ui_dir" ]]; then
        if [[ -z "$(ls -A "$ui_dir")" ]]; then
            rm -rf "$ui_dir"
            ok "Removed empty ui folder."
        else
            skip "ui folder has other files, leaving in place."
        fi
    fi
    echo ""

    # Restart
    step "Restarting Jellyfin..."
    curl -fsSL \
        -X POST "${server_url}/System/Restart" \
        -H "X-Emby-Authorization: ${api_header}" >/dev/null 2>&1 \
        && ok "Restart triggered. Wait a few seconds then refresh." \
        || warn "Could not restart automatically. Please restart Jellyfin manually."

    echo ""
    echo -e "${cyan}  ================================================${reset}"
    echo -e "${green}  Uninstall complete!${reset}"
    echo -e "${cyan}  ================================================${reset}"
    echo ""
    echo "  Next steps:"
    echo -e "${red}    1. Delete browser cache${reset}"
    echo -e "${yellow}    2. Hard refresh your browser (Ctrl+F5)${reset}"
    echo -e "${gray}    3. Relaunch Jellyfin Media Player if using the desktop app${reset}"
    echo ""
    read -rp "  Press Enter to exit: "
}

# ------------------------------------------------------------------------------
# Entry point
# ------------------------------------------------------------------------------

if [[ "$EUID" -ne 0 ]]; then
    echo -e "${red}  This script must be run as root (sudo).${reset}"
    exit 1
fi

check_dependencies

show_header "Setup"

echo "  What would you like to do?"
echo ""
echo -e "${green}   [1] Install${reset}        ${yellow}[2] Uninstall${reset}"
echo ""
read -rp "  Enter 1 or 2: " choice

case "$choice" in
    1) install_abyss ;;
    2) uninstall_abyss ;;
    *) exit_error "Invalid choice. Please enter 1 or 2." ;;
esac
