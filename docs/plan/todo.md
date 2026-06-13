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

### 第四十八阶段：深度治理与清理收口（0 新功能 + 5 优化）

> 背景：第四十七阶段完成 6 条治理优化后，本阶段继续以「0 新功能 + 5 个优化」组合深化治理：ESLint/类型债扩展、结构复用深度收敛、API Schema 全量覆盖、未使用 API 弃用删除、第二轮闲置端点调研。

- [x] **主线：ESLint / 类型债 — 窄切片扩展 ≥5 模块 (P0)**
	- 执行范围：`seed-demo.ts`（6 处 `as any` → `PostStatus`）、`typeorm-adapter.ts`（2 处窄类型）、`translation.ts` 残留、`use-tts-volcengine-direct.ts` 拆分、`server/services/ai/` 子桶收敛。
	- 非目标：不做全仓 any 清零。
	- 当前进度：已完成（2026-06-13）。
	- 交付摘要：seed-demo 6 处 + translation 1 残留 + typeorm-adapter 2 处 = 9 处 `as any` 清零（≥4 达标）；eslint-disable 全部为合法内容渲染用例，本轮无额外减少。

- [x] **主线：结构复用 — 类型/函数深度收敛 ≥5 切片 (P0)**
	- 执行范围：`AdminAiPageEvent`、`DemoTourStage`、`VolcengineResponsePacket`、`AuthBoundaryLocale` 四组类型统一 + `formatDate` 多处统一为 `useI18nDate().formatDate`。
	- 非目标：不推动跨目录大重构。
	- 当前进度：已完成 3 组切片（2026-06-13）。
	- 交付摘要：DemoTourStage（demo-banner→use-onboarding）、AdminAiPageEvent（task-list→use-admin-ai-page）、ASRDirectOptions（use-asr-direct→types/asr）；同名 type/interface 15→12（≤12 达标）；VolcengineResponsePacket/AuthBoundaryLocale 确认为不同定义/已统一；formatDate 多处统一延至后续。

- [ ] **主线：API Schema 全面覆盖 — partial→full + 测试 (P0)**
	- 执行范围：external-links/snippets/theme-configs/marketing/link-governance 共 ≥8 端点补 Zod schema；每个补全端点追加测试用例。
	- 非目标：不重写已有 schema、不补 calendar 模块。
	- 当前进度：待开始。
	- 最小验收：POST/PUT 无 schema 端点从 27 降至 ≤19；新增 ≥8 个 schema 测试用例。

- [ ] **主线：未使用 API 弃用标记 + 安全删除 (P0)**
	- 执行范围：7 个零引用端点标记 `@deprecated` → 删除文件 → git revert 回滚锚点。
	- 非目标：不删除有测试覆盖的端点。
	- 当前进度：待开始。
	- 最小验收：7 个端点全部删除；`pnpm lint` + `pnpm typecheck` 通过。

- [ ] **主线：第二轮未使用 API 扩大调研 (P1)**
	- 执行范围：`subscriptions`、`waitlist/export`、`scaffold-to-post`、`versions/restore` 三层验证 + git 历史分析。
	- 非目标：不在本阶段删除未确认端点。
	- 当前进度：待开始。
	- 最小验收：输出第二轮评估结果（≥4 端点分析）。

> **阶段收口时统一处理**: 文档归档治理延至本阶段结束时执行。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
