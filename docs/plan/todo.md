# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

> 进度表状态另按 [规划文档模型 v1](../standards/planning-docs.md) 的四值口径：`未开始` / `进行中` / `已闭环` / `已阻塞`。

---

## 当前进行中阶段

| 大条目 | 小条目 | 状态 | 提交 | 审计 | 容量（计划→实际） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 81.1 Weekly 安全告警门禁 403 与 fallback 测试隔离 | 3/3 | 已闭环 | `b5eed8f8`、`d398ea18` | R2 Pass | 3 → 2 commits |
| 81.2 覆盖率第二十二批 | 3/3 | 已闭环 | `1b517ae0` | R2 Pass | 3 → 1 commit |
| 81.3 静态规则债第四批 | 5/5 | 已闭环 | `8f560060`、`0762e86b`、`10639741`、`096bd653` | R2 Pass | 5 → 4 commits |
| 81.4 字号归一第四批 | 3/3 | 已闭环 | `689469f1` | R2 Pass | 3 → 1 commit |
| 81.5 规划文档 v1 首轮实战与回归窗口插入修复 | 2/3 | 进行中 | `1e117400`（81.5.2） | R2 Pass | 3 → 1 commit（81.5.3 待阶段收口） |

### 第八十一阶段：质量底线与债务收口（筹备中，2026-11-21 立项）

> 阶段规划、8 要素与回滚边界见 [项目计划](./roadmap.md#第八十一阶段质量底线与债务收口进行中)。小条目默认独立提交、独立审计；强耦合时才合并批次并写明理由。

- [x] **81.1 Weekly 安全告警门禁 403 与 fallback 测试隔离（P1 修复型）**
    - [x] **81.1.1 隔离 fallback 测试的 token 环境**
        - 目标: 让无 token 用例在 CI 自带 `GITHUB_TOKEN` / `GH_TOKEN` 时仍稳定走 `pnpm audit` 分支。
        - 验收: 三者全空 → `fallback/pnpm-audit`；`SECURITY_ALERTS_TOKEN` 有值 → `ok`；仅 `GITHUB_TOKEN` / `GH_TOKEN` 有值 → 维持 403 降级行为或按 81.1.2 的修复结果断言。
        - 交付物: `tests/scripts/security-alert-gate-shared.fallback.test.ts` 的环境隔离与用例。
        - 依赖: 无。
    - [x] **81.1.2 修复 Weekly 的 Dependabot 源 403**
        - 目标: 让 `security:alerts` 在 Weekly 中拿到 Dependabot 数据；`permissions.security-events` 只覆盖 Code Scanning，必要时改用专用 `SECURITY_ALERTS_TOKEN`（PAT / App token，`security_events` 或 `repo` scope）。
        - 验收: `workflow_dispatch` / 下一次 scheduled run 的 `dependabot source` 为 `ok (github-api)`，`security:alerts` 为 Pass；若专用 token 无法提供，登记为已知阻塞并给到期日，不降级为 warning。
        - 交付物: token 来源 / workflow 配置、run 链接、原因记录。
        - 依赖: 专用 `SECURITY_ALERTS_TOKEN` 或等价 App token（可能需用户操作）。
    - [x] **81.1.3 复跑与证据回填**
        - 目标: 证明「有 token / 无 token」两条路径与 Weekly 门禁同时稳定。
        - 验收: 本地 `GITHUB_TOKEN=$(gh auth token) pnpm security:alerts` Pass；定向测试通过；`pnpm lint` / `typecheck` 通过；证据落 `artifacts/review-gate/`。
        - 交付物: 验证摘要、Review Gate 证据。
        - 依赖: 81.1.1 / 81.1.2。

- [x] **81.2 覆盖率第二十二批（P2）**
    - [x] **81.2.1 复算 top 未覆盖模块与基线**
        - 目标: 按最新 coverage-final 选出 2-3 个「未覆盖语句数 × 修改成本」最优的模块。
        - 验收: 基线落 `artifacts/coverage/`；候选模块与未覆盖条数写入任务记录；同源分母口径明确。
        - 交付物: coverage baseline、候选清单。
        - 依赖: 干净全量跑（清 `.vitest-cache` + `--maxWorkers=4`）。
    - [x] **81.2.2 模块 A 补测**
        - 目标: 优先 `scripts/governance/find-unused-components.mjs`（90 未覆盖）或等价 top 模块，补失败 / 边界分支。
        - 验收: 模块 statements `+15pp` 或 `≥85%`；定向测试通过；不写低价值断言。
        - 交付物: 测试文件、模块覆盖对比。
        - 依赖: 81.2.1。
    - [x] **81.2.3 模块 B/C 补测与收口**
        - 目标: 完成第二/第三个模块，使同源 statements 达到 `+0.3pp`。
        - 验收: 达 81.2 大条目验收标准；补充全量 coverage exit 与 flaky 记录。
        - 交付物: 测试文件、coverage exit、证据。
        - 依赖: 81.2.2。

- [x] **81.3 静态规则债第四批（P2）**
    - [x] **81.3.1 复算与代表文件**
        - 目标: 复算 `no-confusing-void-expression` 的当前命中 / 文件分布，先改 1 个代表文件。
        - 验收: inventory 基线落盘；代表文件 `pnpm lint` 0 error；定向测试通过。
        - 交付物: inventory 基线、代表文件改动。
        - 依赖: `governance:inventory:eslint-rules`（timeout budget 10m）。
    - [x] **81.3.2 批量清零 A（≤10 文件）**
        - 目标: 处理第一批 ≤10 文件的 `no-confusing-void-expression` 命中，保持行为等价。
        - 验收: 本批文件 `pnpm lint` 0 error；定向测试通过；无 `eslint-disable` 新增。
        - 交付物: 代码改动、文件清单。
        - 依赖: 81.3.1。
    - [x] **81.3.3 批量清零 B（≤10 文件）**
        - 目标: 处理第二批 ≤10 文件的命中。
        - 验收: 本批文件 `pnpm lint` 0 error；定向测试通过。
        - 交付物: 代码改动、文件清单。
        - 依赖: 81.3.2。
    - [x] **81.3.4 批量清零 C（剩余 ≤9 文件）并升 error**
        - 目标: 处理剩余命中，把规则升为 `error`，同步 debt 目标。
        - 验收: inventory 该规则 0 命中 / 0 warning / 0 显式豁免；`pnpm lint` 0 error、warning ≤10。
        - 交付物: 代码 / 配置改动、inventory 产物。
        - 依赖: 81.3.3。
    - [x] **81.3.5 收口验证与 issue #262 回写**
        - 目标: 完成回归验证并回写 issue #262。
        - 验收: 达 81.3 大条目验收标准；补充定向测试 / `typecheck` 与 issue #262 回写链接。
        - 交付物: 验证摘要、issue 回写链接。
        - 依赖: 81.3.4。

- [x] **81.4 字号归一第四批（P3）**
    - [x] **81.4.1 复算与选批**
        - 目标: 按 `governance:inventory:font-sizes` 复算剩余 98 条，选出 ≤10 文件的一批。
        - 验收: 选批清单与等值判定落盘；不改非字阶取值。
        - 交付物: inventory 基线、选批清单。
        - 依赖: `governance:inventory:font-sizes`。
    - [x] **81.4.2 替换与逐元素对账**
        - 目标: 完成 ≥30 条等值字面量替换为 `--m-font-size-*`。
        - 验收: 口径内待替换下降 ≥30 条；逐元素 `getComputedStyle` 0 差异。
        - 交付物: token 替换、对账证据。
        - 依赖: 81.4.1；onboarding 需 tour 截图。
    - [x] **81.4.3 视觉与 parity 收口**
        - 目标: 确认视觉门禁无未归因差异。
        - 验收: 达 81.4 大条目验收标准；补充 `test:visual` / parity 未归因 0 的日志。
        - 交付物: visual / parity 日志、偏差登记（如有）。
        - 依赖: 81.4.2。

- [ ] **81.5 规划文档 v1 首轮实战与回归窗口插入修复（P3 治理）**
    - [x] **81.5.1 进度表与小条目落地**
        - 目标: 本阶段全程按 v1 维护 6 列进度表、小条目 4 项与独立提交 / 审计。
        - 验收: 表行数 = 5；小条目 17；每次提交后回填 `提交` 列；`docs:check:planning-docs` 通过。
        - 交付物: `todo.md` / `roadmap.md` 的 v1 形态。
        - 依赖: 无。
    - [x] **81.5.2 回归窗口插入修复与 marker 规整**
        - 目标: 复核立项前置已完成的 `scripts/shared/regression-window.mjs` 插入锚点修复与 `current.md` 规整，保证连续 upsert 不嵌套、重 upsert 外层不删除内层。
        - 验收: 连续两次 upsert 后 marker 顺次排列；重 upsert 外层不删除内层；`tests/scripts/regression-window.test.ts` 对 `current.md` 的顺次排列与 11-19 在 11-18 之前断言通过；`docs:check:markers` 通过；窗口条数 / 行数在阈值内。
        - 交付物: 脚本修复、`tests/scripts/regression-window.test.ts`、marker 顺序调整、检查输出。
        - 依赖: 先补单测，再在临时副本验证 upsert。
    - [ ] **81.5.3 v1 归档块与阶段收口**
        - 目标: 阶段收口时产出首个 v1 归档块（6 项 + 标记）。
        - 验收: 归档块 6 项齐全；`> **归档块模型**: v1` 存在；`docs:check:planning-docs` / `markers` 通过。
        - 交付物: `todo-archive.md` 归档块、收口证据。
        - 依赖: 81.5.1 / 81.5.2 与阶段收口。

> 第八十阶段 6 条条目已完成并归档：CLI 断点续传、首页缓存与语言检测解耦、字号归一第三批、覆盖率第二十一批、PWA 2.0.2 与 `generateSW` 迁移、parity 参考态重采清零。正文见 [roadmap 归档分片](./archive/roadmap-phases-80.md)，条目明细见 [待办事项归档](./todo-archive.md)，阶段结论见 [项目计划](./roadmap.md#第八十阶段归档结论最近归档阶段)。
>
> 下一阶段候选按 [项目规划规范 §4.5 Step 7](../standards/planning.md) 在准入时从 [backlog](./backlog.md) 重新评估，未落盘前不写入本文件。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
