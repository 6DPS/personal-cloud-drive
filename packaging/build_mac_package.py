import os
import sys
import shutil
import zipfile
import stat

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BUILD_DIR = os.path.join(ROOT_DIR, "packaging", "mac-build")
APP_BUNDLE = os.path.join(BUILD_DIR, "DPSir 智云盘.app")
CONTENTS = os.path.join(APP_BUNDLE, "Contents")
MACOS_DIR = os.path.join(CONTENTS, "MacOS")
RESOURCES = os.path.join(CONTENTS, "Resources")
APP_PAYLOAD = os.path.join(RESOURCES, "app")
DIST_DIR = os.path.join(ROOT_DIR, "dist")
OUTPUT_ZIP = os.path.join(DIST_DIR, "DPSir-ZhiYunPan-macOS-v1.0.4.zip")

print("===============================================================")
print("     正在构建 DPSir 智云盘 macOS 商业标准版 (.app / .zip)...   ")
print("===============================================================")

# 1. 清理并准备目录
if os.path.exists(BUILD_DIR):
    shutil.rmtree(BUILD_DIR)
os.makedirs(MACOS_DIR, exist_ok=True)
os.makedirs(APP_PAYLOAD, exist_ok=True)
os.makedirs(DIST_DIR, exist_ok=True)

# 2. 写入 Info.plist
info_plist_content = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_CN</string>
    <key>CFBundleDisplayName</key>
    <string>DPSir 智云盘</string>
    <key>CFBundleExecutable</key>
    <string>DPSir-ZhiYunPan</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.dpsir.zhiyunpan.client</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>DPSir 智云盘</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.4</string>
    <key>CFBundleVersion</key>
    <string>1.0.4</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2026 DPSir Studio. All rights reserved.</string>
</dict>
</plist>
"""
with open(os.path.join(CONTENTS, "Info.plist"), "w", encoding="utf-8", newline="\n") as f:
    f.write(info_plist_content)

with open(os.path.join(CONTENTS, "PkgInfo"), "w", encoding="utf-8", newline="\n") as f:
    f.write("APPL????\n")

# 3. 复制 Retina 图标
icns_source = os.path.join(ROOT_DIR, "packaging", "AppIcon.icns")
shutil.copy2(icns_source, os.path.join(RESOURCES, "AppIcon.icns"))

# 4. 写入 MacOS 启动可执行脚本
launcher_script = """#!/usr/bin/env bash
# ==============================================================================
# DPSir 智云盘 - macOS 原生启动器 (Native App Launcher)
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONTENTS_DIR="$( cd "$DIR/.." && pwd )"
APP_DIR="$CONTENTS_DIR/Resources/app"

# 引入所有常见 macOS Node.js 运行环境路径 (Homebrew Apple Silicon / Intel / nvm / MacPorts)
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:/usr/bin:/bin:$PATH"

# 1. 检查 Node.js 环境
if ! command -v node >/dev/null 2>&1; then
    CHOICE=$(osascript -e 'display dialog "「DPSir 智云盘」需要 Node.js 运行时环境支持。\\n\\n检测到当前系统尚未安装 Node.js，是否立即自动前往官方下载安装包？" with title "DPSir 智云盘" buttons {"取消", "前往下载"} default button "前往下载" with icon note' 2>/dev/null)
    if [[ "$CHOICE" == *"前往下载"* ]]; then
        open "https://nodejs.org/zh-cn/download"
    fi
    exit 1
fi

# 2. 准备用户数据目录与默认配置
DEFAULT_STORAGE="$HOME/PersonalCloudDrive"
mkdir -p "$DEFAULT_STORAGE"
mkdir -p "$HOME/Library/Logs/DPSirCloudDrive"

ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat <<EOF > "$ENV_FILE"
PORT=8081
HOST=0.0.0.0
STORAGE_BASE_ROOT=${DEFAULT_STORAGE}
CLOUD_DRIVE_PASSWORD=
EOF
fi

# 3. 检测 8081 端口是否已经在运行
PORT_ALIVE=false
if curl -s -m 1 "http://127.0.0.1:8081/api/system/version" >/dev/null 2>&1; then
    PORT_ALIVE=true
fi

# 若未运行，在后台静默启动守护进程
if [ "$PORT_ALIVE" = false ]; then
    cd "$APP_DIR" || exit 1
    nohup node scripts/server-watchdog.js > "$HOME/Library/Logs/DPSirCloudDrive/watchdog.log" 2>&1 &
    
    # 循环等待服务就绪
    for i in {1..12}; do
        if curl -s -m 1 "http://127.0.0.1:8081/api/system/version" >/dev/null 2>&1; then
            PORT_ALIVE=true
            break
        fi
        sleep 0.5
    done
fi

# 4. 打开独立客户端窗口
TARGET_URL="http://127.0.0.1:8081"
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app="$TARGET_URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -na "Microsoft Edge" --args --app="$TARGET_URL"
elif [ -d "/Applications/Brave Browser.app" ]; then
    open -na "Brave Browser" --args --app="$TARGET_URL"
else
    open "$TARGET_URL"
fi
"""

launcher_path = os.path.join(MACOS_DIR, "DPSir-ZhiYunPan")
with open(launcher_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(launcher_script)

# 5. 复制核心程序到 Contents/Resources/app
print("[1/4] 复制核心代码与模块...")
items_to_copy = [
    "server.js",
    "package.json",
    "package-lock.json",
    ".env.example",
    "public",
    "scripts",
    "tools",
    "node_modules"
]

for item in items_to_copy:
    src = os.path.join(ROOT_DIR, item)
    dst = os.path.join(APP_PAYLOAD, item)
    if os.path.isdir(src):
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns("*.log", "__pycache__", ".git*"))
    elif os.path.isfile(src):
        shutil.copy2(src, dst)

# 6. 准备外围辅助脚本（停止服务、开机自启、使用说明）
print("[2/4] 生成配套快捷指令脚本...")
stop_script = """#!/usr/bin/env bash
PID=$(lsof -ti :8081 2>/dev/null)
if [ -n "$PID" ]; then
    kill -9 $PID 2>/dev/null
    osascript -e 'display dialog "「DPSir 智云盘」后台服务已停止，8081 端口已成功释放！" with title "服务已停止" buttons {"好的"} default button "好的" with icon note' 2>/dev/null
else
    osascript -e 'display dialog "网盘服务当前未在运行。" with title "提示" buttons {"好的"} default button "好的"' 2>/dev/null
fi
"""
with open(os.path.join(BUILD_DIR, "停止网盘服务.command"), "w", encoding="utf-8", newline="\n") as f:
    f.write(stop_script)

autostart_script = """#!/usr/bin/env bash
# ==============================================================================
# DPSir 智云盘 - macOS 开机自启服务配置工具
# ==============================================================================
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$DIR/DPSir 智云盘.app/Contents/Resources/app"
NODE_BIN=$(which node 2>/dev/null || echo "/usr/local/bin/node")

if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/Applications/DPSir 智云盘.app/Contents/Resources/app"
fi

PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.dpsir.zhiyunpan.plist"
mkdir -p "$PLIST_DIR"

cat <<EOF > "$PLIST_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dpsir.zhiyunpan</string>
    <key>ProgramArguments</key>
    <array>
        <string>${NODE_BIN}</string>
        <string>${APP_DIR}/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${APP_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${HOME}/Library/Logs/DPSir-CloudDrive-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${HOME}/Library/Logs/DPSir-CloudDrive-stderr.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST_FILE" 2>/dev/null
launchctl load -w "$PLIST_FILE" 2>/dev/null

osascript -e 'display dialog "「DPSir 智云盘」已成功注册为 macOS 开机自启服务！\\n\\n以后每次电脑开机，网盘将在后台静默自动运行。" with title "配置成功" buttons {"确定"} default button "确定" with icon note' 2>/dev/null
"""
with open(os.path.join(BUILD_DIR, "安装开机自启(可选).command"), "w", encoding="utf-8", newline="\n") as f:
    f.write(autostart_script)

readme_content = """===============================================================
       DPSir 智云盘 (Personal Cloud Drive) - macOS 商业使用指南
===============================================================

【快速开始】
1. 将「DPSir 智云盘.app」拖入您的「访达」->「应用程序 (Applications)」目录中（推荐，也可以在任意目录直接运行）；
2. 双击「DPSir 智云盘.app」即可秒级启动客户端并进入网盘；
3. 本机访问网址：http://127.0.0.1:8081
4. 局域网其他设备（手机/平板/电脑）：点击客户端左上角【访问来源】二维码扫码即可畅连。

【默认数据存放位置】
- 默认存放于您的主目录下：~/PersonalCloudDrive
- 支持直接插拔外接移动硬盘，可在软件目录 .env 中自定义存储路径。

【可选辅助工具】
- 「安装开机自启(可选).command」：双击即可将网盘注册为开机后台静默自启服务；
- 「停止网盘服务.command」：需要彻底关闭网盘并释放 8081 端口时双击运行。

【版本升级】
- 客户端内置 OTA 在线热更新引擎，在客户端左下角点击【检查更新】即可一键平滑升级，无需重复下载安装包！
===============================================================
"""
with open(os.path.join(BUILD_DIR, "使用说明.txt"), "w", encoding="utf-8", newline="\r\n") as f:
    f.write(readme_content)

# 7. 打包为带 POSIX 0755 权限的 macOS Zip 归档
print("[3/4] 正在压缩打包为 macOS 标准发行包 (保留 POSIX 0755 执行权限)...")

if os.path.exists(OUTPUT_ZIP):
    os.remove(OUTPUT_ZIP)

EXECUTABLE_EXTS = {".sh", ".command", ".py"}
EXECUTABLE_NAMES = {"DPSir-ZhiYunPan", "cloudflared"}

with zipfile.ZipFile(OUTPUT_ZIP, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
    for root, dirs, files in os.walk(BUILD_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, BUILD_DIR)
            
            # 判定是否需要 POSIX 可执行权限 (+x)
            is_exec = (
                file in EXECUTABLE_NAMES or 
                os.path.splitext(file)[1] in EXECUTABLE_EXTS or
                "Contents/MacOS" in rel_path.replace("\\", "/")
            )
            
            zinfo = zipfile.ZipInfo.from_file(full_path, arcname=rel_path)
            if is_exec:
                # 0o755 = rwxr-xr-x
                zinfo.external_attr = (stat.S_IFREG | 0o755) << 16
            else:
                # 0o644 = rw-r--r--
                zinfo.external_attr = (stat.S_IFREG | 0o644) << 16
            
            with open(full_path, "rb") as f_in:
                zipf.writestr(zinfo, f_in.read())

print("[4/4] 打包完成！")
print(f"macOS 发行包路径: {OUTPUT_ZIP}")
file_size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
print(f"压缩包体积: {file_size_mb:.2f} MB")
print("===============================================================")
