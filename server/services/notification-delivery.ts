import { dataSource } from '@/server/database'
import { NotificationDeliveryLog } from '@/server/entities/notification-delivery-log'
import type {
    NotificationDeliveryLogItem,
    NotificationDeliveryLogListData,
} from '@/types/notification'
import type {
    NotificationType,
    NotificationDeliveryChannel,
    NotificationDeliveryStatus,
} from '@/utils/shared/notification'

export interface RecordNotificationDeliveryInput {
    notificationId?: string | null
    userId?: string | null
    channel: NotificationDeliveryChannel
    status: NotificationDeliveryStatus
    notificationType: NotificationType
    title: string
    recipient?: string | null
    targetUrl?: string | null
    errorMessage?: string | null
    sentAt?: Date
    metadata?: Record<string, unknown> | null
}

export interface NotificationDeliveryLogFilters {
    page: number
    limit: number
    notificationType?: NotificationType
    channel?: NotificationDeliveryChannel
    status?: NotificationDeliveryStatus
    recipient?: string
    startDate?: Date
    endDate?: Date
}

function toIsoString(value: Date | string) {
    return value instanceof Date ? value.toISOString() : String(value)
}

function mapNotificationDeliveryLogItem(item: NotificationDeliveryLog): NotificationDeliveryLogItem {
    return {
        id: item.id,
        notificationId: item.notificationId,
        userId: item.userId,
        channel: item.channel,
        status: item.status,
        notificationType: item.notificationType,
        title: item.title,
        recipient: item.recipient,
        targetUrl: item.targetUrl,
        errorMessage: item.errorMessage,
        sentAt: toIsoString(item.sentAt),
        createdAt: toIsoString(item.createdAt),
    }
}

export async function recordNotificationDeliveryLog(input: RecordNotificationDeliveryInput) {
    if (!dataSource.isInitialized) {
        return null
    }

    const repo = dataSource.getRepository(NotificationDeliveryLog)
    const entity = repo.create({
        notificationId: input.notificationId ?? null,
        userId: input.userId ?? null,
        channel: input.channel,
        status: input.status,
        notificationType: input.notificationType,
        title: input.title,
        recipient: input.recipient ?? null,
        targetUrl: input.targetUrl ?? null,
        errorMessage: input.errorMessage ?? null,
        sentAt: input.sentAt ?? new Date(),
        metadata: input.metadata ?? null,
    })

    return await repo.save(entity)
}

export async function getNotificationDeliveryLogs(filters: NotificationDeliveryLogFilters): Promise<NotificationDeliveryLogListData> {
    if (!dataSource.isInitialized) {
        return {
            items: [],
            total: 0,
            page: filters.page,
            limit: filters.limit,
            totalPages: 0,
        }
    }

    const repo = dataSource.getRepository(NotificationDeliveryLog)
    const queryBuilder = repo.createQueryBuilder('log')
        .orderBy('log.sentAt', 'DESC')

    if (filters.notificationType) {
        queryBuilder.andWhere('log.notificationType = :notificationType', { notificationType: filters.notificationType })
    }

    if (filters.channel) {
        queryBuilder.andWhere('log.channel = :channel', { channel: filters.channel })
    }

    if (filters.status) {
        queryBuilder.andWhere('log.status = :status', { status: filters.status })
    }

    if (filters.recipient) {
        queryBuilder.andWhere('log.recipient LIKE :recipient', { recipient: `%${filters.recipient}%` })
    }

    if (filters.startDate) {
        queryBuilder.andWhere('log.sentAt >= :startDate', { startDate: filters.startDate.toISOString() })
    }

    if (filters.endDate) {
        queryBuilder.andWhere('log.sentAt <= :endDate', { endDate: filters.endDate.toISOString() })
    }

    const [items, total] = await queryBuilder
        .skip((filters.page - 1) * filters.limit)
        .take(filters.limit)
        .getManyAndCount()

    return {
        items: items.map(mapNotificationDeliveryLogItem),
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
    }
}
