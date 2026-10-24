# 路线图深度归档：第六十八阶段

> 本文件承接 `docs/plan/roadmap.md` 主窗口迁出的第六十八阶段完整正文（迁出时点：2026-10-24，阶段归档）。
> 正文保持立项与执行期原样（含 2026-10-13 版本口径校正段），仅标题状态由「规划中」改为「已审计归档」，并把正文相对链接深度按迁入子目录补一级；阶段收口结论见 [roadmap.md](../roadmap.md) 的「第六十八阶段归档结论」与 [待办事项归档](../todo-archive.md) 的第六十八阶段归档块。
> 归档规则见 [深度归档治理索引](./index.md)。

---

### 第六十八阶段：PrimeVue → caomei-ui 迁移（二）——0.3.0 基线复测与 B2 数据页全量（Phase 68: PrimeVue to caomei-ui Migration II — 0.3.0 Baseline Re-measurement & B2 Data Pages）（已审计归档）

**时间表**: 2026-09-26 ~ 待定（按里程碑滚动，不预设结束日）

**2026-10-13 更新（版本口径校正，不改条目范围）**: 条目 1 立项时的目标基线 `caomei-ui@0.3.0` 已于 2026-09-26 完成升级与基线复测；其后依赖经 Dependabot 单包路径静默抬版到 `0.5.0` / `0.6.0`，**实际执行与当前锁定版本为 `caomei-ui@0.6.0`**。漂移已按升级纪律补做 `0.4.0~0.6.0` 的 `BREAKING CHANGES` 阅读、组件清单 `0.6.0` 口径重数（81 项）、三层视觉回归（10/10，零像素差异）与包体复测（`keyCss` 61,311 B / 70KB，未越线），并同步全部受影响文档（见条目 1 补记与迁移方案 §3.8）。条目 2 / 3 / 4 的范围与验收不变；条目 2 / 3 的行内补丁口径改按 `0.6.0` 原生能力引用（上游反馈 1.3 / 1.4 / 1.5 三条真实缺口已由库侧 `0.4.0` 交付闭合）。本阶段仍为**纯文档收口式校正**，未新增原子条目、容量维持 `4` 项。

**目标**: 承接 backlog 长期主线第 10 条「UI 组件库许可证风险与迁移可行性治理」的第二阶段切片，把迁移从「试点验证」推进到「数据页批量落地」：先完成 `caomei-ui@0.3.0` 升级与基线复测（消除目标基线与口径冲突），再按路由整体切换推进 B2 剩余数据列表页（10 个 `pages/admin` 路由 + 组件型目标与 host 路由），同时以第九批补测维持覆盖率主线的治理节奏。B3 表单与设置、浮层类合并第六十九阶段，B4 收尾与 PrimeVue 卸载为第七十阶段。

**准入结论**: 四条主线来自 [迁移方案 §7](../../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)、backlog 长期主线第 10 条（含 `0.3.0` 升级待执行条目）与第 1 条，阶段构成经用户 2026-09-26 确认（构成方案 A），容量 `4` 项符合规划规范。与迁移方案 §5.5 原预写口径（六十八 = B2 剩余 + B3）的偏离已显式记录：按试点耗时画像（1 页 + 基建即占满第六十七阶段），B2 剩余与 B3 同期会违反阶段聚焦，B3 与浮层类合并第六十九阶段；§5.5 明示批次划分在本阶段准入时单独评估，本结论即该评估输出。同时，原「方案 A 三阶段轨迹」经本次准入重划分为第六十七 ~ 第七十阶段四段（67 基座与试点 / 68 0.3.0 复测与 B2 / 69 B3 与浮层 / 70 B4 收尾与 PrimeVue 卸载），内容总量不变、仅拆分粒度变化。

**准入前置（已核对 2026-09-26；版本口径于 2026-10-13 更新，见本节「2026-10-13 更新」段）**: 第六十七阶段已审计归档、`todo.md` 无残留、工作区清洁检查（`docs:check:source-of-truth` / 归档一致性）通过；`caomei-ui@0.3.0` 已于 2026-09-24 发布且无 `BREAKING CHANGES`；共享壳过渡组件替换清单（迁移方案 §5.5）与上游反馈清单已产出。

**ROI 评估**: `0.3.0` 升级与基线复测 `3.00`；B2 剩余数据页（一）`1.80`；B2 剩余数据页（二）`1.60`（两条按 B2 剩余整体 `1.80` 评估后拆分估值）；覆盖率第九批 `2.30`。全部达到规划规范 §3.3 优先进入阈值。

**长期主线容量说明**: 迁移主线占阶段主要容量；仅上收测试覆盖率第 1 条一个治理切片。结构复用 / 国际化 / 注释治理 / Postgres 等主线本期不上收新切片，由 `pnpm regression:weekly` 保持不回退。

1. **主线：caomei-ui 0.3.0 升级与基线复测（backlog #10 待执行条目上收）（P1）**:

    - **执行范围（立项时口径 2026-09-26）**: `caomei-ui` 由 `0.2.0` 精确锁定升级到 `0.3.0`（保持精确锁定、不加 `^`）；升级前先读 `0.3.0` 的 `BREAKING CHANGES` 并留阅读记录（已知无破坏性变更，仍不得静默升级）；重跑视觉回归（`pnpm test:visual`）与定向测试（路由迁移守卫单测、试点页 `/admin/comments` 相关单测 / E2E）；重测 `keyCss` 并按需刷新 `.github/perf/bundle-baseline.json`（数值变更须脚本 `BUDGETS` / 基线 JSON / [性能规范](../../standards/performance.md) 三处联动）；澄清基线口径——「零 caomei 组件消费」表述与 B2 试点页已消费 5 个组件的事实冲突，按实测口径改写；组件消费清单按 `0.3.0` 口径重数。
    - **非目标**: 不迁移新页面；不连带其他依赖升级；不改动包体其他阈值。
    - **最小验收（立项时口径 2026-09-26）**: `package.json` / `pnpm-lock.yaml` 中 `caomei-ui` 为 `0.3.0` 精确锁定且无 `file:` 形态；视觉回归与定向测试通过并在回归记录留痕；`keyCss` 实测值与基线 JSON 一致、口径表述已修正；`pnpm test:perf:budget` 不越线；`pnpm typecheck` + `pnpm lint` 通过。
    - **实际收口结论（以本阶段「2026-10-13 更新（版本口径校正）」段与 todo.md 条目 1 补记为准）**: 实际锁定版本为 `0.6.0`；`keyCss` 实测 61,311 B、基线沿用 0.3.0 批次口径 60,896 B，差异已显式记录并保留待 B2 / B4 重取基线，不以刷新基线掩盖。
    - **证据落点**: `BREAKING CHANGES` 阅读结论、升级记录、`keyCss` 复测数据写入 `docs/reports/regression/current.md`；基线 JSON 与口径表述修正落对应文件。

2. **主线：B2 剩余数据页迁移（一）`pages/admin` 数据列表页（backlog #10）（P1）**:

    - **执行范围**: 按路由整体切换迁移 `pages/admin/posts`、`users`、`friend-links`、`submissions`、`subscribers`、`waitlist`、`external-links`、`ad/campaigns`、`ad/placements`、`migrations/link-governance` 共 10 个数据列表路由；新增共享壳过渡组件 `AppAvatarV2`（users / subscribers 用）与 `AppUploaderV2`（friend-links 用），按迁移方案 §5.5 过渡策略以路由择库实现；`pages/admin/posts` 的 3 个跨路由共享组件按 §5.5 处置——`post-audit-badge` 的在册族依赖（`Tag`）以过渡组件 + 路由择库隔离，`post-audit-dialog` / `publish-push-dialog` 属浮层显式豁免、维持 PrimeVue 至第六十九阶段；`users` 路由自有组件族（filters / role-dialog / ban-dialog / sessions-drawer）随该路由迁移；各路由登记 `CAOMEI_UI_ROUTE_PREFIXES` 并扩面 `tests/modules/ui-library-route-migration-guard.test.ts` 守卫；同步改写相关测试与 mock。
    - **非目标**: 不迁移 `/admin/posts/[id]` 编辑器路由；不做 settings 族组件（随 B3）；不处理浮层类（Dialog / Drawer / Popover / DropdownMenu / `ConfirmDeleteDialog` / `useConfirm` / `v-tooltip`，留第六十九阶段）；不做图标全量替换；不卸载 PrimeVue。
    - **最小验收**: 各路由「批次在册组件族」零残留守卫通过且至少使用一个 caomei-ui 组件；共享壳按过渡组件路由择库口径无混用；逐页功能回归通过（排序 / 分页 / 选择 / 列插槽）；三层视觉回归通过且截图差异逐项归因（不属于迁移方案 §6.3 有意差异者不得静默出现）；`pnpm typecheck` + `pnpm lint` + `pnpm lint:css` 通过；定向单测与相关 E2E 通过。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单（含过渡组件路由择库登记）；视觉回归归因记录写入 `docs/reports/regression/current.md`。

3. **主线：B2 剩余数据页迁移（二）组件型目标与 host 路由（backlog #10）（P1）**:

    - **执行范围**: `components/admin/admin-taxonomy-page.vue`（host `/admin/categories` + `/admin/tags`）、`components/admin/ai/task-list.vue`（host `/admin/ai`）、`components/admin/marketing-campaign-list.vue`（host `/admin/marketing`）随各自 host 路由整路由迁移；若目标页涉及试点在册清单外的组件族（如 `Tabs`），先在迁移方案 §5.5 在册清单登记并同步守卫口径后方可迁移；含路由登记、守卫扩面、相关测试与 mock 改写。
    - **非目标**: 同条目 2 的浮层 / settings / 图标 / 卸载豁免；不迁移 host 路由之外的页面。
    - **最小验收**: 同条目 2（在册族零残留守卫、无混用、三层回归差异逐项归因、质量门通过）。
    - **证据落点**: 「文件 → 改动点 → 依据指针」清单；视觉回归归因记录。

4. **治理：测试覆盖率第九批（backlog #1）（P2）**:

    - **执行范围**: 从 `server/services/` 低覆盖模块中选 3-5 个补测（优先候选：`friend-link.ts` 73.06%、`notification.ts` 70.10%、`post-distribution.ts` 75.31%、`upload.ts` 74.85%；`ai/task-detail.ts` 28.57% 与 `external-feed/cache.ts` 50.00% 经缺口报告标记低收益 / 排除（体量过小），仅在优先候选不足 3-5 个时作为边界候选评估），失败 / 边界断言优先，不做低价值铺量。
    - **非目标**: 不追求全仓 `90%+` 一步到位；不为覆盖率重构被测模块。
    - **最小验收**: 目标模块覆盖率显著提升（各 +15pp 以上或达 85%+）；全仓 Statements 以 `80.63%` 为基线目标提升 ≥1pp，未达 ≥1pp 时显式记录原因并转长期治理；新增用例含失败 / 边界断言；`pnpm typecheck` + `pnpm lint` + 定向 `pnpm test` 通过。
    - **证据落点**: coverage 数值与模块清单写入 `docs/reports/regression/current.md`；backlog 长期主线第 1 条基线随阶段归档同步。

**回滚边界**:

- 条目 1：版本锁定回退 `0.2.0` 并还原 `pnpm-lock.yaml` 与基线 JSON 即可，无业务代码改动。
- 条目 2 / 3：逐路由独立回滚——路由前缀从 `CAOMEI_UI_ROUTE_PREFIXES` 移除并 `git revert` 该路由改动即可切回 PrimeVue；过渡组件随其消费者路由同进退。
- 条目 4：测试文件独立可删，不影响业务代码。
