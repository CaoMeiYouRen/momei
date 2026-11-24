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
| 84.1 字号归一第六批 B | 3/3 | 已闭环 | 待回填 | Pass（R1 Pass / R2 Reject / R3 Pass；84.1.2 分区 R1 Reject / R2 Pass + 页面样式面 Pass） | 3 → 3 commits |
| 84.2 文档 deploy 压缩 | 3/3 | 已闭环 | 待回填 | Pass（R1 Reject / R2 Pass） | 3 → 1 commit |
| 84.3 结构复用切片 | 3/3 | 已闭环 | 待回填 | Pass（R1 Reject / R2 Reject / R3 Pass） | 3 → 1 commit |
| 84.4 覆盖率第二十五批 | 3/3 | 已闭环 | 待回填 | 待审计 | 3 → 1 commit |
| 84.5 静态规则债第六批 | 3/4 | 进行中 | 待回填 | 进行中 | 4 → 4 commits |
| 84.6 i18n ALS 缺陷修复 | 3/3 | 已闭环 | 待回填 | Pass（R1 Reject / R2 Pass；设计先行，kill-switch 采用保持现状案） | 3 → 1 commit |

### 第八十四阶段：治理收尾与规则面/运行时缺陷收敛（进行中，2026-11-24 立项）

> 阶段规划、8 要素、验收标准与回滚边界见 [项目计划](./roadmap.md#第八十四阶段治理收尾与规则面运行时缺陷收敛进行中)。小条目默认独立提交、独立审计；强耦合时才合并批次并写明理由。
>
> 用户于候选页确认「A+B+C 全量纳入」：6 个大条目在默认容量（4–6）内。其中 84.5（ROI 1.33）与 84.6（ROI 1.14）属 [规划规范 §3.3](../standards/planning.md#33-准入基准-decision-rules) 的「1.0 < Score ≤ 1.5」确认档，已按用户确认纳入，均带 kill-switch。

- [x] **84.1 字号归一第六批 B 与 inventory 盲区修复（P3）**
    - [x] **84.1.1 复算、盲区修复与选批**
        - 目标: 复算口径内 16 条待替换（grep 命中 17 处，须先解释差 1 处）；修复 `inventory-font-sizes.mjs` 的 `stripComments` 对 Vue 属性 `accept="image/*"` 的吞块问题，修后先对账「token +4 / scale +1」再选批。
        - 验收: 盲区 3 文件（`snippet-edit-dialog.vue` / `pages/admin/snippets/capture.vue` / `snippet-quick-capture.vue`）声明重新计入；修复前后 inventory 差异与预期一致；脚本改动附单测（现存 `tests/scripts/*font*` 若无则补最小用例）。
        - 交付物: 脚本与测试改动、inventory 前后对比、选批清单。
        - 依赖: 无。
    - [x] **84.1.2 等值替换与逐元素对账**
        - 目标: 把口径内等值待替换清零（`scaleDeclarationCount = 0`），`styles/main.scss` 的 2 处按用途甄别（字阶定义行不得改）。
        - 验收: inventory `scale` 0 条、token 覆盖上升；逐元素 `getComputedStyle` 0 差异；`pnpm lint:css` 0 error。
        - 交付物: token 替换、对账证据。
        - 依赖: 84.1.1。
    - [x] **84.1.3 视觉与 parity 收口**
        - 目标: 视觉门禁无未归因差异。
        - 验收: `test:visual` 32/32；parity 本机除既有 `user-settings-dark` 外无新增失败；backlog #11 基线与 #9 盲区条目回填。
        - 交付物: visual / parity 日志、backlog 回填。
        - 依赖: 84.1.2。

- [x] **84.2 文档 deploy 压缩（P2）**
    - [x] **84.2.1 盘点与压缩方案**
        - 目标: `docs/guide/deploy.md` 274 行（候选 warn 255 / error 280）定位可合并段与可下沉细节，核对锚点引用面。
        - 验收: 方案落 `artifacts/review-gate/<date>-phase84-item2-docs.md`；不删除仍生效的部署步骤与平台差异说明。
        - 交付物: 盘点清单、压缩方案。
        - 依赖: `node scripts/docs/check-line-count.mjs --profile=candidate`。
    - [x] **84.2.2 压缩到候选 warn 线内**
        - 目标: 压到 `≤255` 行，细节下沉到专项设计或平台文档并回链。
        - 验收: 候选 profile 0 error / 0 warn（全仓）；`lint-md` / `docs:check:links` 通过。
        - 交付物: 文档改动、行数对比。
        - 依赖: 84.2.1。
    - [x] **84.2.3 镜像与门禁收口**
        - 目标: 同步受影响的翻译镜像并复核文档门禁。
        - 验收: `docs:check:i18n` / `docs:check:source-of-truth` / `docs:check:markers` / `docs:check:line-count` 全通过；镜像 `last_sync` 提升到改动日。
        - 交付物: 镜像改动、门禁日志。
        - 依赖: 84.2.2。

- [x] **84.3 结构复用切片（P2）**
    - [x] **84.3.1 复算热点与同源论证**
        - 目标: 按 2026-11-24 基线（39 clones / 577 行 / 0.33%）复算热点，优先处理已登记方向：`login.vue` ↔ `register.vue` 认证页骨架、`post-distribution-button.vue` 与其 composable 的返回面，或新增测试引入的重复。
        - 验收: jscpd 报告与 `governance:audit:simple-duplicates` 结果落 `artifacts/review-gate/`；每组给同源论证与预计收益。
        - 交付物: 热点清单、同源论证。
        - 依赖: 无。
    - [x] **84.3.2 抽取与复算**
        - 目标: 完成 1–2 组收敛，重复率 `≤0.32%`。
        - 验收: `pnpm duplicate-code:check:strict` 通过；定向测试与 `typecheck` 通过；无行为变化。
        - 交付物: 收敛改动、复算报告。
        - 依赖: 84.3.1。
    - [x] **84.3.3 收口与基线判断**
        - 目标: 记录净收益，并判断是否收紧 baseline。
        - 验收: 结论写入 backlog #2 下一次切片方向；基线是否收紧给出明确结论（不收紧须写明理由）。
        - 交付物: 收口证据、backlog 回填。
        - 依赖: 84.3.2。

- [x] **84.4 覆盖率第二十五批（P2）**
    - [x] **84.4.1 复算候选与基线**
        - 目标: 按最新 coverage-final 复算三模块未覆盖数：`composables/use-tts-volcengine-direct.ts`（229/310）、`packages/cli/src/wordpress-parser.ts`（60/116）、`scripts/governance/count-primevue-usage.mjs`（214/263）；确认同源分母 39,697 与 `+0.3pp ≈ 119 条`。
        - 验收: baseline 落 `artifacts/coverage/<date>-phase84-item4/`；候选与分母口径落 `artifacts/review-gate/`。
        - 交付物: coverage baseline、候选清单。
        - 依赖: 干净全量跑（清 `.vitest-cache` + `--maxWorkers=4`）。
    - [x] **84.4.2 模块 A/B 补测**
        - 目标: 补 `use-tts-volcengine-direct` 与 `wordpress-parser` 的失败 / 边界分支。
        - 验收: 两模块各自 `≥85%` 或 `+15pp`；定向测试通过；不写低价值断言。
        - 交付物: 测试文件、模块覆盖对比。
        - 依赖: 84.4.1。
    - [x] **84.4.3 模块 C 补测与同源增幅收口**
        - 目标: 补 `count-primevue-usage` 并确认同源 statements `+0.3pp`（三模块合计 186 条未覆盖，需覆盖约 64%）。
        - 验收: 干净全量 `pnpm test:coverage` EXIT 0 且同源增幅达标；flaky 记录；未达标则按 plan B 追加模块并写明原因。
        - 交付物: 测试文件、coverage exit、证据。
        - 依赖: 84.4.2。

- [ ] **84.5 静态规则债第六批（P2，确认档 ROI 1.33）**
    - [x] **84.5.1 复算基线与作用域评估**
        - 目标: 复算 `no-unsafe-argument` 命中（2026-11-21 口径 50 / 23 文件），确认 typed 规则在 `.vue` 与 tests / scripts 的作用域边界；评估 `PRODUCTION_TS_IGNORES` 中 `**/migration-*.ts` 收窄后共享该常量的其余规则新增命中。
        - 验收: inventory 基线落盘；收窄评估结论（4 个生产模块的新命中数）写入证据；代表文件先改 1 个并定向验证。
        - 交付物: inventory 基线、作用域评估、代表文件改动。
        - 依赖: `governance:inventory:eslint-rules`（分批跑，单次 ≤10m）。
    - [x] **84.5.2 批量清零 A（≤7 文件）**
        - 目标: 处理第一批文件的命中，改为显式类型守卫 / 参数收窄，保持运行时分派不变。
        - 验收: 本批 `pnpm lint` 0 error；定向测试通过；无新增 `eslint-disable`。
        - 交付物: 代码改动、文件清单。
        - 依赖: 84.5.1。
    - [x] **84.5.3 批量清零 B 并收窄 glob 升 error**
        - 目标: 处理剩余命中；同批把 `**/migration-*.ts` 收窄为真实迁移路径，清理收窄带出的新增命中后把规则升 `error`。
        - 验收: inventory 该规则 0 命中 / 0 warning / 0 豁免；`eslint.config.js` 与 `eslint-debt-targets.mjs` 常量同步；typecheck 通过。
        - 交付物: 代码 / 配置改动、inventory 产物。
        - 依赖: 84.5.2。
    - [ ] **84.5.4 收口与 issue #262 回写**
        - 目标: 完成回归并回写批次记录。
        - 验收: `pnpm lint` / `typecheck` / 定向测试通过；issue #262 回写；若收窄引发 >20 处新增 error 且无法收敛，按 kill-switch 回退收窄并登记 backlog。
        - 交付物: 验证摘要、issue 记录。
        - 依赖: 84.5.3。

- [x] **84.6 i18n ALS 缺陷修复（P2，确认档 ROI 1.14，设计先行）**
    - [x] **84.6.1 设计评估**
        - 目标: 针对 `server/middleware/i18n.ts` 的 `i18nStorage.run(appLocale, () => {})` 上下文即销毁问题，产出资质方案比较（handler 链包裹 / 删除 ALS 并修误导注释 / 保持现状仅修文档），含影响面与回滚。
        - 验收: 设计文档落 `docs/design/governance/2026-11-24-i18n-als-locale-resolution.md` 并在 `docs/design/governance/index.md` 登记；方案选定理由与 kill-switch 写明。
        - 交付物: 设计文档、方案结论。
        - 依赖: 无。
    - [x] **84.6.2 按选定方案实现**
        - 目标: 按 84.6.1 结论实现；若结论为「保持现状」，只删除误导注释并在 backlog 记录关闭理由。
        - 验收: `getLocale()` 在 SSR 请求内返回请求真实 locale（定向单测 + 至少一条 server 侧集成断言）；`pnpm lint` / `typecheck` 通过；未引入 i18n 回归（`i18n:audit:missing` / runtime 校验通过）。
        - 交付物: 代码改动、测试。
        - 依赖: 84.6.1。
        - 分支口径: 84.6.1 判定方案 A/B 均触发 kill-switch，本批按「保持现状」分支执行——删除误导注释、新增中间件契约单测、backlog #5 记录关闭理由；「返回真实 locale + server 侧集成断言」转 backlog #5 跟踪，不在本批声明通过。
    - [x] **84.6.3 收口验证与 backlog 回填**
        - 目标: 完成定向回归并将结论写回 backlog #5 待跟踪项。
        - 验收: 相关 server / i18n 测试通过；`docs:check:*` 通过；backlog #5 状态更新（关闭或明确新的跟踪条件）。
        - 交付物: 验证摘要、backlog 回填。
        - 依赖: 84.6.2。

> 第八十三阶段 4 条条目已于 2026-11-24 审计归档（.vue 规则面 / 文档压缩 / 覆盖率第二十四批 / 字号归一第六批 A）。正文见 [roadmap 归档分片](./archive/roadmap-phases-83.md)，条目明细见 [待办事项归档](./todo-archive.md)，阶段结论见 [项目计划](./roadmap.md#第八十三阶段归档结论最近归档阶段)。
>
> 本阶段口径已由用户在候选页确认（A+B+C 全量纳入，6 条）；超时按 `84.6 → 84.5 → 84.4 → 84.3` 移出，优先保留 84.1 / 84.2。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
