const { app, BrowserWindow, Tray, Menu, shell, clipboard, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');

function loadDotEnv(envPath = path.join(__dirname, '.env')) {
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {}
}
loadDotEnv();

const PORT = 8081;
const TARGET_LOCAL_URL = 'http://127.0.0.1:' + PORT;
const PUBLIC_ACCESS_URL = process.env.PUBLIC_ACCESS_URL || '';

let mainWindow = null;
let tray = null;
let isQuitting = false;
let hasNotifiedTray = false;
let spawnedServerChild = null;
let currentActiveUrl = TARGET_LOCAL_URL;

// 防多开互斥锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// 获取局域网 IP
function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const dev in ifaces) {
    for (const details of ifaces[dev]) {
      if (details.family === 'IPv4' && !details.internal) {
        if (
          details.address.startsWith('192.168.') ||
          details.address.startsWith('10.') ||
          details.address.startsWith('172.') ||
          details.address.startsWith('198.18.')
        ) {
          return details.address;
        }
      }
    }
  }
  return '127.0.0.1';
}

// 判断链接是否属于本智云盘内部地址（本机、局域网、公网穿透域名）
function isCloudDriveUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    const port = parsed.port;

    // 1. 本机端口 8081
    if ((host === '127.0.0.1' || host === 'localhost') && (!port || port === '8081')) {
      return true;
    }
    // 2. 局域网各常见网段 IP
    if (
      (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.') || host.startsWith('198.18.')) &&
      (!port || port === '8081')
    ) {
      return true;
    }
    // 3. 智云盘公网穿透域名
    let publicHost = '';
    try {
      publicHost = new URL(PUBLIC_ACCESS_URL).hostname.toLowerCase();
    } catch {}

    if (
      (publicHost && host === publicHost) ||
            host.includes('trycloudflare.com') ||
      host.includes('cloudflare')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// 检查指定地址是否在线
function checkUrlReady(targetUrl, timeoutMs = 1200) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? require('https') : require('http');
      const req = client.get(targetUrl + '/api/me', { timeout: timeoutMs }, (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.on('error', () => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

// 智能判断启动地址（自适应：在主机自动连本机极速，在别人电脑自动连公网）
async function determineTargetUrl() {
  // 1. 检测本地 127.0.0.1:8081 是否在线
  const isLocalAlive = await checkUrlReady(TARGET_LOCAL_URL, 800);
  if (isLocalAlive) {
    console.log('[Electron] 本机网盘服务已在线，以主机极速模式启动 (127.0.0.1)');
    return TARGET_LOCAL_URL;
  }

  // 2. 检测本地是否存在看门狗或数据盘（识别是否在服主本机上）
  const isHost = fs.existsSync('D:\\PersonalCloudDrive') || fs.existsSync(path.join(__dirname, 'scripts', 'server-watchdog.js'));
  if (isHost) {
    console.log('[Electron] 检测为服主主机，正在唤醒看门狗服务...');
    const watchdogScript = path.join(__dirname, 'scripts', 'server-watchdog.js');
    if (fs.existsSync(watchdogScript)) {
      spawnedServerChild = spawn(process.execPath, [watchdogScript], {
        cwd: __dirname,
        env: { ...process.env, PORT: String(PORT), HOST: '0.0.0.0' },
        stdio: ['ignore', 'ignore', 'ignore'],
        windowsHide: true,
      });
      const startTime = Date.now();
      while (Date.now() - startTime < 12000) {
        await new Promise((r) => setTimeout(r, 400));
        if (await checkUrlReady(TARGET_LOCAL_URL, 600)) {
          console.log('[Electron] 本机后台服务已就绪！');
          return TARGET_LOCAL_URL;
        }
      }
    }
  }

  // 3. 如果在别人电脑上（本地无服务且无数据盘），自动直连公网专属域名
  console.log('[Electron] 检测为远程访客客户端，自动连接公网服务:', PUBLIC_ACCESS_URL);
  return PUBLIC_ACCESS_URL;
}

function createMainWindow(startUrl) {
  currentActiveUrl = startUrl;
  const iconPath = path.join(__dirname, 'build', 'icon.ico');
  const fallbackIcon = path.join(__dirname, 'public', 'app-icon-256.png');
  const appIcon = fs.existsSync(iconPath) ? iconPath : fallbackIcon;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    title: 'DPSir 智云盘',
    icon: appIcon,
    show: false,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      spellcheck: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // 加载页面
  mainWindow.loadURL(currentActiveUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 加载容错：如果在别人电脑上加载 127.0.0.1 失败，自动秒级重试并切换到公网
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL && validatedURL.includes('127.0.0.1') && PUBLIC_ACCESS_URL) {
      console.log('[Electron] 本机地址未连通，自动切换到公网地址:', PUBLIC_ACCESS_URL);
      currentActiveUrl = PUBLIC_ACCESS_URL;
      mainWindow.loadURL(PUBLIC_ACCESS_URL);
    }
  });

  // 关闭窗口拦截：默认隐藏到系统托盘，保持后台服务静默工作
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (!hasNotifiedTray && tray) {
        hasNotifiedTray = true;
        try {
          tray.displayBalloon({
            title: 'DPSir 智云盘',
            content: '客户端已最小化到系统托盘，后台服务仍在运行中。双击托盘图标可重新打开。',
          });
        } catch {}
      }
    }
  });

  // 处理窗口内链接点击：局域网、公网或本机均在客户端内直接打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isCloudDriveUrl(url)) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 处理页面导航
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isCloudDriveUrl(url)) {
      return;
    }
    event.preventDefault();
    shell.openExternal(url);
  });

  // 快捷键支持：Alt+Left（后退）、Alt+Right（前进）、Alt+Home（一键回本机）
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.alt && input.key === 'ArrowLeft') {
      if (mainWindow.webContents.canGoBack()) {
        mainWindow.webContents.goBack();
        event.preventDefault();
      }
    } else if (input.alt && input.key === 'ArrowRight') {
      if (mainWindow.webContents.canGoForward()) {
        mainWindow.webContents.goForward();
        event.preventDefault();
      }
    } else if (input.alt && (input.key === 'Home' || input.key === 'h' || input.key === 'H')) {
      mainWindow.loadURL(TARGET_LOCAL_URL);
      event.preventDefault();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.ico');
  const fallbackIcon = path.join(__dirname, 'public', 'app-icon-256.png');
  const appIcon = fs.existsSync(iconPath) ? iconPath : fallbackIcon;

  tray = new Tray(appIcon);
  const lanIp = getLanIp();
  const lanUrl = 'http://' + lanIp + ':' + PORT;
  const pubUrl = PUBLIC_ACCESS_URL;
  let pubHost = '公网访问';
  try {
    pubHost = new URL(pubUrl).hostname;
  } catch {}

  const updateMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'DPSir 智云盘 (运行中)', enabled: false },
      { type: 'separator' },
      {
        label: '打开主界面',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: '一键切换: 本机极速访问 (127.0.0.1)',
        click: () => {
          if (mainWindow) {
            mainWindow.loadURL(TARGET_LOCAL_URL);
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: '一键切换: 局域网访问 (' + lanIp + ')',
        click: () => {
          if (mainWindow) {
            mainWindow.loadURL(lanUrl);
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: '一键切换: 公网访问 (' + pubHost + ')',
        click: () => {
          if (mainWindow) {
            mainWindow.loadURL(pubUrl);
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: '复制局域网地址 (' + lanUrl + ')',
        click: () => {
          clipboard.writeText(lanUrl);
          if (tray && tray.displayBalloon) {
            tray.displayBalloon({
              title: 'DPSir 智云盘',
              content: '已复制局域网访问地址到剪贴板：\n' + lanUrl,
            });
          }
        },
      },
      {
        label: '复制公网地址 (' + pubUrl + ')',
        click: () => {
          clipboard.writeText(pubUrl);
          if (tray && tray.displayBalloon) {
            tray.displayBalloon({
              title: 'DPSir 智云盘',
              content: '已复制公网访问地址到剪贴板：\n' + pubUrl,
            });
          }
        },
      },
      { type: 'separator' },
      {
        label: '重新加载页面 (Ctrl+R)',
        click: () => {
          if (mainWindow) mainWindow.reload();
        },
      },
      {
        label: '退出智云盘',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateMenu();
  tray.setToolTip('DPSir 智云盘\n局域网地址: ' + lanUrl);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.on('click', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC 通信处理
ipcMain.handle('get-lan-addresses', () => {
  const lanIp = getLanIp();
  return {
    local: TARGET_LOCAL_URL,
    lan: 'http://' + lanIp + ':' + PORT,
    public: PUBLIC_ACCESS_URL,
  };
});

ipcMain.handle('copy-to-clipboard', (event, text) => {
  clipboard.writeText(String(text || ''));
  return true;
});

ipcMain.handle('open-external', (event, url) => {
  if (url) shell.openExternal(url);
  return true;
});

app.on('before-quit', () => {
  isQuitting = true;
  if (spawnedServerChild) {
    try {
      spawnedServerChild.kill();
    } catch {}
  }
});

app.whenReady().then(async () => {
  const startUrl = await determineTargetUrl();
  createMainWindow(startUrl);
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(startUrl);
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  // Windows 下后台服务常驻托盘，不在此退出
});
