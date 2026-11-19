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
let updateInProgress = false;

function fetchUrlBuffer(url, timeoutMs = 15000, redirectsLeft = MAX_REDIRECTS, deadlineMs = 0) {
  return new Promise((resolve, reject) => {
    const deadline = deadlineMs || (Date.now() + timeoutMs);
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      return reject(new Error(`请求总耗时超时 (${timeoutMs}ms)`));
    }

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
    let settled = false;
    let req = null;

    const finishResolve = (buf) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      resolve(buf);
    };
    const finishReject = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      reject(err);
    };

    const hardTimer = setTimeout(() => {
      try { req?.destroy(); } catch {}
      finishReject(new Error(`请求总耗时超时 (${timeoutMs}ms)`));
    }, remainingMs);
    hardTimer.unref?.();

    req = client.get(
      parsed.href,
      {
        headers: {
          "User-Agent": "DPSir-ZhiYunPan-Updater/1.0",
          Accept: "*/*",
        },
        timeout: remainingMs,
      },
      (res) => {
        // 自动跟随 301 / 302 重定向（限制最大深度，共享总截止时间）
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            return finishReject(new Error("重定向次数过多"));
          }
          clearTimeout(hardTimer);
          let nextUrl;
          try {
            nextUrl = new URL(res.headers.location, parsed.href).href;
          } catch {
            return finishReject(new Error("无效的重定向地址"));
          }
          return fetchUrlBuffer(nextUrl, timeoutMs, redirectsLeft - 1, deadline)
            .then(finishResolve)
            .catch(finishReject);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return finishReject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }

        const chunks = [];
        let receivedBytes = 0;
        res.on("data", (chunk) => {
          if (settled) return;
          receivedBytes += chunk.length;
          if (receivedBytes > MAX_DOWNLOAD_BYTES) {
            try { req.destroy(); } catch {}
            finishReject(new Error("更新包体积超出安全限制"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => finishResolve(Buffer.concat(chunks)));
        res.on("error", finishReject);
      }
    );

    req.on("timeout", () => {
      try { req.destroy(); } catch {}
      finishReject(new Error(`请求超时 (${timeoutMs}ms)`));
    });

    req.on("error", finishReject);
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

async function atomicReplaceFile(targetPath, contentBuffer) {
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  const tmpPath = `${targetPath}.ota.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2, 8)}.tmp`;
  try {
    await fsp.writeFile(tmpPath, contentBuffer);
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await fsp.rename(tmpPath, targetPath);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        if (err?.code === "EPERM" || err?.code === "EBUSY" || err?.code === "EACCES") {
          await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    if (lastErr) throw lastErr;
  } catch (err) {
    await fsp.rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
}

/**
 * 将已校验的压缩包事务化写入目标目录：
 * 1) 先在内存中全部解压校验；
 * 2) 逐个原子落盘并记录备份，失败自动回滚；
 * 3) package.json 强制留在所有核心文件写入完成后最后一步落盘，杜绝半更新卡死。
 */
async function extractZipAtomically(zip, subFolder, targetRoot = ROOT, options = {}) {
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

  const rootResolved = path.resolve(targetRoot);
  const rootWithSep = rootResolved.endsWith(path.sep) ? rootResolved : `${rootResolved}${path.sep}`;
  const regularEntries = [];
  let packageJsonEntry = null;
  let nativeExeEntry = null;

  // Phase 1: 全部读取到内存并完成路径安全边界校验（不碰磁盘）
  for (const [filename, fileObj] of Object.entries(zip.files)) {
    if (fileObj.dir) continue;

    let relativePath = filename;
    if (subFolder && relativePath.startsWith(`${subFolder}/`)) {
      relativePath = relativePath.slice(subFolder.length + 1);
    }
    if (!relativePath) continue;

    const normalizedRel = relativePath.replace(/\\/g, "/");
    const isNativeExe = normalizedRel === "packaging/native-bin/DPSir-ZhiYunPan.exe";

    const isProtected = !isNativeExe && PROTECTED_PREFIXES.some(
      (prefix) => normalizedRel === prefix || normalizedRel.startsWith(`${prefix}/`)
    );
    if (isProtected) continue;

    const fileContent = await fileObj.async("nodebuffer");

    if (isNativeExe) {
      nativeExeEntry = { relativePath: normalizedRel, fileContent };
      continue;
    }

    const targetPath = path.resolve(rootResolved, normalizedRel);
    if (targetPath !== rootResolved && !targetPath.startsWith(rootWithSep)) {
      console.warn("[Updater] Skipped unsafe archive entry outside ROOT:", normalizedRel);
      continue;
    }

    if (normalizedRel === "package.json") {
      packageJsonEntry = { relativePath: normalizedRel, targetPath, fileContent };
    } else {
      regularEntries.push({ relativePath: normalizedRel, targetPath, fileContent });
    }
  }

  // Phase 2: 创建临时回滚备份目录，依次原子替换普通文件 -> 原生外壳 -> 最后写 package.json
  const backupDir = await fsp.mkdtemp(path.join(os.tmpdir(), "pcd-ota-backup-"));
  const appliedJournal = [];
  const orderedEntries = packageJsonEntry
    ? [...regularEntries, packageJsonEntry]
    : regularEntries;

  const replaceFn = typeof options.replaceFile === "function" ? options.replaceFile : atomicReplaceFile;

  try {
    let idx = 0;
    for (const entry of orderedEntries) {
      const existed = fs.existsSync(entry.targetPath);
      let backupPath = null;
      if (existed) {
        backupPath = path.join(backupDir, `${idx}.bak`);
        await fsp.copyFile(entry.targetPath, backupPath);
      }
      idx += 1;

      await replaceFn(entry.targetPath, entry.fileContent, entry.relativePath);
      appliedJournal.push({ targetPath: entry.targetPath, existed, backupPath });
    }

    // Phase 3: 若包含 Windows 原生外壳且处于生产部署路径，利用 Windows 重命名无锁热替换
    if (nativeExeEntry && !options.skipNativeExeSwap) {
      const repoTarget = path.join(rootResolved, "packaging", "native-bin", "DPSir-ZhiYunPan.exe");
      try {
        await atomicReplaceFile(repoTarget, nativeExeEntry.fileContent);
      } catch {}

      const candidateExePaths = [
        path.join(rootResolved, "DPSir-ZhiYunPan.exe"),
        "D:\\DPSir 智云盘\\DPSir-ZhiYunPan.exe",
        "C:\\Program Files\\DPSir 智云盘\\DPSir-ZhiYunPan.exe",
      ];
      for (const exePath of candidateExePaths) {
        if (fs.existsSync(exePath)) {
          try {
            const oldPath = exePath + ".old";
            if (fs.existsSync(oldPath)) {
              try { await fsp.unlink(oldPath); } catch {}
            }
            await fsp.rename(exePath, oldPath);
            await fsp.writeFile(exePath, nativeExeEntry.fileContent);
          } catch {
            try { await fsp.writeFile(exePath, nativeExeEntry.fileContent); } catch {}
          }
        }
      }
    }
  } catch (err) {
    // 任意一步写入失败 -> 按逆序自动回滚所有已改动文件，保持原有版本完整可用
    for (let i = appliedJournal.length - 1; i >= 0; i -= 1) {
      const rec = appliedJournal[i];
      try {
        if (rec.existed && rec.backupPath && fs.existsSync(rec.backupPath)) {
          const origBuf = await fsp.readFile(rec.backupPath);
          await atomicReplaceFile(rec.targetPath, origBuf);
        } else if (!rec.existed) {
          await fsp.rm(rec.targetPath, { force: true });
        }
      } catch (rollbackErr) {
        console.error("[Updater] Rollback failed for", rec.targetPath, rollbackErr?.message);
      }
    }
    throw err;
  } finally {
    await fsp.rm(backupDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * 执行在线热更新 (并发锁 -> 下载 zip -> 校验版本 -> 原子覆盖+失败回滚 -> 守护进程平滑重启)
 */
async function applyUpdate(onProgress = null) {
  if (updateInProgress) {
    const busyErr = new Error("系统正在执行在线更新，请勿重复点击，稍候片刻即可完成");
    busyErr.status = 409;
    throw busyErr;
  }
  updateInProgress = true;

  try {
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
          // 单节点硬性总耗时上限 20 秒，避免慢速滴水线路长期卡死
          const candidateBuf = await fetchUrlBuffer(url, 20000);
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

    if (onProgress) onProgress("更新包下载完毕，正在事务化校验并替换核心代码...");
    await extractZipAtomically(zip, subFolder, ROOT);

    if (onProgress) onProgress("核心代码热替换完成，正在平滑重启服务...");

    // 触发守护进程重启 (1.2 秒后让当前 node 正常退出，server-watchdog 会自动拉起全新代码)
    // 保持 updateInProgress=true 直到进程退出，杜绝重启窗口内重复触发
    setTimeout(() => {
      process.exit(0);
    }, 1200);

    return {
      ok: true,
      version: check.latestVersion,
      message: `升级成功！系统已更新至 v${check.latestVersion}，正在平滑热重启...`,
    };
  } catch (err) {
    updateInProgress = false;
    throw err;
  }
}

module.exports = {
  getLocalVersion,
  checkUpdate,
  applyUpdate,
  _internal: {
    fetchUrlBuffer,
    extractZipAtomically,
    isUpdateInProgress: () => updateInProgress,
  },
};
