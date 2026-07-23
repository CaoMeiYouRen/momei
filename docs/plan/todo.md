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

## 第五十九阶段：AI 编辑增强与展示优化

> 执行时间: 2026-07-22 ~ 约 3-5 天
> 详细规划: [项目计划 - 第五十九阶段](./roadmap.md#第五十九阶段ai-编辑增强与展示优化ai-editing-enhancement--display-optimization)

### P0 — Demo Banner 暗色模式修复

- [x] `components/demo-banner.vue` 暗色模式下 `.demo-banner__stage` 透明度修复（`rgba(#f1f5f9, 0.82)` → `#f1f5f9`）
- [x] 同样处理 `.demo-banner__text` 透明度（确认已为实色无需修改）
- [x] 验证：暗色模式下文字清晰可见；`pnpm typecheck` + `pnpm lint` 通过

### P2 — 近期热门文章列表（候选 #16）

- [x] 后端：新增 `GET /api/posts/hot?range=365` 端点（基于 `post_view_hourly` 聚合近 365 天 views 增量，返回前 3 篇）
- [x] 前端：首页新增"近期热门"区块（位于"最新文章"与"全站热门"之间）
- [x] i18n：新增"近期热门"及相关文案翻译（zh-CN/en-US/zh-TW/ja-JP/ko-KR）
- [x] 重命名：原"热门文章"→"全站热门"
- [x] 去重：近期热门与最新文章不重复（复用 `excludeIds` 机制）；全站热门允许重复
- [x] 规范化：三个独立端点合并为 `/api/posts/home` 统一返回 `{ items, popular, hot }`，移除 `/api/posts/hot` 独立端点；日期计算统一使用 dayjs
- [x] 验证：`pnpm typecheck` + `pnpm lint` + `pnpm test` 通过（预存测试失败为独立基线问题）

### P2 — AI 编辑增强：改写+审查（候选 #9）

- [x] 后端：新增 `/api/ai/rewrite` 和 `/api/ai/review` 端点
- [x] 前端：编辑器工具栏新增"改写"按钮（支持风格选择：正式/口语/学术）
- [x] 前端：编辑器新增"审查"按钮，输出结构化修改建议列表（不自动应用）
- [x] 计费：复用现有 AI 计费和额度管理，扩展支持 rewrite/review 操作类型
- [x] 审计 (A)：`code-quality-auditor` Review Gate Pass（无 blocker）
- [x] 验证：`pnpm typecheck` ✅ + `pnpm lint` ✅ + `pnpm test` ✅（8/8 tests 通过）
- [x] 收口 (F)：Conventional Commits 已提交

### P2 — E2E CI 限流修复（候选 #17 首阶段）

- [ ] `playwright.config.ts` 的 `e2eServerEnv` 中添加 `NUXT_RATE_LIMIT_DEFAULT_POST_MAX=9999`
- [ ] 验证：`pnpm test:e2e` 通过，无 429 重试阻塞

### P1 — 测试覆盖率 90%+ 首批（长期主线 #1）

- [ ] 覆盖缺口分层盘点：输出缺口报告（哪些模块拖后腿、高价值缺口优先）
- [ ] 补高价值缺口覆盖度，推进全仓 coverage +1%
- [ ] 验证：`pnpm test:coverage` 提升 ≥1%；`pnpm typecheck` + `pnpm lint` 通过

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
