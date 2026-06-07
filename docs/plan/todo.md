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

### 第四十五阶段：隐私闭环与文档治理（进行中）

> 背景：第四十四阶段完成友链 RSS 聚合、分析评估与四条优化后，本阶段以「1 个新功能 + 1 个评估 + 3 个优化」组合推进：Umami 隐私分析作为 Phase 44 评估的落地实现，Digital Garden 为探索评估态，三条优化主线延续治理节奏（文档治理、ESLint/类型债、结构复用）。

- [ ] **主线：Umami 隐私自托管分析集成 — Phase 1 核心 (P0)**
	- 执行范围：基于 Phase 44 评估结论和 `docs/design/governance/privacy-analytics-evaluation.md` 实施路线 Phase 1，完成：Schema（`SettingKey.UMAMI_ANALYTICS` + env mapping）、Nuxt 客户端插件（`plugins/umami-analytics.client.ts`）、后台设置页（`analytics-settings.vue` 新增输入框 + 锁定逻辑）、5 locale i18n 翻译、`server/api/settings/public.get.ts` 公开字段。
	- 非目标：不在本阶段完成 Docker 部署模板（Phase 2）、不替换现有 GA4/Clarity/百度统计。
	- 当前进度：实现已完成并通过 lint/typecheck/定向测试；待补充 V3 浏览器验证证据后关闭。
	- 最小验收：
		- 后台设置页可配置 Umami Website ID + Script URL。
		- 公开页面注入正确 Umami 追踪脚本。
		- 与现有 GA4/Clarity/百度统计可独立开关。

- [ ] **主线：Digital Garden / 知识花园探索评估 (P1)**
	- 执行范围：对 backlog #10「Digital Garden / 知识花园模式」进行 go/no-go 评估，覆盖：双向链接存储模型（JSON 字段 vs 关联表）现有文章体量下的性能影响预估、非时序导航对现有路由 / 信息架构的侵入度、知识图谱可视化的前端依赖与 bundle 增量。产出评估文档 `docs/design/governance/digital-garden-evaluation.md`。
	- 非目标：不在本阶段实施双向链接、内容成熟度标记或知识图谱可视化。
	- 当前进度：评估已完成，结论为 No-Go（当前阶段不进入实现，保留后续 P2 候选）；评估文档已落盘。
	- 最小验收：
		- 评估文档输出明确的 go/no-go 结论。
		- 至少覆盖存储模型、性能影响、前端依赖三个维度。

- [ ] **主线：文档治理收口 (P1)**
	- 执行范围：
		- `docs/design/governance/` 清理过期文档（Phase 规划稿 5 份 + 已完成评估 7 份 + 已完成工程 6 份 + Phase 44 报告 1 份 → 共 ~19 份归档至 `archive/`）
		- `docs/standards/performance.md` Section 11「优化历史」迁出至 `docs/reports/performance-optimization-log.md`
		- `docs/plan/backlog.md` 清理已完成条目（#12 Blogroll 删除 + `#9` 状态更新 + Phase 44 方向描述改写 + `#8` 调研机制移除/合并）
	- 非目标：不做新文档创建、不做翻译同步（延至阶段收口时统一执行）。
	- 当前进度：待开始。
	- 最小验收：
		- governance/ 文档从 45 份缩减到 ~25 份。
		- performance.md 恢复纯规范定位（无时间线记录）。
		- backlog.md 无 Phase 44 残留引用。

- [ ] **主线：ESLint / 类型债 — 继续窄切片 (P1)**
	- 执行范围：继续「单规则 + 单文件 / 双文件」窄切片，至少完成两轮：清理 `require-await` 2 处（`feed.get.test.ts`）；继续 `no-explicit-any` 在 `server/services/ai/openai-provider.ts` 子桶收敛 1 桶。
	- 非目标：不做全仓 `any` 清零、不改变治理脚本基线。
	- 当前进度：待开始。
	- 最小验收：
		- eslint-disable 总量从 15 降至 ≤13。
		- 生产代码新增 any 清零至少 3 处。

- [ ] **主线：结构复用治理 — 继续收敛 (P1)**
	- 执行范围：在 Phase 44 两组切片基础上继续收敛，聚焦 `pages/categories/[slug].vue` vs `pages/tags/[slug].vue` 的公共模板片段，以及 `server/utils/` 下近似工具函数的抽取。每组切片必须输出原始重复点、拟抽象边界、复用收益。
	- 非目标：不推动跨目录大重构、不为复用而复用。
	- 当前进度：待开始。
	- 最小验收：
		- 至少两组热点切片完成。
		- `pnpm duplicate-code:check` 基线不反弹。

> **阶段收口时统一处理**: 文档归档治理（regression/current 与 todo-archive 滚动归档）延至本阶段结束时作为收口动作执行，不占用独立待办条目。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
