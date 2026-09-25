# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

---

## 第六十八阶段：PrimeVue → caomei-ui 迁移（二）——0.3.0 基线复测与 B2 数据页全量

> 阶段规划详情与 ROI 见 [项目计划](./roadmap.md)。
> 迁移方案事实源见 [PrimeVue → caomei-ui 迁移方案](../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)。
> backlog 来源见 [长期规划与积压项](./backlog.md) 长期主线第 10 条（UI 组件库迁移）与第 1 条（测试覆盖率）。

**时间表**: 2026-09-26 ~ 待定（按里程碑滚动，不预设结束日）

**准入前置（已核对 2026-09-26）**: 第六十七阶段已审计归档、`todo.md` 无残留；`caomei-ui@0.3.0` 已于 2026-09-24 发布且无 `BREAKING CHANGES`（目标基线）；共享壳过渡组件替换清单与上游反馈清单已产出；阶段构成（构成方案 A：0.3.0 复测 + B2 剩余 + 覆盖率第九批，B3 与浮层留待第六十九阶段）经用户确认。

- [ ] **1. caomei-ui 0.3.0 升级与基线复测（P1）**
    - **执行范围**: `caomei-ui` 由 `0.2.0` 精确锁定升级到 `0.3.0`（保持精确锁定、不加 `^`）；升级前先读 `0.3.0` 的 `BREAKING CHANGES` 并留阅读记录（已知无破坏性变更，仍不得静默升级）；重跑视觉回归（`pnpm test:visual`）与定向测试（路由迁移守卫单测、试点页 `/admin/comments` 相关单测 / E2E）；重测 `keyCss` 并按需刷新 `.github/perf/bundle-baseline.json`（数值变更须脚本 `BUDGETS` / 基线 JSON / [性能规范](../standards/performance.md) 三处联动）；澄清基线口径——「零 caomei 组件消费」表述与 B2 试点页已消费 5 个组件的事实冲突，按实测口径改写；组件消费清单按 `0.3.0` 口径重数。
    - **非目标**: 不迁移新页面；不连带其他依赖升级；不改动包体其他阈值。
    - **最小验收**: `package.json` / `pnpm-lock.yaml` 中 `caomei-ui` 为 `0.3.0` 精确锁定且无 `file:` 形态；视觉回归与定向测试通过并在回归记录留痕；`keyCss` 实测值与基线 JSON 一致、口径表述已修正；`pnpm test:perf:budget` 不越线；`pnpm typecheck` + `pnpm lint` 通过。
    - **证据落点**: `BREAKING CHANGES` 阅读结论、升级记录、`keyCss` 复测数据写入 [回归记录](../reports/regression/current.md)；基线 JSON 与口径表述修正落对应文件。

- [ ] **2. B2 剩余数据页迁移（一）：`pages/admin` 数据列表页（P1）**
    - **执行范围**: 按路由整体切换迁移 `pages/admin/posts`、`users`、`friend-links`、`submissions`、`subscribers`、`waitlist`、`external-links`、`ad/campaigns`、`ad/placements`、`migrations/link-governance` 共 10 个数据列表路由；新增共享壳过渡组件 `AppAvatarV2`（users / subscribers 用）与 `AppUploaderV2`（friend-links 用），按迁移方案 §5.5 过渡策略以路由择库实现；`pages/admin/posts` 的 3 个跨路由共享组件按 §5.5 处置——`post-audit-badge` 的在册族依赖（`Tag`）以过渡组件 + 路由择库隔离，`post-audit-dialog` / `publish-push-dialog` 属浮层显式豁免、维持 PrimeVue 至第六十九阶段；`users` 路由自有组件族（filters / role-dialog / ban-dialog / sessions-drawer）随该路由迁移；各路由登记 `CAOMEI_UI_ROUTE_PREFIXES` 并扩面 `tests/modules/ui-library-route-migration-guard.test.ts` 守卫；同步改写相关测试与 mock。
    - **非目标**: 不迁移 `/admin/posts/[id]` 编辑器路由；不做 settings 族组件（随 B3）；不处理浮层类（Dialog / Drawer / Popover / DropdownMenu / `ConfirmDeleteDialog` / `useConfirm` / `v-tooltip`，留第六十九阶段）；不做图标全量替换；不卸载 PrimeVue。
    - **最小验收**: 各路由「批次在册组件族」零残留守卫通过且至少使用一个 caomei-ui 组件；共享壳按过渡组件路由择库口径无混用；逐页功能回归通过（排序 / 分页 / 选择 / 列插槽）；三层视觉回归通过且截图差异逐项归因（不属于迁移方案 §6.3 有意差异者不得静默出现）；`pnpm typecheck` + `pnpm lint` + `pnpm lint:css` 通过；定向单测与相关 E2E 通过。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单（含过渡组件路由择库登记）；视觉回归归因记录写入回归记录。

- [ ] **3. B2 剩余数据页迁移（二）：组件型目标与 host 路由（P1）**
    - **执行范围**: `components/admin/admin-taxonomy-page.vue`（host `/admin/categories` + `/admin/tags`）、`components/admin/ai/task-list.vue`（host `/admin/ai`）、`components/admin/marketing-campaign-list.vue`（host `/admin/marketing`）随各自 host 路由整路由迁移；若目标页涉及试点在册清单外的组件族（如 `Tabs`），先在迁移方案 §5.5 在册清单登记并同步守卫口径后方可迁移；含路由登记、守卫扩面、相关测试与 mock 改写。
    - **非目标**: 同条目 2 的浮层 / settings / 图标 / 卸载豁免；不迁移 host 路由之外的页面。
    - **最小验收**: 同条目 2（在册族零残留守卫、无混用、三层回归差异逐项归因、质量门通过）。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单；视觉回归归因记录。

- [ ] **4. 测试覆盖率治理第九批（P2）**
    - **执行范围**: 从 `server/services/` 低覆盖模块中选 3-5 个补测（优先候选：`friend-link.ts` 73.06%、`notification.ts` 70.10%、`post-distribution.ts` 75.31%、`upload.ts` 74.85%；`ai/task-detail.ts` 28.57% 与 `external-feed/cache.ts` 50.00% 经缺口报告标记低收益 / 排除（体量过小），仅在优先候选不足 3-5 个时作为边界候选评估），失败 / 边界断言优先，不做低价值铺量。
    - **非目标**: 不追求全仓 `90%+` 一步到位；不为覆盖率重构被测模块。
    - **最小验收**: 目标模块覆盖率显著提升（各 +15pp 以上或达 85%+）；全仓 Statements 以 `80.63%` 为基线目标提升 ≥1pp，未达 ≥1pp 时显式记录原因并转长期治理；新增用例含失败 / 边界断言；`pnpm typecheck` + `pnpm lint` + 定向 `pnpm test` 通过。
    - **证据落点**: coverage 数值与模块清单写入回归记录；backlog 长期主线第 1 条基线随阶段归档同步。

**回滚边界**:

- 条目 1：版本锁定回退 `0.2.0` 并还原 `pnpm-lock.yaml` 与基线 JSON 即可，无业务代码改动。
- 条目 2 / 3：逐路由独立回滚——路由前缀从 `CAOMEI_UI_ROUTE_PREFIXES` 移除并 `git revert` 该路由改动即可切回 PrimeVue；过渡组件随其消费者路由同进退。
- 条目 4：测试文件独立可删，不影响业务代码。

**长期主线容量说明**: 迁移主线占阶段主要容量；仅上收测试覆盖率第 1 条一个治理切片。结构复用 / 国际化 / 注释治理 / Postgres 等主线本期不上收新切片，由 `pnpm regression:weekly` 保持不回退；周期性回归发现的问题按 backlog 漂移路由规则回灌对应主线。

**风险提示**: `0.x` 版本不承诺语义化兼容，`0.3.0` 升级后必须重跑该批回归并留痕（迁移方案 §5.6）；B2 批量路由迁移存在共享壳混用风险（`AppAvatar` / `AppUploader` 消费者跨路由），过渡组件必须按路由择库；上游 caomei-ui 已知能力缺口（见 [上游反馈清单](../design/governance/2026-09-25-caomei-ui-upstream-feedback.md)）可能在剩余数据页复现，命中时按清单既有处置口径执行并回灌上游；`pages/admin/posts` 迁移存在波及 `/admin/posts/[id]` 的被动混用风险，须按 §5.5 过渡策略隔离。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
