import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { requireAuth } from '@/server/utils/permission'
import { NotificationChannel, NotificationType } from '@/utils/shared/notification'
import handler from '@/server/api/user/notifications/settings.put'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAuth: vi.fn(),
}))

describe('user notifications settings.put API handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('readValidatedBody', vi.fn((event: { body?: unknown }, validate: (body: unknown) => unknown) => Promise.resolve(validate(event.body))))
    })

    it('should force security email and browser preferences to enabled when saving', async () => {
        const existingSecurityEmailSetting = {
            userId: 'user-1',
            type: NotificationType.SECURITY,
            channel: NotificationChannel.EMAIL,
            isEnabled: true,
        }
        const existingSecurityWebPushSetting = {
            userId: 'user-1',
            type: NotificationType.SECURITY,
            channel: NotificationChannel.WEB_PUSH,
            isEnabled: true,
        }
        const savedSettings: { type: NotificationType, channel: NotificationChannel, isEnabled: boolean }[] = []
        const mockRepo = {
            findOne: vi.fn()
                .mockResolvedValueOnce(existingSecurityEmailSetting)
                .mockResolvedValueOnce(existingSecurityWebPushSetting)
                .mockResolvedValueOnce(null),
            save: vi.fn().mockImplementation((setting) => {
                savedSettings.push({
                    type: setting.type,
                    channel: setting.channel,
                    isEnabled: setting.isEnabled,
                })

                return setting
            }),
        }

        vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any)
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)

        const event = {
            context: {},
            node: { req: {} },
            method: 'PUT',
            body: [
                {
                    type: NotificationType.SECURITY,
                    channel: NotificationChannel.EMAIL,
                    isEnabled: false,
                },
                {
                    type: NotificationType.SECURITY,
                    channel: NotificationChannel.WEB_PUSH,
                    isEnabled: false,
                },
                {
                    type: NotificationType.SYSTEM,
                    channel: NotificationChannel.EMAIL,
                    isEnabled: false,
                },
            ],
        } as any

        const result = await handler(event)

        expect(savedSettings).toEqual([
            {
                type: NotificationType.SECURITY,
                channel: NotificationChannel.EMAIL,
                isEnabled: true,
            },
            {
                type: NotificationType.SECURITY,
                channel: NotificationChannel.WEB_PUSH,
                isEnabled: true,
            },
            {
                type: NotificationType.SYSTEM,
                channel: NotificationChannel.EMAIL,
                isEnabled: false,
            },
        ])
        expect(result).toEqual({
            code: 200,
            message: 'Notification settings updated successfully',
        })
    })
})
