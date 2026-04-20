# 定时任务与发布功能设计 (Scheduled Tasks & Publication Design)

## 1. 概述

当前定时任务模块已经形成“统一任务引擎 + 多环境触发适配”的实际实现，用于处理：

- 文章定时发布
- 营销任务定时执行
- AI 媒体超时巡检与状态补偿
- 友链可用性巡检

设计重点不再是“是否可行”，而是不同部署环境如何安全触发同一条任务执行链路。

## 2. 当前执行模型

### 2.1 统一任务引擎

任务执行逻辑当前分成两层：

- `processScheduledTasks()`：负责文章定时发布与营销任务执行
- `runRoutineMaintenanceTasks()`：在统一调度任务之后补充执行 AI 媒体超时补偿与友链巡检

相关文件：

- [server/services/task.ts](../../server/services/task.ts)
- [server/services/ai/media-task-monitor.ts](../../server/services/ai/media-task-monitor.ts)
- [server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts)
- [server/api/tasks/run-scheduled.post.ts](../../server/api/tasks/run-scheduled.post.ts)
- [server/routes/_scheduled.ts](../../server/routes/_scheduled.ts)

### 2.2 自部署触发

[server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts) 在非 Serverless 环境下注册 CronJob：

- 主任务默认表达式：`*/5 * * * *`
- 时区：`UTC`
- 主任务会依次执行：文章 / 营销定时任务 + AI 媒体超时补偿
- 可通过 `TASK_CRON_EXPRESSION` 覆盖
- 当检测到 Serverless 环境或 `DISABLE_CRON_JOB=true` 时自动禁用

此外，自部署环境还保留一条独立的友链巡检 Cron：

- 默认表达式：`0 2 * * *`
- 可通过 `FRIEND_LINKS_CHECK_CRON` 覆盖
- 仍会受到友链服务内部的最小巡检间隔和失败退避窗口约束

### 2.3 Serverless 触发

当前项目已正式支持一类 Serverless 触发方式，并保留一条 Cloudflare 实验入口：

- Vercel Cron：通过 [vercel.json](../../vercel.json) 调用 `/api/tasks/run-scheduled`
- Cloudflare 实验入口：通过 [wrangler.toml](../../wrangler.toml) 与 [server/routes/_scheduled.ts](../../server/routes/_scheduled.ts) 保留外围能力探索痕迹

其中 Cloudflare 路由要求存在 `cf-scheduled` 请求头，否则直接返回 404；但根据 Cloudflare 官方文档，正式 Cron Trigger 入口应为 `scheduled()` 处理器，因此这一路径当前只能视为实验性适配入口，不构成整站 Cloudflare 运行时支持承诺。完整研究见 [Cloudflare 运行时兼容研究与止损结论](../governance/cloudflare-runtime-study.md)。

补充说明：

- 自部署环境下，主 Cron 会补充执行 AI 媒体超时补偿；友链巡检由 [server/plugins/task-scheduler.ts](../../server/plugins/task-scheduler.ts) 中的独立 Cron 表达式驱动。
- Serverless 或手动触发入口下，`/api/tasks/run-scheduled` 与实验性 [server/routes/_scheduled.ts](../../server/routes/_scheduled.ts) 会在执行统一调度任务后补充执行一次 AI 媒体超时补偿和友链巡检。
- AI 媒体巡检会先做分布式锁与数据库级 claim/lease 认领，再尝试补偿 stale 任务，以降低 Vercel / 自部署多实例并发下的重复补偿风险。
- 友链实际探测仍会受到最小巡检间隔与失败退避冷却约束。

## 3. Webhook 安全模型

### 3.1 HMAC 模式

当前推荐模式为 HMAC 签名校验，实际实现位于 [server/utils/webhook-security.ts](../../server/utils/webhook-security.ts)。

请求头约定：

- `X-Webhook-Signature`
- `X-Webhook-Timestamp`
- `X-Webhook-Source`

签名载荷格式为：

`timestamp + "\n" + source + "\n" + body`

当前实现特征：

- 默认容差 5 分钟
- 使用 `timingSafeEqual` 避免时序攻击
- 默认算法为 `sha256`

### 3.2 Token 兼容模式

为兼容旧触发器，当前仍保留简单 Token 模式：

- 请求头 `X-Tasks-Token`
- 或查询参数 `?token=...`

### 3.3 Vercel Cron 模式

Vercel Cron 会自动把项目中的 `CRON_SECRET` 作为 `Authorization: Bearer <secret>` 发送到任务端点。

由于 Vercel Hobby 套餐限制单个 Cron 任务每天仅能执行一次，本项目采取了**多任务分发策略**：

- **实现方式**：在 [vercel.json](../../vercel.json) 中配置多个独立的 Cron 任务（默认为 12 个）。
- **调度频率**：采取**隔小时触发**策略（如 00:00, 02:00 等），以规避 Vercel Hobby 套餐 $\pm 59$ 分钟的调度偏移导致的并发冲突。
- **自定义建议**：若用户不需要高频执行，建议删除 [vercel.json](../../vercel.json) 中的冗余任务以节省 Serverless 额度；若需更高频率，可继续添加任务并保持至少 1 小时的理论间隔。
- **鉴权机制**：Vercel 使用 [server/api/tasks/run-scheduled.get.ts](../../server/api/tasks/run-scheduled.get.ts) 处理平台默认 GET 调用。
- **配置要求**：需在 Vercel 项目控制面板添加 `CRON_SECRET` 环境变量。

### 3.4 环境行为

| 环境/条件 | 行为 |
| :--- | :--- |
| 已配置 HMAC 头 | 走签名校验 |
| 已配置 `CRON_SECRET` 且存在 `Authorization: Bearer` | 走 Vercel Cron 鉴权 |
| 未配置 HMAC，但存在 `TASKS_TOKEN` | 走 Token 校验 |
| 生产环境且无任何安全配置 | 拒绝执行 |
| 开发环境且无安全配置 | 允许执行并记录警告 |

## 4. 平台适配现状

### 4.1 Vercel

[vercel.json](../../vercel.json) 当前配置为每天执行一次：

- 路径：`/api/tasks/run-scheduled`
- 计划：`0 0 * * *`
- 请求方法：`GET`
- 鉴权头：`Authorization: Bearer ${CRON_SECRET}`

执行结果会返回结构化摘要，至少包含：

- 已执行来源 `source`
- 友链巡检结果 `friendLinksChecked`
- AI 媒体补偿摘要 `aiMediaCompensation`

### 4.2 Cloudflare（实验性外围入口）

[wrangler.toml](../../wrangler.toml) 当前配置为每 15 分钟一次：

- 计划：`*/15 * * * *`

这两种频率不同是部署平台适配策略的一部分，而不是文档误差。

但需要明确：

- 这里记录的是当前仓库保留的探索入口，不代表 Cloudflare Pages / Workers 已成为正式运行环境。
- 当前更推荐的 Cloudflare 任务接入方式，是让 Cloudflare 作为外围调度器调用 [server/api/tasks/run-scheduled.post.ts](../../server/api/tasks/run-scheduled.post.ts)，而不是把完整任务执行链迁到 Cloudflare 运行时。
- 是否重新推进 Cloudflare 正式任务模型，应以 [Cloudflare 运行时兼容研究与止损结论](../governance/cloudflare-runtime-study.md) 为准。

补充说明：高频的统一调度入口并不意味着友链会被高频重复探测。友链服务会基于 `friend_links_check_interval_minutes` 和失败退避窗口筛选“已到期”的候选项，仅对到期记录执行网络请求。

同理，AI 媒体补偿也不是“每次都重新生成媒体”，而是仅扫描超过超时阈值、长时间无更新的 `pending` / `processing` 任务，并根据 checkpoint 决定补写、续跑或最终失败落点。

## 5. 当前边界

以下内容仍然属于后续增强项：

- 更细粒度的任务执行报表
- 后台手动重试与任务可视化控制台
- 更丰富的触发来源白名单与专用密钥轮换策略

另外，当前实现并未读取 `WEBHOOK_TIMESTAMP_TOLERANCE` 环境变量，文档不再把它描述为现有配置项。

## 6. 相关文档

- [系统能力与设置](./system.md)
- [模块索引](./index.md)
