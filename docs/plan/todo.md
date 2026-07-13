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

#### 1. 主线：共享 API 客户端库提取（P1）

- [ ] 创建 `packages/api-client` 包（package.json / tsconfig / tsdown 脚手架）
- [ ] 实现基于 fetch 的统一 HTTP 客户端（复用 MCP 的中心化错误处理模式）
- [ ] 从 CLI `types.ts` 提取共享类型定义
- [ ] 迁移 30 个共享 API 方法到 `packages/api-client`
- [ ] 改造 CLI 包：使用共享客户端，移除 axios 依赖
- [ ] 改造 MCP 包：使用共享客户端，工具注册层保持不变
- [ ] 补齐共享客户端单元测试（mock HTTP 层）
- [ ] 更新 CI/CD：新包纳入 build/lint/test 流水线

**验收标准**: CLI + MCP 全部使用共享客户端；axios 依赖从 CLI 移除；`pnpm typecheck` + `pnpm lint` 通过；`duplicate-code:check` 基线不反弹；所有现有测试通过

#### 2. 主线：CLI 导出命令（P1）

- [ ] CLI 新增 `momei export <output-dir>` 命令
- [ ] 调用 `GET /api/external/posts` 获取文章列表
- [ ] 调用 `GET /api/external/posts/:id` 获取单篇文章
- [ ] 使用 `formatPostToMarkdown` 转换为 Markdown + Front-matter
- [ ] 支持过滤参数：`--language`、`--status`、`--category`、`--limit`
- [ ] 支持输出格式：`--format markdown`（默认）、`--format json`
- [ ] 导出报告统计成功/失败数量

**验收标准**: 导出的 Markdown 保留完整 Front-matter；支持过滤条件；导出报告可追踪；`pnpm typecheck` + `pnpm lint` 通过

#### 3. 主线：ESLint/类型债 — ≥3 组窄切片（P1）

- [ ] 继续「单规则 + 单文件/双文件」窄切片策略
- [ ] ≥3 组独立窄切片，优先选择未覆盖的生产文件
- [ ] 保持 `warning=0`

**验收标准**: ≥3 组窄切片完成；`pnpm governance:audit:eslint-debt` 显示 delta 可对照

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
