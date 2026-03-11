import { Brackets } from 'typeorm'
import { dataSource } from '@/server/database'
import { NotificationDeliveryLog } from '@/server/entities/notification-delivery-log'
import { User } from '@/server/entities/user'
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

function mapNotificationDeliveryLogItem(
    item: NotificationDeliveryLog,
    raw: { user_name?: string | null, user_email?: string | null },
): NotificationDeliveryLogItem {
    return {
        id: item.id,
        notificationId: item.notificationId,
        userId: item.userId,
        recipientName: raw.user_name ?? null,
        recipientEmail: raw.user_email ?? null,
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
        .leftJoin(User, 'user', 'log.userId = user.id')
        .addSelect('user.name', 'user_name')
        .addSelect('user.email', 'user_email')
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
        queryBuilder.andWhere(new Brackets((subQueryBuilder) => {
            subQueryBuilder.where('log.recipient LIKE :recipient', { recipient: `%${filters.recipient}%` })
                .orWhere('user.name LIKE :recipient', { recipient: `%${filters.recipient}%` })
                .orWhere('user.email LIKE :recipient', { recipient: `%${filters.recipient}%` })
                .orWhere('log.userId LIKE :recipient', { recipient: `%${filters.recipient}%` })
        }))
    }

    if (filters.startDate) {
        queryBuilder.andWhere('log.sentAt >= :startDate', { startDate: filters.startDate.toISOString() })
    }

    if (filters.endDate) {
        queryBuilder.andWhere('log.sentAt <= :endDate', { endDate: filters.endDate.toISOString() })
    }

    const total = await queryBuilder.getCount()
    const { entities, raw } = await queryBuilder
        .clone()
        .skip((filters.page - 1) * filters.limit)
        .take(filters.limit)
        .getRawAndEntities()

    return {
        items: entities.map((item, index) => mapNotificationDeliveryLogItem(item, raw[index] ?? {})),
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
    }
}
