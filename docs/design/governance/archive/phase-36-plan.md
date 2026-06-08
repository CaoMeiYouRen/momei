# Phase 36 执行计划

**时间表**: 2026-05-09 ~ 约 1 - 2 周
**目标**: 在第三十五阶段完成后，继续「0 个新功能 + 5 个优化」治理组合。

## 准入结论

五条主线均来自用户指令与 backlog 候选池，总数控制在 5 项内。本阶段不引入新功能。

## 执行约束

- 各主线进入实现前必须先冻结命中清单与替代方案
- 涉及新抽象时必须同步记录收益、过度泛化风险与回滚方式
- 修改敏感链路（数据库初始化、Redis 连接）必须有定向测试与类型验证

---

## 主线 1：修复数据库查询并发问题与 Redis 连接异常（P0）

### 1A — PG client.query() 并发废弃警告

**问题**: Vercel 生产日志中每个冷启动都出现 `DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0`。

**根因**: `server/database/index.ts` 的 `initializeDB()` 存在竞态窗口：
1. `isInitialized = true` 在 `syncAdminRoles()` 和 `repairLegacyPostVersionRecords()` **之前**设置
2. 并发请求的中间件（`1-auth.ts`、`0b-db-ready.ts`）在初始化查询进行中就穿透到数据库
3. `initializationPromise = null` 在 `finally` 中移除守卫

**修复方案**:
1. 将 `isInitialized = true` 移到 `syncAdminRoles()` 和 `repairLegacyPostVersionRecords()` **之后**
2. 保持 `initializationPromise` 为非 null（不在 finally 中重置），使后续 `await initializeDB()` 复用同一 promise
3. 异常路径也标记 `isInitialized = true`，避免死循环

**关键文件**:

| 文件 | 操作 |
|------|------|
| `server/database/index.ts` | 修复初始化顺序，移除 finally 中的 promise 复位 |

**验证**: `pnpm typecheck` + `pnpm vitest run server/database/`

### 1B — ioredis ETIMEDOUT

**问题**: Vercel 日志中出现 `[ioredis] Unhandled error event: Error: connect ETIMEDOUT`。

**根因**: `server/utils/redis.ts` 使用 `lazyConnect: true`，但缺少 `connectTimeout` 与 `retryStrategy` 配置，Vercel serverless 环境中 Redis 主机可能不可达。

**修复方案**:
1. 添加 `connectTimeout: 10000`
2. 添加 `retryStrategy`：最多重试 3 次后放弃
3. 优化 error handler 注册顺序

**关键文件**:

| 文件 | 操作 |
|------|------|
| `server/utils/redis.ts` | 添加 connectTimeout、retryStrategy，优化错误处理 |

**验证**: 部署后在 Vercel 日志中观察无 `ETIMEDOUT` 或 `Unhandled error event`

---

## 主线 2：TTS 前端直出 + 直传 OSS 审查与 backlog 清理（P1）

**任务**:
- [ ] 审查确认所有 TTS 前端直连路径的测试覆盖完整性
- [ ] 验证 `use-tts-volcengine-direct.test.ts` 和 `server/api/posts/[id]/tts-metadata.put.test.ts` 测试通过
- [ ] 确认设计文档与实现一致
- [ ] 从 `docs/plan/backlog.md` 中标注第 13 条「前端直出 TTS + 直传 OSS」为已交付
- [ ] 审查 `composables/use-tts-volcengine-direct.ts` 的 max-lines 阈值（当前 802 > 800 触发 ESLint warning）

**关键文件**:

| 文件 | 操作 |
|------|------|
| `docs/plan/backlog.md` | 标注 #13 完成 |
| `composables/use-tts-volcengine-direct.ts` | 审查（可能拆分以满足 max-lines） |
| `composables/use-tts-volcengine-direct.test.ts` | 审查测试覆盖面 |
| `server/utils/ai/tts-direct-dispatch.ts` | 审查 |
| `server/api/posts/[id]/tts-metadata.put.ts` | 审查 |

---

## 主线 3：ESLint / 类型债继续治理（P1）

### A 组 — 修复现有 4 个 warning

| 文件 | 行 | 修复 |
|------|-----|------|
| `composables/use-app-fetch.ts` | 1 | 删除未使用的 `Ref` import |
| `composables/use-locale-message-modules.ts` | 1 | 删除未使用的 `Ref` import |
| `composables/use-tts-volcengine-direct.ts` | 801 | 拆分或压缩 ≤800 行 |
| `server/utils/post-access.ts` | 211 | 用 Object.assign 替代类实例上的 spread |

### B 组 — 扩展 `no-explicit-any` 窄切片

选择 `server/services/ai/` 中 1-2 个高 ROI 文件：

1. `server/services/ai/tts.ts`（~15 处 `as any`）— 加入 `noExplicitAnyFiles` 覆盖
2. `server/services/ai/asr.ts`（~10 处 `as any`）— 可选，若容量允许

每轮仅处理一个文件，先产出命中清单、替代写法和回滚边界。

### C 组 — `server/utils/translation.ts` 4 处 `as any`（可选）

**关键文件**:

| 文件 | 操作 |
|------|------|
| `composables/use-app-fetch.ts` | 删除未使用的 `Ref` import |
| `composables/use-locale-message-modules.ts` | 删除未使用的 `Ref` import |
| `composables/use-tts-volcengine-direct.ts` | 满足 max-lines 阈值 |
| `server/utils/post-access.ts` | 修复 no-misused-spread |
| `eslint.config.js` | 扩展 `noExplicitAnyFiles` 覆盖 |
| `server/services/ai/tts.ts` | 收敛 `as any` |

---

## 主线 4：结构复用治理：重复代码 + 零散类型收敛（P1）

当前基线：34 clones / 629 lines / 0.52%

### A 组 — jscpd 可见重复收敛（选择 2 组）

**候选 1**：TTS task API 重复
- `server/api/ai/tts/task.post.ts` vs `server/api/external/ai/tts/task.post.ts`
- 配额计算 + 任务创建逻辑重复（21 lines）
- 方案：提取共享 helper 到 `server/utils/ai/`

**候选 2**：邮件服务自重复
- `server/utils/email/service.ts` 中 `sendLoginOTP` / `sendEmailVerificationOTP` / `sendPasswordResetOTP`
- 三个方法结构完全相同（27+27 lines）
- 方案：提取 `sendOTPEmail(templateId, type, options)` 内部方法

**候选 3**：Admin 数据表页面模板
- `pages/admin/subscribers/index.vue` vs `pages/admin/waitlist/index.vue`
- 数据表 + 分页 + 确认删除模板重复（26 lines）

### B 组 — 零散类型收敛

**LocaleOption 收敛**：4 个 composable 中各自定义了相似的 LocaleOption 类型

| 文件 | 当前定义 |
|------|---------|
| `composables/use-post-editor-translation.ts:38` | `interface LocaleOption { code: string }` |
| `composables/use-post-editor-page.ts:38` | `interface LocaleOption { code: string }`（完全相同） |
| `composables/use-admin-ai.ts:10` | `AdminAiLocaleOption` |
| `composables/use-admin-i18n.ts:5` | `AdminI18nLocaleOption` |

方案：收敛到 `types/utils.ts` 的 `LocaleOption` 和 `SelectLocaleOption`

**类型守卫收敛**：
- `composables/use-admin-ai.ts:25` 的 `isAdminAiLocaleOption` 与 `composables/use-admin-i18n.ts:9` 的 `isAdminI18nLocaleOption`
- 方案：收敛为 `types/utils.ts` 中的单一 `isSelectLocaleOption`

**关键文件**:

| 文件 | 操作 |
|------|------|
| `server/utils/ai/` | 新增 tts-task-shared.ts |
| `server/api/ai/tts/task.post.ts` | 使用共享 helper |
| `server/api/external/ai/tts/task.post.ts` | 使用共享 helper |
| `server/utils/email/service.ts` | 提取 sendOTPEmail |
| `types/utils.ts` | 添加 LocaleOption, SelectLocaleOption |
| `composables/use-post-editor-translation.ts` | 使用共享 LocaleOption |
| `composables/use-post-editor-page.ts` | 使用共享 LocaleOption |
| `composables/use-admin-ai.ts` | 使用共享 SelectLocaleOption |
| `composables/use-admin-i18n.ts` | 使用共享 SelectLocaleOption |

---

## 主线 5：存量代码注释治理候选组 C（P1）

候选组 C：公开读接口链路，优先覆盖多语言聚合、宽查询裁剪与缓存策略。

| 文件 | 补注释重点 |
|------|-----------|
| `server/api/posts/index.get.ts` | 模块级文档：多语言聚合、缓存策略、管理模式差异；关键分支：visibility 过滤、pagination、orderBy 优先级 |
| `server/api/posts/archive.get.ts` | 原始 SQL 差异逻辑说明（DISTINCT + IN）、多语言 aggregation 逻辑 |
| `server/api/categories/index.get.ts` | 缓存键构建与 taxonomy filter 复用策略、与共享 helper 协作边界 |
| `server/api/tags/index.get.ts` | 同上 |

---

## 验证矩阵

| 主线 | 验证命令 | 通过标准 |
|------|---------|---------|
| PG + Redis 修复 | `pnpm typecheck` + `pnpm vitest run server/database/` | 类型检查通过，数据库测试通过 |
| TTS backlog 清理 | `pnpm vitest run` composables TTS + tts-metadata 测试 | 所有测试通过 |
| ESLint 治理 | `pnpm lint` | 0 errors, 0 warnings |
| 结构复用 | `pnpm duplicate-code:check` | 基线 ≤ 当前 34/629/0.52% |
| 注释治理 | Review Gate 自检 | 注释与实现同步 |

## Phase 收口

1. `pnpm lint && pnpm typecheck` 通过
2. `pnpm vitest run` 确认无回归
3. `pnpm duplicate-code:check` 确认基线不反弹
4. 更新 `docs/plan/todo-archive.md` 添加 Phase 36 归档块
5. 更新 `docs/plan/roadmap.md` Phase 36 为已审计归档
6. 同步多语 roadmap 摘要
