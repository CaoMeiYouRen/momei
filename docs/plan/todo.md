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

- [ ] **测试覆盖率冲刺 80%+ (P0)**
	- 范围: 从 `~76%+` 基线继续提升，优先认证流边角分支、raw key 暴露、热点公开读链路失败路径、新增 creator-stats API 的失败断言。
	- 收口线: `>= 78%`（`80%+` 为冲刺目标）。

- [x] ~~**ESLint / 类型债 composables 子桶继续收紧 (P1)**~~ → 已完成（回退为 no-explicit-any 切片）
	- 闭合记录（2026-05-03）: `composables/` 生产源码 `no-non-null-assertion` 命中 0（已在 Phase 31 清零），46 个命中全在测试文件。按回退策略切换为 `no-explicit-any` 单文件切片，收敛 `use-ad-injection.ts` 中 3 处 `Record<string, any>` → `Record<string, unknown>`。
	- 验证: `pnpm exec eslint composables/use-ad-injection.ts --rule '{"@typescript-eslint/no-explicit-any":"error"}' --max-warnings 0`、`pnpm exec nuxt typecheck`。

- [ ] **重复代码 — 公开认证页模板收敛 (P1)**
	- 范围: `forgot-password.vue` vs `reset-password.vue` 的公共模板片段与表单逻辑下沉。
	- 基线: `pnpm duplicate-code:check` 不反弹（当前 `32 clones / 0.59%`）。

- [ ] **存量代码注释治理 — 候选组 B (P1)**
	- 范围: `server/services/upload.ts` + `server/utils/post-access.ts` 两条安全敏感链路。
	- 同步清理失效旧注释，完成 Review Gate 复核。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

