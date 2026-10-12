#!/usr/bin/env bash
# ==============================================================================
# DPSir Personal Cloud Drive - macOS Setup & Migration Wizard
# ==============================================================================

# Set working directory to project root
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
ROOT_DIR="$( cd -P "$( dirname "$SOURCE" )/.." >/dev/null 2>&1 && pwd )"
cd "$ROOT_DIR" || exit 1

# ANSI colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}       DPSir Personal Cloud Drive - macOS Setup Wizard         ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""

# 1. Check and configure Node.js runtime environment
echo -e "${GREEN}[1/5] Checking Node.js runtime environment...${NC}"

# Include common macOS Node.js paths (Homebrew Apple Silicon / Intel / nvm)
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
    echo -e "${YELLOW}  Node.js runtime not detected.${NC}"
    echo -e "${CYAN}  Attempting automatic download of official Node.js LTS installer...${NC}"
    PKG_PATH="/tmp/node-v20.18.0.pkg"
    curl -fSL -A "Mozilla/5.0" "https://mirrors.huaweicloud.com/nodejs/v20.18.0/node-v20.18.0.pkg" -o "$PKG_PATH" 2>/dev/null || \
    curl -fSL -A "Mozilla/5.0" "https://npmmirror.com/mirrors/node/v20.18.0/node-v20.18.0.pkg" -o "$PKG_PATH" 2>/dev/null
    
    if [ -f "$PKG_PATH" ] && [ -s "$PKG_PATH" ]; then
        echo -e "${GREEN}  [OK] Installer downloaded. Opening macOS package installer...${NC}"
        open "$PKG_PATH" 2>/dev/null
        echo -e "${GRAY}  Note: Please complete the installation in the popup window.${NC}"
        read -p "Press Enter here after installation completes to continue..."
        rm -f "$PKG_PATH"
    elif command -v brew >/dev/null 2>&1; then
        echo -e "${GRAY}  Homebrew detected. Installing Node.js LTS via brew...${NC}"
        brew install node
    fi
    export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
fi

if ! command -v node >/dev/null 2>&1; then
    echo ""
    echo -e "${RED}  [WARN] Node.js was not detected. Please download and install it from one of the links below:${NC}"
    echo -e "${YELLOW}  -> Mirror 1 (Huawei Cloud): https://mirrors.huaweicloud.com/nodejs/v20.18.0/node-v20.18.0.pkg${NC}"
    echo -e "${YELLOW}  -> Mirror 2 (npmmirror)   : https://npmmirror.com/mirrors/node/v20.18.0/node-v20.18.0.pkg${NC}"
    echo -e "${GRAY}  -> Official Site          : https://nodejs.org/${NC}"
    echo -e "${YELLOW}  After installing Node.js, re-run this setup wizard.${NC}"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}  [OK] Node.js is ready: ${NODE_VER}${NC}"

# 2. Check and configure data storage path (STORAGE_BASE_ROOT)
echo ""
echo -e "${GREEN}[2/5] Configuring cloud drive data storage path...${NC}"

ENV_FILE="$ROOT_DIR/.env"
CURRENT_STORAGE=""

if [ -f "$ENV_FILE" ]; then
    CURRENT_STORAGE=$(grep -E '^\s*STORAGE_BASE_ROOT\s*=' "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
fi

DEFAULT_STORAGE="$HOME/PersonalCloudDrive"

if [ -z "$CURRENT_STORAGE" ] || [[ "$CURRENT_STORAGE" == *:* ]]; then
    # Fallback to macOS home directory path if empty or contains Windows drive letter colon
    CURRENT_STORAGE="$DEFAULT_STORAGE"
fi

echo -e "${CYAN}  Recommended / current data root directory: [${CURRENT_STORAGE}]${NC}"
echo -e "${GRAY}  Tip: If your data is on an external drive, you can drag the folder into this Terminal window.${NC}"
read -p "  Enter data directory path [Press Enter for default: ${CURRENT_STORAGE}]: " USER_INPUT_STORAGE

if [ -n "$USER_INPUT_STORAGE" ]; then
    CURRENT_STORAGE=$(echo "$USER_INPUT_STORAGE" | tr -d '"' | tr -d "'" | xargs)
fi

# Ensure directory exists
mkdir -p "$CURRENT_STORAGE"

ACCOUNTS_FILE="$CURRENT_STORAGE/accounts.json"
if [ -f "$ACCOUNTS_FILE" ]; then
    echo -e "${GREEN}  [OK] Existing migrated account data (accounts.json) detected and loaded!${NC}"
else
    echo -e "${GRAY}  [INFO] No existing accounts.json found. Default admin account will be initialized on startup.${NC}"
fi

# Write or update .env file
if [ -f "$ENV_FILE" ]; then
    if grep -q "STORAGE_BASE_ROOT" "$ENV_FILE"; then
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
# DPSir Personal Cloud Drive Configuration (macOS)
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

echo -e "${GREEN}  [OK] Storage path configured: ${CURRENT_STORAGE}${NC}"

# 3. Check dependencies (node_modules) & Git domestic mirror binding
echo ""
echo -e "${GREEN}[3/5] Checking application dependencies & cloud sync channel...${NC}"
if command -v git >/dev/null 2>&1; then
    if [ ! -d "$ROOT_DIR/.git" ]; then
        git init >/dev/null 2>&1
    fi
    if ! git remote get-url origin >/dev/null 2>&1; then
        git remote add origin "https://github.com/6DPS/personal-cloud-drive.git" 2>/dev/null
    fi
    if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
        for EP in "https://ghfast.top/https://github.com/6DPS/personal-cloud-drive.git" "https://gh-proxy.com/https://github.com/6DPS/personal-cloud-drive.git"; do
            if git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=15 fetch "$EP" main 2>/dev/null; then
                git checkout -f -B main FETCH_HEAD >/dev/null 2>&1
                git reset --hard FETCH_HEAD >/dev/null 2>&1
                git update-ref refs/remotes/origin/main FETCH_HEAD 2>/dev/null
                git branch --set-upstream-to=origin/main main >/dev/null 2>&1
                break
            fi
        done
    fi
fi
npm config set registry https://registry.npmmirror.com >/dev/null 2>&1
if [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo -e "${YELLOW}  Installing dependencies via domestic mirror (npm install --omit=dev)...${NC}"
    npm install --omit=dev
fi
echo -e "${GREEN}  [OK] Application dependencies are ready.${NC}"

# 4. Stop old processes and configure background launchd service
echo ""
echo -e "${GREEN}[4/5] Configuring macOS background auto-start service (launchd)...${NC}"

mkdir -p "$ROOT_DIR/logs"

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

echo -e "${GREEN}  [OK] Registered macOS LaunchAgent for automatic background startup.${NC}"

# 5. Verify service health
echo ""
echo -e "${GREEN}[5/5] Verifying cloud drive core service status...${NC}"
SERVICE_READY=false
for i in {1..6}; do
    if curl -s -m 2 "http://127.0.0.1:8081/api/me" >/dev/null 2>&1; then
        SERVICE_READY=true
        break
    fi
    sleep 1
done

if [ "$SERVICE_READY" = false ]; then
    nohup "${NODE_BIN_PATH}" "${ROOT_DIR}/server.js" > "${ROOT_DIR}/logs/drive.log" 2>&1 &
    sleep 2
    if curl -s -m 2 "http://127.0.0.1:8081/api/me" >/dev/null 2>&1; then
        SERVICE_READY=true
    fi
fi

LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ipconfig getifaddr en2 2>/dev/null || echo "127.0.0.1")

echo ""
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GREEN}       [OK] DPSir Personal Cloud Drive is Ready on macOS!      ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo -e "${YELLOW}  * Local Access URL : http://127.0.0.1:8081${NC}"
if [ "$LAN_IP" != "127.0.0.1" ]; then
    echo -e "${YELLOW}  * LAN Access URL   : http://${LAN_IP}:8081${NC}"
fi
echo -e "${YELLOW}  * Admin Username   : admin${NC}"
echo -e "${YELLOW}  * Admin Password   : admin123456 (or custom password in .env)${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo -e "${GRAY}Note: The service will run automatically in the background on boot.${NC}"
echo ""

if command -v open >/dev/null 2>&1; then
    open "http://127.0.0.1:8081" 2>/dev/null
fi

echo ""
read -p "Setup complete. Press Enter to exit..."
