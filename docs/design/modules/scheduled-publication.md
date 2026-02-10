# 定时发布功能设计 (Scheduled Publication Design)

## 1. 概述 (Overview)

本模块旨在实现文章的定时发布功能。由于项目需要兼容**自部署 (VPS/Docker)** 与 **Serverless (Cloud Functions)** 环境，设计上采用“业务逻辑解耦，触发方式适配”的原则。

## 2. 核心架构 (Architecture)

### 2.1 任务执行引擎 (Task Engine)
位于 `server/services/task.ts`，负责核心检索与状态变更逻辑。
1.  检索所有 `status === 'scheduled'` 且 `publishedAt <= now()` 的文章。
2.  **锁竞争**: 尝试获取 Redis 锁 `momei:lock:publish-scheduled` (仅在集群环境下生效)。
3.  **循环处理**:
    -   将状态变更为 `published`。
    -   **意图恢复**: 从 `publishIntent` 读取该文章定时时的发布偏好（如同步 Memos、发送邮件等）。
    -   **执行副作用**: 调用 `executePublishEffects` 触发实际的同步和推送。
4.  **解锁**: 任务结束或异常后释放锁。

### 2.2 环境适配器 (Environment Adapters)

- **自部署 (Self-hosted)**:
    -   利用 Nitro 的 `server/plugins` 注册启动任务。
    -   使用 `cron` 库 (`CronJob`) 驱动，默认每 5 分钟执行一次 (`*/5 * * * *`)。
    -   **分布式锁**: 
        -   当配置外部 Redis 时，使用 `ioredis` 实现分布式锁，防止多实例并发执行任务。
        -   降级机制：无 Redis 时，默认视为单实例环境直接运行。

- **Serverless (如 Vercel, Zeabur)**:
    -   由于 Serverless 环境无法维持后台 CronJob 进程，`cron` 插件将根据环境变量自动检测并禁用。
    -   暴露受保护的 Webhook API 接口：`POST /api/tasks/run-scheduled`。
    -   **安全机制**:
        -   校验请求头 `X-Tasks-Token` 或 `?token=...`。
        -   Token 由环境变量 `TASKS_TOKEN` 定义。
    -   触发方式：用户配置 Vercel Cron, GitHub Actions 或外部监控服务定期请求该接口。

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
-   发布前弹出确认框，若探测到 `publishedAt` 为未来时间，底部主按钮文字变为“计划发布”。
-   提供取消计划的入口。

### 6.2 状态提示
-   列表页使用特殊的颜色（如紫色）标记 `SCHEDULED` 状态。
