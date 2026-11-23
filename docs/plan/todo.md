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
| 83.1 `.vue` 非空断言清零 | 3/3 | 已闭环 | 待回填 | Pass（R1 Pass / R2 Pass） | 3 → 1 commit |
| 83.2 文档规范压缩切片 | 3/3 | 已闭环 | 待回填 | Pass（R1 R2 Reject / R3 Pass） | 3 → 1 commit |
| 83.3 覆盖率第二十四批 | 3/3 | 已闭环 | 待回填 | Pass（R1 Reject / R2 Pass） | 3 → 1 commit |
| 83.4 字号归一第六批 A | 0/3 | 未开始 | 待提交 | — | 3 → 0 commits |

### 第八十三阶段：规则面收口与文档/覆盖率滚动治理（进行中，2026-11-23 立项）

> 阶段规划、8 要素、验收标准与回滚边界见 [项目计划](./roadmap.md#第八十三阶段规则面收口与文档覆盖率滚动治理进行中)。小条目默认独立提交、独立审计；强耦合时才合并批次并写明理由。

- [x] **83.1 `.vue` 非空断言清零与规则面收口（P2）**
    - [x] **83.1.1 复算命中与代表文件改造**
        - 目标: 复算 `.vue` 内 `@typescript-eslint/no-non-null-assertion` 命中（3 文件 10 处），先改代表文件 `components/app-captcha.vue`（5 处）。
        - 验收: 代表文件 `pnpm exec eslint` 0 error；`window.grecaptcha` 等全局对象改为显式守卫后行为等价；定向测试通过。
        - 交付物: 代表文件改动、命中清单。
        - 依赖: `eslint.config.js` 现有 `strictTsRuleOverrides` 面。
    - [x] **83.1.2 批量清零与规则面扩到 `.vue`**
        - 目标: 处理 `components/admin/admin-taxonomy-page.vue`（4 处）与 `components/admin/posts/post-editor-media-settings.vue`（1 处）；新增 `NO_NON_NULL_ASSERTION_FILES` 常量，让 `no-non-null-assertion` 的配置面与 inventory 计数面同源并纳入 `.vue`。
        - 验收: 三文件 0 命中；`pnpm lint` 0 error 且无新增 `eslint-disable`；`typecheck` 通过；`governance:inventory:eslint-rules` 该规则 0 命中 / 0 warning / 0 豁免。
        - 交付物: 代码 / 配置改动、inventory 产物。
        - 依赖: 83.1.1。
    - [x] **83.1.3 收口验证与 issue 回写**
        - 目标: 完成定向回归并回写 issue #262 的批次记录。
        - 验收: 达 83.1 大条目验收标准；`pnpm test` 定向文件全部通过；issue #262 回写链接。
        - 交付物: 验证摘要、issue 回写记录。
        - 依赖: 83.1.2。

- [x] **83.2 文档规范压缩切片（P2）**
    - [x] **83.2.1 盘点与压缩方案**
        - 目标: 定位 `docs/standards/documentation.md`（363 行，候选 error 线 320）与 `docs/standards/planning.md`（395 行，候选 warn 线 365）中可合并的重复叙述、逐阶段历史与可下沉段落，核对锚点引用面。
        - 验收: 压缩方案落 `artifacts/review-gate/<date>-phase83-item2-docs.md`；列出被引用锚点与保留边界，规则正文不删减。
        - 交付物: 盘点清单、压缩方案。
        - 依赖: `node scripts/docs/check-line-count.mjs --profile=candidate`。
    - [x] **83.2.2 `documentation.md` 压缩至候选 error 线内**
        - 目标: 把 `documentation.md` 压到 `≤320` 行，规则只做合并 / 索引化，不降低约束强度。
        - 验收: 该文件候选 error 消失；`lint-md` 通过；受影响的 `docs:check:links` 锚点无失效。
        - 交付物: 文档改动、行数对比。
        - 依赖: 83.2.1。
    - [x] **83.2.3 `planning.md` 压缩与门禁复核**
        - 目标: 把 `planning.md` 压到 `≤365` 行，并复核 `docs:check:planning-docs`、`docs:check:source-of-truth` 与 `docs:check:i18n` 全部通过。
        - 验收: 达 83.2 大条目验收标准；候选 profile 0 error / 0 warn（两文件均回健康线内）。
        - 交付物: 文档改动、门禁日志。
        - 依赖: 83.2.2。

- [x] **83.3 覆盖率第二十四批（P2）**
    - [x] **83.3.1 复算候选模块与基线**
        - 目标: 按最新 coverage-final 复算未覆盖条数与分母口径，选出 3 个候选模块（脚本池优先，其次组件池）。
        - 验收: baseline 落 `artifacts/coverage/<date>-phase83-item3/`；同源分母口径与候选清单落 `artifacts/review-gate/<date>-phase83-item3.md`。
        - 交付物: coverage baseline、候选清单。
        - 依赖: 干净全量跑（清 `.vitest-cache` + `--maxWorkers=4`）。
    - [x] **83.3.2 模块 A/B 补测**
        - 目标: 补两个模块的失败 / 边界分支。
        - 验收: 两模块**各自** statements `+15pp` 或 `≥85%`；定向测试通过；不写低价值断言。
        - 交付物: 测试文件、模块覆盖对比。
        - 依赖: 83.3.1。
    - [x] **83.3.3 模块 C 补测与同源增幅收口**
        - 目标: 补第三个模块并确认同源 statements `+0.3pp`（约 119 条）。
        - 验收: 达 83.3 大条目验收标准；补全量 coverage exit 与 flaky 记录。
        - 交付物: 测试文件、coverage exit、证据。
        - 依赖: 83.3.2。

- [ ] **83.4 字号归一第六批 A（P3）**
    - [ ] **83.4.1 复算与选批**
        - 目标: 按 `governance:inventory:font-sizes` 复算 28 条口径内等值待替换，选出 ≤10 文件的一批（≥11 条）。
        - 验收: 选批清单与等值判定落 `artifacts/review-gate/<date>-phase83-item4-font-sizes.md`；不改非字阶取值。
        - 交付物: inventory 复算、选批清单。
        - 依赖: `governance:inventory:font-sizes`。
    - [ ] **83.4.2 替换与逐元素对账**
        - 目标: 完成 ≥11 条等值字面量替换为 `--m-font-size-*`。
        - 验收: 口径内等值待替换 `28 → ≤17`；逐元素 `getComputedStyle` 0 差异；`pnpm lint:css` 0 error。
        - 交付物: token 替换、对账证据。
        - 依赖: 83.4.1。
    - [ ] **83.4.3 视觉与 parity 收口**
        - 目标: 确认视觉门禁无未归因差异。
        - 验收: 达 83.4 大条目验收标准；`test:visual` 32/32、parity 未归因差异 0，偏差按既有偏差处置表登记。
        - 交付物: visual / parity 日志。
        - 依赖: 83.4.2。

> 第八十二阶段 4 条条目已于 2026-11-23 审计归档（覆盖率第二十三批 / 字号归一第五批 / 静态规则债第五批 / 结构复用切片）。正文见 [roadmap 归档分片](./archive/roadmap-phases-82.md)，条目明细见 [待办事项归档](./todo-archive.md)，阶段结论见 [项目计划](./roadmap.md#第八十二阶段归档结论最近归档阶段)。
>
> 本阶段口径已由用户在候选页确认（方案 A，4 条滚动治理）；超时按 `83.4 → 83.3 → 83.2` 移出，优先保留规则面收口与文档压缩。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
