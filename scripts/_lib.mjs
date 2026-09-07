// 共用工具：通过 gh CLI 调 GitHub REST API（不用自己管 token）
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const TIER_ORDER = ["daily-driver", "active-project", "portfolio", "archived"];
export const TIER_LABEL = {
  "daily-driver": "常用",
  "active-project": "主线",
  "portfolio": "展示",
  "archived": "归档",
};

function run(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * 调 API 并返回文本。
 * 注意：gh 的 --jq 对标量结果输出的是裸字符串（不加引号），所以不要盲目 JSON.parse；
 * 本账号真有过一个名字叫 "-" 的仓库，parse 它会抛 "No number after minus sign"。
 */
export function gh(args) {
  return run(args).trim();
}

export function api(p, args = []) {
  return gh(["api", p, ...args]);
}

/** 多行投影结果：对象行按 JSON 解析，标量行按原样返回 */
export function apiJsonl(p, args = []) {
  return api(p, args)
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const c = line[0];
      if (c === "{" || c === "[") {
        try { return JSON.parse(line); } catch { return line; }
      }
      return line;
    });
}

export function owner() {
  return api("user", ["--jq", ".login"]);
}

/** 当前登录用户的全部仓库（含私有）。sort 例："full_name" | "pushed" */
export function listRepos(sort) {
  const q = `?per_page=100${sort ? `&sort=${sort}` : ""}`;
  return apiJsonl(`/user/repos${q}`, ["--jq", ".[] | {name, private, language, pushed_at, topics}"]);
}

export function loadTiers(file = "tiers.json") {
  const p = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) {
    console.error(`找不到 ${p}\n  先执行：cp tiers.example.json tiers.json 并填入你的仓库`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * topics 是整体覆盖式 PUT：先写临时 JSON 再用 --input，比在命令行里拼数组安全
 * （gh 的 -f/-F 不支持 names[] 这种数组语法，拼出来会变成字面量键名）。
 */
export function putTopics(login, name, names) {
  const tmp = path.join(execFileSync(process.execPath, ["-e", "process.stdout.write(require('os').tmpdir())"], { encoding: "utf8" }),
    `topics-${Date.now()}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ names }));
  try {
    return api(`repos/${login}/${encodeURIComponent(name)}/topics`, ["-X", "PUT", "--input", tmp, "--jq", ".names | join(\", \")"]);
  } finally {
    fs.unlinkSync(tmp);
  }
}

/** 把表格写回 README 的 AUTO-INDEX 标记区块，只改这一段 */
export function spliceReadme(readmePath, block) {
  const S = "<!-- AUTO-INDEX:START -->";
  const E = "<!-- AUTO-INDEX:END -->";
  let t = fs.readFileSync(readmePath, "utf8");
  const i = t.indexOf(S);
  const j = t.indexOf(E);
  if (i < 0 || j < 0 || j < i) {
    console.error(`${readmePath} 里缺少 AUTO-INDEX 标记，脚本不动你的正文`);
    console.error(`  请在希望放总表的位置加两行：${S} 与 ${E}`);
    process.exit(1);
  }
  t = t.slice(0, i + S.length) + "\n" + block + "\n" + t.slice(j);
  fs.writeFileSync(readmePath, t);
  return t;
}

export function flag(argv, name) {
  return argv.includes(`--${name}`);
}

export function argAfter(argv, name, dflt) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
}
