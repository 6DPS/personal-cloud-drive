#!/usr/bin/env bash
# ==============================================================================
# DPSir 个人网盘 - macOS GitHub 远程仓库一键推送助手
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
echo -e "${YELLOW}          DPSir 个人网盘 - GitHub 远程仓库一键推送助手 (Mac)    ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -n "$REMOTE_URL" ]; then
    echo -e "${GREEN}当前已关联的远程仓库: ${REMOTE_URL}${NC}"
    echo ""
else
    REMOTE_URL="https://github.com/6DPS/personal-cloud-drive.git"
    git remote add origin "$REMOTE_URL"
    echo -e "${GREEN}已关联远程仓库: ${REMOTE_URL}${NC}"
fi

CHANGES=$(git status --porcelain)
if [ -n "$CHANGES" ]; then
    echo -e "${YELLOW}[1/2] 检测到本地代码有改动，正在准备同步...${NC}"
    NOW_STR=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${CYAN}💡 提示: 您输入的文字将直接显示在 GitHub 文件列表右侧作为【功能描述】。${NC}"
    read -p "请输入本次提交的功能描述 [直接回车使用默认: update: $NOW_STR 代码更新]: " CUSTOM_MSG
    if [ -z "$CUSTOM_MSG" ]; then
        CUSTOM_MSG="update: $NOW_STR 代码更新"
    fi
    git add .
    git commit -m "$CUSTOM_MSG"
    echo -e "${GREEN}  ✓ 本地更新已记录: ${CUSTOM_MSG}${NC}"
    echo ""
else
    echo -e "${GREEN}[1/2] 本地代码处于最新提交状态，无需重复打包。${NC}"
    echo ""
fi

echo -e "${YELLOW}[2/2] 正在将代码推送到 GitHub 云端 (main 分支)...${NC}"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${CYAN}===============================================================${NC}"
    echo -e "${GREEN}         🎉 恭喜！网盘代码已成功上传到 GitHub 云端！             ${NC}"
    echo -e "${CYAN}===============================================================${NC}"
    echo -e "${YELLOW}你可以刷新你的 GitHub 网页，最新代码已经同步更新！${NC}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}[提示] 推送遇到网络波动，可稍后直接再次运行本脚本重试。${NC}"
    echo ""
fi
