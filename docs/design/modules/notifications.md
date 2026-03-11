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

### 3.4 浏览器推送订阅 (`WebPushSubscription`)
存储每个登录设备的浏览器推送订阅信息。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `userId` | `string` | 订阅所属用户 |
| `endpoint` | `string` | Push Service 端点，按用户 + 端点去重 |
| `subscription` | `json` | 浏览器返回的 PushSubscription 对象 |
| `permission` | `string` | 最近一次同步的权限状态（default / granted / denied） |
| `userAgent` | `string` | 设备浏览器信息，便于排查 |
| `locale` | `string` | 同步订阅时的语言环境 |

### 3.5 通知投递日志 (`NotificationDeliveryLog`)
统一沉淀通知事件在不同渠道上的投递结果，供管理员审计查询使用。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `notificationId` | `string \\| null` | 关联的站内通知 ID |
| `userId` | `string \\| null` | 接收用户 ID |
| `channel` | `string` | 投递渠道（IN_APP / SSE / EMAIL / WEB_PUSH） |
| `status` | `string` | 投递结果（SUCCESS / FAILED / SKIPPED） |
| `notificationType` | `string` | 通知类型（SYSTEM / SECURITY / COMMENT_REPLY 等） |
| `title` | `string` | 通知标题 |
| `recipient` | `string \\| null` | 接收对象展示值（邮箱、用户标识或 broadcast） |
| `targetUrl` | `string \\| null` | 点击跳转目标 |
| `errorMessage` | `string \\| null` | 失败或跳过原因 |
| `sentAt` | `datetime` | 实际投递时间 |
| `metadata` | `json \\| null` | 渠道扩展信息（如连接数、推送尝试次数） |

## 4. 实时通信 (Real-time Messaging)
系统通过 **SSE (Server-Sent Events)** 实现站内信的实时推送。
- 入口：`GET /api/notifications/stream`。
- 回退：若 SSE 不可用，前端将降级为长轮询。

## 5. 浏览器推送补强 (Web Push Reinforcement)

### 5.1 首轮策略

- 在线场景优先复用 SSE，不重复发送 Web Push。
- 离线场景仅对高价值事件发送 Web Push：管理员站务通知、AI 图片生成、ASR、TTS 与文本翻译等异步任务完成/失败提醒。
- 营销通知暂不进入 Web Push 通道，避免首轮范围失控。

### 5.2 VAPID 与配置

- `WEB_PUSH_VAPID_SUBJECT`: VAPID Subject，建议使用 `mailto:`。
- `WEB_PUSH_VAPID_PUBLIC_KEY`: 提供给前端订阅浏览器推送使用。
- `WEB_PUSH_VAPID_PRIVATE_KEY`: 仅服务端使用，禁止暴露到前端，也不会同步到数据库。
- 可通过 `pnpm web-push:generate-vapid` 生成一组可直接写入环境变量的 VAPID 配置。
- 前端通过 `GET /api/settings/public` 获取公开 VAPID 公钥与 `webPushEnabled` 状态。

### 5.3 订阅链路

- 前端在通知中心检测 `Notification.permission`、Service Worker 与 PushManager 能力。
- 订阅写入：`PUT /api/user/notifications/push-subscription`。
- 订阅注销：`DELETE /api/user/notifications/push-subscription`。
- 静态 Service Worker：`public/web-push-sw.js` 负责展示系统通知并处理点击跳转。

### 5.4 失效清理

- 服务端发送 Web Push 时若收到 `404` 或 `410`，立即删除对应订阅记录。
- 当前设备权限从 `granted` 变为 `default / denied` 时，前端会主动取消订阅并通知服务端清理当前端点。

### 5.5 历史与投递审计

- 用户通知历史接口：`GET /api/notifications`，支持分页查询已接收过的站内通知。
- 已读状态回填接口：`PUT /api/notifications/read`，支持单条或全部标记为已读。
- 管理员投递审计接口：`GET /api/admin/notifications/delivery-logs`，支持按通知类型、投递渠道、投递结果、接收者与时间范围筛选。
- `server/services/notification.ts` 作为统一通知入口，在落库站内信后继续按在线状态分流到 SSE 或 Web Push，并为 EMAIL / IN_APP / SSE / WEB_PUSH 统一记录 `NotificationDeliveryLog`。

## 6. 成本监控与统计
`NotificationStatistics` 表记录每日各渠道的发送量，支持管理员查看推送成本分析与异常频率告警。

---
> 关联代码: `server/services/notification.ts` | `composables/use-notifications.ts`
