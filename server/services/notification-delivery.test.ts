import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Brackets } from 'typeorm'
import {
    getNotificationDeliveryLogs,
    recordNotificationDeliveryLog,
} from './notification-delivery'
import { dataSource } from '@/server/database'
import {
    NotificationDeliveryChannel,
    NotificationDeliveryStatus,
    NotificationType,
} from '@/utils/shared/notification'

vi.mock('@/server/database', () => ({
    dataSource: {
        isInitialized: true,
        getRepository: vi.fn(),
    },
}))

describe('notification delivery service', () => {
    const queryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn(),
        clone: vi.fn(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getRawAndEntities: vi.fn(),
    }

    const repo = {
        create: vi.fn((input) => input),
        save: vi.fn((input) => Promise.resolve({ id: 'saved-log', ...input })),
        createQueryBuilder: vi.fn(() => queryBuilder),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        ;(dataSource as { isInitialized: boolean }).isInitialized = true
        vi.mocked(dataSource.getRepository).mockReturnValue(repo as never)
        queryBuilder.clone.mockReturnValue(queryBuilder)
        queryBuilder.getCount.mockResolvedValue(3)
        queryBuilder.getRawAndEntities.mockResolvedValue({
            entities: [
                {
                    id: 'log-1',
                    notificationId: 'notification-1',
                    userId: 'user-1',
                    channel: NotificationDeliveryChannel.EMAIL,
                    status: NotificationDeliveryStatus.SUCCESS,
                    notificationType: NotificationType.SYSTEM,
                    title: '新评论待审核',
                    recipient: 'admin@example.com',
                    targetUrl: '/admin/comments',
                    errorMessage: null,
                    sentAt: new Date('2026-04-07T12:00:00.000Z'),
                    createdAt: '2026-04-07T12:01:00.000Z',
                },
            ],
            raw: [
                {
                    user_name: 'Admin',
                    user_email: null,
                },
            ],
        })
    })

    it('returns null when datasource is not initialized', async () => {
        ;(dataSource as { isInitialized: boolean }).isInitialized = false

        await expect(recordNotificationDeliveryLog({
            channel: NotificationDeliveryChannel.EMAIL,
            status: NotificationDeliveryStatus.SUCCESS,
            notificationType: NotificationType.SYSTEM,
            title: 'ignored',
        })).resolves.toBeNull()
    })

    it('creates and saves normalized delivery log entities', async () => {
        const sentAt = new Date('2026-04-07T09:00:00.000Z')

        const result = await recordNotificationDeliveryLog({
            channel: NotificationDeliveryChannel.WEB_PUSH,
            status: NotificationDeliveryStatus.FAILED,
            notificationType: NotificationType.SYSTEM,
            title: '推送失败',
            recipient: undefined,
            targetUrl: undefined,
            errorMessage: undefined,
            sentAt,
            metadata: { attempt: 2 },
        })

        expect(repo.create).toHaveBeenCalledWith({
            notificationId: null,
            userId: null,
            channel: NotificationDeliveryChannel.WEB_PUSH,
            status: NotificationDeliveryStatus.FAILED,
            notificationType: NotificationType.SYSTEM,
            title: '推送失败',
            recipient: null,
            targetUrl: null,
            errorMessage: null,
            sentAt,
            metadata: { attempt: 2 },
        })
        expect(result).toEqual(expect.objectContaining({
            id: 'saved-log',
            title: '推送失败',
        }))
    })

    it('returns an empty paginated payload when datasource is not initialized', async () => {
        ;(dataSource as { isInitialized: boolean }).isInitialized = false

        await expect(getNotificationDeliveryLogs({ page: 2, limit: 10 })).resolves.toEqual({
            items: [],
            total: 0,
            page: 2,
            limit: 10,
            totalPages: 0,
        })
    })

    it('applies filters and maps joined user metadata into list items', async () => {
        const startDate = new Date('2026-04-01T00:00:00.000Z')
        const endDate = new Date('2026-04-30T23:59:59.000Z')

        const result = await getNotificationDeliveryLogs({
            page: 2,
            limit: 2,
            notificationType: NotificationType.SYSTEM,
            channel: NotificationDeliveryChannel.EMAIL,
            status: NotificationDeliveryStatus.SUCCESS,
            recipient: 'admin',
            startDate,
            endDate,
        })

        expect(repo.createQueryBuilder).toHaveBeenCalledWith('log')
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('log.notificationType = :notificationType', {
            notificationType: NotificationType.SYSTEM,
        })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('log.channel = :channel', {
            channel: NotificationDeliveryChannel.EMAIL,
        })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('log.status = :status', {
            status: NotificationDeliveryStatus.SUCCESS,
        })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Brackets))
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('log.sentAt >= :startDate', {
            startDate: startDate.toISOString(),
        })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('log.sentAt <= :endDate', {
            endDate: endDate.toISOString(),
        })
        expect(queryBuilder.skip).toHaveBeenCalledWith(2)
        expect(queryBuilder.take).toHaveBeenCalledWith(2)
        expect(result).toEqual({
            items: [
                {
                    id: 'log-1',
                    notificationId: 'notification-1',
                    userId: 'user-1',
                    recipientName: 'Admin',
                    recipientEmail: null,
                    channel: NotificationDeliveryChannel.EMAIL,
                    status: NotificationDeliveryStatus.SUCCESS,
                    notificationType: NotificationType.SYSTEM,
                    title: '新评论待审核',
                    recipient: 'admin@example.com',
                    targetUrl: '/admin/comments',
                    errorMessage: null,
                    sentAt: '2026-04-07T12:00:00.000Z',
                    createdAt: '2026-04-07T12:01:00.000Z',
                },
            ],
            total: 3,
            page: 2,
            limit: 2,
            totalPages: 2,
        })
    })
})
