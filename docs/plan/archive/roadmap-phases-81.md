# 第八十一阶段规划正文（质量底线与债务收口）

> 归档说明：本阶段已于 2026-11-21 审计归档，规划正文自 [项目路线图](../roadmap.md) 主窗口迁出；条目执行明细见 [待办事项归档](../todo-archive.md) 的第八十一阶段归档块，Review Gate 证据见 `artifacts/review-gate/2026-11-21-phase81-item{1..5}.md`。

## 规划正文

**时间表**: 2026-11-21 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 恢复 Weekly Regression 绿，收口 P1 安全门禁与 fallback 测试环境耦合；完成覆盖率第二十二批、静态规则债第四批、字号归一第四批；并用 [规划文档模型 v1](../../standards/planning-docs.md) 完成首个完整阶段（6 列进度表 / 小条目分层 / v1 归档块）。

**准入结论**: 用户于 2026-11-21 在候选页确认方案 A（5 条，ROI 均值 `2.42`）：Weekly 安全门禁 `2.25` / 覆盖率 `2.33` / ESLint 第四批 `2.33` / 字号第四批 `1.67` / 规划 v1 首轮实战 `3.50`。

**准入前置（已核对 2026-11-21）**: 第八十阶段已审计归档；issue #1071 已采纳并提交 `11013702`（本地，待推送）；open PR 0；open issue #1071（已回写）/ #262（ESLint 规则分批）。基线：coverage **86.35%**、duplicate-code **0.37%**（43 clones / 650 行）、i18n missing 0 / duplicates 64 组、字号 457 声明 / token 176 / 口径内待替换 98、`coreEntryJs` 287.20KB / 335KB、`keyCss` 60.01KB / 62KB。CI 回执：`396ed65b` 的 Test / Pages / Docker / CodeQL / TODO 全绿；Weekly Regression run `44733444354` **failure**（见条目 1）。**开工前先推送 `11013702` 并核对 CI。**

**阶段容量与移出顺序**: 5 个大条目 / 17 个小条目（超过建议 15 的原因：条目 3 按 ≤10 文件/提交拆为 3 个批量小条目，避免单 commit 超规模；范围未新增，仅提交粒度拆分，故不拆阶段）。顺序 `1 → 2 → 3 → 4 → 5`（条目 5 与 1-4 并行，收口时闭环）；若超时，按 `4 → 3 → 2` 移出——先移出视觉债，保留 CI 修复、覆盖率与 v1 实战。

**执行进展（2026-11-21）**: 条目 1-4 已闭环，条目 5 的 81.5.1 / 81.5.2 已完成，81.5.3（v1 归档块与阶段收口）待阶段收口时执行。关键结果：Weekly Regression run `44847021795` success（`dependabot source: ok (github-api)` / `code-scanning source: ok`）；覆盖率同源 statements `86.35% → 86.69%`（+0.34pp），`find-unused-components` 60.7% → 94.78%、`check-source-of-truth` 74.9% → 96.17%；`no-confusing-void-expression` 80 处 / 29 文件清零并升 `error`；字号口径内待替换 `98 → 68`（本批 30 条），`test:visual` 32/32、parity 本地 82/83（1 条为本机测试数据态差异，以 CI 裁决）。Review Gate 各条目 R1/R2 均 Pass。

1. **Weekly 安全告警门禁 403 与 fallback 测试隔离（P1 修复型）**
    - **目标**: 让 Weekly Regression 的 `security:alerts` 与 `test:coverage` 恢复稳定通过；修复 fallback 测试对 CI token 的环境耦合；定位 Dependabot 源 `permission-denied`。
    - **优先级**: P1（CI 阻断 / 安全门禁可信度）。
    - **范围**: ① `tests/scripts/security-alert-gate-shared.fallback.test.ts` 的无 token 用例显式隔离 `SECURITY_ALERTS_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`；② 复核 `.github/workflows/regression-weekly.yml` 的 token 来源：`permissions.security-events: read` 只覆盖 Code Scanning，Dependabot alerts 需要专用 PAT / App token（`security_events` 或 `repo` scope），必要时改用 `SECURITY_ALERTS_TOKEN`；③ 以 `workflow_dispatch` 或下一次 scheduled run 复核 `dependabot source`。
    - **验收标准**: 无 token / 有 token 两种环境下定向测试均通过；本地 `GITHUB_TOKEN=$(gh auth token) pnpm security:alerts` Pass；Weekly run 的 `security:alerts` 为 Pass 且 `dependabot source` 为 `ok (github-api)`；若专用 token 无法提供，必须在 issue / backlog #10 登记 `permission-denied` 为已知阻塞并给出到期日，不得把该源降级为 warning；`pnpm lint` / `typecheck` 通过。
    - **不做什么**: 不改 severity / allowlist / fail-closed 口径；不通过放宽门禁换绿；不升级依赖。
    - **依赖**: 仓库 Actions token 权限或专用 secret（可能需要用户操作）；本地 `gh auth token` 仅用于验证。
    - **交付物**: 测试隔离改动、workflow / token 配置、run 链接与 Review Gate 证据。
    - **风险**: 若权限无法在仓库侧修复，需用户确认专用 token；不得静默把 `permission-denied` 降级为 warning。

2. **覆盖率第二十二批（P2）**
    - **目标**: 同源 statements 至少 `+0.3pp`（约 115 条），优先 `scripts/governance/find-unused-components.mjs`（phase79 快照 90 未覆盖）与 `scripts/docs/check-source-of-truth.mjs`（phase79 快照 59 未覆盖；artifact `artifacts/coverage/2026-11-19-phase80-item4/coverage-final.json`），开工时按最新 coverage-final 复算。
    - **优先级**: P2（长期主线 #1）。
    - **范围**: 2-3 个模块；失败 / 边界分支优先；新增或扩充测试；不改生产行为。
    - **验收标准**: 模块级 `+15pp` 或 `≥85%`；同源 statements `+0.3pp`；干净全量 `pnpm test:coverage` 通过；定向测试通过；flaky 记录。
    - **不做什么**: 不追全量 90%；不测真实网络 / 浏览器；不为凑数写低价值断言；不拆 `admin-taxonomy-page`（另案）。
    - **依赖**: phase79 / 最新 coverage-final；清 `.vitest-cache` + `--maxWorkers=4` 的干净跑口径。
    - **交付物**: 测试文件、coverage baseline / exit、证据。
    - **风险**: coverage 分母变化、0-test 套件、异步 flake；先复算再选模块，必要时换模块。

3. **静态规则债第四批（P2）**
    - **目标**: `no-confusing-void-expression` 80 处 / 29 文件（2026-11-17 inventory 口径，开工复算）清零并升 `error`；同步 inventory / debt / issue #262。
    - **优先级**: P2（长期主线 #10）。
    - **范围**: 80 处 / 29 文件；按 ≤10 文件/提交拆为 3 个批量小条目（29 文件 ≈ 3 批）；先改 1 个代表文件 + 定向测试，再批量；`no-unsafe-argument` 只评估 typed lint 作用域，不强行清零。
    - **验收标准**: inventory 该规则 0 命中 / 0 warning / 0 显式豁免；`pnpm lint` 0 error、warning ≤10；issue #262 回写；相关定向测试通过。
    - **不做什么**: 不动千级命中项（`explicit-function-return-type` / `prefer-nullish-coalescing`）；不放宽规则；不写 `eslint-disable`。
    - **依赖**: `governance:inventory:eslint-rules`（timeout budget 10m）；现有 `eslint-debt-targets.mjs`。
    - **交付物**: 代码 / 配置改动、inventory JSON、issue 回写。
    - **风险**: `void` 表达式可能涉及事件处理器 / Promise；逐文件确认行为等价；单文件风险高则拆小批。

4. **字号归一第四批（P3）**
    - **目标**: 按 `governance:inventory:font-sizes` 复算，处理剩余 98 条中的 `≥30` 条（≤10 文件），优先 admin 路由面与 `_onboarding.scss` 剩余。
    - **优先级**: P3（长期主线 #11）。
    - **范围**: 等值字面量 → `--m-font-size-*`；单批 ≤10 文件；onboarding 需 tour 截图。
    - **验收标准**: 口径内待替换下降 `≥30` 条；逐元素 `getComputedStyle` 0 差异；`test:visual` 32/32、parity 83/83 未归因 0；`pnpm lint:css` 0 error。
    - **不做什么**: 不改非字阶取值；不按现值批量替换；不改暗色 tint；不扩 U1-U6；不动 `admin-taxonomy-page`。
    - **依赖**: inventory；tour 截图环境；parity 参考态。
    - **交付物**: token 替换、inventory JSON、对账 / 截图证据。
    - **风险**: 参考态覆盖不足时登记偏差表；单文件视觉回归立即回退。

5. **规划文档 v1 首轮实战与回归窗口插入修复（P3 治理）**
    - **目标**: 本阶段按 v1 维护 6 列进度表 / 小条目分层 / 独立提交审计；复核立项前置已完成的 `scripts/shared/regression-window.mjs` 插入锚点修复与 `current.md` 规整；收口产出首个 v1 归档块。
    - **优先级**: P3（规划文档模型 v1 首轮实战）。
    - **范围**: `todo.md` / `roadmap.md` / `todo-archive.md` / `current.md` / `scripts/shared/regression-window.mjs` / `tests/scripts/regression-window.test.ts`；插入锚点与 marker 顺序；v1 归档块模板。
    - **验收标准**: 连续两次 upsert 后四个 marker 顺次排列、重 upsert 外层不删除内层；`tests/scripts/regression-window.test.ts` 的当前窗口顺序断言通过（11-19 在 11-18 之前）；`pnpm docs:check:planning-docs` 通过；`pnpm docs:check:markers` 通过；进度表 5 行 = 5 大条目；小条目 17；归档块 6 项 + `> **归档块模型**: v1`。
    - **不做什么**: 不改存量归档正文；不重排历史窗口；不改阈值 / 规范。
    - **依赖**: 阶段收口；脚本改动需先补单测，再在临时副本上验证 upsert。
    - **交付物**: 脚本修复、单测、进度表、marker 规整、v1 归档块、证据。
    - **风险**: 脚本改动影响 weekly 自动追加；先补单测 + 临时副本验证，再改真实窗口；嵌套旧块若存在，脚本会显式抛错而不是删除内层。

**回滚边界（阶段级）**:

- 条目 1：测试隔离与 workflow / token 配置分离，可独立回滚；回滚后 Weekly 仍红，需重新评估。
- 条目 2：测试文件独立可删。
- 条目 3：规则配置与代码改动按文件回退；升 `error` 先于批量清零时需同批回滚。
- 条目 4：按文件独立 revert；token 定义不动。
- 条目 5：文档改动 revert；marker 恢复原顺序仅用于紧急。

**风险提示**: ① 条目 1 的 token 权限可能需要仓库管理员操作，不得用放宽 fail-closed 换绿；② 条目 2 的 coverage 受 flake 影响，以干净全量跑 + CI 为最终裁决；③ 条目 3 可能暴露真实 `void` 语义差异，逐文件定向测试；④ 条目 4 的 `_onboarding.scss` 必须 tour 截图取证；⑤ 条目 5 的脚本插入修复已覆盖 weekly 自动回写；先合脚本 + 单测，再让 weekly 回写；若窗口内已有嵌套旧块，脚本会显式抛错而不是删除内层。
