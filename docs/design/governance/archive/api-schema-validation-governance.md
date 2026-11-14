# server/api Schema 校验治理初审

## 1. 概述

### 1.1 背景

根据 [API 规范](../../standards/api.md) 与 [安全规范](../../standards/security.md)，`server/api` 下的 `body`、`query`、`params` 都必须通过 Zod Schema 做显式校验。当前仓库已经在大量新接口中收敛到 `readValidatedBody`、`getValidatedQuery`、`getValidatedRouterParams` 加 `utils/schemas/**` 的模式，但仍残留一批旧接口继续裸读请求参数。

本治理文档用于记录首轮排查口径、已确认缺口、第一批修复点与后续批次队列，避免后续再次从零审计。

### 1.2 本轮目标

1. 明确什么情况算“缺少 schema 校验”。
2. 记录首轮已确认的接口缺口，而不是泛化到所有仍在使用 `readBody` 或 `getQuery` 的文件。
3. 先修高风险入口：外部写接口、上传入口、管理端写接口、管理端列表查询。

## 2. 判定口径

### 2.1 计为缺口

以下情况计入本轮治理范围：

| 请求面 | 判定条件 |
| :-- | :-- |
| `body` | 直接 `readBody(event)` 后使用，且没有经过共享 schema 或本地 Zod parse |
| `query` | 直接 `getQuery(event)` 后手动 `Number()` / `as string` / `split()`，且没有经过 Zod parse |
| `params` | 直接 `getRouterParam(event, ...)` 后手动判空或断言，且没有经过 Zod parse |

### 2.2 不计为缺口

以下模式不作为本轮误报：

1. 已使用 `readValidatedBody`、`getValidatedQuery`、`getValidatedRouterParams`。
2. 虽然仍是 `readBody` / `getQuery`，但随后立即进入 `schema.parse(...)` 或 `safeParse(...)`。
3. 原始 `body` 只用于签名串拼接、日志、透传比对等非业务字段解析场景，例如 [server/api/tasks/run-scheduled.post.ts](../../../server/api/tasks/run-scheduled.post.ts)。

## 3. 首轮已确认缺口

### 3.1 已在第一批修复中收口

| 文件 | 方法 | 缺口 | 原模式 | 当前治理结果 |
| :-- | :-- | :-- | :-- | :-- |
| [server/api/external/ai/tts/task.post.ts](../../../server/api/external/ai/tts/task.post.ts) | `POST` | `body` | `readBody` + 手动 `voice` 判空 | 切到共享 `aiExternalTTSTaskSchema` + `readValidatedBody` |
| [server/api/admin/friend-link-applications/index.get.ts](../../../server/api/admin/friend-link-applications/index.get.ts) | `GET` | `query` | `getQuery` + `Number()` + 手动枚举收窄 | 切到共享 `friendLinkApplicationListQuerySchema` + `getValidatedQuery` |
| [server/api/admin/agreements/[id]/activate.post.ts](../../../server/api/admin/agreements/[id]/activate.post.ts) | `POST` | `params` | `getRouterParam` + 手动字符串比对 | 切到共享 `agreementTypeParamSchema` + `getValidatedRouterParams` |
| [server/api/upload/index.post.ts](../../../server/api/upload/index.post.ts) | `POST` | `query` | `getQuery` + 类型断言 | 切到共享 `uploadQuerySchema` + `getValidatedQuery` |

### 3.2 已在第二批修复中收口

| 文件 | 方法 | 缺口 | 原模式 | 当前治理结果 |
| :-- | :-- | :-- | :-- | :-- |
| [server/api/admin/ai/tasks.get.ts](../../../server/api/admin/ai/tasks.get.ts) | `GET` | `query` | 手动解析 `page`、`pageSize`、`status`、`search` 等过滤参数 | 切到共享 `aiAdminTaskListQuerySchema` + `getValidatedQuery` |
| [server/api/admin/ai/tasks.delete.ts](../../../server/api/admin/ai/tasks.delete.ts) | `DELETE` | `query` | 直接读取 `ids` 并按逗号拆分 | 切到共享 `aiAdminTaskDeleteQuerySchema` + `getValidatedQuery` |

### 3.3 已在第三批修复中收口

| 文件 | 方法 | 缺口 | 原模式 | 当前治理结果 |
| :-- | :-- | :-- | :-- | :-- |
| [server/api/admin/agreements/index.get.ts](../../../server/api/admin/agreements/index.get.ts) | `GET` | `query` | 直接读取 `type`、`language` 并手动收窄 | 切到共享 `agreementAdminListQuerySchema` + `getValidatedQuery` |
| [server/api/admin/marketing/campaigns.get.ts](../../../server/api/admin/marketing/campaigns.get.ts) | `GET` | `query` | 直接 `getQuery` 后交给 `parsePagination` 回退默认值 | 切到共享 `marketingCampaignListQuerySchema` + `getValidatedQuery` |

### 3.4 已在第四批修复中收口

| 文件 | 方法 | 缺口 | 原模式 | 当前治理结果 |
| :-- | :-- | :-- | :-- | :-- |
| [server/api/admin/agreements/[id].put.ts](../../../server/api/admin/agreements/[id].put.ts) | `PUT` | `params` | 直接读取 `id` 路由参数并手动判空 | 切到共享 `agreementIdParamSchema` + `getValidatedRouterParams` |
| [server/api/admin/friend-links/index.get.ts](../../../server/api/admin/friend-links/index.get.ts) | `GET` | `query` | 手动解析分页、状态、分类、featured 和关键词 | 切到共享 `adminFriendLinkListQuerySchema` + `getValidatedQuery` |

### 3.5 已确认但留待下一批

| 文件 | 方法 | 缺口 | 现状说明 | 建议方向 |
| :-- | :-- | :-- | :-- | :-- |
| [server/api/admin/external-links/[id].put.ts](../../../server/api/admin/external-links/[id].put.ts) | `PUT` | `params` | 仍在直接读取 `id` 路由参数 | 迁移到共享 params schema，并与 body 校验一起收口 |
| [server/api/admin/agreements/[id].delete.ts](../../../server/api/admin/agreements/[id].delete.ts) | `DELETE` | `params` | 仍在直接读取 `id` 路由参数 | 迁移到共享 agreement params schema |

## 4. 第一批治理策略

### 4.1 共享 Schema 优先

本轮统一把可复用契约上收至 `utils/schemas/**`：

1. AI 外部 TTS 请求体归并到 [utils/schemas/ai.ts](../../../utils/schemas/ai.ts)。
2. 协议激活参数与请求体归并到 [utils/schemas/agreement.ts](../../../utils/schemas/agreement.ts)。
3. 友链申请后台列表查询归并到 [utils/schemas/friend-link.ts](../../../utils/schemas/friend-link.ts)。
4. 上传查询参数独立落在 [utils/schemas/upload.ts](../../../utils/schemas/upload.ts)。
5. 管理端 AI 任务列表与批量删除查询归并到 [utils/schemas/ai.ts](../../../utils/schemas/ai.ts)。
6. 协议列表查询归并到 [utils/schemas/agreement.ts](../../../utils/schemas/agreement.ts)。
7. 营销活动后台列表分页查询归并到 [utils/schemas/notification.ts](../../../utils/schemas/notification.ts)。
8. 协议更新 params 与后台友链列表查询分别归并到 [utils/schemas/agreement.ts](../../../utils/schemas/agreement.ts) 和 [utils/schemas/friend-link.ts](../../../utils/schemas/friend-link.ts)。

### 4.2 Handler 只保留业务决策

接口处理函数的职责收敛为：

1. 鉴权。
2. 读取已校验参数。
3. 执行业务逻辑。
4. 返回统一响应。

不再在 Handler 内手动做 `Number(query.page || 1)`、`if (!type)`、`as UploadType` 这类重复解析。

## 5. 后续批次建议

下一轮优先级建议如下：

1. 管理端其他列表接口：优先排查仍然直接 `getQuery` 的后台分页路由。
2. 动态路由参数：继续把 `getRouterParam` + 非空断言迁移到 `getValidatedRouterParams`。
3. 外部入口：继续清点 `external/**` 下仍使用裸 `readBody` 的写接口。
4. 对已迁移接口补 schema 单测，避免共享契约后续被回退成裸读。

## 6. 验证要求

本专题后续每一批修复都至少需要：

1. 一条最窄的行为测试或邻近测试回归。
2. 一次定向类型检查或等价验证。
3. 在本文件追加“已确认缺口”或“误报说明”，避免重复排查。
