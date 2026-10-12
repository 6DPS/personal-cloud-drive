#!/usr/bin/env bash
# ==============================================================================
# DPSir Personal Cloud Drive - macOS GitHub Cloud Sync & Hot-Reload Helper
# Built-in Domestic Mirror Acceleration (No VPN / Foreign Network Required)
# ==============================================================================

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
ROOT_DIR="$( cd -P "$( dirname "$SOURCE" )/.." >/dev/null 2>&1 && pwd )"
cd "$ROOT_DIR" || exit 1

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}  DPSir Personal Cloud Drive - GitHub Cloud Sync (macOS)       ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

REPO_PATH="6DPS/personal-cloud-drive"
OFFICIAL_URL="https://github.com/${REPO_PATH}.git"
GIT_MIRRORS=(
    "https://gh-proxy.com/https://github.com/${REPO_PATH}.git"
    "https://ghfast.top/https://github.com/${REPO_PATH}.git"
    "${OFFICIAL_URL}"
)

if [ ! -d "$ROOT_DIR/.git" ]; then
    echo -e "${CYAN}[AUTO-INIT] Initializing local Git repository...${NC}"
    git init >/dev/null 2>&1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "$OFFICIAL_URL" 2>/dev/null
fi

echo -e "${YELLOW}[1/3] Pulling latest updates from GitHub (via domestic mirror acceleration)...${NC}"
SYNC_OK=false
for ENDPOINT in "${GIT_MIRRORS[@]}"; do
    echo -e "${GRAY}  -> Trying endpoint: ${ENDPOINT}${NC}"
    if git -c http.sslVerify=false -c http.connectTimeout=5 -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 fetch --progress "$ENDPOINT" main; then
        git checkout -f -B main FETCH_HEAD
        git reset --hard FETCH_HEAD
        git update-ref refs/remotes/origin/main FETCH_HEAD 2>/dev/null
        git branch --set-upstream-to=origin/main main >/dev/null 2>&1
        echo -e "${GREEN}  [OK] Synchronized latest code from: ${ENDPOINT}${NC}"
        SYNC_OK=true
        break
    else
        echo -e "${YELLOW}  [WARN] Endpoint timed out or unreachable, switching to next mirror...${NC}"
    fi
done

if [ "$SYNC_OK" = false ]; then
    echo ""
    echo -e "${RED}[ERROR] Failed to pull updates from all mirrors. Please check your internet connection.${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${YELLOW}[2/3] Verifying dependencies via domestic mirror (registry.npmmirror.com)...${NC}"
npm config set registry https://registry.npmmirror.com >/dev/null 2>&1
npm install --omit=dev

echo ""
echo -e "${YELLOW}[3/3] Restarting cloud drive background service...${NC}"

# Restart launchd agent or background node process
PLIST_FILE="$HOME/Library/LaunchAgents/com.dpsir.clouddrive.plist"
if [ -f "$PLIST_FILE" ]; then
    launchctl kickstart -k "gui/$(id -u)/com.dpsir.clouddrive" 2>/dev/null || {
        launchctl unload "$PLIST_FILE" 2>/dev/null
        launchctl load -w "$PLIST_FILE" 2>/dev/null
    }
else
    OLD_PID=$(lsof -ti :8081 2>/dev/null)
    if [ -n "$OLD_PID" ]; then
        kill -9 $OLD_PID 2>/dev/null
        sleep 1
    fi
    NODE_BIN_PATH=$(which node)
    nohup "${NODE_BIN_PATH}" "${ROOT_DIR}/server.js" > "${ROOT_DIR}/logs/drive.log" 2>&1 &
fi

sleep 2

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GREEN}   [OK] Cloud drive updated to latest GitHub version & restarted!${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""
