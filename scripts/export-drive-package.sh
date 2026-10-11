#!/usr/bin/env bash
# ==============================================================================
# DPSir Personal Cloud Drive - Migration & Storage Inspection Helper (macOS)
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
WHITE='\033[1;37m'
NC='\033[0m'

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}   DPSir Personal Cloud Drive - Migration Helper (macOS)       ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

STORAGE_DIR="$HOME/PersonalCloudDrive"
ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    FOUND_DIR=$(grep -E '^\s*STORAGE_BASE_ROOT\s*=' "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
    if [ -n "$FOUND_DIR" ]; then
        STORAGE_DIR="$FOUND_DIR"
    fi
fi

echo -e "${GREEN}[1. Checking Migration Data Sources]${NC}"
echo -e "${GRAY}  Application Directory : ${ROOT_DIR}${NC}"
echo -e "${GRAY}  Data Storage Directory: ${STORAGE_DIR}${NC}"

if [ -d "$STORAGE_DIR" ]; then
    echo -e "${GRAY}  Calculating data storage size, please wait...${NC}"
    TOTAL_COUNT=$(find "$STORAGE_DIR" -type f 2>/dev/null | wc -l | xargs)
    TOTAL_SIZE=$(du -sh "$STORAGE_DIR" 2>/dev/null | cut -f1)
    echo -e "${GREEN}  [OK] Data root directory exists!${NC}"
    echo -e "${CYAN}    - Total Files: ${TOTAL_COUNT}${NC}"
    echo -e "${CYAN}    - Disk Usage : ${TOTAL_SIZE}${NC}"
else
    echo -e "${YELLOW}  [WARN] Data directory not found at ${STORAGE_DIR}. Please verify the path.${NC}"
fi

echo ""
echo -e "${GREEN}[2. Two-Step Host Migration Guide]${NC}"
echo -e "${YELLOW}  Simply copy the following two folders to your external drive / USB drive:${NC}"
echo -e "${WHITE}  (1) Code Folder: ${ROOT_DIR}${NC}"
echo -e "${WHITE}  (2) Data Folder: ${STORAGE_DIR}${NC}"
echo ""
echo -e "${GRAY}  After copying:${NC}"
echo -e "${CYAN}  Plug the external drive into the target computer:${NC}"
echo -e "${CYAN}  * On Windows: Double-click setup-new-host.bat (or the Windows setup .bat script)${NC}"
echo -e "${CYAN}  * On macOS  : Double-click the Mac setup .command script (or run scripts/setup-mac.sh)${NC}"
echo ""

read -p "Open both folders in Finder now? (Y/N) [Default: Y]: " OPEN_FINDER
if [ -z "$OPEN_FINDER" ] || [ "$OPEN_FINDER" = "Y" ] || [ "$OPEN_FINDER" = "y" ]; then
    open "$ROOT_DIR" 2>/dev/null
    if [ -d "$STORAGE_DIR" ]; then
        open "$STORAGE_DIR" 2>/dev/null
    fi
fi

echo ""
echo -e "${GREEN}Migration helper finished. Ready to copy files.${NC}"
echo ""
read -p "Press Enter to exit..."
