import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockWebPushRepo,
    mockUserRepo,
    mockDataSource,
    mockLogger,
} = vi.hoisted(() => ({
    mockWebPushRepo: {
        findOne: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
    },
    mockUserRepo: {
        exists: vi.fn(),
    },
    mockDataSource: {
        isInitialized: true,
        getRepository: vi.fn(),
    },
    mockLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('web-push', () => ({
    default: {
        setVapidDetails: vi.fn(),
        sendNotification: vi.fn(),
    },
}))

vi.mock('@/server/database', () => ({
    dataSource: mockDataSource,
}))

vi.mock('@/server/services/setting', () => ({
    getSettings: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: mockLogger,
}))

import { User } from '@/server/entities/user'
import { WebPushSubscription } from '@/server/entities/web-push-subscription'
import { upsertWebPushSubscription } from '@/server/services/web-push'

describe('web push subscription upsert', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockDataSource.isInitialized = true
        mockUserRepo.exists.mockResolvedValue(true)
        mockWebPushRepo.findOne.mockResolvedValue(null)
        mockWebPushRepo.create.mockImplementation(() => ({}))
        mockWebPushRepo.save.mockImplementation((entity) => Promise.resolve(entity))
        mockDataSource.getRepository.mockImplementation((entity: unknown) => {
            if (entity === User) {
                return mockUserRepo
            }

            if (entity === WebPushSubscription) {
                return mockWebPushRepo
            }

            return {}
        })
    })

    it('rejects stale session users before hitting the foreign key constraint', async () => {
        mockUserRepo.exists.mockResolvedValue(false)

        await expect(upsertWebPushSubscription({
            userId: 'missing-user',
            subscription: {
                endpoint: 'https://push.example.com/subscription',
                keys: {
                    p256dh: 'p256dh',
                    auth: 'auth',
                },
            },
            permission: 'granted',
            userAgent: 'test-agent',
            locale: 'zh-CN',
        })).rejects.toMatchObject({
            statusCode: 401,
            message: 'User session is invalid',
        })

        expect(mockWebPushRepo.save).not.toHaveBeenCalled()
        expect(mockLogger.warn).toHaveBeenCalledWith('[WebPush] Ignore subscription upsert for missing user missing-user')
    })

    it('persists subscription when the user still exists', async () => {
        const result = await upsertWebPushSubscription({
            userId: 'user-1',
            subscription: {
                endpoint: 'https://push.example.com/subscription',
                keys: {
                    p256dh: 'p256dh',
                    auth: 'auth',
                },
            },
            permission: 'granted',
            userAgent: 'test-agent',
            locale: 'zh-CN',
        })

        expect(mockWebPushRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            endpoint: 'https://push.example.com/subscription',
            permission: 'granted',
            userAgent: 'test-agent',
            locale: 'zh-CN',
        }))
        expect(result).toMatchObject({
            userId: 'user-1',
            endpoint: 'https://push.example.com/subscription',
        })
    })
})
