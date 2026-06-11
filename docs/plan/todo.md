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

### 第四十七阶段：接口契约与路由治理深化（0 新功能 + 6 优化）

> 阶段目标：不新增功能面，聚焦治理与收敛；优先降低维护成本、契约漂移与路由认知负担。

1. [x] **ESLint / 类型债继续治理（窄切片）**
	 - 验收标准:
		 - 至少完成 `3 - 5` 条高 ROI 规则切片；
		 - 每条切片均包含命中清单、回滚边界与最小验证矩阵；
		 - 目标切片 lint/typecheck 稳定通过。
	 - 当前进度：已完成一轮切片（2026-06-08）。
	 - 交付摘要：收敛 6 处生产代码 `as any`（link.ts + translation.ts ×4 + email/i18n.ts），eslint-disable 总量维持 13 处；`pnpm lint` + `pnpm typecheck` through。

2. [x] **结构复用治理继续推进（重复代码/类型/纯函数）**
	 - 验收标准:
		 - 至少完成 `3 - 5` 组高收益复用切片；
		 - `pnpm duplicate-code:check` 基线不反弹；
		 - 每组切片输出收益与未覆盖边界。
	 - 当前进度：已完成一轮切片（2026-06-11）。
	 - 交付摘要：FeedItem（page+service→shared types）、TitleSuggestionOverlayRef（composable→composable）、FeedItem service→types 三组类型收敛；同名 type/interface 候选 17→14 (-3)；lint + typecheck through。

3. [x] **页面与 API 路径规范化治理**
	 - 验收标准:
		 - 输出页面路径 ↔ API 路径映射清单；
		 - 冻结统一命名/分层规则与迁移优先级；
		 - 至少完成 `3` 组高频模块样板验证。
	 - 当前进度：已完成（2026-06-11）。
	 - 交付摘要：
		 - 治理文档: `docs/design/governance/route-api-path-governance.md`（46 page ↔ ~120 api 全量映射 + 5 项不一致清单 + 4 页面规则 + 4 API 规则 + 3 样板验证）
		 - P0 修复: `calendar.vue` + `marketing.vue` → `index.vue` 目录模式（统一 2 处平面文件风格）
		 - 提交: `102b107b`

4. [x] **`pages/admin` 路由文件风格统一**
	 - 验收标准:
		 - 明确单一主规范与例外条件；
		 - 形成分批迁移计划；
		 - 首批样板迁移后路由行为无回归。
	 - 当前进度：已完成（2026-06-11）。
	 - 规则: 第一级强制目录（`<name>/index.vue`），第二级允许平铺。
	 - 迁移: `calendar.vue` + `marketing.vue` → `index.vue`（2 处，其余已符合）。
	 - 提交: `102b107b`, `4f6686a6`

5. [ ] **未使用 API 清单与清理可行性评估**
	 - 验收标准:
		 - 产出端点级清单与证据来源（调用链/日志/测试引用）；
		 - 完成“可删除/观察/保留兼容”三档分流；
		 - 至少形成一组可安全下线候选与回滚锚点。

6. [ ] **API Schema 覆盖与复用治理**
	 - 验收标准:
		 - 给出覆盖率分层（完整/部分/缺失）；
		 - 产出可共享 schema 候选清单；
		 - 至少完成 `3` 组 schema 复用样板。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
