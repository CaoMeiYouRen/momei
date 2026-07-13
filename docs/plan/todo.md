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

### 第五十五阶段：AI 降级与接口扩展（AI Fallback & API Expansion）

**时间表**: 2026-07-07 ~ 约 1-2 周
**组合**: 2 个新功能 + 3 个优化
**目标**: 以「CLI/MCP 外部接口扩展 + AI 功能备用路线」两条新功能为主线，延续结构复用、ESLint/类型债与测试有效性治理节奏。

#### 1. 主线：CLI/MCP 阶段二 — 新增外部接口（P1）

- [x] 实现分类管理接口：`GET/POST/PUT/DELETE /api/external/categories`
- [x] 实现标签管理接口：`GET/POST/PUT/DELETE /api/external/tags`
- [x] 实现灵感管理接口：`GET/POST/GET/PUT/DELETE /api/external/snippets`
- [x] 实现灵感转文章接口：`POST /api/external/snippets/[id]/convert`
- [x] 实现文章版本接口：`GET/POST /api/external/posts/[id]/versions`
- [x] CLI 包新增对应客户端方法（15 个新方法）
- [x] MCP 包新增对应客户端方法 + 16 个新工具
- [x] 所有接口基于 Zod schema 验证（复用现有 schemas + 内联验证）
- [x] 接口文档更新

**验收标准**: 新增 ≥15 个外部接口；CLI 和 MCP 包方法覆盖率达到 100%；`pnpm typecheck` + `pnpm lint` 通过

#### 2. 主线：AI 功能备用路线与自动降级（P1）

- [x] 新增 `SettingKey.AI_FALLBACK_PROVIDER` 配置项（text/image 类别，含独立 API Key/Model/Endpoint）
- [x] 修改 `getAIProvider` 函数支持 fallback 链（新增 `getAIProviderWithFallback` / `getAIImageProviderWithFallback`）
- [x] 实现文本生成备用路线（TextService 9 个方法使用 fallback）
- [x] 实现图片生成备用路线（ImageService.continueTask 使用 fallback）
- [x] 实现重试逻辑：主提供商失败 → 重试 → 日志降级 → 切换备用 → 记录降级事件
- [x] 记录降级日志（logger.warn/info/error 分级别输出, AIFallbackEvent 结构可持久化）
- [x] 降级过程对用户透明（FallbackAIProvider 无缝接管，失败时抛出综合错误信息）

**验收标准**: 主提供商失败时自动切换备用；降级日志可追踪；所有现有测试通过

#### 3. 主线：结构复用逻辑重复收敛（P1）

- [x] 基于 Phase 54 逻辑重复检测脚本输出，识别高收益收敛候选
- [x] ≥2 组逻辑重复完成抽象收敛
- [x] 每组切片给出原始重复点、抽象边界与回滚方式

**验收标准**: ≥2 组逻辑重复收敛；`pnpm duplicate-code:check` 基线不反弹（✅ 0.33% < 基线 1.22%）

#### 4. 主线：ESLint/类型债 — ≥3 组窄切片（P1）

- [ ] 复用 Phase 54 规则债 inventory 脚本作为 baseline
- [ ] ≥3 组独立窄切片（单规则 + 单文件/双文件）
- [ ] 保持 `warning=0`

**验收标准**: ≥3 组窄切片完成；`pnpm governance:audit:eslint-debt` 显示 delta 可对照

#### 5. 主线：测试有效性第三轮切片（P1）

- [ ] 补组件层 AI 失败映射断言
- [ ] 补页面级 auth degradation 场景断言
- [ ] 补 `settings public` 或 `friend-links` 失败口径断言

**验收标准**: ≥5 个新增失败路径断言；覆盖 ≥2 个模块；全仓 coverage 基线不回退

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
