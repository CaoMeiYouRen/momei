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

## 当前待办

### 第五十六阶段：API 客户端统一与 CLI 导出（API Client Unification & CLI Export）

**时间表**: 2026-07-13 ~ 约 2 周
**组合**: 1 重构 + 1 新功能 + 3 优化
**目标**: 以「提取共享 API 客户端库」作为本阶段主重构，将 CLI 从 axios 迁移到 fetch 并统一两包 API 调用层；新增 CLI 导出命令填补迁移工具体验缺口；延续 ESLint、结构复用与测试有效性治理节奏。

#### 1. 主线：共享 API 客户端库提取（P1）✅

- [x] 创建 `packages/api-client` 包（package.json / tsconfig / tsdown / eslint 脚手架）
- [x] 实现基于 fetch 的统一 HTTP 客户端（MomeiHttpClient + MomeiApiError + AbortSignal 超时）
- [x] 从 CLI `types.ts` 提取共享类型定义（42 个接口 → @momei-blog/api-client）
- [x] 迁移 30 个共享 API 方法到 `packages/api-client`（7 领域模块）
- [x] 改造 CLI 包：使用共享客户端，保留 importPosts/testConnection 方法
- [x] 改造 MCP 包：使用共享客户端，工具注册层保持不变
- [x] 补齐共享客户端单元测试（29 tests：client 9 / domain APIs 15 / utils 5）
- [x] 更新 CI/CD：pnpm workspace 自动纳入新包；各包独立的 lint/typecheck/test 全部通过

**验收标准**: ✅ CLI + MCP 全部使用共享客户端；axios 依赖从 CLI 移除；`pnpm typecheck` + `pnpm lint` 通过；所有现有测试通过（CLI 36 + MCP 11 + api-client 29 = 76 pass）

#### 2. 主线：CLI 导出命令（P1）

- [x] CLI 新增 `momei export <output-dir>` 命令
- [x] 调用 `GET /api/external/posts` 获取文章列表
- [x] 调用 `GET /api/external/posts/:id` 获取单篇文章
- [x] 使用 `formatPostToMarkdown` 转换为 Markdown + Front-matter
- [x] 支持过滤参数：`--language`、`--status`、`--category`、`--limit`
- [x] 支持输出格式：`--format markdown`（默认）、`--format json`
- [x] 导出报告统计成功/失败数量

**验收标准**: 导出的 Markdown 保留完整 Front-matter；支持过滤条件；导出报告可追踪；`pnpm typecheck` + `pnpm lint` 通过

#### 3. 主线：ESLint/类型债 — ≥3 组窄切片（P1）✅

- [x] 继续「单规则 + 单文件/双文件」窄切片策略
- [x] 3 组独立窄切片（schema/component/page 各一），均为未覆盖生产文件
- [x] 均保持 `warning=0`
- [x] 更新 `eslint-debt-targets.mjs` 追加 `NO_EXPLICIT_ANY_SCHEMA_FILES` / `PAGE_FILES` / `COMPONENT_FILES`

**验收标准**: ✅ 3 组窄切片完成（`utils/schemas/submission.ts`、`pages/settings.vue`、`components/commercial-link-manager.vue`）；`pnpm governance:audit:eslint-debt` 显示 3 组新切片 warning=0；`pnpm typecheck` 通过

#### 4. 主线：结构复用治理 — ≥2 组热点切片（P1）

- [ ] 聚焦同名函数/重复类型/工具函数收敛
- [ ] ≥2 组切片，每组给出原始重复点、抽象边界与回滚方式

**验收标准**: ≥2 组热点切片完成；`pnpm duplicate-code:check` 基线不反弹

#### 5. 主线：测试有效性第四轮切片 — server 层错误码覆盖（P1）

- [ ] 聚焦 server API 层标准错误码覆盖
- [ ] ≥5 个新增失败路径断言（401/403/503 等标准错误面）
- [ ] 覆盖 ≥2 个 server API 模块

**验收标准**: ≥5 个新增失败路径断言；覆盖 ≥2 个 server API 模块；全仓 coverage 基线不回退

---

## 待准入（筹备中）

> 当前阶段执行中，新增需求请写入 [backlog.md](./backlog.md)。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
