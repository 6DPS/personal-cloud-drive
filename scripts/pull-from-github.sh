#!/usr/bin/env bash
# ==============================================================================
# DPSir Personal Cloud Drive - macOS GitHub Cloud Sync & Hot-Reload Helper
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
NC='\033[0m'

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}  DPSir Personal Cloud Drive - GitHub Cloud Sync (macOS)       ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

echo -e "${YELLOW}[1/3] Pulling latest updates from GitHub (git pull)...${NC}"
git pull
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR] Failed to pull updates from GitHub. Please check your network connection.${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${YELLOW}[2/3] Verifying dependencies (npm install --omit=dev)...${NC}"
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
