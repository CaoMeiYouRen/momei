# 通知矩阵与站内信体系深化设计文档 (Notification Matrix & In-app Refinement)

本文档定义了墨梅博客中通知矩阵与站内信体系的深化实现方案。该功能旨在建立完整的通知管理矩阵、用户通知中心、以及成本监控与预警机制。

## 1. 核心目标

- **多维矩阵实体**: 实现 AdminNotificationConfig 和 UserNotificationPreference 实体
- **统一分发服务**: 重构 notification.ts 服务，支持基于矩阵的策略分发逻辑
- **管理员矩阵 UI**: 后台增加"通知设置矩阵"，支持按事件 x 渠道进行分级控制
- **推送统计与预警**: 实现成本看板，监控邮件发送频率与异常消耗
- **用户通知中心**: 新增历史记录页面，实现已读/删除/清理逻辑
- **自动清理任务**: 实现基于 Cron 的过期站内通知清理逻辑

## 2. 数据库设计

### 2.1 管理员通知配置表 (`AdminNotificationConfig`)

定义全局通知规则：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `id` | `uuid` | 主键 |
| `eventId` | `varchar(100)` | 事件 ID (如: `audit.comment.new`) |
| `channel` | `varchar(50)` | 渠道类型 (EMAIL, IN_APP, WEB_PUSH) |
| `isEnabled` | `boolean` | 全局是否启用 |
| `isMandatory` | `boolean` | 是否强制（用户不可关闭） |
| `isSystem` | `boolean` | 是否为系统级（Better-Auth）事件 |
| `quota` | `integer` | 每日配额（0 表示无限制） |
| `priority` | `integer` | 优先级（1-10，数字越大越优先） |

### 2.2 用户通知偏好表 (`UserNotificationPreference`)

记录个人通知偏好：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `id` | `uuid` | 主键 |
| `userId` | `uuid` | 用户 ID |
| `eventId` | `varchar(100)` | 事件 ID |
| `channel` | `varchar(50)` | 渠道类型 |
| `isEnabled` | `boolean` | 个人是否开启 |

**唯一索引**: `(userId, eventId, channel)`

### 2.3 站内通知表 (`InAppNotification`)

存储用户可阅读的历史记录：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `id` | `uuid` | 主键 |
| `userId` | `uuid` | 接收者 ID |
| `eventId` | `varchar(100)` | 关联事件 ID |
| `type` | `varchar(50)` | 通知类型 |
| `title` | `json` | 国际化标题 (`{ en: string, zh: string }`) |
| `content` | `text` | 国际化正文 |
| `link` | `varchar(500)` | 点击跳转链接 |
| `metadata` | `json` | 额外元数据 |
| `isRead` | `boolean` | 已读状态 |
| `readAt` | `datetime` | 已读时间 |
| `expiresAt` | `datetime` | 过期时间（用于自动清理） |
| `createdAt` | `datetime` | 创建时间 |

### 2.4 通知统计表 (`NotificationStatistics`)

记录每日或核心维度的推送消耗：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `id` | `uuid` | 主键 |
| `date` | `date` | 统计日期 |
| `eventId` | `varchar(100)` | 事件 ID |
| `channel` | `varchar(50)` | 渠道 |
| `count` | `integer` | 发送成功次数 |
| `failCount` | `integer` | 发送失败次数 |
| `costInfo` | `json` | 预估成本信息 |
| `createdAt` | `datetime` | 创建时间 |

## 3. 事件定义枚举

```typescript
// types/notification.ts
export enum NotificationEvent {
    // ========== 认证 (Auth) - 系统级 ==========
    AUTH_USER_OTP = 'auth.user.otp',
    AUTH_USER_RESET_PWD = 'auth.user.reset_pwd',

    // ========== 站务 (Audit) ==========
    AUDIT_COMMENT_NEW = 'audit.comment.new',
    AUDIT_USER_REGISTER = 'audit.user.register',
    SYSTEM_ERROR_API = 'system.error.api',

    // ========== 交互 (Social) ==========
    SOCIAL_COMMENT_REPLY = 'social.comment.reply',
    SOCIAL_COMMENT_LIKE = 'social.comment.like',
    SOCIAL_POST_LIKE = 'social.post.like',

    // ========== 营销 (Marketing) ==========
    MARKETING_BLOG_PUBLISH = 'marketing.blog.publish',
    MARKETING_FEATURE = 'marketing.feature',
    MARKETING_UPDATE = 'marketing.update',
    MARKETING_PROMOTION = 'marketing.promotion',
    MARKETING_SERVICE = 'marketing.service',
}

export enum NotificationChannel {
    EMAIL = 'email',
    IN_APP = 'in_app',
    WEB_PUSH = 'web_push',
    SMS = 'sms',
    WEBHOOK = 'webhook',
}

export interface NotificationEventMetadata {
    id: NotificationEvent
    category: 'auth' | 'audit' | 'social' | 'marketing' | 'system'
    isSystem: boolean
    mandatory: boolean
    defaultChannels: NotificationChannel[]
    icon: string
}
```

## 4. API 设计

### 4.1 管理员端

```typescript
// GET /api/admin/notifications/settings
interface AdminNotificationSettingsResponse {
    matrix: Array<{
        eventId: string
        channels: Array<{
            channel: string
            isEnabled: boolean
            isMandatory: boolean
            quota: number
        }>
    }>
    systemEvents: string[]  // 只读的系统级事件
}

// PUT /api/admin/notifications/settings
interface UpdateAdminSettingsRequest {
    updates: Array<{
        eventId: string
        channel: string
        isEnabled: boolean
        quota?: number
    }>
}

// GET /api/admin/notifications/stats
interface NotificationStatsResponse {
    daily: Array<{
        date: string
        channel: string
        count: number
        failCount: number
        cost: number
    }>
    alerts: Array<{
        type: 'quota_exceeded' | 'high_failure' | 'unusual_cost'
        message: string
        severity: 'warning' | 'error'
        timestamp: string
    }>
    summary: {
        todayTotal: number
        todayFailed: number
        monthTotal: number
        estimatedCost: number
    }
}

// GET /api/admin/notifications/alerts
interface AlertsResponse {
    alerts: Array<{
        id: string
        type: string
        message: string
        severity: 'warning' | 'error'
        resolved: boolean
        createdAt: Date
    }>
}
```

### 4.2 用户端

```typescript
// GET /api/user/notifications
interface UserNotificationsResponse {
    notifications: Array<{
        id: string
        eventId: string
        type: string
        title: Record<string, string>
        content: string
        link: string
        isRead: boolean
        createdAt: Date
    }>
    unreadCount: number
    total: number
}

// PUT /api/user/notifications/:id/read
// 标记单个通知为已读

// PUT /api/user/notifications/read-all
// 标记所有通知为已读

// DELETE /api/user/notifications/:id
// 删除单个通知

// DELETE /api/user/notifications/clear
// 清理所有已读通知

// GET /api/user/notifications/settings
interface UserNotificationSettingsResponse {
    matrix: Array<{
        eventId: string
        eventName: Record<string, string>
        icon: string
        channels: Array<{
            channel: string
            isEnabled: boolean
            isMandatory: boolean
        }>
    }>
}

// PUT /api/user/notifications/settings
interface UpdateUserSettingsRequest {
    updates: Array<{
        eventId: string
        channel: string
        isEnabled: boolean
    }>
}
```

## 5. 服务层实现

### 5.1 统一通知服务

```typescript
// server/services/notification.ts
export class NotificationService {
    /**
     * 发送通知（矩阵路由核心）
     */
    async send(options: {
        eventId: NotificationEvent
        recipients: string[]  // 用户 ID 数组
        data: {
            title: Record<string, string>
            content: string
            link?: string
            metadata?: Record<string, any>
        }
        channels?: NotificationChannel[]  // 指定渠道，否则按矩阵
    }): Promise<{
        sent: number
        failed: number
        byChannel: Record<string, { sent: number; failed: number }>
    }> {
        const { eventId, recipients, data, channels } = options
        const result = {
            sent: 0,
            failed: 0,
            byChannel: {} as Record<string, { sent: number; failed: number }>,
        }

        // 获取管理员配置
        const adminConfigs = await this.getAdminConfigs(eventId)

        // 确定可用渠道
        const availableChannels = channels || adminConfigs
            .filter(c => c.isEnabled)
            .map(c => c.channel as NotificationChannel)

        // 对每个用户逐个处理
        for (const userId of recipients) {
            // 获取用户偏好
            const userPrefs = await this.getUserPreferences(userId, eventId)

            for (const channel of availableChannels) {
                // 检查用户是否关闭
                const pref = userPrefs.find(p => p.channel === channel)
                if (pref && !pref.isEnabled) {
                    continue
                }

                try {
                    await this.dispatchToChannel(channel, {
                        userId,
                        eventId,
                        data,
                    })
                    result.sent++
                    this.recordSuccess(eventId, channel)
                } catch (error) {
                    result.failed++
                    this.recordFailure(eventId, channel, error)
                }
            }
        }

        return result
    }

    /**
     * 分发到指定渠道
     */
    private async dispatchToChannel(
        channel: NotificationChannel,
        options: {
            userId: string
            eventId: NotificationEvent
            data: any
        }
    ): Promise<void> {
        const { userId, eventId, data } = options

        switch (channel) {
            case NotificationChannel.EMAIL:
                return this.emailAdapter.send(userId, data)
            case NotificationChannel.IN_APP:
                return this.inAppAdapter.send(userId, eventId, data)
            case NotificationChannel.WEB_PUSH:
                return this.webPushAdapter.send(userId, data)
            // ... 其他渠道
        }
    }

    /**
     * 获取管理员配置
     */
    private async getAdminConfigs(eventId: NotificationEvent) {
        return await adminNotificationConfigRepo.find({
            where: { eventId },
        })
    }

    /**
     * 获取用户偏好
     */
    private async getUserPreferences(userId: string, eventId: NotificationEvent) {
        return await userNotificationPreferenceRepo.find({
            where: { userId, eventId },
        })
    }

    /**
     * 记录成功统计
     */
    private async recordSuccess(eventId: string, channel: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0]
        const stat = await notificationStatisticsRepo.findOne({
            where: { date: today, eventId, channel },
        })

        if (stat) {
            stat.count++
            await notificationStatisticsRepo.save(stat)
        } else {
            await notificationStatisticsRepo.save({
                date: today,
                eventId,
                channel,
                count: 1,
                failCount: 0,
            })
        }
    }

    /**
     * 记录失败统计
     */
    private async recordFailure(
        eventId: string,
        channel: string,
        error: Error
    ): Promise<void> {
        const today = new Date().toISOString().split('T')[0]
        const stat = await notificationStatisticsRepo.findOne({
            where: { date: today, eventId, channel },
        })

        if (stat) {
            stat.failCount++
            await notificationStatisticsRepo.save(stat)
        } else {
            await notificationStatisticsRepo.save({
                date: today,
                eventId,
                channel,
                count: 0,
                failCount: 1,
            })
        }

        // 检查是否需要生成警报
        await this.checkForAlerts(eventId, channel, stat)
    }

    /**
     * 检查并生成警报
     */
    private async checkForAlerts(
        eventId: string,
        channel: string,
        stat: NotificationStatistics
    ): Promise<void> {
        // 失败率过高
        const total = stat.count + stat.failCount
        if (total > 10 && stat.failCount / total > 0.5) {
            await this.createAlert({
                type: 'high_failure',
                message: `Event ${eventId} on ${channel} has ${(stat.failCount / total * 100).toFixed(1)}% failure rate`,
                severity: 'error',
            })
        }

        // 配额耗尽
        const adminConfig = await adminNotificationConfigRepo.findOne({
            where: { eventId, channel },
        })
        if (adminConfig?.quota && stat.count >= adminConfig.quota) {
            await this.createAlert({
                type: 'quota_exceeded',
                message: `Event ${eventId} on ${channel} exceeded daily quota of ${adminConfig.quota}`,
                severity: 'error',
            })
        }
    }

    private async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'resolved'>): Promise<void> {
        await alertRepo.save({
            ...alert,
            resolved: false,
            createdAt: new Date(),
        })
    }
}
```

### 5.2 站内通知适配器

```typescript
// server/services/notification/adapters/in-app.ts
export class InAppNotificationAdapter {
    async send(
        userId: string,
        eventId: NotificationEvent,
        data: {
            title: Record<string, string>
            content: string
            link?: string
            metadata?: Record<string, any>
        }
    ): Promise<void> {
        const expiresIn = 30 * 24 * 60 * 60 * 1000  // 30 天

        await inAppNotificationRepo.save({
            userId,
            eventId,
            type: this.getEventType(eventId),
            title: data.title,
            content: data.content,
            link: data.link,
            metadata: data.metadata,
            isRead: false,
            expiresAt: new Date(Date.now() + expiresIn),
            createdAt: new Date(),
        })

        // 触发 SSE 事件（如果用户在线）
        this.notifyViaSSE(userId, {
            type: 'notification',
            data: {
                title: data.title,
                content: data.content,
                link: data.link,
            },
        })
    }

    private getEventType(eventId: NotificationEvent): string {
        if (eventId.startsWith('audit.')) return 'audit'
        if (eventId.startsWith('social.')) return 'social'
        if (eventId.startsWith('marketing.')) return 'marketing'
        return 'system'
    }

    private async notifyViaSSE(userId: string, payload: any): Promise<void> {
        // 通过 SSE 服务器推送实时通知
        // 具体实现取决于 SSE 基础设施
    }
}
```

### 5.3 自动清理任务

```typescript
// server/tasks/clean-expired-notifications.ts
export async function cleanExpiredNotifications(): Promise<void> {
    const result = await inAppNotificationRepo
        .createQueryBuilder()
        .where('expiresAt < :now', { now: new Date() })
        .delete()

    logger.info(`Cleaned ${result.affected || 0} expired notifications`)
}

// 在 Nitro 任务中注册
// server/tasks/index.ts
export const tasks = {
    '0 0 * * *': cleanExpiredNotifications,  // 每天午夜执行
}
```

## 6. 前端实现

### 6.1 用户通知中心

```vue
<template>
    <div class="notification-center">
        <div class="center-header">
            <div class="header-left">
                <h1>{{ $t('notifications.title') }}</h1>
                <Chip :label="`${unreadCount} ${$t('notifications.unread')}`" v-if="unreadCount > 0" />
            </div>
            <div class="header-actions">
                <Button
                    :label="$t('notifications.markAllRead')"
                    severity="secondary"
                    :disabled="unreadCount === 0"
                    @click="markAllRead"
                />
                <Button
                    :label="$t('notifications.clearRead')"
                    severity="danger"
                    outlined
                    @click="clearRead"
                />
            </div>
        </div>

        <div class="center-filters">
            <ToggleButton
                v-model="filter"
                onLabel="全部"
                offLabel="未读"
                onIcon="pi pi-list"
                offIcon="pi pi-eye"
            />
            <Dropdown
                v-model="typeFilter"
                :options="typeOptions"
                optionLabel="name"
                optionValue="id"
                placeholder="筛选类型"
            />
        </div>

        <div class="notification-list">
            <div
                v-for="notification in filteredNotifications"
                :key="notification.id"
                class="notification-item"
                :class="{ unread: !notification.isRead }"
                @click="openNotification(notification)"
            >
                <div class="item-icon">
                    <i :class="getNotificationIcon(notification.eventId)" />
                </div>
                <div class="item-content">
                    <h3>{{ notification.title[currentLocale] }}</h3>
                    <p>{{ notification.content }}</p>
                    <span class="item-time">{{ formatRelativeTime(notification.createdAt) }}</span>
                </div>
                <div class="item-actions">
                    <Button
                        icon="pi pi-check"
                        severity="success"
                        text
                        rounded
                        :disabled="notification.isRead"
                        @click.stop="markAsRead(notification.id)"
                    />
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        rounded
                        @click.stop="deleteNotification(notification.id)"
                    />
                </div>
            </div>

            <div v-if="filteredNotifications.length === 0" class="empty-state">
                <i class="pi pi-inbox" />
                <p>{{ $t('notifications.empty') }}</p>
            </div>
        </div>

        <Paginator
            v-if="totalPages > 1"
            v-model:first="first"
            :rows="rows"
            :totalRecords="total"
            @page="onPageChange"
        />
    </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { currentLocale } = useLocale()
const toast = useToast()

const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const filter = ref(true)  // true: 全部, false: 仅未读
const typeFilter = ref<string | null>(null)
const first = ref(0)
const rows = ref(20)
const total = ref(0)

const typeOptions = [
    { id: null, name: '全部类型' },
    { id: 'audit', name: '站务通知' },
    { id: 'social', name: '社交互动' },
    { id: 'marketing', name: '营销推送' },
    { id: 'system', name: '系统消息' },
]

const filteredNotifications = computed(() => {
    let result = notifications.value

    if (!filter.value) {
        result = result.filter(n => !n.isRead)
    }

    if (typeFilter.value) {
        result = result.filter(n => n.type === typeFilter.value)
    }

    return result
})

const totalPages = computed(() => Math.ceil(total.value / rows.value))

async function loadNotifications() {
    const data = await $fetch<UserNotificationsResponse>('/api/user/notifications', {
        query: {
            skip: first.value,
            take: rows.value,
        },
    })

    notifications.value = data.notifications
    unreadCount.value = data.unreadCount
    total.value = data.total
}

async function markAsRead(id: string) {
    await $fetch(`/api/user/notifications/${id}/read`, { method: 'PUT' })
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
        notification.isRead = true
        unreadCount.value--
    }
}

async function markAllRead() {
    await $fetch('/api/user/notifications/read-all', { method: 'PUT' })
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
    toast.add({
        severity: 'success',
        summary: '已全部标记为已读',
    })
}

async function deleteNotification(id: string) {
    await $fetch(`/api/user/notifications/${id}`, { method: 'DELETE' })
    notifications.value = notifications.value.filter(n => n.id !== id)
    if (!notifications.value.find(n => n.id === id)?.isRead) {
        unreadCount.value--
    }
}

async function clearRead() {
    await $fetch('/api/user/notifications/clear', { method: 'DELETE' })
    notifications.value = notifications.value.filter(n => !n.isRead)
    toast.add({
        severity: 'success',
        summary: '已清理所有已读通知',
    })
}

function openNotification(notification: Notification) {
    if (!notification.isRead) {
        markAsRead(notification.id)
    }
    if (notification.link) {
        navigateTo(notification.link)
    }
}

function getNotificationIcon(eventId: string): string {
    if (eventId.startsWith('audit.')) return 'pi pi-shield'
    if (eventId.startsWith('social.')) return 'pi pi-users'
    if (eventId.startsWith('marketing.')) return 'pi pi-prime'
    return 'pi pi-bell'
}

function formatRelativeTime(date: Date): string {
    // 使用 dayjs 或类似库
    return formatDistanceToNow(date, { addSuffix: true })
}

onMounted(() => {
    loadNotifications()
})

function onPageChange() {
    loadNotifications()
}
</script>

<style scoped lang="scss">
.notification-center {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;

    .center-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;

        .header-left {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            h1 {
                margin: 0;
                font-size: 1.5rem;
            }
        }

        .header-actions {
            display: flex;
            gap: 0.5rem;
        }
    }

    .center-filters {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .notification-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .notification-item {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 1rem;
            padding: 1rem;
            background: var(--surface-ground);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background: var(--surface-100);
            }

            &.unread {
                background: var(--primary-50);
                border-left: 3px solid var(--primary-500);
            }

            .item-icon {
                font-size: 1.5rem;
                color: var(--text-color-secondary);
            }

            .item-content {
                h3 {
                    margin: 0 0 0.25rem;
                    font-size: 1rem;
                }

                p {
                    margin: 0 0 0.5rem;
                    color: var(--text-color-secondary);
                }

                .item-time {
                    font-size: 0.875rem;
                    color: var(--text-color-secondary);
                }
            }

            .item-actions {
                display: flex;
                gap: 0.25rem;
                align-self: center;
            }
        }

        .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-color-secondary);

            i {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
        }
    }
}
</style>
```

### 6.2 用户通知设置页

```vue
<template>
    <div class="notification-settings">
        <Panel header="通知偏好设置">
            <p class="settings-intro">
                自定义你想接收的通知类型和方式。系统级通知（如登录验证码）无法关闭。
            </p>

            <div class="settings-grid">
                <div
                    v-for="event in sortedEvents"
                    :key="event.eventId"
                    class="event-setting"
                >
                    <div class="event-header">
                        <i :class="event.icon" />
                        <div class="event-info">
                            <h3>{{ event.name[currentLocale] }}</h3>
                            <p>{{ event.description[currentLocale] }}</p>
                        </div>
                    </div>

                    <div class="channel-toggles">
                        <div
                            v-for="channel in event.channels"
                            :key="channel.channel"
                            class="channel-toggle"
                        >
                            <InputSwitch
                                :modelValue="getChannelState(event.eventId, channel.channel)"
                                :disabled="channel.isMandatory"
                                @update:modelValue="setChannelState(event.eventId, channel.channel, $event)"
                            />
                            <label>{{ getChannelName(channel.channel) }}</label>
                            <Tag v-if="channel.isMandatory" value="强制" severity="warning" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-actions">
                <Button
                    label="保存设置"
                    @click="saveSettings"
                    :loading="isSaving"
                />
                <Button
                    label="重置为默认"
                    severity="secondary"
                    outlined
                    @click="resetToDefault"
                />
            </div>
        </Panel>
    </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const toast = useToast()

const settings = ref<UserNotificationSettingsResponse | null>(null)
const pendingChanges = ref<Record<string, Record<string, boolean>>>({})
const isSaving = ref(false)

const sortedEvents = computed(() => {
    if (!settings.value) return []
    return [...settings.value.matrix].sort((a, b) => {
        // 系统级事件排在前面
        if (a.channels.some(c => c.isMandatory)) return -1
        return 0
    })
})

async function loadSettings() {
    settings.value = await $fetch<UserNotificationSettingsResponse>('/api/user/notifications/settings')
}

function getChannelState(eventId: string, channel: string): boolean {
    const event = settings.value?.matrix.find(e => e.eventId === eventId)
    const channelConfig = event?.channels.find(c => c.channel === channel)
    return channelConfig?.isEnabled ?? false
}

function setChannelState(eventId: string, channel: string, value: boolean) {
    if (!pendingChanges.value[eventId]) {
        pendingChanges.value[eventId] = {}
    }
    pendingChanges.value[eventId][channel] = value
}

async function saveSettings() {
    isSaving.value = true

    try {
        const updates = Object.entries(pendingChanges.value).flatMap(([eventId, channels]) =>
            Object.entries(channels).map(([channel, isEnabled]) => ({
                eventId,
                channel,
                isEnabled,
            }))
        )

        await $fetch('/api/user/notifications/settings', {
            method: 'PUT',
            body: { updates },
        })

        pendingChanges.value = {}
        await loadSettings()

        toast.add({
            severity: 'success',
            summary: '设置已保存',
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '保存失败',
            detail: error.message,
        })
    } finally {
        isSaving.value = false
    }
}

async function resetToDefault() {
    if (!confirm('确定要重置为默认设置吗？')) return

    await $fetch('/api/user/notifications/settings', {
        method: 'PUT',
        body: { updates: [] },  // 空数组表示重置
    })

    pendingChanges.value = {}
    await loadSettings()
}

function getChannelName(channel: string): string {
    const names: Record<string, string> = {
        email: '邮件',
        in_app: '站内信',
        web_push: '推送',
    }
    return names[channel] || channel
}

onMounted(() => {
    loadSettings()
})
</script>
```

### 6.3 管理员通知设置矩阵

```vue
<template>
    <div class="admin-notification-matrix">
        <DataTable :value="matrix" striped-rows>
            <Column field="eventName" header="事件" :sortable="true">
                <template #body="{ data }">
                    <div class="event-name">
                        <i :class="data.icon" />
                        <span>{{ data.name[currentLocale] }}</span>
                    </div>
                </template>
            </Column>
            <Column header="邮件 (Email)">
                <template #body="{ data }">
                    <ChannelToggle
                        :event-id="data.eventId"
                        channel="email"
                        :config="data.channels.find(c => c.channel === 'email')"
                        @change="onConfigChange"
                    />
                </template>
            </Column>
            <Column header="站内 (In-App)">
                <template #body="{ data }">
                    <ChannelToggle
                        :event-id="data.eventId"
                        channel="in_app"
                        :config="data.channels.find(c => c.channel === 'in_app')"
                        @change="onConfigChange"
                    />
                </template>
            </Column>
            <Column header="推送 (Push)">
                <template #body="{ data }">
                    <ChannelToggle
                        :event-id="data.eventId"
                        channel="web_push"
                        :config="data.channels.find(c => c.channel === 'web_push')"
                        @change="onConfigChange"
                    />
                </template>
            </Column>
            <Column header="操作">
                <template #body="{ data }">
                    <Button
                        icon="pi pi-pencil"
                        size="small"
                        text
                        @click="openAdvancedConfig(data.eventId)"
                    />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
```

### 6.4 成本看板

```vue
<template>
    <div class="notification-cost-dashboard">
        <Card>
            <template #title>通知成本看板</template>
            <template #subtitle>今日统计数据</template>

            <template #content>
                <div class="dashboard-summary">
                    <div class="summary-card">
                        <div class="card-label">今日发送</div>
                        <div class="card-value">{{ summary.todayTotal }}</div>
                    </div>
                    <div class="summary-card">
                        <div class="card-label">失败数</div>
                        <div class="card-value error">{{ summary.todayFailed }}</div>
                    </div>
                    <div class="summary-card">
                        <div class="card-label">预估成本</div>
                        <div class="card-value">${{ summary.estimatedCost.toFixed(2) }}</div>
                    </div>
                </div>

                <Chart type="bar" :data="chartData" />

                <Panel header="活跃警报">
                    <div v-for="alert in alerts" :key="alert.id" class="alert-item">
                        <Tag :value="alert.type" :severity="alert.severity" />
                        <span>{{ alert.message }}</span>
                        <Button
                            label="解决"
                            size="small"
                            @click="resolveAlert(alert.id)"
                        />
                    </div>
                </Panel>
            </template>
        </Card>
    </div>
</template>
```

## 7. 实现路线图

### Phase 1: 核心实体与服务
- [ ] 实现所有数据库实体
- [ ] 实现统一 NotificationService
- [ ] 实现各渠道适配器
- [ ] 添加统计记录逻辑

### Phase 2: 用户端
- [ ] 用户通知中心页面
- [ ] 用户通知设置页面
- [ ] 未读红点实时更新

### Phase 3: 管理员端
- [ ] 通知设置矩阵 UI
- [ ] 成本看板与警报
- [ ] 高级配置对话框

### Phase 4: 自动化
- [ ] 自动清理任务
- [ ] 警报生成与通知
- [ ] 成本异常检测
