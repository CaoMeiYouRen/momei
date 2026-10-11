# 2026-10-12 Mergify 合并策略与 merge queue 采用评估

- 日期：2026-10-12
- 性质：**调研与改动方案**。本文档为文档产物，**不含任何配置改动**；尚未授权开工。
- 状态：**候选评估中**，结论待上收后执行。
- 跟踪载体：[backlog.md](../../plan/backlog.md) 短期 / 一次性候选任务。

## 1. 背景与动因

仓库当前把依赖 PR 的合并完全交给 `.github/mergify.yml` 的单条规则（`actions: merge`，立即合并，`method: rebase`）。该规则在依赖洪峰期会产生一个可观测的结构性问题：

**每个依赖 PR 都独立落库，每次落库都改写 `pnpm-lock.yaml`。**

2026-10-12 的一次实测：近 20 分钟内 6 个依赖 PR（`js-yaml` 4→5、`wrangler`、`postcss`、`caomei-ui`、`dotenv`、`aws-sdk-s3`）被逐一自动合并。任何同时修改 `pnpm-lock.yaml` 的维护者 PR 都会在此过程中反复冲突：

| PR | 观测 |
|:---|:---|
| #890（nuxt 与 `@nuxt/kit` override 锁步升级） | 重定基后连续三次进入冲突：`behind 1` → `behind 3` → `behind 3` |
| #877（依赖风险 override 修复） | 一次观测中已 `behind 18` |

带来的具体损耗：维护者必须先重定基、再在很短的窗口内完成合并，否则重定基动作会被下一次依赖合并作废；而依赖 PR 本身因为走「立即合并」，不受此影响（dependabot 会自行重定基），形成不对称。

本次调研的目标是判断：**是否应引入 merge queue（及其配套机制）来消除这个拉锯，代价是什么。**

## 2. 现状事实核对（2026-10-12）

以下均为对仓库配置与 GitHub API 的实测结果，非推测：

| 项 | 实测结果 |
|:---|:---|
| `.github/mergify.yml` | 全文仅 1 条 `pull_request_rules`；动作为 `actions: merge`（立即合并），`method: rebase` |
| `queue_rules` | **不存在**（无任何队列规则） |
| merge queue 特性 | 已启用：每个 PR 都有 `Mergify Merge Queue` check run；PR #807 上 Mergify 留下了队列控制评论「does not currently match the merge queue conditions」 |
| master 分支保护 | **无经典分支保护**（`GET /branches/master/protection` → 404） |
| master ruleset | 存在「保护分支规则集」，仅含 `deletion` + `non_fast_forward` 两条规则 |
| `merge_protections_settings` | 未配置 |

即：**队列功能在、队列规则没写**，合并行为完全由「立即合并」承担。

## 3. 机制原理

### 3.1 merge queue 的三步机制

```
PR 到达队列前端 → ① 与「当时最新」的 base 临时合成（建 queue branch）
                 → ② 在这份合成结果上重跑 CI
                 → ③ merge_conditions 全部满足才真正落库
```

三个衍生能力：

| 能力 | 机制 | 对本仓痛点的作用 |
|:---|:---|:---|
| 对抗 base 漂移 | 轮到它时基于最新 base 重新合成并重跑 CI；`reset_on_external_merge` 默认开启 | 消除「PR 通过时基于过期 base」 |
| 自动更新 PR | `update_method: rebase \| merge`，队列**替你把 base 更新进 PR** | 直接替代当前的人工反复重定基 |
| 批处理 | `batch_size` 让多个 PR 合成一个 batch 一起测、一起落 | 降低 base 的落库次数 → 从源头减少 lockfile churn |

### 3.2 关键限制：队列**不是**冲突解决器

官方 lifecycle 文档明确：**与 base 分支本身的真实内容冲突，会立即把 PR 踢出队列**（`dequeued`），要求更新后重新入队。

而 `pnpm-lock.yaml` 的冲突正是双方改同一处文本的**真实内容冲突**，不是「缺一次 merge」。因此：**单纯增加队列规则无法解决本仓的 lockfile 冲突**，只会把「手动重定基」换成「入队 → 冲突 → 被踢 → 重新入队」。

### 3.3 `conflict_resolvers` 才是对症机制

Mergify 顶层提供 `conflict_resolvers`，官方文档描述的适用场景几乎逐字命中本仓：

> Some conflicts have a mechanical answer: a changelog that only ever grows, or **a lockfile where two pull requests updated different dependencies**.

并且有包管理器感知形式，且**明确支持 pnpm**：

```yaml
conflict_resolvers:
  - package-manager: npm     # 覆盖 npm / pnpm / yarn
    directories:
      - /
```

> `npm` covers npm, pnpm and yarn alike, **though only a `pnpm-lock.yaml` is resolved today**

它的行为是把 manifest（`package.json`）与 lockfile **成对合并**，避免出现两者不一致的 batch；若两个 PR 改的是同一依赖的冲突版本，则仍然冲突（符合预期）。

**硬约束（最容易踩）**：

> Resolvers only take effect in a queue rule whose batch branch is what lands, which means `merge_method` set to **`merge-batch`** or **`fast-forward`**. With `merge`, `squash` or `rebase` and no `queue_branch_merge_method`, each pull request is merged at its own head ... so a resolution made while building the batch would never reach your base branch.

即：**光配 `conflict_resolvers` 无效**，必须让队列规则使用 `merge_method: fast-forward` 或 `merge-batch`。

## 4. 核心权衡：保留 `rebase` 还是换取冲突自动消解

这是本方案的中心取舍——**二者不可兼得**。

### 4.1 历史形态对照（官方 merge-strategies 口径）

| method | 历史 | base 上的 commits | SHA 保留 | 支持 batch / 并行 | `conflict_resolvers` 生效 |
|:---|:---|:---|:---:|:---:|:---:|
| `merge` | 非线性 | 原 commits + merge commit | ✅ | ✅ | ❌ |
| `squash` | 线性 | 每 PR 1 个新 commit | ❌ | ✅ | ❌ |
| **`rebase`（现状）** | 线性 | 每个 commit 的重放副本（SHA 变） | ❌ | ✅ | ❌ |
| `fast-forward` | 线性 | 原 commits 直接推进 base ref | ✅ | ❌（仅 serial） | ✅ |
| `merge-batch` | 非线性 | 原 commits + 每 PR 1 个 `Merge of #N` + 每批 1 个 merge commit | ✅ | ✅ | ✅ |

### 4.2 取舍含义

- 若**保留 `rebase`**（`merge_method: rebase` 在队列中同样可用）：历史形态不变，获得自动 update + 基于最新 base 重测 + 排队顺序；但 `conflict_resolvers` 不生效，**lockfile 冲突仍会 dequeue**，痛点只被缓解 50%。
- 若**换取 `conflict_resolvers`**：必须改用 `fast-forward`（线性、SHA 保留、但仅支持 serial 模式、需允许 Mergify 绕过 required PR）或 `merge-batch`（非线性、每批一个 merge commit、但走标准 GitHub PR merge API 无需绕过配置）。**现状的 `rebase` 语义确实会消失**。

补充：`fast-forward` 的 in-place 模式（`batch_size=1` + `max_parallel_checks=1` + serial + 无两步 CI）可给出「严格线性 + SHA 保留」的历史，是三者中最接近「比现状更好」的形态；但它放弃了并行检查，吞吐会低。

## 5. 候选方案

| # | 方案 | 改动 | 解决比例 | 风险 |
|:--|:---|:---|:---|:---|
| A | 维持现状 | 无 | 0%（靠人工与时间窗） | 低 |
| B | 仅引入队列，保留 `rebase` | 新增 `queue_rules`（`merge_method: rebase`）；决定是否移除 `pull_request_rules` 的立即合并动作 | 缓解 base 漂移（自动 update + 重测）；**不解决** lockfile 真冲突 | 低 |
| C | 依赖 PR 走 `merge-batch` 队列；维护者 PR 维持现状 | 新增 1 条依赖队列规则 + `conflict_resolvers` | 显著：依赖批量落库（降低 churn）+ lockfile 冲突自动消解 | 中 |
| D | 全量队列化（依赖 `merge-batch` + 维护者 `fast-forward`） | 新增 2 条队列规则 + `conflict_resolvers` | 最彻底 | 中高 |

### 5.1 方案 B 的注意点

- 队列规则与 `pull_request_rules` 的 `actions: merge` 会**并行存在**。若两者同时命中同一 PR，立即合并会绕过队列，队列形同虚设。因此方案 B 必须同时明确：依赖 PR 是「继续立即合并」还是「改走队列」。
- 队列条件不包含「是否可合并」，因此冲突 PR 仍会被接受入队、再被踢出——只是踢出点从「人工发现」提前到「入队即刻」。

### 5.2 方案 C / D 的注意点

- `merge-batch` 语义：落库的是 **batch 分支整体**，单个 PR 只有在 head 仍可从新 base tip 到达时才被 GitHub 标记为 merged；依赖 PR 的呈现会与现状不同。
- `merge-batch` 要求 `batch_size > 1`。
- 依赖 PR 被批量测试意味着「多个依赖变更被一起验证」——对本仓的 RAG（Nuxt 全栈 + 大量 peer 耦合）是否可接受，需要评估。
- `fast-forward` 直接推进 base ref，需确认与仓库 ruleset 的 `non_fast_forward` 规则兼容（真 fast-forward 应属允许，但需实测确认），且需允许 Mergify 绕过「require pull requests」（本仓当前无该要求）。

## 6. 推荐

**分两步走，先 B 后评估 C/D。**

1. **第一步（低风险）**：引入队列并保留 `rebase`，先拿到「自动 update + 基于最新 base 重测」这两个确定收益，同时验证队列在本仓的实际行为（入队条件、dequeue 语义、与 ruleset 的交互）。此步不改变历史形态与冲突语义。
2. **第二步（需实测前置）**：仅当第 1 步确认队列可用后，再评估是否用 `conflict_resolvers` 换取 `merge-batch` / `fast-forward`。这一步必须先用真实冲突做验证，不得凭文档直接上生产。

## 7. 前置条件与待验证项（不得跳过）

| # | 待验证项 | 为什么必须验证 |
|:--|:---|:---|
| 1 | 当前 Mergify 套餐是否覆盖 Batch 与 `conflict_resolvers` | 定价页 FAQ 明确「Open Source / Free 与 Max 覆盖的 Merge Queue 子特性不同」，未逐一确认 |
| 2 | `conflict_resolvers` 对「与 base 分支本身冲突」是否生效 | 官方文档只在「合成 batch」语境下描述 resolver；与 base 的冲突则被归为「立即踢出」。二者是否重叠需实测 |
| 3 | 机械消解后的 `pnpm-lock.yaml` 是否始终内部自洽 | `importers` 的 specifier 必须与 `packages` / `snapshots` 对齐；行级合并能否保证不明确 |
| 4 | `fast-forward` 与 ruleset `non_fast_forward` 的兼容性 | 直接推进 base ref，需确认不被 ruleset 拒绝 |
| 5 | 移除 / 保留 `pull_request_rules` 的 `actions: merge` | 决定是否存在「立即合并绕过队列」的竞态 |
| 6 | in-place 检查的成立条件 | 需同时满足 `batch_size=1`、`max_parallel_checks=1`、serial 模式、`max_checks_retries=0`、无两步 CI |

**验证方式**：在临时 fork 或测试仓库上造一个真实 `pnpm-lock.yaml` 冲突，配置队列 + `conflict_resolvers`，用 `@mergifyio queue` 走一轮，观察是否真能自动消解、以及队列报告的实际状态。通过后再动生产配置。

## 8. 非目标

- 不引入 GitHub 原生 merge queue（官方对比表显示其无 batch、无 `conflict_resolvers`，对本仓「lockfile 反复冲突」场景不对症）。
- 不改变依赖升级节奏、override 体系与 `security:audit-deps` 门禁口径。
- 不借本次调整改动分支保护策略。

## 9. 附：本次观测到的原始证据

| 证据 | 内容 |
|:---|:---|
| 失败运行 | `Publish Docker Image` run `38159202604`（master，Pre-check 被 `security:audit-deps` Reject）——本次调研的起点 |
| 冲突观测 | #890 `behind 1 → behind 3 → behind 3`（连续三次重定基后仍冲突）；#877 一次观测 `behind 18` |
| 依赖合并速度 | 近 20 分钟内 master 新增 6 个依赖 PR 合并提交 |
| 队列特性存在性 | 每个 PR 均出现 `Mergify Merge Queue` check run；PR #807 存在 Mergify 队列控制评论 |
| 配置事实源 | `.github/mergify.yml`（1 条规则，`actions: merge`） |

## 10. 相关文档

- [待办与候选池（backlog）](../../plan/backlog.md)
- [项目规划规范](../../standards/planning.md)
- [仓库安全与依赖风险门禁治理](./2026-09-03-dependency-override-patched-version-validation.md)
