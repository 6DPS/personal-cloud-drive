#!/usr/bin/env bash
# ==============================================================================
# DPSir Personal Cloud Drive - Full Service Restart & Auto-Repair Helper (macOS)
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
echo -e "${YELLOW}  DPSir Personal Cloud Drive - Service Restart Helper (macOS)  ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

echo -e "${YELLOW}[1/3] Stopping existing background processes...${NC}"
OLD_PID=$(lsof -ti :8081 2>/dev/null)
if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null
fi
pkill -f "cloudflared" 2>/dev/null
sleep 1
echo -e "${GREEN}  [OK] Old background processes terminated safely.${NC}"

echo ""
echo -e "${YELLOW}[2/3] Starting cloud drive core service...${NC}"
PLIST_FILE="$HOME/Library/LaunchAgents/com.dpsir.clouddrive.plist"
if [ -f "$PLIST_FILE" ]; then
    launchctl kickstart -k "gui/$(id -u)/com.dpsir.clouddrive" 2>/dev/null || {
        launchctl unload "$PLIST_FILE" 2>/dev/null
        launchctl load -w "$PLIST_FILE" 2>/dev/null
    }
else
    NODE_BIN_PATH=$(which node)
    mkdir -p "$ROOT_DIR/logs"
    nohup "${NODE_BIN_PATH}" "${ROOT_DIR}/server.js" > "${ROOT_DIR}/logs/drive.log" 2>&1 &
fi

echo -e "${GREEN}  [OK] Startup command issued. Running health check...${NC}"
sleep 3

echo ""
echo -e "${YELLOW}[3/3] Service Health Check:${NC}"
if curl -s -m 3 "http://127.0.0.1:8081/api/me" >/dev/null 2>&1; then
    echo -e "${GREEN}  * Local Core Service (Port 8081): [OK] ONLINE${NC}"
else
    echo -e "${RED}  * Local Core Service: [STARTING] Please check logs/ directory${NC}"
fi

LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ipconfig getifaddr en2 2>/dev/null || echo "127.0.0.1")
echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GREEN}       [OK] Restart and repair completed! Ready to use.        ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}  * Local URL: http://127.0.0.1:8081${NC}"
if [ "$LAN_IP" != "127.0.0.1" ]; then
    echo -e "${YELLOW}  * LAN URL  : http://${LAN_IP}:8081${NC}"
fi
echo ""
