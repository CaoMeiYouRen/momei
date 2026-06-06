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

### 第四十四阶段：友链生态与性能闭环（进行中）

> 背景：第四十三阶段完成 AI 多格式复用与四条治理优化后，本阶段以「1 个新功能 + 1 个评估 + 3 个优化」组合推进：友链 RSS 聚合作为轻量新增能力，隐私自托管分析为评估态不进入实现，三条优化主线延续治理节奏（ESLint、结构复用、CWV 性能）。

- [ ] **主线：友链 RSS 聚合 — Blogroll Feed (P1)**
	- 执行范围：为友链页面增加「最近更新」RSS 聚合摘要。后端新增 `server/services/friend-link-feed.ts`（读取友链站点的 RSS/Atom Feed，解析标题 + 链接 + 日期），前端友链页新增「最近更新」卡片区域展示最近 N 条聚合摘要。抓取结果缓存于 Redis（TTL 可配，默认 1 小时），避免每次请求都抓取。复用现有 `FriendLink` 实体与友链管理页面。
	- 非目标：不建 RSS 阅读器、不建内容聚合平台、不做全文索引、不替换现有友链系统。
	- 当前进度：待开始。
	- 最小验收：
		- 友链页面展示至少一个友链站点的最近更新摘要（标题 + 链接 + 日期）。
		- RSS 抓取带缓存，重复请求不触发重复抓取。
		- 抓取失败时优雅降级（显示「暂无更新」而非报错）。

- [ ] **主线：隐私优先自托管分析集成 — 评估态 (P1)**
	- 执行范围：对 Umami 的 Docker 部署方案进行评估，输出 go/no-go 结论。评估维度包括：Docker 资源开销（CPU / RAM / 磁盘）、与现有 PostgreSQL 中间件的兼容性、与现有 GA4/Clarity/百度统计的并存策略、后台设置页 tracking script 注入的接入复杂度。产出评估文档 `docs/design/governance/privacy-analytics-evaluation.md`。
	- 非目标：不在本阶段实施 Umami 部署、不自建分析引擎、不替换现有 GA4/Clarity。
	- 当前进度：待开始。
	- 最小验收：
		- 评估文档输出明确的 go/no-go 结论。
		- 至少覆盖资源开销、兼容性、接入复杂度三个维度。

- [x] **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**
	- 执行范围：继续「单规则 + 单文件 / 双文件」窄切片，本轮至少完成三组独立切片（每组 2-5 个文件），优先选择命中数多、回滚边界清晰的规则族（如 `no-explicit-any`、`no-non-null-assertion`）。继续保持 `warning=0`。
	- 非目标：不扩写为全仓 `any` 清零、不引入新规则族、不改变治理脚本基线。
	- 当前进度：已完成（2026-06-06）。
	- 交付摘要：
		- Slice 1 (no-non-null-assertion): import-path-alias.ts + quota-governance.ts + post-distribution.ts (5 处 ! 清零)
		- Slice 2 (no-explicit-any): gemini-provider.ts ({} as any → typed accumulator)
		- Slice 3: server/services/*.ts non-null assertions 全清零
		- typecheck pass, 4 文件 +10/-6
		- 提交: `28e171f8`

- [x] **主线：结构复用治理 — 至少两组热点切片 (P1)**
	- 执行范围：在 Phase 43 四组切片基础上继续收敛，聚焦重复类型声明、纯函数、工具函数。优先处理同名/近似名函数、同形状 type/interface 声明等热点。每组切片必须输出原始重复点、拟抽象边界、复用收益、回滚方式。
	- 非目标：不推动跨目录大重构、不为复用而复用、不改变业务行为。
	- 当前进度：已完成（2026-06-06）。
	- 交付摘要：
		- Slice 1: `SettingFieldMetadata` — 4 组件文件统一 import `types/setting.ts`（ai-cost-factors / ai-alert-thresholds / ai-quota-policies / setting-form-field）
		- Slice 2: `AgreementFormData` — `agreement-edit-dialog.vue` export → `agreements-settings.vue` import
		- 统计: 同名类型/接口 20→18 (-2)，6 文件 +6/-28，typecheck + lint pass
		- 提交: `249eb90a`

- [ ] **主线：CWV 性能优化 — 至少一项可量化优化 (P0)**
	- 执行范围：基于 Phase 42 建立的 CWV 基线，借助 CI（Linux）环境验证，至少完成一项可量化优化。优先从：首屏关键 CSS 内联、非关键 JS 延迟加载、图片格式优化（WebP/AVIF）中选择。用 Lighthouse CI `pnpm test:perf:cwv` 产出前后对比数据。
	- 非目标：不做整站重构、不引入新性能框架、不触及后台管理页性能。
	- 当前进度：待开始。
	- 最小验收：
		- 至少完成一项可量化优化且 LCP / CLS / TBT 中至少一项有可测量改善。
		- 优化前后对比数据记录到 `performance.md` 对应章节。

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
