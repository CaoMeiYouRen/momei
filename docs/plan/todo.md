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

### 第五十阶段：PWA 启用与收口治理（1 新功能 + 4 优化）

> 背景：Phase 39-49 共 11 个阶段完成 5 个新功能 + 46 条治理优化。Phase 47-49 连续三阶段纯治理后，本阶段以「1 个新功能 + 4 个优化」组合重启新功能面。

- [x] **主线：PWA 功能开启 — Progressive Web App (P0)**
	- 执行范围：启用 `nuxt.config.ts` 中已注释的 `@vite-pwa/nuxt` 模块，配置 Service Worker + Web Manifest + 离线缓存策略。
	- 非目标：不做复杂的 Workbox 自定义路由、不做 Push Notification 集成。
	- 当前进度：已完成 (2026-06-14)。
	- 最小验收：PWA 可安装（manifest.json 生效）；Service Worker 注册成功；离线页面可访问。
	- 完成证据：`pnpm typecheck`=0, `pnpm lint`=0, `pnpm build` 成功生成 `sw.js` (41KB) + `manifest.webmanifest` (486B), 预缓存 607 条目 (7329.53 KiB)。

- [x] **主线：API 测试分层收敛 (P1)**
	- 执行范围：统一 `tests/server/api/` 与 `server/api/**/*.test.ts` 双轨目录，固化测试分层规则与目录归属。
	- 非目标：不重写现有测试内容、不移除测试覆盖。
	- 当前进度：已完成 (2026-06-14)。
	- 最小验收：输出分层规则文档；至少 3 组样板迁移落地。
	- 完成证据：输出 `docs/design/governance/api-test-layering.md`；4 组样板迁移 (`benefits/waitlist`, `friend-links/feed`, `ai/comment-translation`, `admin/external-feed/refresh` 去重)；`pnpm lint`=0, `pnpm typecheck`=0, `pnpm lint:md`=0, 定向测试 4 文件 8 tests passed；`docs/standards/testing.md` §3.2 强化禁止 co-located 规则。

- [x] **主线：i18n 首屏翻译稳定性治理 (P1)**
	- 执行范围：评估 `locale-modules.ts` 拆分加载链路，识别首屏 raw key 泄漏点；给出首屏关键路由加载命中矩阵与回退策略。
	- 非目标：不重写 i18n 加载架构。
	- 当前进度：已完成 (2026-06-14)。
	- 最小验收：输出首屏路由命中矩阵；至少修复 1 处 raw key 泄漏。
	- 完成证据：输出 `docs/design/governance/i18n-first-screen-hit-matrix.md`（17 路由命中矩阵 + fallbackChain 回退策略）；修复 3 处：`admin/posts/index.vue` + `admin/posts/[id].vue` 的 `void`→`await` 竞态修复 + `locale-modules.ts` 补充 `pages.enhanced_pack` 模块定义；`pnpm lint`=0, `pnpm typecheck`=0, `pnpm lint:md`=0。

- [x] **主线：backlog 深度清理 (P1)**
	- 执行范围：压缩「方向判断」中 Phase 29-41 逐段复述为简表；移除已完成的 `#3 未使用 API`、`#4 API Schema`、`#8 调研机制` 条目。
	- 非目标：不新增 backlog 条目。
	- 当前进度：已完成 (2026-06-14)。
	- 最小验收：方向判断段缩减 ≥50%；已上收项全部标记或移除。
	- 完成证据：`roadmap.md` Phase 32-41 段从 386 行压缩至 19 行简表（缩减 95%）；`backlog.md` 移除 #3/#4/#5/#8 四项已上收条目并标记归档来源，剩余条目重新编号 1-4；`pnpm lint:md`=0。

- [x] **主线：友链前后博客环导航 — 评估态 (P2)**
	- 执行范围：对友链页「前后博客环」功能做最小可行性评估：相邻友链排序逻辑、前后导航 UX、数据来源（现有 FriendLink 实体复用）。
	- 非目标：不在本阶段实现完整功能。
	- 当前进度：已完成 (2026-06-14)。
	- 最小验收：评估文档输出明确的 go/no-go 结论。
	- 完成证据：输出 `docs/design/governance/friend-link-ring-navigation-evaluation.md`，结论 **Go**（~4h 工作量）；排序复用 `sortOrder` 字段，导航方案 A（现有端点附加 prevId/nextId），零新增依赖。

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
