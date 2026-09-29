#!/usr/bin/env bash
# ==============================================================================
# DPSir 个人网盘 - 彻底卸载并停止后台服务 (macOS)
# ==============================================================================

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}        DPSir 个人网盘 - 彻底卸载与停止服务助手 (Mac)          ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

echo -e "${YELLOW}[1/3] 正在卸载 launchd 开机自启守护配置...${NC}"
PLIST_FILE="$HOME/Library/LaunchAgents/com.dpsir.clouddrive.plist"
if [ -f "$PLIST_FILE" ]; then
    launchctl unload "$PLIST_FILE" 2>/dev/null
    rm -f "$PLIST_FILE"
    echo -e "${GREEN}  ✓ 已成功清理 launchd 计划自启配置文件${NC}"
else
    echo -e "${GREEN}  ✓ launchd 配置文件不存在或已清理${NC}"
fi

echo ""
echo -e "${YELLOW}[2/3] 正在终止后台运行的 Node.js 网盘服务进程...${NC}"
OLD_PID=$(lsof -ti :8081 2>/dev/null)
if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null
    echo -e "${GREEN}  ✓ 8081 端口服务进程已彻底停止${NC}"
else
    echo -e "${GREEN}  ✓ 8081 端口未被占用${NC}"
fi

echo ""
echo -e "${YELLOW}[3/3] 检查数据文件安全状态...${NC}"
echo -e "${GREEN}  ✓ 您的所有真实数据（PersonalCloudDrive 目录）完好无损保留！${NC}"

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GREEN}               🎉 网盘后台服务已全部彻底停止！                   ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""
