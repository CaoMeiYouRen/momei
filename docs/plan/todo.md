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

## 当前进行中阶段

### 第七十八阶段：质量门禁与债务收口（筹备中，2026-11-16 立项）

**阶段目标**: 收口静态规则债第三批与依赖台账复核、治理目录索引补全与索引检查、字号归一第二批、覆盖率第十九批、`AppAvatar` 生产构建尺寸缺陷，以及脚本治理入口的回归接线评估。

**准入结论**: 用户于 2026-11-16 在候选页确认「方案 A」6 条组合；ROI 均 ≥ `1.40`（静态规则债 1.60 / 治理索引 2.00 / 字号 1.40 / 覆盖率 1.60 / AppAvatar 1.60 / 脚本治理 2.00）；字号条目落在 `1.0 < Score ≤ 1.5` 档，经用户明确确认受控纳入并保留 kill-switch。

**阶段基线**: 同源 statements `85.6%`（33,045 / 38,601）；`duplicate-code` 0.38%（43 clones / 665 行）；i18n missing 0 / duplicates 64 组；字号 457 声明（token 88 / 口径内 186 / 非字阶 149 / scss 变量 34）；治理目录 69 份文档 / 40 份未入索引；`coreEntryJs` 281.04KB / 335KB、`keyCss` 59.41KB / 62KB。

**排程与移出顺序**: `5 → 1 → 2 → 6 → 3 → 4`；超时按 `6 → 3 → 4` 移出。

- [x] **1. 静态规则债第三批与依赖台账复核（P2）**: 把 `no-inferrable-types`（44 命中 / 16 文件，`server/services/ai` 17 处）与 `use-unknown-in-catch-callback-variable`（32 命中 / 19 文件）升为 `error` 并清零；`dependency-risk-allowlist.json` 增加 `reviewBy` 复核日期与到期提醒输出 + 惰性单测；同批回写 issue #262。
    - **验收标准**: 两条规则 `warningCount = 0` / `explicitExemptionCount = 0`；`pnpm lint` 0 error；台账过期判红、未过期通过；issue #262 已回写。
    - **非目标**: 不碰 `no-unsafe-*`；不改 high+ 门禁 severity；不新增依赖。
    - **验证 / 证据**: V0 + V1 + V2 + RG；inventory 产物与台账单测输出落 `artifacts/governance/`。
    - **回滚边界**: ESLint 配置与命中修复同批 revert，台账字段独立 revert。

- [x] **2. 治理索引补全与索引检查（P2）**: 对 `docs/design/governance` 69 份文档分类（在役补索引 / 过期入 `archive/` / 临时报告进 allowlist 并注明理由；断言排除 `index.md` 与 `archive/**`）；新增 `scripts/governance/check-governance-index.mjs` 与 `pnpm governance:check:index`（报告模式）并补单测。
    - **验收标准**: 脚本在当前 HEAD 输出 0 未登记项；单测覆盖已索引 / 未索引 / allowlist 三类；`docs:check:links` / `line-count` / `markers` 保持通过。
    - **非目标**: 不改文档正文结论；不删除文档；不把检查直接升阻断；不重命名既有文档。
    - **验证 / 证据**: V0 + V1 + V2 + RG；脚本 JSON 与分类清单落 `artifacts/governance/`。
    - **回滚边界**: 索引改动与新增脚本独立 revert。

- [x] **3. 字号归一第二批（P2）**: 按 [字号归一评估](../design/governance/2026-11-15-font-size-normalization-evaluation.md) 的 149 条非字阶取值（报告基线 150，第七十七阶段条目 3 删除面板时带走 1 处）与 186 条口径内可替换字面量取 ≤10 个文件（优先非 `components/admin/**`），逐元素对账并复算 inventory。
    - **验收标准**: 逐元素 `font-size` / `line-height` 零差异；`test:visual` 32/32、parity 83/83 未归因差异 0；inventory 口径内待替换数下降。
    - **非目标**: 不动 scss 变量与 `--m-font-size-*`；不按现值批量替换非字阶；不改视觉设计。
    - **验证 / 证据**: V0 + V1 + V2 + RG（V3 由 parity / visual 与逐元素对账覆盖）；输出落 `artifacts/review-gate/`。
    - **回滚边界**: 按目录批次独立 revert。**kill-switch**: 跨断点 / 容器查询导致无法等值替换时保留原值并登记报告。

- [ ] **4. 覆盖率第十九批（P2）**: 取 `packages/cli/src/import-command.ts`（8 / 145）与 `components/admin/admin-taxonomy-page.vue`（173 / 284），目标同源 `+0.3pp` 或模块级 `+15pp / ≥85%`；`import-command.ts` 超预算时按同源口径换入脚本池。
    - **验收标准**: 干净全量跑基线 / 收口 delta 落 `artifacts/coverage/`；定向测试通过；flaky 归因。
    - **非目标**: 不测模板分支凑数；不重构 `admin-taxonomy-page.vue`；不新增测试依赖。
    - **验证 / 证据**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。
    - **回滚边界**: 测试文件与覆盖率产物独立可回滚。

- [x] **5. AppAvatar 生产构建尺寸缺陷修复（P1 修复型）**: `components/app-avatar.vue` 把 `$attrs` 与 `--caomei-avatar-size` 落到自有包装元素或可用钩子，使 `xlarge` 生产构建渲染 64px、`large` 48px；回填 `/settings`、`/admin/users`、`comments` 实测并同步 backlog。
    - **验收标准**: `pnpm build` 产物中三处实测 64px / 48px；对应 parity / visual 未归因差异 0；开发态与 SSR 首帧无回归。
    - **非目标**: 不改档位映射；不改消费处 BEM；不以等上游改 Fragment 根为唯一交付。
    - **验证 / 证据**: V0 + V1 + V2 + V3 + RG；构建产物探针与截图落 `artifacts/review-gate/`。
    - **回滚边界**: 单组件独立 revert。

- [x] **6. 脚本治理入口晋级与回归接线（P3）**: 评估并把 `governance:audit:unused-components` 与 `governance:check:index` 接入 `regression:weekly` warning 面，复核 `docs:check:*:candidate` 频率，并同步 `scripts/README.md`。
    - **验收标准**: `pnpm regression:weekly --dry-run` 通过且步骤清单含新增项；README / 规范同步；周级实测（`--mode=warn`）通过。
    - **非目标**: 不把报告型入口升阻断；不改既有 5 个 governance 步骤的 required 口径；不为凑步骤增加长跑。
    - **验证 / 证据**: V0 + V1 + V2 + RG；dry-run 输出与周回归记录落盘。
    - **回滚边界**: 调度配置与 README 同批 revert。

> 阶段收口门禁: `pnpm regression:phase-close`；任何条目开工前先确认工作区干净并拉取远端。

> 上一阶段归档：第七十七阶段「体验与债务收口」已完成全部 6 条条目并归档（2026-11-15 立项、2026-11-16 收口），正文见 [roadmap 归档分片](./archive/roadmap-phases-77.md)、条目明细见 [待办事项归档](./todo-archive.md)、阶段结论见 [项目计划](./roadmap.md#第七十七阶段归档结论最近归档阶段)。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
