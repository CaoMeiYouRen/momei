import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { requireAuth } from '@/server/utils/permission'
import { NotificationChannel, NotificationType } from '@/utils/shared/notification'
import handler from '@/server/api/user/notifications/settings.get'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAuth: vi.fn(),
}))

describe('user notifications settings.get API handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should force security email and browser preferences to enabled', async () => {
        const mockRepo = {
            find: vi.fn().mockResolvedValue([
                {
                    userId: 'user-1',
                    type: NotificationType.SECURITY,
                    channel: NotificationChannel.EMAIL,
                    isEnabled: false,
                },
                {
                    userId: 'user-1',
                    type: NotificationType.SECURITY,
                    channel: NotificationChannel.WEB_PUSH,
                    isEnabled: false,
                },
                {
                    userId: 'user-1',
                    type: NotificationType.SYSTEM,
                    channel: NotificationChannel.EMAIL,
                    isEnabled: false,
                },
            ]),
        }

        vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any)
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)

        const result = await handler({} as any)
        const settings = result.data as { type: NotificationType, channel: NotificationChannel, isEnabled: boolean }[]

        expect(settings.find((item) => item.type === NotificationType.SECURITY && item.channel === NotificationChannel.EMAIL))
            .toEqual({
                type: NotificationType.SECURITY,
                channel: NotificationChannel.EMAIL,
                isEnabled: true,
            })
        expect(settings.find((item) => item.type === NotificationType.SECURITY && item.channel === NotificationChannel.WEB_PUSH))
            .toEqual({
                type: NotificationType.SECURITY,
                channel: NotificationChannel.WEB_PUSH,
                isEnabled: true,
            })
        expect(settings.find((item) => item.type === NotificationType.SYSTEM && item.channel === NotificationChannel.EMAIL))
            .toEqual({
                type: NotificationType.SYSTEM,
                channel: NotificationChannel.EMAIL,
                isEnabled: false,
            })
    })
})
