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

// 国内高可用 GitHub 加速镜像列表（优先健康稳定节点）
const MIRROR_PREFIXES = [
  "https://ghfast.top/",
  "https://gh-proxy.com/",
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

const MAX_DOWNLOAD_BYTES = 150 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function fetchUrlBuffer(url, timeoutMs = 15000, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return reject(new Error("无效的下载地址"));
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return reject(new Error(`不支持的下载协议: ${parsed.protocol}`));
    }

    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const req = client.get(
      parsed.href,
      {
        headers: {
          "User-Agent": "DPSir-ZhiYunPan-Updater/1.0",
          Accept: "*/*",
        },
        timeout: timeoutMs,
      },
      (res) => {
        // 自动跟随 301 / 302 重定向（限制最大深度，防止循环重定向）
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            return reject(new Error("重定向次数过多"));
          }
          const nextUrl = new URL(res.headers.location, parsed.href).href;
          return fetchUrlBuffer(nextUrl, timeoutMs, redirectsLeft - 1)
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }

        const chunks = [];
        let receivedBytes = 0;
        res.on("data", (chunk) => {
          receivedBytes += chunk.length;
          if (receivedBytes > MAX_DOWNLOAD_BYTES) {
            req.destroy(new Error("更新包体积超出安全限制"));
            return;
          }
          chunks.push(chunk);
        });
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
 * 检查是否有新版本（全节点并发探测 + GitHub API 防缓存兜底，取最高版本避免旧镜像缓存抢答）
 */
async function fetchLatestCommitSha(timeoutMs = 3000) {
  try {
    const buf = await fetchUrlBuffer(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/main`,
      timeoutMs
    );
    const data = JSON.parse(buf.toString("utf8"));
    const sha = String(data?.sha || "").trim();
    return /^[0-9a-f]{40}$/i.test(sha) ? sha : "";
  } catch {
    return "";
  }
}

async function fetchPackageViaGitHubApi(timeoutMs = 3500) {
  const startedAt = Date.now();
  const buf = await fetchUrlBuffer(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/package.json?ref=main`,
    timeoutMs
  );
  const data = JSON.parse(buf.toString("utf8"));
  if (!data?.content) throw new Error("Missing API content");
  const pkg = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));
  if (!pkg || !pkg.version) throw new Error("Invalid API package.json");
  return { prefix: "https://ghfast.top/", pkg, elapsedMs: Date.now() - startedAt, viaApi: true };
}

async function checkUpdate() {
  const currentVersion = getLocalVersion();
  const candidates = [];

  // 并发探测所有镜像节点的 raw package.json，同时探测 GitHub API 防止 CDN 5 分钟旧缓存覆盖新版
  const mirrorProbes = MIRROR_PREFIXES.map(async (prefix) => {
    const startedAt = Date.now();
    const targetUrl = `${prefix}https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/package.json?_t=${Date.now()}`;
    const buf = await fetchUrlBuffer(targetUrl, 3500);
    const pkg = JSON.parse(buf.toString("utf8"));
    if (!pkg || !pkg.version) throw new Error("Invalid package.json");
    return { prefix, pkg, elapsedMs: Date.now() - startedAt, viaApi: false };
  });

  const commitShaPromise = fetchLatestCommitSha(3500);
  const apiProbePromise = fetchPackageViaGitHubApi(3500);

  const [results, commitSha] = await Promise.all([
    Promise.allSettled([...mirrorProbes, apiProbePromise]),
    commitShaPromise,
  ]);

  for (const r of results) {
    if (r.status === "fulfilled" && r.value?.pkg?.version) {
      candidates.push(r.value);
    }
  }

  // 若并发全部超时/失败，做一次官方通道 5 秒兜底重试
  if (candidates.length === 0) {
    try {
      const startedAt = Date.now();
      const fallbackRef = commitSha || "main";
      const buf = await fetchUrlBuffer(
        `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${fallbackRef}/package.json?_t=${Date.now()}`,
        5000
      );
      const pkg = JSON.parse(buf.toString("utf8"));
      if (pkg && pkg.version) {
        candidates.push({ prefix: "", pkg, elapsedMs: Date.now() - startedAt, viaApi: false });
      }
    } catch {}
  }

  if (candidates.length === 0) {
    return {
      ok: false,
      currentVersion,
      error: "未能连接到 GitHub 检查服务器，请检查网络连接后重试",
    };
  }

  // 取最高语义化版本号；版本相同时优先非 API 镜像通道及耗时更短的节点
  candidates.sort((a, b) => {
    const cmp = compareSemver(b.pkg.version, a.pkg.version);
    if (cmp !== 0) return cmp;
    if (a.viaApi !== b.viaApi) return a.viaApi ? 1 : -1;
    return a.elapsedMs - b.elapsedMs;
  });

  const winner = candidates[0];
  const latestPkg = winner.pkg;
  const successfulMirror = winner.prefix;
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

  const archiveRef = commitSha || "refs/heads/main";
  const downloadUrl = `${successfulMirror}https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${archiveRef}.zip`;

  const mirrorDisplay = successfulMirror
    ? successfulMirror.replace("https://", "").replace("/", "")
    : "GitHub Official";

  return {
    ok: true,
    hasUpdate,
    currentVersion,
    latestVersion,
    commitSha,
    changelog,
    downloadUrl,
    mirrorPrefix: successfulMirror,
    mirrorUsed: mirrorDisplay,
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
  let zip = null;
  let subFolder = "";
  let lastErr = null;

  // 优先尝试刚才探测胜出的最快镜像，若异常或遇到旧版本缓存则依次自动切换节点
  const bestPrefix = (check.mirrorPrefix !== undefined)
    ? check.mirrorPrefix
    : (check.mirrorUsed === "GitHub Official" ? "" : (check.mirrorUsed || ""));

  const orderedMirrors = [
    bestPrefix,
    ...MIRROR_PREFIXES.filter((m) => m !== bestPrefix),
  ];

  const archivePaths = [];
  if (check.commitSha) {
    archivePaths.push(`archive/${check.commitSha}.zip`);
  }
  archivePaths.push("archive/refs/heads/main.zip");

  for (const archivePath of archivePaths) {
    for (const prefix of orderedMirrors) {
      const mirrorName = prefix ? prefix.replace("https://", "").replace("/", "") : "官方通道";
      const url = `${prefix}https://github.com/${REPO_OWNER}/${REPO_NAME}/${archivePath}`;
      try {
        if (onProgress) onProgress(`正在通过高速加速镜像下载核心补丁包 (${mirrorName})...`);
        const candidateBuf = await fetchUrlBuffer(url, 15000);
        if (!candidateBuf || candidateBuf.length <= 20000) continue;

        const loadedZip = await JSZip.loadAsync(candidateBuf);
        const rootPrefixMatch = Object.keys(loadedZip.files).find((f) => f.includes("/"));
        const folderPrefix = rootPrefixMatch ? rootPrefixMatch.split("/")[0] : "";
        const pkgEntry = loadedZip.files[folderPrefix ? `${folderPrefix}/package.json` : "package.json"];
        if (pkgEntry) {
          const zipPkg = JSON.parse(await pkgEntry.async("string"));
          if (zipPkg?.version && compareSemver(zipPkg.version, check.latestVersion) < 0) {
            lastErr = new Error(`镜像 ${mirrorName} 缓存尚未刷新（仍为 v${zipPkg.version}），切换下一节点`);
            continue;
          }
        }

        zipBuffer = candidateBuf;
        zip = loadedZip;
        subFolder = folderPrefix;
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (zip) break;
  }

  if (!zipBuffer || !zip || zipBuffer.length < 20000) {
    throw new Error("更新包下载失败或超时：" + (lastErr ? lastErr.message : "未能获取到有效数据包"));
  }

  if (onProgress) onProgress("更新包下载完毕，正在校验并解压覆盖核心代码...");

  // 严禁覆盖的保护清单 (用户私有数据和核心配置永不受影响)
  const PROTECTED_PREFIXES = [
    ".env",
    ".git",
    ".cloudflared",
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

    // 特殊例外：允许热更新桌面客户端原生外壳 packaging/native-bin/DPSir-ZhiYunPan.exe
    const isNativeExe = relativePath === "packaging/native-bin/DPSir-ZhiYunPan.exe";

    // 保护检查
    const isProtected = !isNativeExe && PROTECTED_PREFIXES.some(
      (prefix) => relativePath === prefix || relativePath.startsWith(`${prefix}/`) || relativePath.startsWith(`${prefix}\\`)
    );
    if (isProtected) continue;

    const fileContent = await fileObj.async("nodebuffer");

    if (isNativeExe) {
      // 1. 同步保存至仓库 native-bin 目录
      const repoTarget = path.join(ROOT, "packaging", "native-bin", "DPSir-ZhiYunPan.exe");
      try {
        await fsp.mkdir(path.dirname(repoTarget), { recursive: true });
        await fsp.writeFile(repoTarget, fileContent);
      } catch {}

      // 2. 如果当前 ROOT 或已知安装目录存在运行外壳，利用 Windows 重命名无锁机制热替换
      const candidateExePaths = [
        path.join(ROOT, "DPSir-ZhiYunPan.exe"),
        "D:\\DPSir 智云盘\\DPSir-ZhiYunPan.exe",
        "C:\\Program Files\\DPSir 智云盘\\DPSir-ZhiYunPan.exe"
      ];
      for (const exePath of candidateExePaths) {
        if (fs.existsSync(exePath)) {
          try {
            const oldPath = exePath + ".old";
            if (fs.existsSync(oldPath)) {
              try { await fsp.unlink(oldPath); } catch {}
            }
            await fsp.rename(exePath, oldPath);
            await fsp.writeFile(exePath, fileContent);
          } catch (err) {
            try { await fsp.writeFile(exePath, fileContent); } catch {}
          }
        }
      }
      continue;
    }

    const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : `${ROOT}${path.sep}`;
    const targetPath = path.resolve(ROOT, relativePath);
    if (targetPath !== ROOT && !targetPath.startsWith(rootWithSep)) {
      console.warn("[Updater] Skipped unsafe archive entry outside ROOT:", relativePath);
      continue;
    }
    await fsp.mkdir(path.dirname(targetPath), { recursive: true });
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
