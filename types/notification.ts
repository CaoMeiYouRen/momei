import type {
    NotificationType,
    NotificationDeliveryChannel,
    NotificationDeliveryStatus,
} from '@/utils/shared/notification'

export interface UserNotificationHistoryItem {
    id: string
    type: NotificationType | string
    title: string
    content: string
    link: string | null
    isRead: boolean
    createdAt: string
}

export interface NotificationHistoryResponseData {
    items: UserNotificationHistoryItem[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface NotificationDeliveryLogItem {
    id: string
    notificationId: string | null
    userId: string | null
    recipientName?: string | null
    recipientEmail?: string | null
    channel: NotificationDeliveryChannel | string
    status: NotificationDeliveryStatus | string
    notificationType: NotificationType | string
    title: string
    recipient: string | null
    targetUrl: string | null
    errorMessage: string | null
    sentAt: string
    createdAt: string
}

export interface NotificationDeliveryLogListData {
    items: NotificationDeliveryLogItem[]
    total: number
    page: number
    limit: number
    totalPages: number
    demoPreview?: boolean
}
