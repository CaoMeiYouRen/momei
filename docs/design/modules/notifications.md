# 订阅中心与通知系统 (Subscription & Notification System)

## 1. 概述 (Overview)

本模块旨在为用户提供中心化的订阅管理和通知偏好设置，同时为管理员提供轻量化的营销内容分发中心。系统明确区分**强制性系统通知**与**可选性营销通知**，确保用户体验与合规性。

## 2. 核心架构 (Core Architecture)

### 2.1 统一通知矩阵 (Unified Notification Matrix)

系统基于“事件 (Event) x 渠道 (Channel)”的矩阵模式管理所有通知。

- **事件 (Event)**: 系统中触发通知的动作（如：新评论、用户注册、密码重置、文章发布）。
- **渠道 (Channel)**: 通知送达的方式（如：邮件、站内信、Web Push、SMS、Webhook）。
- **控制逻辑**:
    - **系统默认 (Admin Matrix)**: 管理员全局配置哪些事件允许开启哪些渠道，并标记哪些是“强制性 (Mandatory)”的。
        - **注意**: 集成在 `better-auth` 中的核心事件（如 OTP、重置密码）在矩阵中仅作为“只读”展示，确保管理员了解其触发逻辑但无法错误关闭。
    - **用户偏好 (User Matrix)**: 用户在管理员允许的范围内，自主选择是否开启特定渠道。对于强制性通知，用户不可关闭。

### 2.2 流程生命周期 (Lifecycle)

1. **触发 (Trigger)**: 业务逻辑调用 `notificationService.send(eventId, data, recipients)`.
2. **过滤 (Filter)**: 
    - 检查 Admin 配置：该事件在此渠道是否启用？
    - 检查 User 配置：用户是否订阅了此事件的此渠道？(若是 Mandatory 则跳过此步)。
3. **分发 (Dispatch)**: 根据渠道调用对应的适配器（EmailAdapter, InAppAdapter 等）。
4. **清理 (Cleanup)**: 针对非持久化渠道同步完成；针对站内信，根据保留策略定期清理旧记录。

## 3. 数据库设计 (Database Schema)

### 3.1 事件定义 (NotificationEvent - 枚举)
事件 ID 采用命名空间格式：`模块.对象.动作`。

| 分类 | 事件 ID 示例 | 说明 | 强制性建议 | 管理权限 |
| :--- | :--- | :--- | :--- | :--- |
| **认证** | `auth.user.otp` | 登录验证码 | 是 | 只读 (Better-Auth) |
| | `auth.user.reset_pwd` | 密码重置链接 | 是 | 只读 (Better-Auth) |
| **站务** | `audit.comment.new` | 管理员收到新评论 | 否 | 可编辑 |
| | `system.error.api` | API 异常警报 | 否 | 可编辑 |
| **交互** | `social.comment.reply` | 评论被回复 | 否 | 可编辑 |
| **营销** | `marketing.blog.publish` | 新文章发布 | 否 | 可编辑 |

### 3.2 矩阵配置表
/* ...existing code... */

### 3.4 通知统计表 (`NotificationStatistics`)
记录每日或核心维度的推送消耗，用于成本控制与异常监测。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `date` | `date` | 统计日期 |
| `eventId` | `string` | 事件 ID |
| `channel` | `string` | 渠道 |
| `count` | `number` | 发送成功次数 |
| `failCount` | `number` | 发送失败次数 |
| `costInfo` | `json` | 预估成本（可选，如邮件服务商计费） |

#### 管理员矩阵 (`AdminNotificationConfig`)
定义全局规则。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `eventId` | `string` | 事件 ID (枚举值) |
| `channel` | `string` | 渠道 (EMAIL, IN_APP, etc.) |
| `isEnabled` | `boolean` | 全局是否启用 |
| `isMandatory` | `boolean` | 是否强制（用户不可在前端关闭） |

#### 用户矩阵 (`UserNotificationPreference`)
记录个人偏好。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `userId` | `string` | 用户 ID |
| `eventId` | `string` | 事件 ID |
| `channel` | `string` | 渠道 |
| `isEnabled` | `boolean` | 个人是否开启 |

### 3.3 站内信表 (`InAppNotification`)
存储用户可阅读的历史记录。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `userId` | `string` | 接收者 ID |
| `title` | `string` | 国际化标题 |
| `content` | `text` | 国际化正文 |
| `link` | `string` | 点击跳转链接 |
| `isRead` | `boolean` | 已读状态 |
| `expiresAt` | `datetime` | 过期时间 (用于自动清理) |

## 4. 界面设计 (UI/UX Design)

### 4.1 管理员：通知控制台 (Admin Notification Console)
- **位置**: 后台管理 -> 系统设置 -> 通知中心。
- **展示矩阵**: 
    - 列表展示所有触发事件。
    *Better-Auth 事件*（如找回密码）标记为“系统级/核心”，开关为禁用状态但显示为开启。
- **监控仪表盘**: 
    - **今日概览**: 实时显示各渠道发送量（Email/In-App）。
    - **成本看板**: 根据发送频率计算预估消耗，设定“消耗预警阈值”，超过阈值（如一小时内发送超过 500 封邮件）自动锁定营销通道并通知管理员。
    - **异常检测**: 监控验证码类邮件的请求频率，识别恶意刷信行为。

### 4.2 用户：订阅管理 (User Subscription Center)
- **位置**: 个人中心 -> 订阅与通知。
- **展示**: 
    - **频道管理**: 快速开启/重置所有邮件或站内信。
    - **精细化设置**: 管理员标记为“可选”的事件列表，用户可勾选不同渠道。

### 4.3 用户：站内通知中心 (User Notification Hub)
- **入口**: 顶部导航铃铛点击“查看全部”。
- **功能**:
    - 列表展示所有历史通知，支持按“未读/已读”筛选。
    - 提供“全部标记已读”按钮。
    - 自动清理：系统仅保留最近 30 天或 100 条记录（以先到者为准）。

## 5. 扩展性设计 (Extensibility)

### 5.1 新渠道接入流程
1. 在 `NotificationChannel` 枚举中增加新项。
2. 实现 `NotificationAdapter` 接口（含 `send` 方法）。
3. 在 `notificationService` 中注册该适配器。
4. 管理员矩阵中自动出现该新渠道的列。

### 5.2 必选通知逻辑 (Business Critical)
对于“找回密码”、“登录验证”等核心流程，即使管理员在矩阵中误关闭，底层 Service 仍应具备“金牌通道”逻辑，确保业务不中断。

## 6. API 接口设计 (API Design)

### 7.1 用户侧 (User Side)

- `GET /api/user/subscription`: 获取当前登录用户的订阅详情和偏好。
- `PUT /api/user/subscription`: 更新用户的多维度订阅设置（分类/标签/营销开关）。
- `GET /api/user/notifications/settings`: 获取通知渠道偏好。
- `PUT /api/user/notifications/settings`: 更新通知偏好。

### 7.2 管理员侧 (Admin Side)

- `GET /api/notifications/stream`: **SSE 实时连接**: 建立双向通信通道。
- `POST /api/admin/notifications/broadcast`: **全站广播**: 向所有在线/离线用户发送实时通知。
- `POST /api/admin/marketing/campaigns`: 创建营销推送草案。
- `POST /api/admin/marketing/campaigns/:id/send`: 触发推送任务。
- `GET /api/admin/marketing/campaigns`: 获取推送历史记录。
- `GET /api/admin/notifications/settings`: 获取站务通知接收偏好。
- `PUT /api/admin/notifications/settings`: 更新站务通知接收偏好。
- `POST /api/admin/marketing/from-post/:postId`: **核心联动**: 从特定文章快速生成营销推送。
- `GET /api/admin/notifications/stats`: **成本控制**: 获取指定时间范围内的渠道消耗统计数据。
- `GET /api/admin/notifications/alerts`: 获取异常发送警报记录。

## 8. UI/UX 设计 (UI/UX Design)

### 8.1 站内通知中心 (In-app Notifications)
- **入口**: 顶部导航栏铃铛图标。
- **状态**: 红点展示未读计数，SSE 实时更新。
- **交互**: 点击展开最近 10 条通知，支持点击跳转关联资源及标记已读。

### 8.2 用户设置页 (Settings Page)
在 `pages/settings.vue` 中新增 “订阅与通知 (Subscription & Notifications)” 标签页。
- **涉及组件**:
    - [pages/settings.vue](pages/settings.vue): 增加侧边栏入口。
    - [components/settings/settings-notifications.vue](components/settings/settings-notifications.vue) (新): 提供订阅与通知的配置表单。

### 8.3 管理员营销中心 (Admin Marketing Center)
- **涉及组件**:
    - [pages/admin/marketing.vue](pages/admin/marketing.vue) (新): 营销中心主页。
    - [components/admin/marketing-campaign-form.vue](components/admin/marketing-campaign-form.vue): 增加 `type` 选择和更丰富的预览。

## 9. 技术实现要点 (Implementation Details)

- **实时中心 (SSE Hub)**:
    - [server/api/notifications/stream.get.ts](server/api/notifications/stream.get.ts): 管理心跳与连接生命周期。
    - [composables/use-notifications.ts](composables/use-notifications.ts): 实现“SSE 优先 -> 轮询降级”的健壮逻辑。
- **数据库实体**:
    - [server/entities/in-app-notification.ts](server/entities/in-app-notification.ts): 记录通知状态。
    - [server/entities/subscriber.ts](server/entities/subscriber.ts): 扩展字段。
    - [server/entities/marketing-campaign.ts](server/entities/marketing-campaign.ts) (新): 记录营销任务。
- **API 路由**:
    - [server/api/notifications/index.get.ts](server/api/notifications/index.get.ts)
    - [server/api/notifications/read.put.ts](server/api/notifications/read.put.ts)
    - [server/api/user/subscription.get.ts](server/api/user/subscription.get.ts)
    - [server/api/user/subscription.put.ts](server/api/user/subscription.put.ts)
- **后台任务**: 推送任务通过异步队列执行。
- **频率限制**: 营销邮件应强制包含退订链接及发送频率控制。

## 10. 未来规划与积压项 (Future Planning & Backlog)

### 10.1 浏览器推送 (Web Push)
- **技术栈**: Web Push API + Service Worker + VAPID 协议。
- **功能**: 支持网页关闭时接收关键业务通知（如评论被回复、系统警报）。

### 10.2 推送统计增强 (Advanced Analytics)
- **指标**: 记录邮件打开率、点击率（通过追踪像素/重定向链接）。
