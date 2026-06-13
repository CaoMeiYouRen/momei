# API 测试分层规则

## 1. 概述

本文档固化项目中 API 测试文件的目录归属规则，消除历史遗留的 `tests/server/api/` 与 `server/api/**/*.test.ts` 双轨并存问题。

**事实源**: 以本文档为准；[测试规范](../../standards/testing.md) 中的 §3.1 / §3.2 为下游引用。

## 2. 分层规则

### 2.1 单元测试（Co-located）

与源代码**同级存放**，适用以下类型：

| 类型 | 目录模式 | 示例 |
|:---|:---|:---|
| 工具函数 | `utils/*.test.ts` | `utils/date-formatter.test.ts` |
| Vue 组件 | `components/**/*.test.ts` | `components/article-card.test.ts` |
| Vue 页面 | `pages/**/*.test.ts` | `pages/login.test.ts` |
| Store 状态管理 | `stores/**/*.test.ts` | `stores/auth.test.ts` |
| 服务层纯逻辑 | `server/services/**/*.test.ts` | `server/services/comment.test.ts` |
| 数据库工具 | `server/utils/**/*.test.ts` | `server/utils/pagination.test.ts` |
| Nitro 工具函数 | `server/utils/**/*.test.ts` | `server/utils/rate-limit.test.ts` |

**特征**: 不依赖完整 HTTP 请求上下文、可直接 mock 依赖、侧重单元行为。

### 2.2 API 集成测试（Centralized）

统一存放在 **`tests/server/api/`**，适用以下类型：

| 类型 | 目录模式 | 示例 |
|:---|:---|:---|
| API Handler 测试 | `tests/server/api/**/*.test.ts` | `tests/server/api/posts/index.get.test.ts` |
| 中间件测试 | `tests/server/middleware/**/*.test.ts` | `tests/server/middleware/db-ready.test.ts` |
| 数据库集成测试 | `tests/server/database/**/*.test.ts` | `tests/server/database/init-boundary.test.ts` |
| 外部服务集成 | `tests/server/external*/**/*.test.ts` | `tests/server/external-feed/aggregator.test.ts` |

**特征**: 涉及数据库交互、API 接口调用、完整业务流程、需 mock Nitro 运行时环境。

### 2.3 决策树

```
测试涉及完整 HTTP 请求/响应周期？
  ├── 是 → 涉及数据库、鉴权、外部 API？
  │         ├── 是 → tests/server/api/ (集成测试)
  │         └── 否 → 考虑是否可以抽取为纯逻辑单元
  └── 否 → 被测单元可以独立 mock 所有依赖？
            ├── 是 → co-located (单元测试)
            └── 否 → 重新评估架构，可能需要 tests/server/
```

## 3. 迁移规则

### 3.1 从 `server/api/` 迁移到 `tests/server/api/`

当 colocated 测试满足 API 集成测试特征时，按以下步骤迁移：

1. **创建目标目录**: 在 `tests/server/api/` 下镜像源 API 目录结构，包括动态路由段（如 `[id]`）
2. **修复 handler 导入**: `import handler from './xxx'` → `import handler from '@/server/api/path/xxx'`
3. **保持其他导入不变**: `@/` 开头的绝对导入无需修改
4. **保持测试内容不变**: 不重写测试逻辑、不添加或移除断言
5. **删除原文件**: 迁移验证通过后删除 `server/api/` 下的原测试文件

### 3.2 导入路径对照

| 原位置 | 迁移后 import |
|:---|:---|
| `server/api/benefits/waitlist.post.test.ts` | `import handler from '@/server/api/benefits/waitlist.post'` |
| `server/api/friend-links/feed.get.test.ts` | `import handler from '@/server/api/friend-links/feed.get'` |
| `server/api/ai/tts/task.post.test.ts` | `import handler from '@/server/api/ai/tts/task.post'` |
| `server/api/admin/posts/[id]/repush.post.test.ts` | `import handler from '@/server/api/admin/posts/[id]/repush.post'` |

## 4. 当前状态

### 4.1 迁移进度

| 状态 | 数量 | 说明 |
|:---|:---|:---|
| ✅ 符合规范 | 45 | `tests/server/api/` 中的现有测试 |
| ✅ 已迁移 | ≥3 | 本阶段样板迁移（≥3 组） |
| ⬜ 待迁移 | ~20 | 剩余 colocated 测试，后续阶段继续 |
| 🗑️ 已去重 | 1 | `refresh.post.test.ts` 重复合并 |

### 4.2 待迁移清单

剩余 colocated API 测试文件（`server/api/**/*.test.ts`），后续阶段按需迁移：

```
server/api/admin/ai/stats.get.test.ts
server/api/admin/ai/tasks.get.test.ts
server/api/admin/content-insights.get.test.ts
server/api/admin/creator-stats.get.test.ts
server/api/admin/marketing/campaigns.post.test.ts
server/api/admin/marketing/campaigns/[id]/send.post.test.ts
server/api/admin/posts/[id]/repush.post.test.ts
server/api/admin/posts/[id]/versions/[versionId]/restore.post.test.ts
server/api/admin/submissions/[id].delete.test.ts
server/api/ai/image/generate.post.test.ts
server/api/ai/translate.post.test.ts
server/api/ai/translate.stream.post.test.ts
server/api/ai/translate-name.post.test.ts
server/api/ai/tts/estimate.post.test.ts
server/api/ai/tts/task.post.test.ts
server/api/ai/task/status/[id].get.test.ts
server/api/ai/tasks/[id].get.test.ts
server/api/posts/[id]/tts-metadata.put.test.ts
server/api/tasks/tts/[id].get.test.ts
```

## 5. 相关文档

- [测试规范](../../standards/testing.md) — 目录结构与命名规范
- [开发规范](../../standards/development.md) — 代码生成准则
- [AI 协作规范](../../standards/ai-collaboration.md) — PDTFC+ 工作流
