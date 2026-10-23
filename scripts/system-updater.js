/**
 * ==============================================================================
 * DPSir 智云盘 - 客户端在线热更新引擎 (OTA Update Engine)
 * 基于 GitHub 官方仓库 + 国内智能高速加速镜像
 * ==============================================================================
 */

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const https = require("https");
const http = require("http");
const os = require("os");
const JSZip = require("jszip");

const ROOT = path.resolve(__dirname, "..");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const REPO_OWNER = "6DPS";
const REPO_NAME = "personal-cloud-drive";

// 国内高可用 GitHub 加速镜像列表
const MIRROR_PREFIXES = [
  "https://ghfast.top/",
  "https://gh-proxy.com/",
  "https://ghproxy.net/",
  "https://gh.llkk.cc/",
  "", // 直接官方通道（作为兜底）
];

function getLocalVersion() {
  try {
    if (fs.existsSync(PACKAGE_JSON_PATH)) {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
      return pkg.version || "1.0.0";
    }
  } catch {}
  return "1.0.0";
}

function fetchUrlBuffer(url, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          "User-Agent": "DPSir-ZhiYunPan-Updater/1.0",
          Accept: "*/*",
        },
        timeout: timeoutMs,
      },
      (res) => {
        // 自动跟随 301 / 302 重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrlBuffer(res.headers.location, timeoutMs)
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`请求超时 (${timeoutMs}ms)`));
    });

    req.on("error", reject);
  });
}

function compareSemver(v1, v2) {
  const p1 = String(v1).replace(/^v/i, "").split(".").map(Number);
  const p2 = String(v2).replace(/^v/i, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

/**
 * 检查是否有新版本
 */
async function checkUpdate() {
  const currentVersion = getLocalVersion();
  let latestPkg = null;
  let successfulMirror = "";

  for (const prefix of MIRROR_PREFIXES) {
    const targetUrl = `${prefix}https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/package.json`;
    try {
      const buf = await fetchUrlBuffer(targetUrl, 5000);
      latestPkg = JSON.parse(buf.toString("utf8"));
      successfulMirror = prefix;
      break;
    } catch {}
  }

  if (!latestPkg || !latestPkg.version) {
    return {
      ok: false,
      currentVersion,
      error: "未能连接到 GitHub 检查服务器，请检查网络连接后重试",
    };
  }

  const latestVersion = latestPkg.version;
  const hasUpdate = compareSemver(latestVersion, currentVersion) > 0;

  // 动态读取 package.json 中的更新日志，若无则使用标准变更描述
  const changelog = (Array.isArray(latestPkg.changelog) && latestPkg.changelog.length > 0)
    ? latestPkg.changelog
    : [
        `DPSir 智云盘 v${latestVersion} 升级补丁`,
        "全面同步 GitHub 主干最新功能与核心代码",
        "新增新版本自动静默检测与弹窗提醒功能",
        "优化高分屏矢量渲染与字体抗锯齿表现",
      ];

  const downloadUrl = `${successfulMirror}https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/main.zip`;

  return {
    ok: true,
    hasUpdate,
    currentVersion,
    latestVersion,
    changelog,
    downloadUrl,
    mirrorUsed: successfulMirror || "GitHub Official",
  };
}

/**
 * 执行在线热更新 (下载 zip -> 解压覆盖代码 -> 守护进程平滑重启)
 */
async function applyUpdate(onProgress = null) {
  const check = await checkUpdate();
  if (!check.ok) {
    throw new Error(check.error || "获取更新信息失败");
  }

  const downloadUrl = check.downloadUrl;
  if (onProgress) onProgress("正在通过高速镜像下载代码更新包...");

  const zipBuffer = await fetchUrlBuffer(downloadUrl, 60000);
  if (!zipBuffer || zipBuffer.length < 50000) {
    throw new Error("更新包下载不完整，请稍后重试");
  }

  if (onProgress) onProgress("更新包下载完毕，正在校验并解压覆盖核心代码...");

  const zip = await JSZip.loadAsync(zipBuffer);
  const rootPrefixMatch = Object.keys(zip.files).find((f) => f.includes("/"));
  const subFolder = rootPrefixMatch ? rootPrefixMatch.split("/")[0] : "";

  // 严禁覆盖的保护清单 (用户私有数据和核心配置永不受影响)
  const PROTECTED_PREFIXES = [
    ".env",
    ".git",
    "runtime",
    "logs",
    "dist",
    "packaging",
    "tools/cloudflared.exe",
    "node_modules", // 避免锁定正在调用的原生二进制模块
  ];

  for (const [filename, fileObj] of Object.entries(zip.files)) {
    if (fileObj.dir) continue;

    // 去掉 GitHub zip 根目录前缀 (例如: personal-cloud-drive-main/server.js -> server.js)
    let relativePath = filename;
    if (subFolder && relativePath.startsWith(`${subFolder}/`)) {
      relativePath = relativePath.slice(subFolder.length + 1);
    }
    if (!relativePath) continue;

    // 保护检查
    const isProtected = PROTECTED_PREFIXES.some(
      (prefix) => relativePath === prefix || relativePath.startsWith(`${prefix}/`) || relativePath.startsWith(`${prefix}\\`)
    );
    if (isProtected) continue;

    const targetPath = path.join(ROOT, relativePath);
    await fsp.mkdir(path.dirname(targetPath), { recursive: true });

    const fileContent = await fileObj.async("nodebuffer");
    await fsp.writeFile(targetPath, fileContent);
  }

  if (onProgress) onProgress("核心代码热替换完成，正在平滑重启服务...");

  // 触发守护进程重启 (1.2 秒后让当前 node 正常退出，server-watchdog 会在 1 秒内拉起全新代码)
  setTimeout(() => {
    process.exit(0);
  }, 1200);

  return {
    ok: true,
    version: check.latestVersion,
    message: `升级成功！系统已更新至 v${check.latestVersion}，正在平滑热重启...`,
  };
}

module.exports = {
  getLocalVersion,
  checkUpdate,
  applyUpdate,
};
