# scripts - 跨平台自动化运维与指令库

本目录包含 DPSir 个人网盘在 Windows 与 macOS 平台的完整自动化运维、环境初始化与后台常驻守护指令：

## 1. 跨平台一键部署向导
- **`setup-new-windows-host.ps1`**：Windows 主机一键部署向导，支持国内华为云/阿里云高速镜像拉取 Node.js、自动放行系统防火墙、自动注册计划任务开机自启并启动服务。
- **`setup-mac.sh`**：macOS 苹果电脑一键部署向导，支持国内高速镜像、自动注册 launchd 后台静默自启。

## 2. 系统网络与防火墙放行
- **`allow-lan-firewall.ps1`**：Windows 系统防火墙 TCP 8081 端口全网络通用放行规则配置，保障局域网多设备畅通互联。
- **`show-addresses.ps1`**：智能探测并输出本机访问地址、局域网物理 IP 直达地址及公网远程域名。

## 3. 开机常驻与后台守护
- **`install-lan-autostart.ps1` / `uninstall-lan-autostart.ps1`**：Windows 局域网开机后台静默自启任务的安装与卸载。
- **`install-cloudflare-autostart.ps1` / `uninstall-cloudflare-autostart.ps1`**：Cloudflare 公网隧道开机后台自启的安装与卸载。
- **`run-lan-drive-hidden.ps1` / `run-cloudflare-domain-hidden.ps1`**：零窗口后台静默唤醒启动服务。
- **`server-watchdog.js`**：Node.js 原生进程看门狗，异常退出毫秒级自动拉起守护。

## 4. 换机迁移与云端同步
- **`export-drive-package.ps1` / `export-drive-package.sh`**：自动识别数据盘、统计文件容量与换机极简拷贝向导。
- **`pull-from-github.ps1` / `pull-from-github.sh`**：一键从 GitHub 拉取最新版本代码。
- **`push-to-github.ps1` / `push-to-github.sh`**：一键将本地工程改动安全推送到 GitHub。
- **`restart-all-services.ps1` / `restart-all-services.sh`**：一键释放占用端口并安全重启网盘全部服务。

## 5. 核心能力扩展
- **`render-office-preview.ps1` / `office-preview-worker.ps1`**：PowerPoint 与 Word 原生高清排版在线预览转换渲染引擎。
- **`clean-hidden-drive-files.ps1`**：清理网盘内临时隐藏缓存碎片。
