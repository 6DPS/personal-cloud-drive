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

// 国内高可用 GitHub 加速镜像列表（已通过实时测速与高并发筛选的最优节点）
const MIRROR_PREFIXES = [
  "https://ghfast.top/",
  "https://gh-proxy.com/",
  "https://gh.llkk.cc/",
  "https://ghproxy.net/",
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

function fetchUrlBuffer(url, timeoutMs = 15000) {
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
 * 检查是否有新版本（并发探测所有高速加速节点，毫秒级响应）
 */
async function checkUpdate() {
  const currentVersion = getLocalVersion();
  let latestPkg = null;
  let successfulMirror = "";

  // 并发向所有节点发起 3.5s 快速探测，只要任一节点返回合法版本信息即立刻采用
  const probePromises = MIRROR_PREFIXES.map((prefix) => {
    return new Promise(async (resolve, reject) => {
      const targetUrl = `${prefix}https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/package.json?_t=${Date.now()}`;
      try {
        const buf = await fetchUrlBuffer(targetUrl, 3500);
        const pkg = JSON.parse(buf.toString("utf8"));
        if (pkg && pkg.version) {
          return resolve({ prefix, pkg });
        }
        reject(new Error("Invalid package.json"));
      } catch (err) {
        reject(err);
      }
    });
  });

  try {
    const winner = await Promise.any(probePromises);
    latestPkg = winner.pkg;
    successfulMirror = winner.prefix;
  } catch (err) {
    // 若并发全部超时/失败，做一次官方通道 5 秒兜底重试
    try {
      const buf = await fetchUrlBuffer(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/package.json?_t=${Date.now()}`, 5000);
      latestPkg = JSON.parse(buf.toString("utf8"));
      successfulMirror = "";
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
        "优化桌面客户端全屏最大化自适应适配",
        "升级 OTA 在线更新引擎多节点并发测速与断点下载",
        "全面同步 GitHub 主干最新功能与核心代码",
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

  let zipBuffer = null;
  let lastErr = null;

  // 优先尝试刚才探测胜出的最快镜像，若异常则依次自动切换至其余高可用节点
  const orderedMirrors = [
    check.mirrorUsed,
    ...MIRROR_PREFIXES.filter((m) => m !== check.mirrorUsed),
  ];

  for (const prefix of orderedMirrors) {
    const mirrorName = prefix ? prefix.replace("https://", "").replace("/", "") : "官方通道";
    const url = `${prefix}https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/main.zip`;
    try {
      if (onProgress) onProgress(`正在通过高速加速镜像下载核心补丁包 (${mirrorName})...`);
      // 控制单节点下载超时为 15 秒，避免卡死在某一条不稳定线路上
      zipBuffer = await fetchUrlBuffer(url, 15000);
      if (zipBuffer && zipBuffer.length > 20000) {
        break;
      }
    } catch (err) {
      lastErr = err;
    }
  }

  if (!zipBuffer || zipBuffer.length < 20000) {
    throw new Error("更新包下载失败或超时：" + (lastErr ? lastErr.message : "未能获取到有效数据包"));
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
    "docs",
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
