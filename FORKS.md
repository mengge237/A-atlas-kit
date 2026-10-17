# Forks 台账（统一吸收渠道）

本页是**所有 fork 的唯一登记处**：列表页只留自有仓，fork 的去向、为什么存在、跟不跟上游，全在这里一线可查。
新增 fork 先登记再动手；不再跟进的就地归档并在本页标 `archived`。

| 仓库 | 上游 | 为什么 fork | 本地改动 | 跟进上游？ |
|---|---|---|---|---|
| `dsh-web` | `zhu1090093659/dsh-web` | 读 DSH Web 聚合器/创意工坊的 `market-build` 数据源与界面实现（学实现、只看不发） | 无（纯镜像） | 需要时 `gh repo sync` |
| `dsh-community-plugins` | `zhu1090093659/dsh-community-plugins` | 登记自研插件用的 fork 通道（`community.json` 条目走 PR，如 PR #40） | 仅 `community.json` 的条目追加（在分支上，不入 master） | 是；上游合入后删本地分支 |
| `dsh-plugin-hub` | `wingsky-1/dsh-plugin-hub` | 看第三方插件集的收纳与索引做法 | 无 | 暂不跟进（有新做法再看） |
| `Glance` | `Harukaon/Glance` | 读源码与构建流程（上游项目，代码非本人） | 无 | 跟随上游 release |

## 判据（怎么算"该归档/该跟进"）

- **有本地改动**：改动必须落在分支或独立 commit，并在上表"本地改动"列写明；无列写 = 纯镜像。
- **纯镜像且 30 天没动** → 归档（历史与代码仍可读，只是不再出现在活跃列表）。
- **上游仍在演进且本机依赖它** → 保持 fork 并定期 `gh repo sync`；同步失败写进上表备注。
- **自研仓不要 fork**：自研件直接在自有仓开发（fork 会带来 upstream 同步噪音）。
