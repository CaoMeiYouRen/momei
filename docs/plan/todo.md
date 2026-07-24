# 墨梅博客 待办事项 （Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事（ (To）o) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 （Todo）
- [x] 已完成 （Done）
- [-] 已取消 （Cancelled）

---

## 第五十九阶段：AI 编辑增强与展示优化（已审计归档）

> 执行时间: 2026-07-22 ~ 2026-07-23（2 天，密集交付）
> 本阶段已审计归档，详细记录见 [待办归档](./todo-archive.md#第五十九阶段ai-编辑增强与展示优化-已审计归档)。

---

## 第六十阶段：编辑器延续与代码质量治理（已审计归档）

> 执行时间: 2026-07-23 ~ 2026-07-24（2 天，密集交付）
> 本阶段已审计归档，详细记录见 [待办归档](./todo-archive.md#第六十阶段编辑器延续与代码质量治理-已审计归档)。

---

## 第六十一阶段：AI 编辑增强扩展与治理延续

> 执行时间: 2026-07-24 ~ 约 3-4 天
> 详细规划: [项目计划 - 第六十一阶段](./roadmap.md#第六十一阶段ai-编辑增强扩展与治理延续phase-61-ai-editing-enhancement-extension--governance-continuation)

### P2 — AI 编辑增强：扩写+缩写（候选 #9 子功能）

- [x] 后端：新增 `/api/ai/expand` 端点（`TextService.expandContent()` + `AI_PROMPTS.EXPAND` 模板）
- [x] 后端：新增 `/api/ai/condense` 端点（`TextService.condenseContent()` + `AI_PROMPTS.CONDENSE` 模板）
- [x] 前端：编辑器工具栏新增"扩写"按钮（`#ai-expand-btn`），选中文本后调用 expand API，支持 Ctrl+Z 撤销
- [x] 前端：编辑器工具栏新增"缩写"按钮（`#ai-condense-btn`），选中文本后调用 condense API，支持 Ctrl+Z 撤销
- [x] 计费：复用 AI 计费和额度管理，支持 expand/condense 操作类型（`recordTask({ type: 'expand' })` / `recordTask({ type: 'condense' })`）
- [x] 提示词模板：在 `AI_PROMPTS` 中新增 `EXPAND` / `CONDENSE` 模板，支持中英文
- [x] 验证：`pnpm typecheck` ✅ + `pnpm lint` ✅ + `pnpm test` ✅（49/49 AI 测试通过）
- [x] 审计 (A)：`code-quality-auditor` Review Gate Pass（证据见 `artifacts/review-gate/2026-07-24-ai-expand-condense.md`）

### P1 — 结构复用治理：CLI 包类型收敛 + 工具函数抽取（长期主线 #3）

- [x] 切片 1：`MomeiPostStatus`/`MomeiPostVisibility` → 从 `PostStatus`/`PostVisibility` 枚举派生（自包含枚举，Phase 58 已完成）
- [x] 切片 2：`MomeiPostScaffoldMetadata` → `PostScaffoldMetadata` 类型别名（保留向后兼容 + `@deprecated` 标记，Phase 58 已完成）
- [x] 切片 3：`toDateOrNull`/`toDateOrUndefined` → 已抽取到 `server/utils/date.ts`（2 个 ad campaigns 文件改为导入共享函数）
- [x] 验证：`pnpm typecheck` ✅ + `pnpm lint` ✅ + `pnpm test` ✅（注：api-client 为独立发布包，不应反向依赖主项目类型）

### P1 — 响应式状态模型收敛：reactive→ref Step 2（候选 #14）

- [x] 识别 Step 2 目标文件清单：后台列表页筛选/分页/排序/弹窗类 `reactive` 对象（`use-admin-friend-links-page.ts`、`use-admin-list.ts`、`pages/admin/users/index.vue` 等）
- [x] 逐文件迁移：`reactive({...})` → `ref<{...}>()`，补齐 `.value` 读取路径（≥5 处迁移，实际 9 处）
- [x] 同步调整 composable 返回值类型约束（`Ref<F>` + 移除 `reactive` 导入）
- [x] 定向验证：受影响页面的筛选/分页/弹窗/排序行为不回退（30 tests pass）
- [x] 验证：`pnpm typecheck` + `pnpm lint` 通过

### P2 — 测试覆盖率 90%+ 第三批（长期主线 #1）

- [ ] 基于 Phase 60 最新全仓覆盖率缺口报告，选择下一批高价值覆盖缺口模块（如 `server/services/` 层、`server/utils/` 层）
- [ ] 补高价值缺口覆盖度，推进全仓 coverage +1%-2%
- [ ] 验证：`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过

### P2 — Zod Schema 复用治理第二批（候选 #18）

- [x] 移除 Category/Tag `updateSchema` 中不必要的 `.extend({slug})`（`.partial()` 已覆盖）
- [x] 将 Post 的 `createdAt`/`publishedAt`/`updatedAt`/`views` 4 字段抽取为共享对象
- [x] 为 Marketing Campaign 创建 `marketingCampaignUpdateSchema`（不含默认值，避免局部更新重置字段）
- [x] 更新 PUT 端点使用 `marketingCampaignUpdateSchema`，添加字段级 `!== undefined` 守卫
- [x] 验证：`pnpm typecheck` ✅ + `pnpm lint` ✅ + 139/139 schema 定向测试通过 ✅ + Audit Pass ✅

---

## 阶段收口检查清单

- [ ] `todo.md` 当前阶段条目全部完成
- [ ] `roadmap.md` 同步阶段状态与收口结论
- [ ] 多语路线图摘要更新（`docs/i18n/*/plan/roadmap.md`）
- [ ] `pnpm typecheck` + `pnpm lint` 通过
- [ ] `pnpm test` + `pnpm test:coverage` 通过
- [ ] `pnpm docs:build` 通过
- [ ] Code Auditor Review Gate 通过
- [ ] 归档记录写入 `todo-archive.md`

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
