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
}

/**
 * 营销推送状态
 */
export enum MarketingCampaignStatus {
    /** 草稿 */
    DRAFT = 'DRAFT',
    /** 发送中 */
    SENDING = 'SENDING',
    /** 已完成 */
    COMPLETED = 'COMPLETED',
    /** 失败 */
    FAILED = 'FAILED',
}
