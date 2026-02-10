# 定时发布功能设计 (Scheduled Publication Design)

## 1. 概述 (Overview)

本模块旨在实现文章的定时发布功能。由于项目需要兼容**自部署 (VPS/Docker)** 与 **Serverless (Cloud Functions)** 环境，设计上采用“业务逻辑解耦，触发方式适配”的原则。

## 2. 核心架构 (Architecture)

### 2.1 任务执行引擎 (Task Engine)
位于 `server/services/task.ts`，负责核心检索与状态变更逻辑。
1.  检索所有 `status === 'scheduled'` 且 `publishedAt <= now()` 的文章。
2.  循环处理：
    -   将状态变更为 `published`。
    -   触发副作用：同步到 Memos、发送全球通知（邮件/RSS）。
3.  保存数据。

### 2.2 环境适配器 (Environment Adapters)

- **自部署 (Self-hosted)**:
    -   利用 Nitro 的 `server/plugins`。
    -   使用 `cron` 库 (`CronJob`) 替代 `setInterval`，以获得更精确的调度控制。
    -   **分布式锁 (Multi-instance Safety)**: 
        -   集成 `ioredis` 实现分布式锁。
        -   任务执行前尝试获取键为 `momei:lock:publish-scheduled` 的锁，超时时间设为 10 分钟。
        -   如果没有配置 Redis，则在单进程环境下直接运行（降级）。

- **Serverless (如 Vercel, Zeabur)**:
    -   由于 Serverless 环境无法维持后台进程，`cron` 插件将被禁用。
    -   暴露受保护的 API 接口：`POST /api/tasks/run-scheduled`。
    -   **安全机制**:
        -   配置环境变量 `TASKS_TOKEN`。
        -   接口校验请求头 `X-Tasks-Token` 或 `?token=...`。
    -   用户可配置外部 Cron 触发（如 Vercel Cron, GitHub Actions, 或 NAS 定时脚本）。

## 3. 数据库与意图持久化 (Data & Persistence)

### 3.1 发布意图 (Publish Intent)
由于发布是一个包含多项副作用的操作，定时发布时必须能够还原作者的原始选择。这些选项将存储在 `Post` 实体的 `scaffoldMetadata` 字段中（JSON 格式）：

```json
{
  "publishIntent": {
    "syncToMemos": true,
    "pushOption": "now",
    "pushCriteria": { "categoryIds": [], "tagIds": [] }
  }
}
```

### 3.2 PostStatus 枚举
-   新增 `SCHEDULED = 'scheduled'`。
-   转换路径扩展：
    -   `DRAFT` -> `SCHEDULED` (校验 `publishedAt` > now)
    -   `PENDING` -> `SCHEDULED` (管理员审核通过)
    -   `SCHEDULED` -> `PUBLISHED` (执行引擎自动触发)
    -   `SCHEDULED` -> `DRAFT/HIDDEN` (手动撤回)

## 4. 业务逻辑分离 (Logic Separation)

1.  **副作用剥离**: 将文章发布后的同步、推送等逻辑封装至 `server/services/post-publish.ts` 中的 `executePublishEffects` 方法。
2.  **任务引擎**: `server/services/task.ts` 中的 `processScheduledPosts` 负责查找、锁竞争、状态更新及调用 `executePublishEffects`。

## 5. 前端交互 (User Experience)

### 5.1 编辑器 (`admin/article-editor.vue`)
-   发布按钮增加下拉菜单或切换模式。
-   若 `publishedAt` 被设置为未来某个时间，点击发布时自动识别为“定时发布”。
-   显示明显的“定时中”标签。

### 5.2 状态管理
-   列表页增加针对“定时发布”的筛选与标识。

## 6. 安全与成本 (Security & Cost)

-   **防抖与频率限制**: Webhook 接口应具备简单的防抖机制，避免被恶意高频调用。
-   **日志**: 记录每次定时任务的执行结果（成功数、失败数、耗时）。
