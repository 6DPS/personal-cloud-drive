const fs = require("fs");
const path = require("path");

const root = process.argv[2] || "D:\\PersonalCloudDrive\\files";

function score(value) {
  const text = String(value || "");
  return ((text.match(/[ÃÂâ�]/g) || []).length * 3) + ((text.match(/[äåæçèéêïð]/g) || []).length);
}

function readableName(name) {
  const decoded = Buffer.from(String(name || ""), "latin1").toString("utf8");
  if (!decoded || decoded.includes("\uFFFD")) return name;
  const decodedLooksUseful = /[\u3400-\u9fff]/.test(decoded) || score(decoded) + 2 < score(name);
  return score(name) > 0 && decodedLooksUseful ? decoded : name;
}

function uniquePath(target) {
  if (!fs.existsSync(target)) return target;
  const parsed = path.parse(target);
  let index = 1;
  let candidate = target;
  while (fs.existsSync(candidate)) {
    candidate = path.join(parsed.dir, `${parsed.name} (${index})${parsed.ext}`);
    index += 1;
  }
  return candidate;
}

function collect(dir, changes = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".tmp") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, changes);
    const fixed = readableName(entry.name);
    if (fixed !== entry.name) {
      changes.push({ from: full, to: uniquePath(path.join(dir, fixed)) });
    }
  }
  return changes;
}

const changes = collect(root);
for (const change of changes) {
  fs.renameSync(change.from, change.to);
  console.log(`${change.from} -> ${change.to}`);
}
console.log(`Renamed ${changes.length} item(s).`);
