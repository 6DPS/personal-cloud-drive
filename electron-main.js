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
const TARGET_URL = 'http://127.0.0.1:' + PORT;
const PUBLIC_ACCESS_URL = process.env.PUBLIC_ACCESS_URL || 'https://dpsirperson.085410.xyz';

let mainWindow = null;
let tray = null;
let isQuitting = false;
let hasNotifiedTray = false;
let spawnedServerChild = null;

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
    // 3. 智云盘公网穿透域名（支持开源部署者自定义配置）
    let publicHost = '';
    try {
      publicHost = new URL(PUBLIC_ACCESS_URL).hostname.toLowerCase();
    } catch {}

    if (
      (publicHost && host === publicHost) ||
      host.endsWith('085410.xyz') ||
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

// 检查服务是否已经在运行
function checkServerReady(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(TARGET_URL + '/api/me', { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

// 启动后台服务（若未运行）
async function ensureServerRunning() {
  const ready = await checkServerReady();
  if (ready) {
    console.log('[Electron] 后台服务已在运行，直接连接。');
    return;
  }

  console.log('[Electron] 后台服务未运行，正在唤起看门狗服务...');
  const watchdogScript = path.join(__dirname, 'scripts', 'server-watchdog.js');
  spawnedServerChild = spawn(process.execPath, [watchdogScript], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(PORT), HOST: '0.0.0.0' },
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
  });

  // 轮询等待服务就绪，最多 15 秒
  const startTime = Date.now();
  while (Date.now() - startTime < 15000) {
    await new Promise((r) => setTimeout(r, 400));
    if (await checkServerReady(800)) {
      console.log('[Electron] 后台服务已就绪！');
      return;
    }
  }
  console.warn('[Electron] 等待后台服务启动超时，将直接尝试加载页面。');
}

function createMainWindow() {
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

  // 启动默认加载本机访问
  mainWindow.loadURL(TARGET_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 关闭窗口拦截：默认隐藏到系统托盘，保持手机端局域网服务持续工作
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

  // 处理窗口内链接点击：
  // 如果是局域网地址、公网地址或本机地址，均直接在客户端窗口内打开，坚决不弹出外部浏览器！
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isCloudDriveUrl(url)) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    // 外部第三方链接才调用系统默认浏览器打开
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 处理页面导航：本网盘内部地址直接在窗口内流转
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isCloudDriveUrl(url)) {
      return;
    }
    event.preventDefault();
    shell.openExternal(url);
  });

  // 快捷键支持：Alt+Left（后退）、Alt+Right（前进）、Alt+Home（一键回本机 127.0.0.1）
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
      mainWindow.loadURL(TARGET_URL);
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
            mainWindow.loadURL(TARGET_URL);
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
    local: TARGET_URL,
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
  await ensureServerRunning();
  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  // Windows 下后台服务常驻托盘，不在此退出
});
