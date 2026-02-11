# 订阅中心与通知系统 (Subscription & Notification System)

## 1. 概述 (Overview)

本模块旨在为用户提供中心化的订阅管理和通知偏好设置，同时为管理员提供轻量化的营销内容分发中心。系统明确区分**强制性系统通知**与**可选性营销通知**，确保用户体验与合规性。

## 2. 核心概念 (Core Concepts)

- **系统通知 (System Notifications)**: 涉及账户安全、法律合规及核心业务变更的通知。此类通知通常是强制性的。
- **营销通知 (Marketing Notifications)**: 涉及内容更新、功能推荐及活动推广的通知。此类通知由管理员发起，用户可自主选择订阅或退订。
- **维度级订阅 (Dimensional Subscription)**: 允许用户按分类 (Categories) 或标签 (Tags) 订阅特定内容的更新。

## 3. 数据库设计 (Database Schema)

### 3.1 订阅者表 (`Subscriber`) 扩展
现有的 `Subscriber` 表需要扩展以支持多维度订阅偏好。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `subscribedCategories` | `json` | 订阅的分类 ID 数组 |
| `subscribedTags` | `json` | 订阅的标签 ID 数组 |
| `isMarketingEnabled` | `boolean` | 是否开启营销类邮件通知 |

### 3.2 通知设置表 (`NotificationSettings`)
存储用户对不同类型通知的接收偏好。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `userId` | `string` | 关联的用户 ID |
| `type` | `enum` | 通知类型 (SECURITY, SYSTEM, MARKETING, COMMENT_REPLY) |
| `channel` | `enum` | 通知渠道 (目前支持 EMAIL，规划中：IN_APP) |
| `isEnabled` | `boolean` | 是否开启 |

### 3.3 营销推送表 (`MarketingCampaign`)
存储管理员发送的营销推送记录。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `title` | `string` | 推送标题 |
| `content` | `text` | 推送正文 (支持简单的 HTML/Markdown) |
| `type` | `enum` | 邮件类型: <br> - `UPDATE`: 版本更新 <br> - `FEATURE`: 功能推荐 <br> - `PROMOTION`: 活动推广 <br> - `BLOG_POST`: 博客发布 <br> - `MAINTENANCE`: 停机维护 <br> - `SERVICE`: 服务变动 |
| `targetCriteria` | `json` | 推送目标条件 (如特定标签/分类订阅者) |
| `senderId` | `string` | 发送管理员 ID |
| `sentAt` | `datetime` | 实际发送完成时间 |
| `scheduledAt` | `datetime` | 计划发送时间 (若为定时任务) |
| `status` | `enum` | 状态 (DRAFT, SCHEDULED, SENDING, COMPLETED, FAILED) |

### 3.4 管理员通知配置 (`AdminNotificationSettings`)
存储管理员对站务事件的接收偏好。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `event` | `enum` | 场景: `NEW_USER`, `NEW_COMMENT`, `API_ERROR`, `SYSTEM_ALERT` |
| `isEmailEnabled` | `boolean` | 是否发送邮件 |
| `isBrowserEnabled` | `boolean` | 是否发送浏览器通知 |

## 4. 博客发布集成 (Blog Integration)

### 4.1 自动推送流程 (自动化与人工介入权衡)
1. **触发条件**: 管理员点击“发布”按钮。
2. **二次确认 (Secondary Confirmation)**: 弹出一个小对话框，询问管理员：
    - [ ] **不同步推送**: 仅发布文章。
    - [ ] **存为推送草稿**: 自动生成营销记录，状态为 `DRAFT`，不实际发信。
    - [ ] **立即推送到订阅者**: 自动生成记录并立即加入发送队列。
3. **逻辑执行**:
    - 仅在文章状态从 `DRAFT` 或 `HIDDEN` 变为 `PUBLISHED` 的**首次**发布时生效。
    - 系统自动以文章标题为 `MarketingCampaign.title`，以摘要和封面图为 `content`。
    - 目标人群默认为文章所属分类/标签的订阅者。

### 4.2 手动重新推送 (Manual Re-push)
- **入口**: 在文章管理列表或编辑页详情中。
- **功能**: 对于状态已为 `PUBLISHED` 的文章，允许管理员随时触发“重新推送”。
- **确认逻辑**: 同样提供“存为草稿”与“立即发送”的选择，或直接打开完整的营销编辑器进行微调。

### 4.3 定时推送 (Scheduled Push)
除博客关联推送外，独立的营销任务也支持定时发送。
1.  **设置**: 在营销编辑器中选择“计划发送时间”。
2.  **状态**: 任务保存后进入 `SCHEDULED` 状态。
3.  **扫描**: 任务引擎 (`server/services/task.ts`) 每 5 分钟扫描一次。
4.  **执行**: 到达预定时间后，引擎自动调用推送接口。

## 5. 邮件模板系统 (Email Templates)

### 5.1 动态变量 (Dynamic Variables)
- `{{userName}}`: 订阅者用户名/称呼。
- `{{articleTitle}}`: 博客文章标题。
- `{{articleSummary}}`: 博客摘要。
- `{{articleCover}}`: 博客封面图 URL。
- `{{articleLink}}`: 文章永久链接。
- `{{siteUrl}}`: 博客主站链接。
- `{{unsubLink}}`: 一键退订链接。

### 5.2 布局设计 (Card-Style HTML)
借鉴 `components/article-card.vue` 的视觉风格，采用响应式 HTML 骨架：
- **卡片容器**: 居中对齐，背景色 `#ffffff`，圆角 `8px`，轻微投影。
- **封面图**: 如果有 `articleCover`，显示在最上方，铺满宽度。
- **内容区**:
    - **标题**: `font-size: 20px; font-weight: bold; color: #333; margin-bottom: 12px;`
    - **元信息**: 分类名称或发布时间。
    - **摘要**: `color: #666; font-size: 14px; line-height: 1.6;`
- **操作区**: 居中的“阅读全文”按钮，背景色根据博客主色调动态填充。
- **Footer**: 备案信息、社交媒体链接及**居中的退订链接**。

## 6. 管理员站务通知场景 (Admin Notification Scenarios)

管理员可配置在以下事件发生时接收邮件或站内通知：
- **NEW_USER**: 当有新的订阅者或注册用户时。
- **NEW_COMMENT**: 收到新评论（待审核）。
- **API_ERROR**: 关键接口（如邮件发送接口、数据库迁移）报错时。
- **SYSTEM_ALERT**: 登录异地提醒、连续登录失败或磁盘空间不足建议。

## 7. API 接口设计 (API Design)

### 7.1 用户侧 (User Side)

- `GET /api/user/subscription`: 获取当前登录用户的订阅详情和偏好。
- `PUT /api/user/subscription`: 更新用户的多维度订阅设置（分类/标签/营销开关）。
- `GET /api/user/notifications/settings`: 获取通知渠道偏好。
- `PUT /api/user/notifications/settings`: 更新通知偏好。

### 7.2 管理员侧 (Admin Side)

- `POST /api/admin/marketing/campaigns`: 创建营销推送草案。
- `POST /api/admin/marketing/campaigns/:id/send`: 触发推送任务。
- `GET /api/admin/marketing/campaigns`: 获取推送历史记录。
- `GET /api/admin/notifications/settings`: 获取站务通知接收偏好。
- `PUT /api/admin/notifications/settings`: 更新站务通知接收偏好。
- `POST /api/admin/marketing/from-post/:postId`: **核心联动**: 从特定文章快速生成营销推送。

## 8. UI/UX 设计 (UI/UX Design)

### 8.1 用户设置页 (Settings Page)
在 `pages/settings.vue` 中新增 “订阅与通知 (Subscription & Notifications)” 标签页。
- **涉及组件**:
    - [pages/settings.vue](pages/settings.vue): 增加侧边栏入口。
    - [components/settings/settings-notifications.vue](components/settings/settings-notifications.vue) (新): 提供订阅与通知的配置表单。

### 8.2 管理员营销中心 (Admin Marketing Center)
- **涉及组件**:
    - [pages/admin/marketing.vue](pages/admin/marketing.vue) (新): 营销中心主页。
    - [components/admin/marketing-campaign-form.vue](components/admin/marketing-campaign-form.vue): 增加 `type` 选择和更丰富的预览。

## 9. 技术实现要点 (Implementation Details)

- **数据库实体**:
    - [server/entities/subscriber.ts](server/entities/subscriber.ts): 扩展字段。
    - [server/entities/marketing-campaign.ts](server/entities/marketing-campaign.ts) (新): 记录营销任务。
- **API 路由**:
    - [server/api/user/subscription.get.ts](server/api/user/subscription.get.ts)
    - [server/api/user/subscription.put.ts](server/api/user/subscription.put.ts)
- **后台任务**: 推送任务通过异步队列执行。
- **频率限制**: 营销邮件应强制包含退订链接及发送频率控制。

## 10. 未来规划与积压项 (Future Planning & Backlog)

### 10.1 站内通知与实时推送 (In-app & SSE)
- **目标**: 实现无需刷新页面的实时通知提醒。
- **技术**: 采用 **SSE (Server-Sent Events)** 实现轻量化推送。
- **存储**: 引入 `InAppNotification` 实体持久化通知，支持未读计数。
- **UI**: 增加顶部导航铃铛组件及 Toast 实时浮层。

### 10.2 浏览器推送 (Web Push)
- **技术栈**: Web Push API + Service Worker + VAPID 协议。
- **功能**: 支持网页关闭时接收关键业务通知（如评论被回复、系统警报）。

### 10.3 推送统计增强 (Advanced Analytics)
- **指标**: 记录邮件打开率、点击率（通过追踪像素/重定向链接）。
