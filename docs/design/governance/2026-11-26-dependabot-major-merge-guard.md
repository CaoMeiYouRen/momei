# Dependabot major 升级自动合并门禁（2026-11-26）

## 1. 背景

`.github/mergify.yml` 原本只要求 `Test` 通过、作者为 Dependabot、带 `dependencies` 标签，即自动 rebase 合并。该规则对 minor / patch 足够，但 major 升级可能在无人复核的情况下静默进入主分支，破坏面覆盖框架运行时、构建链与类型系统。

本治理补充把「major 升级」从自动合并路径中移出，同时保持 minor / patch 的既有自动化节奏。

## 2. 机制

1. **检测脚本**：`scripts/ci/detect-semver-major.mjs` 解析 PR 标题中的 `from x.y.z to a.b.c`（minor / patch 段可省略），输出 `major` / `minor` / `patch` / `none`。预发布后缀参与版本解析但不改变核心版本比较；主版本下降同样按 `major` 处理。
2. **检查工作流**：`.github/workflows/dependabot-major-guard.yml` 使用 `pull_request` 事件，使检查挂在 PR head commit 上，Mergify 的 `check-success` 才能读取。工作流只检出基线分支（`github.event.pull_request.base.ref`）并执行基线脚本，不执行 PR 代码；作者判定取 `github.event.pull_request.user.login`，避免维护者编辑标题时事件发送者变化导致检查被跳过。job 名 `Dependabot Major Guard` 即检查名：Dependabot 作者的 major 升级让检查失败，其余情况通过。
3. **Mergify 条件**：自动合并规则要求 `check-success=Dependabot Major Guard` 且 `-label=semver-major`。

`semver-major` 标签是 best-effort：Dependabot 触发的 `pull_request` 运行 token 只读，标签通常写不进去，写入失败不影响主判定。维护者手工添加该标签时，Mergify 的 `-label` 条件仍会阻止自动合并，可当作临时人工闸门。

**分组 PR**：`.github/dependabot.yml` 的所有 `groups` 均声明 `update-types: [minor, patch]`，major 升级不进入分组，而是单独成 PR 并保留 `from x.y.z to a.b.c` 标题，因此标题解析覆盖全部自动合并路径。

## 3. 边界

- 只识别 PR 标题中的精确版本对（支持 `4 → 5`、`3.19 → 3.20` 与三段版本）。range 升级（`from ^1.0.0 to ^2.0.0`）不产生精确版本对，脚本输出 `none`。
- `0.x` 系列的次版本升级按 semver 归为 `minor`，不触发 major 门禁；该类破坏性变更仍需人工判断，属已知边界。
- 该门禁只作用于 Dependabot 作者（`dependabot[bot]` / `dependabot-preview[bot]`），不改变人工 PR 的合并门槛。
- 不升级任何依赖、不调整分支保护、不引入 GitHub 原生 merge queue。
- `pnpm ci:precheck` 不解析 workflow YAML；workflow 语法与 action 版本钉定由人工核对，合并前以 CI 实跑为准。

## 4. 验证

- `tests/scripts/detect-semver-major.test.ts` 覆盖 major / minor / patch、两段式版本（GitHub Actions / Docker 生态）、预发布、主版本降级、scoped 包名、多版本对取首个、`0.x` 次版本、分组标题、range 标题、空标题与 CLI / 环境变量入口。
- `pnpm exec vitest run tests/scripts/detect-semver-major.test.ts` 通过。
- 首次真实 Dependabot PR 需在 Actions 中确认 `Dependabot Major Guard` 检查出现在 head commit 上；若未出现，按 §5 第 1 档取消 major 阻断（所有依赖 PR 恢复自动合并，标签降级为手工闸门）。

## 5. 回滚与 Kill-switch

按影响面从小到大回退：

1. **仅取消 major 阻断（kill-switch）**：当检测误伤 minor / patch 超过 1 次时执行：
    - 从 `.github/mergify.yml` 删除 `check-success=Dependabot Major Guard`；
    - 保留 `-label=semver-major`：它不再由 workflow 写入，仅作为维护者可手工添加的临时阻断开关；
    - 本状态下所有依赖 PR（含 major）恢复自动合并，误判告警保留在 Actions 日志的 `::notice::Dependabot version bump classified as <bump> for "<title>"` 与 `::error::` 中。
    - 与 roadmap 原措辞「仅标签告警 + 人工合并」的偏差：Dependabot 触发的 `pull_request` token 只读，bot 无法写标签，因此「人工合并」改为维护者按需手工加标签，其余 PR 恢复自动合并；方向仍是「不阻断正常依赖 PR」。
    - 误伤判定口径：在 Dependabot PR 的 `Dependabot Major Guard` 运行日志里，统计标题为 minor / patch 却输出 `major` 的次数；超过 1 次即执行本项，并在 `artifacts/review-gate/` 记录 PR 编号与标题。
2. **移除门禁基础设施**：在 kill-switch 基础上删除 `-label=semver-major`，并删除 `.github/workflows/dependabot-major-guard.yml`。
3. **彻底移除**：删除 `scripts/ci/detect-semver-major.mjs` 与对应测试，并同步本文件与治理索引。

回滚不需要改依赖或 lockfile。
