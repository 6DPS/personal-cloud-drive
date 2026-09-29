#!/usr/bin/env bash
# ==============================================================================
# DPSir 个人网盘 - macOS GitHub 云端同步与热更新向导
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
echo -e "${YELLOW}        DPSir 个人网盘 - GitHub 云端同步与热更新助手 (Mac)      ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

echo -e "${YELLOW}[1/3] 正在从 GitHub 云端拉取最新代码更新 (git pull)...${NC}"
git pull
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[错误] 拉取代码遇到异常，请检查网络或 GitHub 连接。${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${YELLOW}[2/3] 正在检查依赖完整性 (npm install --omit=dev)...${NC}"
npm install --omit=dev

echo ""
echo -e "${YELLOW}[3/3] 正在平滑重启网盘守护服务...${NC}"

# 重启 launchd 或后台进程
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
echo -e "${GREEN}       🎉 恭喜！网盘已成功同步至 GitHub 最新版本并已完成重启！    ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""
