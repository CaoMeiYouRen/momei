# 墨梅博客 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

---

## 当前待办
> 开始进行待办时，在本区域填写正在进行的待办，结束后清理并更新对应条目状态。

> 阶段状态: 第三十一、第三十二阶段已完成审计归档。第三十三阶段正式上收，继续将测试覆盖率推进至 `80%+`（冲刺目标）。`存量代码注释治理与注释漂移收敛` 已正式上收为候选组 B 切片。

> 当前进行中: 第三十三阶段 —「1 个新功能 + 4 个优化」。新功能：创作者数据统计增强；优化：coverage `80%+` 冲刺、ESLint `composables` 子桶继续收紧、重复代码认证页模板收敛、注释治理候选组 B。

### 第三十三阶段：创作者统计与质量冲刺

- [x] ~~**创作者数据统计增强 (P1)**~~ → 已完成
	- 闭合记录（2026-05-03）: 专项设计文档已冻结三项前置结论并通过两轮 Review Gate。`GET /api/admin/creator-stats` 已落地，支持 `?range=7|30|90` 窗口过滤、`?authorId=` 权限隔离。发文趋势按 7d→天、30d→周、90d→月 聚合；分发成功率从 `Post.metadata` JSONB TypeScript 端提取并按周分桶。后台 `/admin` 新增「创作者统计」Tab，展示产出卡片（已发布/草稿/WechatSync 成功率/Hexo 同步成功率）与趋势列表。31 条定向测试 + typecheck + lint 全部通过，i18n 五语完整。
	- 验证: `pnpm exec vitest run server/utils/creator-stats.test.ts server/api/admin/creator-stats.get.test.ts components/admin/dashboard/creator-metric-card.test.ts`（31 passed）、`pnpm exec nuxt typecheck`、`pnpm i18n:audit:missing`（total: 0）。

- [x] ~~**测试覆盖率冲刺 80%+ (P0)**~~ → 阶段收口（75.8%，80%+ 顺延至下一阶段）
	- 闭合记录（2026-05-03）: 本阶段新增 38 条定向测试（creator-stats 工具层 16、API 9、creator-metric-card 7、auth-card 6），全量测试从 3366→3366（3 个回归失败的测试已修复）。当前基线 **Lines 75.8% / Statements 75.67%**。80%+ 仍需约 1112 行，相当于 20-30 个新测试文件，超出单一阶段覆盖冲刺容量，顺延至 Phase 34。
	- 验证: `pnpm test:coverage` Lines 75.8%、`pnpm exec nuxt typecheck`、`pnpm exec eslint --max-warnings 0`。

- [x] ~~**ESLint / 类型债 composables 子桶继续收紧 (P1)**~~ → 已完成（回退为 no-explicit-any 切片）
	- 闭合记录（2026-05-03）: `composables/` 生产源码 `no-non-null-assertion` 命中 0（已在 Phase 31 清零），46 个命中全在测试文件。按回退策略切换为 `no-explicit-any` 单文件切片，收敛 `use-ad-injection.ts` 中 3 处 `Record<string, any>` → `Record<string, unknown>`。
	- 验证: `pnpm exec eslint composables/use-ad-injection.ts --rule '{"@typescript-eslint/no-explicit-any":"error"}' --max-warnings 0`、`pnpm exec nuxt typecheck`。

- [x] ~~**重复代码 — 公开认证页模板收敛 + 追加切片 (P1)**~~ → 已完成（三轮收敛）
	- 闭合记录（2026-05-03）:
		- **首轮（auth-card）**: 提取 `components/auth-card.vue` 共享认证壳组件，消除 `forgot-password.vue` 与 `reset-password.vue` 的重复 CSS + 模板头部（-16 dup lines）。
		- **次轮（taxonomy-page）**: 提取 `components/taxonomy-post-page.vue` 统一 `categories/[slug].vue` 与 `tags/[slug].vue` 的模板/脚本/CSS（-1 clone, -47 dup lines）。
		- **三轮（voice-overlay）**: 提取 `styles/voice-popover.scss` 共享 CSS，收敛 `app-voice-input-overlay.vue` 与 `post-editor-voice-overlay.vue`（-1 clone, -59 dup lines）。
		- **累计**: `33 clones / 681 lines / 0.57%` → `31 clones / 575 lines / 0.48%`（-2 clones, -106 dup lines, ↓0.09%）。
	- 验证: 每轮 `pnpm duplicate-code:check` Pass，`pnpm exec eslint` `--max-warnings 0`，`pnpm exec nuxt typecheck`。

- [x] ~~**存量代码注释治理 — 候选组 B (P1)**~~ → 已完成
	- 闭合记录（2026-05-03）:
		- `server/services/upload.ts`: 新增 11 处 JSDoc（`UploadSettings` / `UploadStorageContext` 设计意图、`normalizePrefix` / `getSettingValue` / `getNumericLimit` / `getAssetObjectPrefix` / `resolveUploadPublicBaseUrl` 优先级链、`normalizeStorageType` vercel-blob 映射原因、`sanitizeUploadBasename` 安全意图、`buildUploadStoredFilename` 格式契约、`isAllowedUploadFileType` 匹配规则矩阵、`validateUploadPayload` / `buildUploadObjectKey` / `getUploadStorageContext` env 分层模式）；移除 1 处被 JSDoc 吸收的冗余行内注释。
		- `server/utils/post-access.ts`: 新增 `rethrowPostAccessError` JSDoc（错误转换链）；补充 `applyPostVisibilityFilter` 中 `any` 类型说明（Better-Auth 外部契约）；移除 1 处从行内提升到 JSDoc 的重复注释。
	- 验证: `pnpm exec eslint` `--max-warnings 0`、`pnpm exec nuxt typecheck`、`server/utils/post-access.test.ts` 全部通过。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

