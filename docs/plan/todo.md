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

## 当前待办 — 第三十六阶段

> 执行计划详见 [phase-36-plan.md](../../docs/design/governance/phase-36-plan.md)
> 本阶段继续「0 个新功能 + 5 个优化」治理组合。

### 主线 1：修复数据库查询并发问题与 Redis 连接异常（P0）

- [x] 修复 `server/database/index.ts` 中 `initializeDB()` 竞态窗口（`isInitialized = true` 时序 + 移除 `finally` 中的 `initializationPromise = null`）
- [x] 修复 `server/utils/redis.ts` 中 ioredis 连接超时（添加 `connectTimeout` + `retryStrategy`）

### 主线 2：TTS 前端直出 + 直传 OSS 审查与 backlog 清理（P1）

- [x] 审查 TTS 前端直连 pipeline 测试覆盖完整性（9/9 测试通过）
- [x] 运行 TTS 相关测试确认通过
- [x] 从 `docs/plan/backlog.md` 标注 #13「前端直出 TTS + 直传 OSS」为已交付
- [x] 审查 `composables/use-tts-volcengine-direct.ts` max-lines 阈值（类型抽取至 `types/tts-direct.ts`）

### 主线 3：ESLint / 类型债继续治理（P1）

- [x] 修复 4 个 ESLint warning（2 unused imports, 1 max-lines 类型抽取, 1 no-misused-spread → Object.assign）
- [x] 扩展 `no-explicit-any` 窄切片到 `server/services/ai/tts.ts`（~16 处 `any`/`as any` 收敛）
- [-] `server/services/ai/asr.ts`：本轮容量有限，延后至下阶段

### 主线 4：结构复用治理：重复代码 + 零散类型收敛（P1）

- [x] TTS task API 重复收敛：提取 `server/utils/ai/tts-task-shared.ts`，双端点使用共享 helper
- [-] 邮件服务自重复收敛：本轮容量有限，延后至下阶段
- [x] `LocaleOption` 类型收敛：4 个 composable → `types/utils.ts`（`LocaleOption` + `SelectLocaleOption`）
- [x] 类型守卫收敛：`isAdminAiLocaleOption` / `isAdminI18nLocaleOption` → 统一 `isLocaleOption`

### 主线 5：存量代码注释治理候选组 C（P1）

- [x] `server/api/posts/index.get.ts`：补多语言聚合、缓存策略、管理模式注释
- [x] `server/api/posts/archive.get.ts`：补 SQL 差异逻辑与 aggregation 注释
- [x] `server/api/categories/index.get.ts`：补缓存键与 taxonomy filter 复用注释
- [x] `server/api/tags/index.get.ts`：同上

### 本轮基线

| 指标 | 起始 | 结束 | 变化 |
|------|------|------|------|
| ESLint | 4 warnings | 0 warnings | ✅ |
| jscpd | 34/629/0.52% | 33/608/0.50% | ↓1 clone, ↓21 lines |
| `tts.ts` any | ~16 | 0 | ✅ |
| LocaleOption 定义 | 4 scattered | 1 shared | ✅ |

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

