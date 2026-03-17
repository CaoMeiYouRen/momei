/**
 * 通知类型
 */
export enum NotificationType {
    /** 安全提醒 */
    SECURITY = 'SECURITY',
    /** 系统通知 */
    SYSTEM = 'SYSTEM',
    /** 营销推广 */
    MARKETING = 'MARKETING',
    /** 评论回复 */
    COMMENT_REPLY = 'COMMENT_REPLY',
}

/**
 * 通知渠道
 */
export enum NotificationChannel {
    /** 邮件 */
    EMAIL = 'EMAIL',
    /** 站内信 */
    IN_APP = 'IN_APP',
    /** 浏览器推送 */
    WEB_PUSH = 'WEB_PUSH',
}

/**
 * 通知投递渠道
 */
export enum NotificationDeliveryChannel {
    /** 站内信落库 */
    IN_APP = 'IN_APP',
    /** SSE 实时推送 */
    SSE = 'SSE',
    /** 邮件 */
    EMAIL = 'EMAIL',
    /** listmonk */
    LISTMONK = 'LISTMONK',
    /** 浏览器推送 */
    WEB_PUSH = 'WEB_PUSH',
}

/**
 * 通知投递结果
 */
export enum NotificationDeliveryStatus {
    /** 发送成功 */
    SUCCESS = 'SUCCESS',
    /** 发送失败 */
    FAILED = 'FAILED',
    /** 主动跳过 */
    SKIPPED = 'SKIPPED',
}

/**
 * 营销推送状态
 */
export enum MarketingCampaignStatus {
    /** 草稿 */
    DRAFT = 'DRAFT',
    /** 计划发送 */
    SCHEDULED = 'SCHEDULED',
    /** 发送中 */
    SENDING = 'SENDING',
    /** 已完成 */
    COMPLETED = 'COMPLETED',
    /** 失败 */
    FAILED = 'FAILED',
}

/**
 * 营销推送类型
 */
export enum MarketingCampaignType {
    /** 版本更新 */
    UPDATE = 'UPDATE',
    /** 功能推荐 */
    FEATURE = 'FEATURE',
    /** 活动推广 */
    PROMOTION = 'PROMOTION',
    /** 博客发布 */
    BLOG_POST = 'BLOG_POST',
    /** 停机维护 */
    MAINTENANCE = 'MAINTENANCE',
    /** 服务变动 */
    SERVICE = 'SERVICE',
}

/**
 * 管理员通知事件
 */
export enum AdminNotificationEvent {
    /** 新用户/订阅 */
    NEW_USER = 'NEW_USER',
    /** 新评论 */
    NEW_COMMENT = 'NEW_COMMENT',
    /** API 错误 */
    API_ERROR = 'API_ERROR',
    /** 系统警报 */
    SYSTEM_ALERT = 'SYSTEM_ALERT',
}

const AI_TASK_DETAIL_PATH = '/admin/ai/tasks/'

interface ResolveNotificationLinkTargetOptions {
    allowAdminPaths?: boolean
}

export function buildAITaskDetailPath(taskId: string) {
    return `${AI_TASK_DETAIL_PATH}${encodeURIComponent(taskId)}`
}

export function resolveNotificationLinkTarget(link: string | null | undefined, options: ResolveNotificationLinkTargetOptions = {}) {
    if (!link) {
        return null
    }

    const allowAdminPaths = options.allowAdminPaths ?? true

    const taskId = extractTaskIdFromNotificationLink(link)

    if (taskId) {
        if (!allowAdminPaths) {
            return null
        }

        return buildAITaskDetailPath(taskId)
    }

    if (!allowAdminPaths && isAdminPath(link)) {
        return null
    }

    return link
}

function isAdminPath(link: string) {
    try {
        const parsed = new URL(link, 'https://momei.local')
        return parsed.pathname.startsWith('/admin/')
    } catch {
        return link.startsWith('/admin/')
    }
}

function extractTaskIdFromNotificationLink(link: string) {
    try {
        const parsed = new URL(link, 'https://momei.local')
        const taskId = parsed.searchParams.get('taskId')

        return taskId?.trim() || null
    } catch {
        return null
    }
}
