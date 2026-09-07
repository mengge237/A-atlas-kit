# A-atlas-kit · GitHub 仓库"频率分级"索引：方法与脚本

![lang](https://img.shields.io/badge/lang-JavaScript-informational) ![status](https://img.shields.io/badge/status-maintained-brightgreen) ![deps](https://img.shields.io/badge/deps-gh%20CLI-lightgrey)

把一堆年度性堆积的 GitHub 仓库整理成**一份按使用频率分层的索引**的完整做法：分级判据、命名与排序实测、topics 批量落地、自动重生成总表的脚本。

> 我自用的索引仓库是私有的，本仓库只放**方法、实测结论与脚本**，不含任何个人仓库信息。

## 0. 为什么需要自己写索引

GitHub 原生只有语言、star、更新时间这几个维度，回答不了真正重要的那个问题：**这一堆仓库里，哪些是我天天在用的，哪些早就该当没有？**

而且默认视图会主动误导你：主页仓库列表默认按 `Last updated` 排序，谁最后被推过一次谁就在最上面。我实测时的情况是——一个当天刚 fork 的第三方工具仓库（其实是给上游提 PR 用的），把全部主力项目压在了下面。

## 1. 分级判据：只看打开频率，不看技术栈

按语言或框架分类是新手最常见的做法，也是最快失效的做法：同一门语言里既有一次性 demo，也有每天都在跑的daily driver，把它们塞进同一个"Java"标题下等于没分。

只用一条判据，写成可复现的规则：**过去 30 天内我自己打开过几次**。

| 层级 | topic | 判据 | 频率 |
|---|---|---|---|
| Tier 1 常用 | `daily-driver` | 日常在跑、在改，离了手会不舒服 | 每天 / 每周 |
| Tier 2 主线 | `active-project` | 阶段性开发，几周回头看一次 | 阶段 |
| Tier 3 展示 | `portfolio` | 自己不打开，求职或给人看时才动 | 极低（集中维护） |
| Tier 4 归档 | `archived` | 一次性产物或已被取代，只读 | 只读 |

配套两条硬规则，避免"分级靠感觉"：

- 一次性产物（事故报告、会话备份、为提上游 PR 而建的 fork）**出生即 Tier 4**，不允许进前三层
- 同一产品的前后端**必须同层、成对登记**，并在 README 首段互链——否则半年后你只认得其中一个

## 1.5 两个把自己判错的真实案例

分级最危险的不是懒，是**用错的信号得出看起来合理的结论**。这两个坑我亲自踩过：

| 错误做法 | 后果 | 正确做法 |
|---|---|---|
| 用"默认分支上本人提交数为 0"判定某个 fork 没用 | 误判：那个 fork 其实带着 3 个已提交上游的 PR，只是都开在独立分支上，默认分支当然和上游一致 | 判 fork 要同时看 `GET /repos/{owner}/{repo}/branches`、`gh pr list --repo <上游> --state all --author <自己>`，以及本地工作目录里未推送的分支 |
| 按 `pushed_at` 排活跃度 | 批量导入/镜像会把一堆仓库刷成同一天，排出的是"哪天搬运过" | 活跃度靠人工判据（30 天内打开过几次），时间戳只当参考 |

还有一条配套红线：**被外部引用过的仓库不能删也不能改名**。issue、Discussion、别人文档里贴过的图片/链接（图床型仓库最容易中），改名后外部页面直接裂图，而你不会收到任何报错。删除前先在 GitHub 全局搜一遍引用。

## 2. 名称排序实测（最容易搞错的地方）


想用 `A_` 这样的前缀把索引仓库顶到第一位，先看清楚 GitHub 到底怎么排：

| 事实 | 实测结果 |
|---|---|
| 主页仓库列表默认排序 | **`Last updated`**（不是名称）——前缀对默认视图完全无效 |
| `Sort` → `Name` 下的位置 | `-atlas` / `.atlas` / `0-atlas` / `A-atlas` **全部并列第 1 名候选**：`-` `.` `0` 都排在字母之前 |
| 下划线 | `A_atlas` 掉到第 **6**，排在 `accounting-*`、`ai-*` **之后** |

结论有两条，第二条才是重点：

1. 前缀要用**连字符** `-`，不要用下划线 `_`；`A-atlas` 在 `Sort → Name` 下就是第 1。
2. 但前缀只影响名称排序，**影响不了默认的 `Last updated` 视图**。所以"第一位"真正由这两件事决定：
   - **Pinned / Featured 区**：访客第一眼看到的就是它。公开 GraphQL **没有** `pinItem`（我 introspect 了 260 个 mutation，只有 `pinIssue`），只能网页上 "Customize your pins" 手动设置。
   - **主页 README 顶部链接**：`<username>/<username>` 仓库的 README 会渲染在个人主页上，不受排序影响，是最稳的入口。

## 3. 让分类在 GitHub 里也能直接筛

README 里的分层只是给人看的，配上 topics 才变成可筛选的结构：每个仓库打**恰好一个层级 topic** + 若干领域 topic。

之后这些链接就是活的目录：

- `https://github.com/search?q=user%3A<你>+topic%3Adaily-driver&type=repositories`
- `https://github.com/search?q=user%3A<你>+topic%3Aarchived&type=repositories`

## 4. 用法

前置：装好 `gh` 并已 `gh auth login`（token 需要 `repo` 权限），或导出 `GITHUB_TOKEN`。

```bash
cp tiers.example.json tiers.json     # 填你自己的仓库 -> 层级 / 频率 / 领域标签
node scripts/apply-topics.mjs --dry-run
node scripts/apply-topics.mjs        # 批量 PUT topics，已有标签自动合并保留，不覆盖
node scripts/measure-sort.mjs        # 打印各仓库在名称排序里的真实位置
node scripts/regenerate-table.mjs    # 把全量总表重新生成进 README 的 AUTO-INDEX 区块
```

`regenerate-table.mjs` 只改写 `<!-- AUTO-INDEX:START -->` 与 `<!-- AUTO-INDEX:END -->` 之间的内容，其余正文随便你写，不会被脚本吃掉。

## 5. 索引 README 的骨架

```text
0. 怎么读这份索引（判据 + 层级表 + 状态图例 + "时间戳不可信"提醒）
1. Tier 1 常用（每天/每周）
2. Tier 2 主线（在开发的工程，前后端成对）
3. Tier 3 展示（作品集，求职季才动）
4. Tier 4 归档（一次性产物 / 被取代 / 只是镜像）
5. 仅自己可见（私有仓库单列一节，不要和公开层混排）
6. 全量总表（脚本生成，先按层级再按名称）
7. 本机在做、GitHub 上找不到的（索引必然有盲区，把盲区也列出来）
8. 组织规制（命名前缀 / 状态徽章 / 升降层规则 / 新仓库登记流程 / topics 约定）
9. 待办（下次回来直接办，不要写感想）
```

两个容易忽略但很值钱的细节：

- **"最近推送"字段要标注不可信**。批量导入、镜像同步、跑 CI 都会把一堆仓库的时间戳刷成同一天；一旦你按时间戳分层，分出来的其实是"哪天搬运过"。
- **单列"本机在做但没上 GitHub"一节**。主力项目往往还没建仓，导航最该回答的就是"那个东西去哪了"。

## 6. 维护纪律

- 新仓库**先登记再推送**：建仓 → 改索引 → 打 topic → 需要曝光再进 Pinned
- 升降层按第 1 节判据走，别凭印象；连续 30 天没动且不打算动 → 降一层
- `status=archived` 的仓库请在 Settings 里真点 **Archive repository**，让 GitHub 层面的归档标记和 README 徽章一致
- 索引落后现实超过一周，这份文件就失去意义了——所以登记动作要绑在"建仓"这个动作上，而不是"想起来再补"

---

© 2026 mengge237
