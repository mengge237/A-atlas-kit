#!/usr/bin/env node
// 打印真实的排序位置：默认视图(Last updated) vs Sort->Name(full_name)。
// 改仓库名之前先跑一次，别靠猜；跑完就能看清"默认视图根本不看名字"。
// 用法：node scripts/measure-sort.mjs
import { apiJsonl, owner } from "./_lib.mjs";

const byName = apiJsonl("/user/repos?per_page=100&sort=full_name", ["--jq", ".[].name"]);
const byUpdated = apiJsonl("/user/repos?per_page=100&sort=pushed", ["--jq", ".[].name"]);

console.log(`账号 ${owner()} 共 ${byName.length} 个仓库（含私有）\n`);
console.log("Sort -> Name（GitHub 自己的名称比较器）:");
byName.forEach((n, i) => console.log(`  ${String(i + 1).padStart(2)}  ${n}`));

console.log("\n默认视图 = Last updated（前 8，和名称排序几乎无关）:");
byUpdated.slice(0, 8).forEach((n, i) => console.log(`  ${i + 1}  ${n}`));

const punct = byName.filter((n) => /^[^a-z0-9]/i.test(n));
console.log(`\n名称排序第 1 名当前是 "${byName[0]}"。`);
if (punct.length) {
  console.log(`以非字母开头的仓库：${punct.join(" / ")}`);
  console.log("想靠名字抢首位，得先比过它们；把它们清掉之后，字母前缀 + 连字符才是第一位。");
}
console.log("\n实测规律：- . 0 排在字母之前，_ 排在字母之后");
console.log("  A-atlas -> 靠前          A_atlas -> 会掉到 accounting-* / ai-* 之后");
