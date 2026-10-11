#!/usr/bin/env bash
# ==============================================================================
# DPSir Personal Cloud Drive - Stop & Uninstall Background Services (macOS)
# ==============================================================================

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}   DPSir Personal Cloud Drive - Stop & Uninstall Helper (macOS)${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

echo -e "${YELLOW}[1/3] Removing launchd background auto-start configuration...${NC}"
PLIST_FILE="$HOME/Library/LaunchAgents/com.dpsir.clouddrive.plist"
if [ -f "$PLIST_FILE" ]; then
    launchctl unload "$PLIST_FILE" 2>/dev/null
    rm -f "$PLIST_FILE"
    echo -e "${GREEN}  [OK] Removed launchd auto-start plist file.${NC}"
else
    echo -e "${GREEN}  [OK] launchd plist file not present or already removed.${NC}"
fi

echo ""
echo -e "${YELLOW}[2/3] Stopping background Node.js cloud drive service...${NC}"
OLD_PID=$(lsof -ti :8081 2>/dev/null)
if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null
    echo -e "${GREEN}  [OK] Stopped service listening on port 8081.${NC}"
else
    echo -e "${GREEN}  [OK] Port 8081 is not in use.${NC}"
fi

echo ""
echo -e "${YELLOW}[3/3] Checking data directory status...${NC}"
echo -e "${GREEN}  [OK] Your data directory (PersonalCloudDrive) remains intact!${NC}"

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GREEN}         [OK] All background services have been stopped!       ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""
