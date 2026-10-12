#!/usr/bin/env bash
# ==============================================================================
# DPSir Personal Cloud Drive - macOS GitHub Push Helper
# Built-in Domestic Mirror & Unborn Branch Auto-Repair
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
echo -e "${YELLOW}    DPSir Personal Cloud Drive - GitHub Push Helper (macOS)    ${NC}"
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
    git init >/dev/null 2>&1
fi

REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -n "$REMOTE_URL" ]; then
    echo -e "${GREEN}Connected remote repository: ${REMOTE_URL}${NC}"
    echo ""
else
    REMOTE_URL="$OFFICIAL_URL"
    git remote add origin "$REMOTE_URL"
    echo -e "${GREEN}Added remote repository: ${REMOTE_URL}${NC}"
    echo ""
fi

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo -e "${CYAN}[AUTO-REPAIR] Synchronizing commit history from GitHub mirror...${NC}"
    for ENDPOINT in "${GIT_MIRRORS[@]}"; do
        if git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=15 fetch "$ENDPOINT" main 2>/dev/null; then
            git checkout -B main FETCH_HEAD >/dev/null 2>&1
            git reset --mixed FETCH_HEAD >/dev/null 2>&1
            git update-ref refs/remotes/origin/main FETCH_HEAD 2>/dev/null
            break
        fi
    done
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

CUR_BRANCH=$(git branch --show-current 2>/dev/null)
if [ -n "$CUR_BRANCH" ] && [ "$CUR_BRANCH" != "main" ]; then
    git branch -M main 2>/dev/null
fi

echo -e "${YELLOW}[2/2] Checking & pushing commits to GitHub remote (main branch)...${NC}"

LOCAL_HEAD=$(git rev-parse HEAD 2>/dev/null)
REMOTE_HEAD=""
for ENDPOINT in "${GIT_MIRRORS[@]}"; do
    LS_OUT=$(git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 ls-remote "$ENDPOINT" refs/heads/main 2>/dev/null | awk '{print $1}')
    if [ -n "$LS_OUT" ]; then
        REMOTE_HEAD="$LS_OUT"
        break
    fi
done

PUSH_OK=false
if [ -n "$LOCAL_HEAD" ] && [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
    echo -e "${GREEN}  [OK] Local repository is already 100% in sync with GitHub remote.${NC}"
    PUSH_OK=true
else
    PUSH_ENDPOINTS=(
        "${OFFICIAL_URL}"
        "https://ghfast.top/https://github.com/${REPO_PATH}.git"
        "https://gh-proxy.com/https://github.com/${REPO_PATH}.git"
    )
    for ENDPOINT in "${PUSH_ENDPOINTS[@]}"; do
        echo -e "${GRAY}  -> Pushing to: ${ENDPOINT}${NC}"
        if git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=15 push "$ENDPOINT" main; then
            git update-ref refs/remotes/origin/main HEAD 2>/dev/null
            PUSH_OK=true
            break
        fi
    done
fi

if [ "$PUSH_OK" = true ]; then
    echo ""
    echo -e "${CYAN}===============================================================${NC}"
    echo -e "${GREEN}    [OK] Code synchronized with GitHub repository successfully!${NC}"
    echo -e "${CYAN}===============================================================${NC}"
    echo -e "${YELLOW}You can refresh your GitHub page to view the latest updates.${NC}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}[WARN] Push encountered a network issue. Please re-run this script later to retry.${NC}"
    echo ""
fi
