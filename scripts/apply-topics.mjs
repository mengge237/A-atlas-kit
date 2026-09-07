#!/usr/bin/env node
// 批量给仓库打 topics：每个仓库恰好 1 个层级 topic + 若干领域 topic。
// 用法：node scripts/apply-topics.mjs [--dry-run] [--file tiers.json]
//
// 两个必须踩的坑，脚本里已经处理：
//  1) topics 是整体覆盖式 PUT —— 不先读旧值就会把别人手工加的标签抹掉；
//  2) gh 的 -f/-F 不支持 names[] 数组语法，拼出来是字面量键名，
//     所以走临时 JSON 文件 + --input（见 _lib.mjs 的 putTopics）。
import { apiJsonl, owner, loadTiers, putTopics, TIER_ORDER, flag, argAfter } from "./_lib.mjs";

const tiers = loadTiers(argAfter(process.argv, "file", "tiers.json"));
const dry = flag(process.argv, "dry-run");
const login = owner();

const existing = new Map(
  apiJsonl("/user/repos?per_page=100", ["--jq", ".[] | {name, topics}"]).map((r) => [r.name, r.topics || []])
);

let changed = 0;
for (const [name, cfg] of Object.entries(tiers.repos)) {
  if (!cfg.tier || !TIER_ORDER.includes(cfg.tier)) {
    console.log(`跳过 ${name}：tier 必须是 ${TIER_ORDER.join(" / ")}`);
    continue;
  }
  const want = [...new Set([cfg.tier, ...(cfg.topics || [])])].slice(0, 20);
  const have = existing.get(name);
  if (!have) {
    console.log(`跳过 ${name}：当前账号（${login}）下找不到该仓库`);
    continue;
  }
  const merged = [...new Set([...have, ...want])];
  if (merged.length === have.length) {
    console.log(`= ${name} 标签已齐`);
    continue;
  }
  changed++;
  const added = merged.filter((x) => !have.includes(x)).join(",");
  console.log(`${dry ? "[dry] " : ""}+ ${name}: 新增 ${added}（保留原有 ${have.join(",") || "无"}）`);
  if (!dry) console.log(`    -> ${putTopics(login, name, merged)}`);
}
console.log(dry ? `\n预演结束：${changed} 个仓库待更新` : `\n完成：${changed} 个仓库已更新`);
