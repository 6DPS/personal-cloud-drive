/**
 * ==============================================================================
 * DPSir 智云盘 - 开机自启动与后台服务生命周期管理器
 * 支持 Windows 与 macOS 双端，提供查询、一键开启静默自启、一键关闭与停止服务
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const { exec, execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function getWindowsStartupDirs() {
  const dirs = [];
  const userStartup = path.join(
    process.env.APPDATA || "",
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "Startup"
  );
  if (userStartup) dirs.push(userStartup);

  const commonStartup = path.join(
    process.env.ProgramData || "C:\\ProgramData",
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "Startup"
  );
  if (commonStartup) dirs.push(commonStartup);

  return dirs;
}

function getMacLaunchAgentPath() {
  const home = process.env.HOME || "";
  return path.join(home, "Library", "LaunchAgents", "com.dpsir.cloud-drive.plist");
}

/**
 * 查询当前开机自启状态
 */
function getStatus() {
  const platform = process.platform;
  let enabled = false;
  let mode = "none";
  let shortcutPath = "";

  if (platform === "win32") {
    const startupDirs = getWindowsStartupDirs();
    for (const dir of startupDirs) {
      const silentLnk = path.join(dir, "DPSir 智云盘后台服务.lnk");
      const legacyLnk = path.join(dir, "DPSir 智云盘.lnk");
      const altLnk = path.join(dir, "DPSir 智云盘服务.lnk");

      if (fs.existsSync(silentLnk)) {
        enabled = true;
        mode = "silent";
        shortcutPath = silentLnk;
        break;
      } else if (fs.existsSync(legacyLnk)) {
        enabled = true;
        mode = "legacy";
        shortcutPath = legacyLnk;
        break;
      } else if (fs.existsSync(altLnk)) {
        enabled = true;
        mode = "silent";
        shortcutPath = altLnk;
        break;
      }
    }
  } else if (platform === "darwin") {
    const plist = getMacLaunchAgentPath();
    if (fs.existsSync(plist)) {
      enabled = true;
      mode = "silent";
      shortcutPath = plist;
    }
  }

  return {
    ok: true,
    platform,
    enabled,
    mode, // 'silent' (静默后台) | 'legacy' (可能弹窗) | 'none'
    shortcutPath,
    description: enabled
      ? (mode === "silent"
          ? "已开启开机后台静默自启 (端口8081常驻就绪，手机可随时连，开机无弹窗)"
          : "已开启开机自启")
      : "开机自启已关闭 (仅在手动双击启动图标时运行)",
  };
}

/**
 * 启用开机后台静默自启
 */
function enableAutostart() {
  const platform = process.platform;

  if (platform === "win32") {
    const vbs = path.join(ROOT, "scripts", "enable-autostart.vbs");
    if (!fs.existsSync(vbs)) {
      throw new Error("自启配置脚本未找到: " + vbs);
    }
    execSync(`wscript.exe "${vbs}" /silent`, { stdio: "ignore", windowsHide: true });
    return getStatus();
  } else if (platform === "darwin") {
    const plist = getMacLaunchAgentPath();
    const launchAgentsDir = path.dirname(plist);
    if (!fs.existsSync(launchAgentsDir)) {
      fs.mkdirSync(launchAgentsDir, { recursive: true });
    }

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dpsir.cloud-drive</string>
    <key>ProgramArguments</key>
    <array>
        <string>${process.execPath}</string>
        <string>${path.join(ROOT, "scripts", "server-watchdog.js")}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${ROOT}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${path.join(ROOT, "logs", "mac-launchagent.out.log")}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(ROOT, "logs", "mac-launchagent.err.log")}</string>
</dict>
</plist>`;
    fs.writeFileSync(plist, plistContent, "utf8");
    try {
      execSync(`launchctl load -w "${plist}"`, { stdio: "ignore" });
    } catch {}
    return getStatus();
  }

  throw new Error("当前系统环境不支持自动化设置开机自启");
}

/**
 * 关闭开机自启
 */
function disableAutostart() {
  const platform = process.platform;

  if (platform === "win32") {
    const vbs = path.join(ROOT, "scripts", "disable-autostart.vbs");
    if (fs.existsSync(vbs)) {
      execSync(`wscript.exe "${vbs}" /silent`, { stdio: "ignore", windowsHide: true });
    } else {
      // 兜底直接删除启动项文件
      const startupDirs = getWindowsStartupDirs();
      const files = ["DPSir 智云盘后台服务.lnk", "DPSir 智云盘.lnk", "DPSir 智云盘服务.lnk"];
      for (const dir of startupDirs) {
        for (const f of files) {
          const p = path.join(dir, f);
          if (fs.existsSync(p)) {
            try { fs.unlinkSync(p); } catch {}
          }
        }
      }
    }
    return getStatus();
  } else if (platform === "darwin") {
    const plist = getMacLaunchAgentPath();
    if (fs.existsSync(plist)) {
      try {
        execSync(`launchctl unload -w "${plist}"`, { stdio: "ignore" });
      } catch {}
      try {
        fs.unlinkSync(plist);
      } catch {}
    }
    return getStatus();
  }

  throw new Error("当前系统环境不支持自动化关闭开机自启");
}

/**
 * 停止网盘服务并释放 8081 端口
 */
function stopService() {
  const platform = process.platform;

  try {
    const tunnelManager = require("./tunnel-manager");
    tunnelManager.stopTunnel();
  } catch {}

  if (platform === "win32") {
    const vbs = path.join(ROOT, "scripts", "stop-desktop.vbs");
    if (fs.existsSync(vbs)) {
      exec(`wscript.exe "${vbs}" /silent`, { windowsHide: true });
    }
  }

  // 延时让 HTTP 响应先返回给客户端，然后退出当前 Node.js 进程
  setTimeout(() => {
    process.exit(0);
  }, 600);

  return {
    ok: true,
    message: "智云盘服务正在安全停止，端口 8081 与公网隧道即将释放。",
  };
}

module.exports = {
  getStatus,
  enableAutostart,
  disableAutostart,
  stopService,
};
