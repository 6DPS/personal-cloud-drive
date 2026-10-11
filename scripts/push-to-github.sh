#!/usr/bin/env bash
# ==============================================================================
# DPSir Personal Cloud Drive - macOS GitHub Push Helper
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
echo -e "${YELLOW}    DPSir Personal Cloud Drive - GitHub Push Helper (macOS)    ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -n "$REMOTE_URL" ]; then
    echo -e "${GREEN}Connected remote repository: ${REMOTE_URL}${NC}"
    echo ""
else
    REMOTE_URL="https://github.com/6DPS/personal-cloud-drive.git"
    git remote add origin "$REMOTE_URL"
    echo -e "${GREEN}Added remote repository: ${REMOTE_URL}${NC}"
fi

CHANGES=$(git status --porcelain)
if [ -n "$CHANGES" ]; then
    echo -e "${YELLOW}[1/2] Local code changes detected. Preparing commit...${NC}"
    NOW_STR=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${CYAN}[TIP] Your commit message will be shown in the GitHub repository history.${NC}"
    read -p "Enter commit description [Press Enter for default: update: $NOW_STR code update]: " CUSTOM_MSG
    if [ -z "$CUSTOM_MSG" ]; then
        CUSTOM_MSG="update: $NOW_STR code update"
    fi
    git add .
    git commit -m "$CUSTOM_MSG"
    echo -e "${GREEN}  [OK] Committed local changes: ${CUSTOM_MSG}${NC}"
    echo ""
else
    echo -e "${GREEN}[1/2] Working tree is clean. No new local changes to commit.${NC}"
    echo ""
fi

echo -e "${YELLOW}[2/2] Pushing commits to GitHub remote (main branch)...${NC}"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${CYAN}===============================================================${NC}"
    echo -e "${GREEN}    [OK] Code pushed to GitHub remote repository successfully! ${NC}"
    echo -e "${CYAN}===============================================================${NC}"
    echo -e "${YELLOW}You can refresh your GitHub page to view the latest updates.${NC}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}[WARN] Push encountered a network issue. Please re-run this script later to retry.${NC}"
    echo ""
fi
