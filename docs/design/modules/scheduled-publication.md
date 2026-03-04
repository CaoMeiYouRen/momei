# 定时任务与发布功能设计 (Scheduled Tasks & Publication Design)

## 1. 概述 (Overview)

本模块旨在实现站内的定时自动化任务，主要包括**文章定时发布**与**营销邮件定时推送**。由于项目需要兼容**自部署 (VPS/Docker)** 与 **Serverless (Cloud Functions)** 环境，设计上采用“业务逻辑解耦，触发方式适配”的原则。

## 2. 核心架构 (Architecture)

### 2.1 任务执行引擎 (Task Engine)
位于 `server/services/task.ts`，负责核心检索与状态变更逻辑。

#### 2.1.1 文章定时发布 (Post)
1.  检索所有 `status === 'scheduled'` 且 `publishedAt <= now()` 的文章。
2.  **状态变更**: 将状态变更为 `published`。
3.  **副作用触发**:
    -   从 `publishIntent` 读取该文章计划时的发布偏好（如同步 Memos、发送邮件等）。
    -   调用 `executePublishEffects` 触发实际的同步和推送。

#### 2.1.2 营销定时推送 (MarketingCampaign)
1.  检索所有 `status === 'SCHEDULED'` 且 `scheduledAt <= now()` 的营销任务。
2.  **推送启动**: 调用 `sendMarketingCampaign` 异步执行实际的邮件投递。
3.  **异常重试**: 若发送失败，状态将变更为 `FAILED`，管理员可手动重新触发。

### 2.2 锁竞争与安全性 (Locking)
位于 `server/services/task.ts`，负责核心检索与状态变更逻辑。
1.  **锁竞争**: 尝试获取 Redis 锁 `momei:lock:scheduled-tasks` (仅在集群环境下生效)。
2.  **解锁**: 任务结束或异常后释放锁。

### 2.3 环境适配器 (Environment Adapters)

- **自部署 (Self-hosted)**:
    -   利用 Nitro 的 `server/plugins` 注册启动任务。
    -   使用 `cron` 库 (`CronJob`) 驱动，默认每 5 分钟执行一次 (`*/5 * * * *`)。
    -   **分布式锁**: 
        -   当配置外部 Redis 时，使用 `ioredis` 实现分布式锁，防止多实例并发执行任务。
        -   降级机制：无 Redis 时，默认视为单实例环境直接运行。

- **Serverless (如 Vercel, Cloudflare)**:
    -   由于 Serverless 环境无法维持后台 CronJob 进程，`cron` 插件将根据环境变量自动检测并禁用。
    -   暴露受保护的 Webhook API 接口：`POST /api/tasks/run-scheduled`。
    -   **安全机制**:
        -   **HMAC 签名模式 (推荐)**: 通过 `X-Webhook-Signature` + `X-Webhook-Timestamp` 验证，支持防重放攻击。
        -   **简单 Token 模式 (向后兼容)**: 校验请求头 `X-Tasks-Token` 或 `?token=...`。
        -   Token 由环境变量 `TASKS_TOKEN` 或 `WEBHOOK_SECRET` 定义。
    -   **原生触发集成**:
        -   **Vercel Cron Jobs**: 通过 `vercel.json` 配置自动注册定时任务。
        -   **Cloudflare Scheduled Events**: 通过 `wrangler.toml` + `server/routes/_scheduled.ts` 实现。
    -   **外部触发**: GitHub Actions 或其他监控服务定期请求 Webhook 接口。

## 3. 数据库与意图持久化 (Data & Persistence)

### 3.1 发布意图 (Publish Intent)
编辑器中“发布”按钮的选项（推送通知、同步 Memos、推送条件）在“定时发布”场景下不会立即执行，必须被持久化。系统将这些选项存储在 `Post` 实体的 `publishIntent` 字段中：

```json
{
  "syncToMemos": true,
  "pushOption": "now",
  "pushCriteria": { "categoryIds": [], "tagIds": [] }
}
```

### 3.2 PostStatus 枚举
-   新增 `SCHEDULED = 'scheduled'`。
-   转换路径扩展：
    -   `DRAFT` -> `SCHEDULED` (校验 `publishedAt` > now)
    -   `PENDING` -> `SCHEDULED` (管理员审核通过并排期)
    -   `SCHEDULED` -> `PUBLISHED` (引擎自动完成)
    -   `SCHEDULED` -> `DRAFT/HIDDEN` (手动取消定时)

## 4. 时区与时间处理 (Timezone)

-   前端统一传递 **ISO 8601** 格式的时间字符串。
-   后端及数据库统一存储为 UTC 时间。
-   执行引擎通过 `publishedAt <= now()` 进行判断，不受本地时区差异影响。

## 5. 业务逻辑分离 (Logic Separation)

1.  **副作用剥离**: `server/services/post-publish.ts` 封装 `executePublishEffects`。
2.  **任务引擎**: `server/services/task.ts` 负责业务逻辑调度。
3.  **插件集成**: `server/plugins/task-scheduler.ts` 负责自部署环境的 Cron 注册。

## 6. 前端交互 (User Experience)

### 6.1 编辑器
-   发布前弹出确认框，若探测到 `publishedAt` 为未来时间，底部主按钮文字变为”计划发布”。
-   提供取消计划的入口。

### 6.2 状态提示
-   列表页使用特殊的颜色（如紫色）标记 `SCHEDULED` 状态。

## 7. Serverless 生态深度适配 (Serverless Ecosystem Integration)

### 7.1 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    Serverless Cron Triggers                      │
├───────────────────┬───────────────────┬─────────────────────────┤
│  Vercel Cron Jobs │ Cloudflare Cron   │   External Services     │
│  (vercel.json)    │ (wrangler.toml)   │   (GitHub Actions, etc) │
└─────────┬─────────┴─────────┬─────────┴───────────┬─────────────┘
          │                   │                     │
          └───────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Webhook Task Dispatcher (API Layer)                 │
│  server/api/tasks/run-scheduled.post.ts                         │
│  - HMAC-SHA256 签名验证                                          │
│  - 时间戳防重放攻击                                              │
│  - 请求来源识别                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Task Execution Engine (Service Layer)               │
│  server/services/task.ts                                        │
│  - processScheduledPosts()                                      │
│  - processScheduledCampaigns()                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 平台配置

#### 7.2.1 Vercel Cron Jobs

**配置文件**: `vercel.json`

```json
{
    “crons”: [
        {
            “path”: “/api/tasks/run-scheduled”,
            “schedule”: “*/5 * * * *”
        }
    ]
}
```

**触发流程**:
1. Vercel 平台按 Cron 表达式自动调用 `/api/tasks/run-scheduled`
2. 请求自动携带 Vercel 内部认证信息
3. 服务端验证并执行任务

#### 7.2.2 Cloudflare Workers/Pages

**配置文件**: `wrangler.toml`

```toml
[triggers]
crons = [“*/5 * * * *”]
```

**处理路由**: `server/routes/_scheduled.ts`
- 通过 `cf-scheduled` 请求头识别 Cloudflare 内部触发
- 直接执行 `processScheduledTasks()`，无需额外认证

### 7.3 安全机制

#### 7.3.1 HMAC 签名验证 (推荐)

**请求头**:
- `X-Webhook-Timestamp`: 请求时间戳 (毫秒)
- `X-Webhook-Signature`: HMAC-SHA256 签名
- `X-Webhook-Source`: 来源标识 (`vercel` | `cloudflare` | `external`)

**签名计算**:
```
payload = timestamp + “\n” + source + “\n” + body
signature = HMAC-SHA256(payload, WEBHOOK_SECRET)
```

**防重放攻击**:
- 时间戳容差默认 5 分钟
- 超出容差的请求将被拒绝

#### 7.3.2 简单 Token 模式 (向后兼容)

**请求方式**:
- Query 参数: `?token=<TASKS_TOKEN>`
- 请求头: `X-Tasks-Token: <TASKS_TOKEN>`

### 7.4 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|-------|------|-------|------|
| `TASKS_TOKEN` | 生产必需 | - | 简单 Token 模式密钥 |
| `WEBHOOK_SECRET` | 推荐 | `TASKS_TOKEN` | HMAC 签名密钥 |
| `WEBHOOK_TIMESTAMP_TOLERANCE` | 可选 | `300000` | 时间戳容差 (毫秒) |

### 7.5 相关文件

| 文件路径 | 用途 |
|---------|------|
| `server/utils/webhook-security.ts` | Webhook 安全校验工具 |
| `server/api/tasks/run-scheduled.post.ts` | Webhook API 接口 |
| `server/routes/_scheduled.ts` | Cloudflare 内部触发处理器 |
| `server/services/task.ts` | 任务执行引擎 |
| `server/plugins/task-scheduler.ts` | 自部署环境 Cron 插件 |
| `vercel.json` | Vercel Cron Jobs 配置 |
| `wrangler.toml` | Cloudflare Scheduled Events 配置 |
