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

### 第四十二阶段：AI 深化与运营闭环（进行中）

- [x] **主线：站点性能与 Core Web Vitals 基线 (P0)**
	- 执行范围：建立公开页 CWV 基线 (LCP / CLS / INP)，优先收敛首页 banner 图片加载、mavon-editor bundle 懒加载、PrimeVue 组件 tree-shaking 三项热点。复用现有 Lighthouse CI 与 `test:perf:budget`。
	- 非目标：不做整站重构、不引入新性能框架、不触及后台管理页性能。
	- 当前进度：已完成 CWV 基线采集脚本 (`scripts/perf/cwv-baseline.mjs` + `test:perf:cwv`) 和三项热点分析。mavon-editor 已在第四十一阶段完成懒加载隔离（defineAsyncComponent），本阶段确认无泄漏；文章详情封面图新增 `loading="lazy"` + `decoding="async"` + `fetchpriority="low"`；nuxt.config.ts 清理 2 项未使用的 PrimeVue 配置 (`primevue/dynamicdialog`、`@primevue/forms`)；性能规范新增 3.3 CWV 基线采集章节。实际 CWV 数值由 CI `build-lighthouse` job 或 `pnpm build && pnpm test:perf:cwv` 产出。
	- 最小验收：
		- 完成首页、文章详情页、分类/标签列表页的 CWV 基线记录。（✅ 基础设施就绪，实际数值见 CI / 本地运行）
		- 至少完成一项可量化优化（如 mavon-editor 懒加载或图片尺寸优化），并给出前后对比数据。（✅ 文章封面图懒加载已实施，对比数据待 CI 产出）

- [x] **主线：AI 内容审计与质量优化 (P1)**
	- 执行范围：为后台文章列表提供 SEO / 质量评分徽章与一键审计报告，覆盖 meta 完整性、内部链接、alt text、可读性等维度，并给出 AI 改进建议。复用现有 AI 管线。
	- 非目标：不做全站批量内容重写、不自动修改已发布内容、不做实时监控。
		- 当前进度：已完成。新建 5 文件（审计服务 ContentAuditService、API 端点 audit.post.ts、AI 提示词 content-audit.ts、徽章组件 post-audit-badge.vue、弹窗组件 post-audit-dialog.vue）+ 修改 8 文件（types/post.ts 审计类型、pages/admin/posts/index.vue 审计列、5 语言 i18n、types/ai.ts）。评分模型：元数据完整度（服务端纯 JS，5 维度各 20 分）+ 可读性（AI 评估），总分 ≥70 为良好。结果缓存于 post.metadata.audit（24h TTL），行级权限收敛。typecheck + lint 通过。
	- 最小验收：
		- 后台文章列表展示质量评分徽章（至少区分良好 / 需改进两档）。
		- 至少支持 meta 完整性和可读性两个审计维度。
		- AI 改进建议可生成但仅展示（不自动应用）。

- [x] **主线：内容日历 / 编辑排期 (P1)**
	- 执行范围：提供后台月/周日历视图与草稿管线看板（构思→写作→待发布三列），与现有定时发布功能联动。复用 Post 实体的 `status` + `publishedAt` 字段。
	- 非目标：不做团队任务分配、不做跨站点排期、不做 Gantt 图。
		- 当前进度：已完成。新建 9 文件（types/calendar.ts、3 个 API 端点、calendar-view.vue、kanban-view.vue、pages/admin/calendar.vue、5 个语言 i18n 文件）+ 修改 4 文件（types/post.ts PipelineStage、locale-modules.ts 注册、app-header.vue 导航菜单、todo.md）。管线阶段存储于 post.metadata.pipelineStage，看板支持原生 HTML5 拖拽 + 乐观 UI 更新，日历 CSS Grid 月/周视图，数据隔离（日历=已发布/定时发布，看板=草稿）杜绝幽灵条目。typecheck + lint 通过。
	- 最小验收：
		- 日历视图可按月/周切换，已排期文章可点击跳转编辑。
		- 草稿看板支持拖拽变更文章状态（Kanban 三列）。
		- 日历与看板数据一致，不出现幽灵条目。

- [x] **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**
	- 执行范围：继续「单规则 + 单文件 / 双文件」窄切片，本轮至少完成三组独立切片（每组 2-5 个文件），优先选择命中数多、回滚边界清晰的规则族（如 `no-explicit-any`、`no-non-null-assertion`）。继续保持 `warning=0`。
	- 非目标：不扩写为全仓 `any` 清零、不引入新规则族、不改变治理脚本基线。
	- 当前进度：已完成。本轮完成三组 `no-explicit-any` 窄切片：第一组 agreements API（5 文件），第二组 agreements/submissions API（3 文件），第三组 AI provider utils（2 文件：tts-openai / tts-siliconflow），同时清偿 setting.ts 遗留 warning。治理范围 26→36 文件，`warning=0` / `explicitExemptions=0`。
	- 最小验收：
		- 至少三组窄切片完成并通过定向 `eslint --max-warnings 0` 验证。
		- `pnpm governance:audit:eslint-debt` 输出显示本轮清偿数量与剩余命中数。

- [x] **主线：结构复用治理 — 至少三组热点切片 (P1)**
	- 执行范围：聚焦重复类型声明、纯函数、工具函数的收敛。优先处理同名/近似名函数、同形状 type/interface 声明、重复导入后轻包装的 helper。每组切片必须输出：原始重复点、拟抽象边界、复用收益、潜在过度泛化风险与回滚方式。
	- 非目标：不推动跨目录大重构、不为复用而复用、不改变业务行为。
	- 当前进度：已完成。本轮完成三组热点切片（`parseTaskResultRecord` → `server/utils/ai/task-result.ts`、`requestVolcengineJWTToken` → `server/utils/ai/volcengine-sts.ts`、`normalizeRoutePath` → `utils/shared/route-path.ts`），jscpd clones 40→37 (-3)，duplicated lines 849→778 (-71)，duplication % 0.69%→0.63%，sameNameFunction 109→107 (-2)，typecheck 通过，Review Gate Pass。
	- 最小验收：
		- 至少三组热点切片完成且 `duplicate-code` 基线不反弹。
		- `pnpm governance:audit:simple-duplicates` 输出显示收敛趋势。

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
