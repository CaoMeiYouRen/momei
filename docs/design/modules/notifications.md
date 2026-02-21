# 订阅中心与通知系统 (Subscription & Notification System)

## 1. 概述 (Overview)

本模块旨在为用户提供中心化的订阅管理和通知偏好设置，同时为管理员提供轻量化的内容分发中心。系统通过“通知矩阵”支持对不同事件与渠道的精细化控制。

## 2. 核心架构：通知矩阵 (Notification Matrix)

系统基于“事件 (Event) x 渠道 (Channel)”的矩阵模式管理所有通知。

- **事件 (Event)**: 系统中触发通知的动作（如：认证、审计、交互、营销）。
- **渠道 (Channel)**: 通知送达的方式（如：EMAIL - 邮件、IN_APP - 站内信、WEB_PUSH - 浏览器推送）。
- **优先级/分级**:
    - **系统级 (System)**: 核心业务（如 OTP 验证码），开关固定为开启且不可由普通管理员/用户关闭。
    - **营销/站务**: 允许管理员在后台配置全局开关及默认偏好，用户可自行在个人设置中覆盖配置。

## 3. 数据库设计 (Database Schema)

### 3.1 管理员通知配置 (`AdminNotificationConfig`)
定义全局规则。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `eventId` | `string` | 事件唯一标识 |
| `channel` | `string` | 渠道类型 |
| `isEnabled` | `boolean` | 全局是否启用 |
| `isMandatory` | `boolean` | 是否强制（用户不可关闭） |

### 3.2 用户通知偏好 (`UserNotificationPreference`)
记录个人选择。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `userId` | `string` | 用户 ID |
| `eventId` | `string` | 事件 ID |
| `channel` | `string` | 渠道类型 |
| `isEnabled` | `boolean` | 个人是否针对此事件/渠道开启 |

### 3.3 站内信记录 (`InAppNotification`)
存储用户可阅读的历史记录。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `userId` | `string` | 接收者 ID |
| `title` | `json` | 国际化标题（如 `{ en: "...", zh: "..." }`） |
| `content` | `text` | 国际化正文 |
| `isRead` | `boolean` | 已读状态 |
| `expiresAt` | `datetime` | 自动清理时间 (默认 30-90 天) |

## 4. 实时通信 (Real-time Messaging)
系统通过 **SSE (Server-Sent Events)** 实现站内信的实时推送。
- 入口：`GET /api/notifications/stream`。
- 回退：若 SSE 不可用，前端将降级为长轮询。

## 5. 成本监控与统计
`NotificationStatistics` 表记录每日各渠道的发送量，支持管理员查看推送成本分析与异常频率告警。

---
> 关联代码: `server/services/notification.ts` | `composables/use-notifications.ts`
