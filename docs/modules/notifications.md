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
| `channel` | `enum` | 通知渠道 (EMAIL, IN_APP) |
| `isEnabled` | `boolean` | 是否开启 |

### 3.3 营销推送表 (`MarketingCampaign`)
存储管理员发送的营销推送记录。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `title` | `string` | 推送标题 |
| `content` | `text` | 推送正文 (支持简单的 HTML/Markdown) |
| `targetCriteria` | `json` | 推送目标条件 (如特定标签/分类订阅者) |
| `senderId` | `string` | 发送管理员 ID |
| `sentAt` | `datetime` | 发送时间 |
| `status` | `enum` | 状态 (DRAFT, SENDING, COMPLETED, FAILED) |

## 4. API 接口设计 (API Design)

### 4.1 用户侧 (User Side)

- `GET /api/user/subscription`: 获取当前登录用户的订阅详情和偏好。
- `PUT /api/user/subscription`: 更新用户的多维度订阅设置（分类/标签/营销开关）。
- `GET /api/user/notifications/settings`: 获取通知渠道偏好。
- `PUT /api/user/notifications/settings`: 更新通知偏好。

### 4.2 管理员侧 (Admin Side)

- `POST /api/admin/marketing/campaigns`: 创建营销推送草案。
- `POST /api/admin/marketing/campaigns/:id/send`: 触发推送任务。
- `GET /api/admin/marketing/campaigns`: 获取推送历史记录。
- `GET /api/admin/marketing/stats`: 获取推送统计（到达率、点击率预留等）。

## 5. UI/UX 设计 (UI/UX Design)

### 5.1 用户设置页 (Settings Page)
在 `pages/settings.vue` 中新增 “订阅与通知 (Subscription & Notifications)” 标签页。
- **涉及组件**:
    - [pages/settings.vue](pages/settings.vue): 增加侧边栏入口。
    - [components/settings/settings-notifications.vue](components/settings/settings-notifications.vue) (新): 提供订阅与通知的配置表单。
- **功能点**: 
    - 列表展示所有分类和热门标签的复选框。
    - “系统通知”展示（只读或部分敏感配置）。
    - “营销通知”开关。

### 5.2 管理员营销中心 (Admin Marketing Center)
- **涉及组件**:
    - [pages/admin/marketing.vue](pages/admin/marketing.vue) (新): 营销中心主页。
    - [components/admin/marketing-campaign-form.vue](components/admin/marketing-campaign-form.vue) (新): 创建营销任务的表单，包含 Target Picker（目标选择器）。
    - [components/admin/marketing-campaign-list.vue](components/admin/marketing-campaign-list.vue) (新): 已发送/待发送任务列表。

## 6. 技术实现要点 (Implementation Details)

- **数据库实体**:
    - [server/entities/subscriber.ts](server/entities/subscriber.ts): 扩展字段。
    - [server/entities/marketing-campaign.ts](server/entities/marketing-campaign.ts) (新): 记录营销任务。
- **API 路由**:
    - [server/api/user/subscription.get.ts](server/api/user/subscription.get.ts)
    - [server/api/user/subscription.put.ts](server/api/user/subscription.put.ts)
    - [server/api/admin/marketing/campaigns.post.ts](server/api/admin/marketing/campaigns.post.ts)
- **后台任务**: 推送任务应通过异步队列（如集成现有的 `server/utils/tasks` 或简单后台进程）执行。
- **频率限制**: 营销邮件应强制包含退订链接及发送频率控制。
