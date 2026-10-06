#!/usr/bin/env bash
# ==============================================================================
# DPSir 个人网盘 - 迁移准备与数据盘检查助手 (macOS)
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
echo -e "${YELLOW}         DPSir 个人网盘 - 换机迁移与数据打包助手 (Mac)          ${NC}"
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

echo -e "${GREEN}【1. 检查迁移数据源】${NC}"
echo -e "${GRAY}  程序代码目录: ${ROOT_DIR}${NC}"
echo -e "${GRAY}  数据存放目录: ${STORAGE_DIR}${NC}"

if [ -d "$STORAGE_DIR" ]; then
    echo -e "${GRAY}  正在统计数据目录大小，请稍候...${NC}"
    TOTAL_COUNT=$(find "$STORAGE_DIR" -type f 2>/dev/null | wc -l | xargs)
    TOTAL_SIZE=$(du -sh "$STORAGE_DIR" 2>/dev/null | cut -f1)
    echo -e "${GREEN}  ✓ 数据根目录正常存在！${NC}"
    echo -e "${CYAN}    - 文件总数量: ${TOTAL_COUNT} 个${NC}"
    echo -e "${CYAN}    - 占用磁盘空间: ${TOTAL_SIZE}${NC}"
else
    echo -e "${YELLOW}  [警告] 未在 ${STORAGE_DIR} 找到数据目录，请检查路径是否正确。${NC}"
fi

echo ""
echo -e "${GREEN}【2. 换机迁移极简两步法】${NC}"
echo -e "${YELLOW}  只需将以下两个文件夹拷贝到你的移动硬盘 / U 盘中：${NC}"
echo -e "${WHITE}  ① 代码文件夹: ${ROOT_DIR}${NC}"
echo -e "${WHITE}  ② 数据文件夹: ${STORAGE_DIR}${NC}"
echo ""
echo -e "${GRAY}  拷贝完成后：${NC}"
echo -e "${CYAN}  在目标电脑上插上移动硬盘：${NC}"
echo -e "${CYAN}  • 若目标是 Windows 电脑：双击【一键部署新电脑(Windows).bat】${NC}"
echo -e "${CYAN}  • 若目标是 Mac 电脑：双击【一键部署新电脑(Mac).command】${NC}"
echo ""

read -p "是否现在为你自动打开这两个文件夹所在的访达(Finder)窗口？(Y/N) [默认 Y]: " OPEN_FINDER
if [ -z "$OPEN_FINDER" ] || [ "$OPEN_FINDER" = "Y" ] || [ "$OPEN_FINDER" = "y" ]; then
    open "$ROOT_DIR" 2>/dev/null
    if [ -d "$STORAGE_DIR" ]; then
        open "$STORAGE_DIR" 2>/dev/null
    fi
fi

echo ""
echo -e "${GREEN}助手已就绪，随时可以开始拷贝迁移。${NC}"
echo ""
read -p "按回车键退出..."

