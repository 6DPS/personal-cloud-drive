#!/usr/bin/env bash
# ==============================================================================
# DPSir 个人网盘 - macOS 苹果电脑 一键部署向导
# ==============================================================================

# 设置工作目录为项目根目录
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
ROOT_DIR="$( cd -P "$( dirname "$SOURCE" )/.." >/dev/null 2>&1 && pwd )"
cd "$ROOT_DIR" || exit 1

# 颜色定义
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}       DPSir 个人网盘 - macOS 苹果电脑 一键部署向导           ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

# 1. 检查并适配 Node.js 环境变量
echo -e "${GREEN}[1/5] 正在检查 Node.js 运行环境...${NC}"

# 自动补充 macOS 常见 Node.js 安装路径 (Homebrew Apple Silicon / Intel / nvm)
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
    echo -e "${YELLOW}  未检测到 Node.js 运行环境。${NC}"
    if command -v brew >/dev/null 2>&1; then
        echo -e "${GRAY}  检测到 Homebrew，正在尝试通过 brew 自动安装 Node.js LTS...${NC}"
        brew install node
    fi
fi

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}  [提示] 自动安装未能就绪，请手动下载安装 Node.js LTS (macOS 版)：${NC}"
    echo -e "${YELLOW}  官方下载地址: https://nodejs.org/${NC}"
    echo -e "${YELLOW}  下载并双击安装 .pkg 安装包后，重新运行本脚本即可！${NC}"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}  ✓ Node.js 已就绪: ${NODE_VER}${NC}"

# 2. 检查并配置存储路径 (STORAGE_BASE_ROOT)
echo ""
echo -e "${GREEN}[2/5] 正在配置网盘数据存储路径...${NC}"

ENV_FILE="$ROOT_DIR/.env"
CURRENT_STORAGE=""

if [ -f "$ENV_FILE" ]; then
    CURRENT_STORAGE=$(grep -E '^\s*STORAGE_BASE_ROOT\s*=' "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
fi

DEFAULT_STORAGE="$HOME/PersonalCloudDrive"

if [ -z "$CURRENT_STORAGE" ] || [[ "$CURRENT_STORAGE" == *:* ]]; then
    # 如果为空或者包含 Windows 盘符冒号，回退到 macOS 标准家目录路径
    CURRENT_STORAGE="$DEFAULT_STORAGE"
fi

echo -e "${CYAN}  当前推荐/已设定的数据根目录: [${CURRENT_STORAGE}]${NC}"
echo -e "${GRAY}  提示: 如果你的数据存放在外接移动硬盘，可直接将移动硬盘里的 PersonalCloudDrive 文件夹拖入终端。${NC}"
read -p "  请输入数据目录路径 [直接按回车默认使用 ${CURRENT_STORAGE}]: " USER_INPUT_STORAGE

if [ -n "$USER_INPUT_STORAGE" ]; then
    CURRENT_STORAGE=$(echo "$USER_INPUT_STORAGE" | tr -d '"' | tr -d "'" | xargs)
fi

# 确保目录存在
mkdir -p "$CURRENT_STORAGE"

ACCOUNTS_FILE="$CURRENT_STORAGE/accounts.json"
if [ -f "$ACCOUNTS_FILE" ]; then
    echo -e "${GREEN}  ✓ 检测到已迁移的历史账号数据 (accounts.json)，系统将自动无缝接管！${NC}"
else
    echo -e "${GRAY}  [提示] 当前目录暂无历史 accounts.json，系统将在启动时自动初始化默认管理员账户。${NC}"
fi

# 写入/更新 .env 文件
if [ -f "$ENV_FILE" ]; then
    if grep -q "STORAGE_BASE_ROOT" "$ENV_FILE"; then
        # 兼容 macOS sed 语法
        sed -i '' "s|^[[:space:]]*STORAGE_BASE_ROOT=.*|STORAGE_BASE_ROOT=${CURRENT_STORAGE}|" "$ENV_FILE" 2>/dev/null || \
        sed -i "s|^[[:space:]]*STORAGE_BASE_ROOT=.*|STORAGE_BASE_ROOT=${CURRENT_STORAGE}|" "$ENV_FILE"
    else
        echo "STORAGE_BASE_ROOT=${CURRENT_STORAGE}" >> "$ENV_FILE"
    fi
else
    if [ -f "$ROOT_DIR/.env.example" ]; then
        cp "$ROOT_DIR/.env.example" "$ENV_FILE"
        sed -i '' "s|^[[:space:]]*STORAGE_BASE_ROOT=.*|STORAGE_BASE_ROOT=${CURRENT_STORAGE}|" "$ENV_FILE" 2>/dev/null || \
        sed -i "s|^[[:space:]]*STORAGE_BASE_ROOT=.*|STORAGE_BASE_ROOT=${CURRENT_STORAGE}|" "$ENV_FILE"
    else
        cat <<EOF > "$ENV_FILE"
# DPSir 个人网盘配置文件 (macOS)
STORAGE_BASE_ROOT=${CURRENT_STORAGE}
PORT=8081
HOST=0.0.0.0
CLOUD_DRIVE_USER=admin
# CLOUD_DRIVE_PASSWORD=
# DEEPSEEK_API_KEY=
PUBLIC_ACCESS_URL=
EOF
    fi
fi

echo -e "${GREEN}  ✓ 存储配置已锁定: ${CURRENT_STORAGE}${NC}"

# 3. 检查依赖项 (node_modules)
echo ""
echo -e "${GREEN}[3/5] 正在检查程序运行依赖...${NC}"
if [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo -e "${YELLOW}  正在安装运行依赖包 (npm install --omit=dev)...${NC}"
    npm install --omit=dev
fi
echo -e "${GREEN}  ✓ 运行依赖已完整就绪${NC}"

# 4. 释放旧进程并启动守护服务
echo ""
echo -e "${GREEN}[4/5] 正在配置后台常驻守护任务...${NC}"

mkdir -p "$ROOT_DIR/logs"

# 终止可能正在占用 8081 端口的旧 Node 进程
OLD_PID=$(lsof -ti :8081 2>/dev/null)
if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null
    sleep 1
fi

NODE_BIN_PATH=$(which node)
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.dpsir.clouddrive.plist"

mkdir -p "$PLIST_DIR"

cat <<EOF > "$PLIST_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dpsir.clouddrive</string>
    <key>ProgramArguments</key>
    <array>
        <string>${NODE_BIN_PATH}</string>
        <string>${ROOT_DIR}/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${ROOT_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${ROOT_DIR}/logs/drive-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${ROOT_DIR}/logs/drive-stderr.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST_FILE" 2>/dev/null
launchctl load -w "$PLIST_FILE" 2>/dev/null

echo -e "${GREEN}  ✓ 已成功注册 macOS 用户级后台开机自启任务 (launchd)${NC}"

# 5. 验证服务启动状态
echo ""
echo -e "${GREEN}[5/5] 正在验证网盘核心服务就绪状态...${NC}"
SERVICE_READY=false
for i in {1..6}; do
    if curl -s -m 2 "http://127.0.0.1:8081/api/me" >/dev/null 2>&1; then
        SERVICE_READY=true
        break
    fi
    sleep 1
done

if [ "$SERVICE_READY" = false ]; then
    # 备用方案：后台直接 nohup 启动
    nohup "${NODE_BIN_PATH}" "${ROOT_DIR}/server.js" > "${ROOT_DIR}/logs/drive.log" 2>&1 &
    sleep 2
    if curl -s -m 2 "http://127.0.0.1:8081/api/me" >/dev/null 2>&1; then
        SERVICE_READY=true
    fi
fi

# 获取本机局域网 IP
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ipconfig getifaddr en2 2>/dev/null || echo "127.0.0.1")

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GREEN}        🎉 恭喜！网盘服务已在您的 Mac 电脑成功就绪！           ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}  • 本机极速访问: http://127.0.0.1:8081${NC}"
if [ "$LAN_IP" != "127.0.0.1" ]; then
    echo -e "${YELLOW}  • 局域网访问地址: http://${LAN_IP}:8081${NC}"
fi
echo -e "${YELLOW}  • 超级管理员账号: admin${NC}"
echo -e "${YELLOW}  • 超级管理员密码: admin123456 (或在 .env 中自定义)${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GRAY}提示: 以后开机 Mac 会在后台自动守护运行，无需每次手动开启。${NC}"
echo ""

# 自动在默认浏览器中打开
if command -v open >/dev/null 2>&1; then
    open "http://127.0.0.1:8081" 2>/dev/null
fi
