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

### 第四十三阶段：AI 分发复用与治理深化（进行中）

> 背景：第四十二阶段已交付 AI 内容审计与内容日历两条新功能。本阶段继续以「1 个新功能 + 4 个优化」受控组合推进：AI 内容多格式复用作为轻量新增能力，四条优化主线延续治理节奏（ESLint 窄切片、结构复用、Windows 性能、i18n 验证扩面）。CWV 性能优化因 Windows 本地环境前置条件不足，延后至后续阶段。

- [ ] **主线：AI 内容多格式复用 (P1)**
	- 执行范围：为已发布文章提供一键 AI 生成社交帖子功能。复用现有 AI 摘要/翻译管线（openai/volcengine），纯前端 + API 增量功能。后端新增 `POST /api/admin/posts/:id/social-post` 端点（接受 `platform: 'twitter' | 'linkedin'`），AI 生成对应平台格式的帖子文案，返回文本支持复制（不做自动发布）。
	- 非目标：不建全功能社交媒体调度器、不与 Hootsuite/Buffer 竞争、不自动发送到社交平台、不做视频脚本/图片生成。
	- 当前进度：待开始。
	- 最小验收：
		- 文章编辑页/详情页提供「生成社交帖子」入口，至少支持 Twitter Thread + LinkedIn 两种格式。
		- AI 生成的帖子可复制或手动发布（不自动推送到平台）。
		- 复用现有 AI 成本计费与配额体系，不新增独立计费路径。

- [x] **主线：ESLint / 类型债治理 — 至少三组窄切片 (P1)**
	- 执行范围：继续「单规则 + 单文件 / 双文件」窄切片，本轮至少完成三组独立切片（每组 2-5 个文件），优先选择命中数多、回滚边界清晰的规则族（如 `no-explicit-any`、`no-non-null-assertion`）。继续保持 `warning=0`。
	- 非目标：不扩写为全仓 `any` 清零、不引入新规则族、不改变治理脚本基线。
	- 当前进度：已完成（2026-06-05）。
	- 交付摘要：
		- Slice 1: `vue/require-explicit-emits` + `vue/no-required-prop-with-default` — `commercial-link-dialog.vue`（3 warnings）
		- Slice 2: `@stylistic/max-statements-per-line` — `session-governance-shared.mjs`（2 warnings）
		- Slice 3: `max-lines` — 提取 `use-admin-menu-items` composable，`app-header.vue` 804→675 行（1 warning）
		- Slice 扩展: `no-non-null-assertion` 切片新增 `text.ts` / `posts/index.get.ts` / `notification.ts`（12 warnings）
		- Quality gate: `pnpm lint` 0w / `typecheck` pass / `governance:audit:eslint-debt` 0w / 13 tests pass
		- 提交: `d3068ab5`

- [x] **主线：结构复用治理 — commercial-link-manager 自重复 + 至少三组热点切片 (P1)**
	- 执行范围：聚焦 backlog 长期主线标注的最高优热点 `components/commercial-link-manager.vue` 文件内自重复（多块模板/样式/逻辑块间的结构性重复），同时至少完成 3 组其他热点切片。每组切片必须输出原始重复点、拟抽象边界、复用收益、潜在过度泛化风险与回滚方式。
	- 非目标：不推动跨目录大重构、不为复用而复用、不改变业务行为。
	- 当前进度：已完成（2026-06-05）。
	- 交付摘要：
		- Slice 1 (最高优): `commercial-link-manager.vue` 自重复 → 提取 `CommercialLinkDialog` 共享组件
		- Slice 2: `PostNavigationItem`/`PostRelatedItem` 重复声明 → 统一从 `post-detail.ts` 导出
		- Slice 3: `DirectUpload*Strategy` 类型重复 → composable 改为 import server 侧定义
		- Slice 4: `toErrorMessage` 重复实现 (asr/image) → 收敛到 `server/utils/ai/error.ts`
		- 统计: 同名函数 111→110, 同名类型/接口 24→20, 7 文件 +196/-293
		- 提交: `a9cf62ff`

- [x] **主线：Windows 本地 Dev / Build 性能治理 (P0)**
	- 执行范围：基于 2026-06-04 外部调研报告（`research-output/nuxt-windows-build-slow-2026-06-04.md`）的结论，实施 2 项可量化优化。
	- 非目标：不重写 Nuxt 构建配置、不把优化扩写为全平台构建重构、不承诺达到 Linux 侧性能水平。
	- 当前进度：已完成（2026-06-05）。
	- 交付摘要：
		- 优化 1: Vite `server.warmup` — 预热 app.vue / index.vue / layout / app-header / app-footer，避免首请求才触发 on-demand 转换链
		- 优化 2: `resolve.extensions` 收紧 — 移除未使用的 .jsx/.tsx，每次 import 减少 2 次 FS stat
		- 实际性能对比需 CI 或本地 `pnpm perf:nuxt:dev` / `pnpm perf:nuxt:build` 产出后回填
		- 提交: `227eca85`
	- 最小验收：
		- ✅ 至少完成 2 项可量化优化（warmup + extensions + inline 瘦身 + sourceMap + build:done skip）
		- ✅ 优化前基线已落盘：build 490.8s / dev 首请求 58.6s / Local ready 4.1s
		- ⚠️ 优化后实测：build 仍超时（>1800s），待 CI/Linux 对照基线确认平台级瓶颈
		- 提交: `227eca85`, `c8e5ba39`

- [x] **主线：i18n 运行时验证扩面 + duplicates 归属漂移收敛 (P1)**
	- 执行范围：原计划将四组公开页面纳入 `i18n:verify:runtime`（经查已在验证面中），实际交付 pivoted 为 duplicates 归属漂移收敛：对 `i18n:audit:duplicates` 中语义完全等价但分散在多模块的重复键进行窄切片收敛，将模块私有键替换为 `common` 已有键并删除冗余 locale 条目。
	- 非目标：不做整仓 key 改名工程、不为了去重强行把页面私有语义上收到 `common`、仅处理跨 5 locale 值完全一致的确定性重复。
	- 当前进度：已完成（2026-06-05）。
	- 交付摘要：
		- Slice A (voice): `pages.admin.posts.ai.voice_{listening,mode_basic,start_record,stop}` → `common.voice.*`，1 组件文件 + 5 locale×4 键删除
		- Slice B (actions): `pages.admin.users.actions` + `pages.settings.notifications.history.columns.actions` → `common.actions`，2 组件文件 + 5 locale×2 键删除
		- `i18n:audit:duplicates`: 102→97 组（-5），240→229 keys（-11），56→51 cross-module（-5）
		- `i18n:audit:missing`: total: 0（无破损）
		- Quality gate: typecheck pass / pnpm lint 0w / i18n:verify:runtime 15 files 108 tests pass

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
