import { describe, it, expect } from 'vitest'
import { NotificationType, NotificationChannel } from '../shared/notification'
import {
    notificationSettingSchema,
    updateNotificationSettingsSchema,
    marketingCampaignSchema,
} from './notification'

describe('utils/schemas/notification', () => {
    describe('notificationSettingSchema', () => {
        it('应该验证有效的通知设置', () => {
            const validData = {
                type: NotificationType.COMMENT_REPLY,
                channel: NotificationChannel.EMAIL,
                isEnabled: true,
            }

            const result = notificationSettingSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.type).toBe(NotificationType.COMMENT_REPLY)
                expect(result.data.channel).toBe(NotificationChannel.EMAIL)
                expect(result.data.isEnabled).toBe(true)
            }
        })

        it('应该验证所有通知类型', () => {
            const types = Object.values(NotificationType)

            types.forEach((type) => {
                const data = {
                    type,
                    channel: NotificationChannel.EMAIL,
                    isEnabled: true,
                }
                const result = notificationSettingSchema.safeParse(data)
                expect(result.success).toBe(true)
            })
        })

        it('应该验证所有通知渠道', () => {
            const channels = Object.values(NotificationChannel)

            channels.forEach((channel) => {
                const data = {
                    type: NotificationType.COMMENT_REPLY,
                    channel,
                    isEnabled: true,
                }
                const result = notificationSettingSchema.safeParse(data)
                expect(result.success).toBe(true)
            })
        })

        it('应该验证 isEnabled 为 false', () => {
            const validData = {
                type: NotificationType.COMMENT_REPLY,
                channel: NotificationChannel.EMAIL,
                isEnabled: false,
            }

            const result = notificationSettingSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.isEnabled).toBe(false)
            }
        })

        it('应该拒绝无效的通知类型', () => {
            const invalidData = {
                type: 'INVALID_TYPE',
                channel: NotificationChannel.EMAIL,
                isEnabled: true,
            }

            const result = notificationSettingSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝无效的通知渠道', () => {
            const invalidData = {
                type: NotificationType.COMMENT_REPLY,
                channel: 'INVALID_CHANNEL',
                isEnabled: true,
            }

            const result = notificationSettingSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝缺少必需字段', () => {
            const invalidData = {
                type: NotificationType.COMMENT_REPLY,
            }

            const result = notificationSettingSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝 isEnabled 不是布尔值', () => {
            const invalidData = {
                type: NotificationType.COMMENT_REPLY,
                channel: NotificationChannel.EMAIL,
                isEnabled: 'true',
            }

            const result = notificationSettingSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('updateNotificationSettingsSchema', () => {
        it('应该验证有效的通知设置数组', () => {
            const validData = [
                {
                    type: NotificationType.COMMENT_REPLY,
                    channel: NotificationChannel.EMAIL,
                    isEnabled: true,
                },
                {
                    type: NotificationType.SYSTEM,
                    channel: NotificationChannel.IN_APP,
                    isEnabled: false,
                },
            ]

            const result = updateNotificationSettingsSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data).toHaveLength(2)
            }
        })

        it('应该验证空数组', () => {
            const validData: any[] = []

            const result = updateNotificationSettingsSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data).toHaveLength(0)
            }
        })

        it('应该验证单个设置的数组', () => {
            const validData = [
                {
                    type: NotificationType.COMMENT_REPLY,
                    channel: NotificationChannel.EMAIL,
                    isEnabled: true,
                },
            ]

            const result = updateNotificationSettingsSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data).toHaveLength(1)
            }
        })

        it('应该拒绝包含无效设置的数组', () => {
            const invalidData = [
                {
                    type: NotificationType.COMMENT_REPLY,
                    channel: NotificationChannel.EMAIL,
                    isEnabled: true,
                },
                {
                    type: 'INVALID_TYPE',
                    channel: NotificationChannel.EMAIL,
                    isEnabled: true,
                },
            ]

            const result = updateNotificationSettingsSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝非数组数据', () => {
            const invalidData = {
                type: NotificationType.COMMENT_REPLY,
                channel: NotificationChannel.EMAIL,
                isEnabled: true,
            }

            const result = updateNotificationSettingsSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('marketingCampaignSchema', () => {
        it('应该验证有效的营销活动数据', () => {
            const validData = {
                title: '新产品发布',
                content: '我们很高兴地宣布新产品即将发布...',
                targetCriteria: {
                    categoryIds: ['cat-1', 'cat-2'],
                    tagIds: ['tag-1', 'tag-2'],
                },
            }

            const result = marketingCampaignSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.title).toBe('新产品发布')
                expect(result.data.content).toBe('我们很高兴地宣布新产品即将发布...')
                expect(result.data.targetCriteria?.categoryIds).toHaveLength(2)
                expect(result.data.targetCriteria?.tagIds).toHaveLength(2)
            }
        })

        it('应该应用默认的 targetCriteria', () => {
            const minimalData = {
                title: '测试活动',
                content: '测试内容',
            }

            const result = marketingCampaignSchema.safeParse(minimalData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.targetCriteria).toEqual({})
            }
        })

        it('应该验证只有 categoryIds 的 targetCriteria', () => {
            const validData = {
                title: '测试活动',
                content: '测试内容',
                targetCriteria: {
                    categoryIds: ['cat-1'],
                },
            }

            const result = marketingCampaignSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.targetCriteria?.categoryIds).toHaveLength(1)
                expect(result.data.targetCriteria?.tagIds).toBeUndefined()
            }
        })

        it('应该验证只有 tagIds 的 targetCriteria', () => {
            const validData = {
                title: '测试活动',
                content: '测试内容',
                targetCriteria: {
                    tagIds: ['tag-1', 'tag-2', 'tag-3'],
                },
            }

            const result = marketingCampaignSchema.safeParse(validData)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.targetCriteria?.tagIds).toHaveLength(3)
                expect(result.data.targetCriteria?.categoryIds).toBeUndefined()
            }
        })

        it('应该验证空的 targetCriteria', () => {
            const validData = {
                title: '测试活动',
                content: '测试内容',
                targetCriteria: {},
            }

            const result = marketingCampaignSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝空标题', () => {
            const invalidData = {
                title: '',
                content: '测试内容',
            }

            const result = marketingCampaignSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝超长标题', () => {
            const invalidData = {
                title: 'a'.repeat(256),
                content: '测试内容',
            }

            const result = marketingCampaignSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该接受最大长度的标题', () => {
            const validData = {
                title: 'a'.repeat(255),
                content: '测试内容',
            }

            const result = marketingCampaignSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该拒绝空内容', () => {
            const invalidData = {
                title: '测试活动',
                content: '',
            }

            const result = marketingCampaignSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝缺少标题', () => {
            const invalidData = {
                content: '测试内容',
            }

            const result = marketingCampaignSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该拒绝缺少内容', () => {
            const invalidData = {
                title: '测试活动',
            }

            const result = marketingCampaignSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('应该验证空的 categoryIds 数组', () => {
            const validData = {
                title: '测试活动',
                content: '测试内容',
                targetCriteria: {
                    categoryIds: [],
                },
            }

            const result = marketingCampaignSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证空的 tagIds 数组', () => {
            const validData = {
                title: '测试活动',
                content: '测试内容',
                targetCriteria: {
                    tagIds: [],
                },
            }

            const result = marketingCampaignSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('应该验证长内容', () => {
            const validData = {
                title: '测试活动',
                content: 'a'.repeat(10000),
            }

            const result = marketingCampaignSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })
    })
})
