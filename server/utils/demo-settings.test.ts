import { describe, expect, it } from 'vitest'
import {
    getDemoAdminNotificationSettingsPreview,
    getDemoCommercialSettingsPreview,
    getDemoNotificationDeliveryLogsPreview,
    getDemoSettingAuditLogsPreview,
    getDemoSettingsPreview,
} from './demo-settings'
import { NotificationDeliveryChannel, NotificationDeliveryStatus, NotificationType, AdminNotificationEvent } from '@/utils/shared/notification'
import { SettingKey } from '@/types/setting'

describe('demo settings helpers', () => {
    it('builds setting preview metadata for locked, explicit and default-backed keys', () => {
        const items = getDemoSettingsPreview()
        const findByKey = (key: SettingKey) => items.find((item) => String(item.key) === String(key))
        const siteUrl = findByKey(SettingKey.SITE_URL)
        const aiProvider = findByKey(SettingKey.AI_PROVIDER)
        const externalFeedEnabled = findByKey(SettingKey.EXTERNAL_FEED_ENABLED)

        expect(items.map((item) => item.key)).not.toContain(SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY)
        expect(siteUrl).toEqual(expect.objectContaining({
            key: SettingKey.SITE_URL,
            value: 'https://demo.momei.app',
            source: 'env',
            isLocked: true,
            defaultUsed: false,
            lockReason: 'forced_env_lock',
        }))
        expect(siteUrl?.envKey).toBeTruthy()

        expect(aiProvider).toEqual(expect.objectContaining({
            key: SettingKey.AI_PROVIDER,
            value: 'openai',
            source: 'db',
            isLocked: false,
            defaultUsed: false,
        }))

        expect(externalFeedEnabled).toEqual(expect.objectContaining({
            key: SettingKey.EXTERNAL_FEED_ENABLED,
            value: 'false',
            source: 'default',
            isLocked: false,
            defaultUsed: true,
        }))
    })

    it('returns commercial preview payload for demo mode', () => {
        expect(getDemoCommercialSettingsPreview()).toEqual({
            enabled: true,
            socialLinks: [
                {
                    platform: 'github',
                    url: 'https://github.com/CaoMeiYouRen',
                    label: 'GitHub',
                },
            ],
            donationLinks: [
                {
                    platform: 'github_sponsors',
                    url: 'https://github.com/CaoMeiYouRen/cmyr-sponsor',
                    label: 'GitHub Sponsors',
                },
            ],
            demoPreview: true,
        })
    })

    it('returns admin notification preview with alternating browser toggles', () => {
        const preview = getDemoAdminNotificationSettingsPreview()
        const [firstEvent, secondEvent] = Object.values(AdminNotificationEvent)

        expect(preview.demoPreview).toBe(true)
        expect(preview.items).toHaveLength(Object.values(AdminNotificationEvent).length)
        expect(preview.items[0]).toEqual({
            event: firstEvent,
            isEmailEnabled: true,
            isBrowserEnabled: true,
        })
        expect(preview.items[1]).toEqual({
            event: secondEvent,
            isEmailEnabled: true,
            isBrowserEnabled: false,
        })
        expect(preview.webPush).toEqual(expect.objectContaining({
            privateKeyConfigured: true,
            isConfigured: true,
        }))
        expect(preview.webPush.publicKey.value).toBe('BOr-demo-public-key-preview')
    })

    it('paginates demo setting audit logs', () => {
        const page = getDemoSettingAuditLogsPreview(2, 1)

        expect(page).toEqual(expect.objectContaining({
            total: 3,
            page: 2,
            limit: 1,
            totalPages: 3,
            demoPreview: true,
        }))
        expect(page.items).toHaveLength(1)
        expect(page.items[0]?.id).toBe('demo-audit-2')
    })

    it('paginates notification delivery logs and preserves marketing records', () => {
        const page = getDemoNotificationDeliveryLogsPreview(2, 2)

        expect(page).toEqual(expect.objectContaining({
            total: 4,
            page: 2,
            limit: 2,
            totalPages: 2,
            demoPreview: true,
        }))
        expect(page.items).toEqual([
            expect.objectContaining({
                id: 'demo-notification-log-3',
                channel: NotificationDeliveryChannel.WEB_PUSH,
                status: NotificationDeliveryStatus.FAILED,
                notificationType: NotificationType.SYSTEM,
            }),
            expect.objectContaining({
                id: 'demo-notification-log-4',
                notificationId: null,
                userId: null,
                channel: NotificationDeliveryChannel.LISTMONK,
                status: NotificationDeliveryStatus.SUCCESS,
                notificationType: NotificationType.MARKETING,
            }),
        ])
    })
})
