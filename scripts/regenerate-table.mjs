#!/usr/bin/env node
// 依据 tiers.json + 实时 API 重新生成索引 README 的"全量总表"，并同步 repos 徽章计数。
// 只动 <!-- AUTO-INDEX:START --> 与 <!-- AUTO-INDEX:END --> 之间，其余正文不碰。
// 用法：node scripts/regenerate-table.mjs [--readme README.md] [--file tiers.json]
import fs from "node:fs";
import { owner, listRepos, loadTiers, TIER_ORDER, TIER_LABEL, spliceReadme, argAfter } from "./_lib.mjs";

const readme = argAfter(process.argv, "readme", "README.md");
const tiers = loadTiers(argAfter(process.argv, "file", "tiers.json"));
const login = owner();
const live = new Map(listRepos().map((r) => [r.name, r]));
const rank = Object.fromEntries(TIER_ORDER.map((t, i) => [t, i]));

const rows = [];
for (const [name, cfg] of Object.entries(tiers.repos)) {
  const r = live.get(name);
  if (!r) { console.log(`跳过 ${name}：账号下已不存在（记得同步删掉 tiers.json 里的条目）`); continue; }
  rows.push({
    name,
    tier: TIER_LABEL[cfg.tier] || cfg.tier,
    freq: cfg.freq || "-",
    lang: r.language || cfg.lang || "-",
    vis: r.private ? "**private**" : "public",
    pushed: (r.pushed_at || "").slice(0, 10),
    _k: rank[cfg.tier] ?? 9,
  });
}
rows.sort((a, b) => a._k - b._k || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

const table =
  "| # | 仓库 | 层级 | 频率 | 语言 | 可见性 | 最近推送 |\n" +
  "|---|---|---|---|---|---|---|\n" +
  rows.map((x, i) =>
    `| ${i + 1} | [${x.name}](https://github.com/${login}/${encodeURIComponent(x.name)}) | ${x.tier} | ${x.freq} | ${x.lang} | ${x.vis} | ${x.pushed} |`
  ).join("\n") +
  `\n\n> 由 \`scripts/regenerate-table.mjs\` 依 \`GET /user/repos\` 生成，共 ${rows.length} 个仓库。"最近推送"仅供参考。`;

let text = spliceReadme(readme, table);
const badge = /(!\[repos\]\(https:\/\/img\.shields\.io\/badge\/repos-)[0-9]+(-[^)]*\))/;
if (badge.test(text)) text = text.replace(badge, `$1${rows.length}$2`);
fs.writeFileSync(readme, text);
console.log(`已重写 ${readme} 的 AUTO-INDEX 区块：${rows.length} 行`);
