import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationDeliveryChannel, NotificationDeliveryStatus, NotificationType } from '@/utils/shared/notification'
import { getNotificationDeliveryLogs } from '@/server/services/notification-delivery'
import { requireAdmin } from '@/server/utils/permission'
import handler from '@/server/api/admin/notifications/delivery-logs.get'

vi.mock('@/server/services/notification-delivery', () => ({
    getNotificationDeliveryLogs: vi.fn(),
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

describe('admin notifications delivery-logs.get API handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getQuery', vi.fn((event: { query?: unknown }) => event.query || {}))
        vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ public: { demoMode: false } })))
    })

    it('should pass filters to notification delivery service', async () => {
        vi.mocked(requireAdmin).mockResolvedValue(undefined as never)
        vi.mocked(getNotificationDeliveryLogs).mockResolvedValue({
            items: [],
            total: 0,
            page: 2,
            limit: 20,
            totalPages: 0,
        })

        const result = await handler({
            query: {
                page: '2',
                limit: '20',
                notificationType: NotificationType.SYSTEM,
                channel: NotificationDeliveryChannel.WEB_PUSH,
                status: NotificationDeliveryStatus.FAILED,
                recipient: 'admin@example.com',
                startDate: '2026-03-01T00:00:00.000Z',
                endDate: '2026-03-10T00:00:00.000Z',
            },
        } as never)

        expect(getNotificationDeliveryLogs).toHaveBeenCalledWith(expect.objectContaining({
            page: 2,
            limit: 20,
            notificationType: NotificationType.SYSTEM,
            channel: NotificationDeliveryChannel.WEB_PUSH,
            status: NotificationDeliveryStatus.FAILED,
            recipient: 'admin@example.com',
        }))
        expect(result.code).toBe(200)
        expect(result.data).toEqual({
            items: [],
            total: 0,
            page: 2,
            limit: 20,
            totalPages: 0,
            demoPreview: false,
        })
    })
})
