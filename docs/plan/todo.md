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
| 82.1 覆盖率第二十三批 | 3/3 | 已闭环 | `ac4cb00f` | R2 Pass | 3 → 1 commit |
| 82.2 字号归一第五批 | 0/3 | 未开始 | 待提交 | — | 3 → 0 commits |
| 82.3 静态规则债第五批 | 4/4 | 已闭环 | `e625a1e9`、`bef0f871`、`18cd75b8` | R2 Pass | 4 → 3 commits |
| 82.4 结构复用切片 | 0/3 | 未开始 | 待提交 | — | 3 → 0 commits |

### 第八十二阶段：质量滚动治理与债务收敛（进行中，2026-11-22 立项）

> 阶段规划、8 要素、验收标准与回滚边界见 [项目计划](./roadmap.md#第八十二阶段质量滚动治理与债务收敛进行中)。小条目默认独立提交、独立审计；强耦合时才合并批次并写明理由。

- [x] **82.1 覆盖率第二十三批（P2）**
    - [x] **82.1.1 复算候选模块与基线**
        - 目标: 按最新 coverage-final 复算，确认 3 个模块的未覆盖条数与分母口径。
        - 验收: baseline 落 `artifacts/coverage/<date>-phase82-item1/`；候选模块清单与同源分母口径写入 `artifacts/review-gate/<date>-phase82-item1.md`。
        - 交付物: coverage baseline、候选清单。
        - 依赖: 干净全量跑（清 `.vitest-cache` + `--maxWorkers=4`）。
    - [x] **82.1.2 模块 A/B 补测**
        - 目标: 补 `scripts/governance/inventory-font-sizes.mjs` 与 `composables/use-post-editor-page.helpers.ts` 的失败 / 边界分支。
        - 验收: 两模块**各自** statements `+15pp` 或 `≥85%`；定向测试通过；不写低价值断言。
        - 交付物: 测试文件、模块覆盖对比。
        - 依赖: 82.1.1。
    - [x] **82.1.3 模块 C 补测与同源增幅收口**
        - 目标: 补 `packages/cli/src/api-client.ts` 并确认同源 statements `+0.3pp`。
        - 验收: 达 82.1 大条目验收标准；补全量 coverage exit 与 flaky 记录。
        - 交付物: 测试文件、coverage exit、证据。
        - 依赖: 82.1.2。

- [ ] **82.2 字号归一第五批（P3）**
    - [ ] **82.2.1 复算与选批**
        - 目标: 按 `governance:inventory:font-sizes` 复算 65 条等值待替换，选出 ≤10 文件的一批（≥30 条）。
        - 验收: 选批清单与等值判定落 `artifacts/review-gate/<date>-phase82-item2-font-sizes.md`；不改非字阶取值。
        - 交付物: inventory 复算、选批清单。
        - 依赖: `governance:inventory:font-sizes`。
    - [ ] **82.2.2 替换与逐元素对账**
        - 目标: 完成 ≥30 条等值字面量替换为 `--m-font-size-*`。
        - 验收: 达 82.2 大条目验收标准；本批等值待替换下降 ≥30 且逐元素 `getComputedStyle` 0 差异。
        - 交付物: token 替换、对账证据。
        - 依赖: 82.2.1；tour 页面需截图。
    - [ ] **82.2.3 视觉与 parity 收口**
        - 目标: 确认视觉门禁无未归因差异。
        - 验收: 达 82.2 大条目验收标准；补充 `test:visual` / parity 未归因 0 的日志。
        - 交付物: visual / parity 日志、偏差登记（如有）。
        - 依赖: 82.2.2。

- [x] **82.3 静态规则债第五批（P2）**
    - [x] **82.3.1 复算基线与代表文件**
        - 目标: 复算 `no-non-null-assertion` 命中 / 文件分布，先改 1 个代表文件。
        - 验收: inventory 基线落盘；代表文件 `pnpm lint` 0 error；定向测试通过。
        - 交付物: inventory 基线、代表文件改动。
        - 依赖: `governance:inventory:eslint-rules`（timeout budget 10m）。
    - [x] **82.3.2 批量清零 A（≤7 文件）**
        - 目标: 处理第一批 ≤7 文件的命中，保持类型窄化语义等价。
        - 验收: 本批文件 `pnpm lint` 0 error；定向测试通过；无 `eslint-disable` 新增。
        - 交付物: 代码改动、文件清单。
        - 依赖: 82.3.1。
    - [x] **82.3.3 批量清零 B（剩余文件）并升 error**
        - 目标: 处理剩余命中，把规则升为 `error` 并同步 debt 目标。
        - 验收: 达 82.3 大条目验收标准；inventory 该规则 0 命中 / 0 warning / 0 显式豁免。
        - 交付物: 代码 / 配置改动、inventory 产物。
        - 依赖: 82.3.2。
    - [x] **82.3.4 收口验证与 issue #262 回写**
        - 目标: 完成回归验证并回写 issue #262。
        - 验收: 达 82.3 大条目验收标准；`typecheck` 与定向测试通过；issue #262 回写链接。
        - 交付物: 验证摘要、issue 回写记录。
        - 依赖: 82.3.3。

- [ ] **82.4 结构复用切片（P2）**
    - [ ] **82.4.1 复算重复热点清单**
        - 目标: 基于 jscpd 报告与 `governance:audit:simple-duplicates` 选出 2-3 组「同源」热点。
        - 验收: 基线落 `artifacts/review-gate/`；每组给同源论证与预计收益（clones / 行数）。
        - 交付物: 热点清单、同源论证。
        - 依赖: 2026-11-22 jscpd 基线。
    - [ ] **82.4.2 收敛热点并复算**
        - 目标: 完成 2-3 组抽取 / 收敛，使重复率 ≤0.35%。
        - 验收: `pnpm duplicate-code:check:strict` 通过；定向测试与 `typecheck` 通过。
        - 交付物: 收敛改动、复算报告。
        - 依赖: 82.4.1。
    - [ ] **82.4.3 结构复用收口**
        - 目标: 复算并记录本批净收益与未收敛项。
        - 验收: 达 82.4 大条目验收标准；未收敛项写入 backlog 主线 #2 的下一次切片方向。
        - 交付物: 收口证据、backlog 回填。
        - 依赖: 82.4.2。

> 第八十一阶段 5 条条目已完成并归档（2026-11-21 立项并收口）：Weekly 安全告警门禁恢复、覆盖率第二十二批、静态规则债第四批、字号归一第四批、规划文档模型 v1 首轮实战。正文见 [roadmap 归档分片](./archive/roadmap-phases-81.md)，条目明细见 [待办事项归档](./todo-archive.md)，阶段结论见 [项目计划](./roadmap.md#第八十一阶段归档结论最近归档阶段)。
>
> 下一阶段候选按 [项目规划规范 §4.5 Step 7](../standards/planning.md) 在准入时从 [backlog](./backlog.md) 重新评估；本阶段口径已由用户在候选页确认（方案 A，4 条滚动治理）。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
