#!/usr/bin/env bash
# ==============================================================================
# DPSir 个人网盘 - 一键全服务重启与自动修复助手 (macOS)
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
echo -e "${YELLOW}         DPSir 个人网盘 - 一键全服务重启与自动修复助手 (Mac)    ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

echo -e "${YELLOW}[1/3] 正在安全释放可能卡顿的旧后台进程...${NC}"
OLD_PID=$(lsof -ti :8081 2>/dev/null)
if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null
fi
pkill -f "cloudflared" 2>/dev/null
sleep 1
echo -e "${GREEN}  ✓ 旧进程已安全释放${NC}"

echo ""
echo -e "${YELLOW}[2/3] 正在重新唤醒网盘核心服务...${NC}"
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

echo -e "${GREEN}  ✓ 服务启动指令已发出，正在进行健康体检...${NC}"
sleep 3

echo ""
echo -e "${YELLOW}[3/3] 服务健康状态校验:${NC}"
if curl -s -m 3 "http://127.0.0.1:8081/api/me" >/dev/null 2>&1; then
    echo -e "${GREEN}  • 本地核心服务 (8081 端口): [OK] 正常在线${NC}"
else
    echo -e "${RED}  • 本地核心服务: [检查中] 请查看 logs/ 目录日志${NC}"
fi

LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ipconfig getifaddr en2 2>/dev/null || echo "127.0.0.1")
echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GREEN}             🎉 重启与修复完成，您可以继续使用网盘！             ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}  • 本机地址: http://127.0.0.1:8081${NC}"
if [ "$LAN_IP" != "127.0.0.1" ]; then
    echo -e "${YELLOW}  • 局域网地址: http://${LAN_IP}:8081${NC}"
fi
echo ""
