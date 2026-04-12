import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingKey } from '@/types/setting'

const {
    getSettingsMock,
    setVapidDetailsMock,
    sendNotificationMock,
    getRepositoryMock,
    dataSourceState,
    loggerMock,
    InMock,
} = vi.hoisted(() => ({
    getSettingsMock: vi.fn(),
    setVapidDetailsMock: vi.fn(),
    sendNotificationMock: vi.fn(),
    getRepositoryMock: vi.fn(),
    dataSourceState: {
        isInitialized: true,
    },
    loggerMock: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
    InMock: vi.fn((value: unknown) => ({ $in: value })),
}))

vi.mock('typeorm', async () => {
    const actual = await vi.importActual<typeof import('typeorm')>('typeorm')
    return {
        ...actual,
        In: InMock,
    }
})

vi.mock('web-push', () => ({
    default: {
        setVapidDetails: setVapidDetailsMock,
        sendNotification: sendNotificationMock,
    },
}))

vi.mock('@/server/services/setting', () => ({
    getSettings: getSettingsMock,
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        get isInitialized() {
            return dataSourceState.isInitialized
        },
        getRepository: getRepositoryMock,
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: loggerMock,
}))

async function loadModule() {
    vi.resetModules()
    return await import('./web-push')
}

describe('web-push service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        dataSourceState.isInitialized = true
        getSettingsMock.mockResolvedValue({
            [SettingKey.WEB_PUSH_VAPID_SUBJECT]: 'mailto:test@example.com',
            [SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]: 'public-key',
            [SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY]: 'private-key',
        })
        getRepositoryMock.mockReset()
        sendNotificationMock.mockResolvedValue(undefined)
    })

    it('reports disabled when vapid settings are incomplete', async () => {
        getSettingsMock.mockResolvedValue({
            [SettingKey.WEB_PUSH_VAPID_SUBJECT]: '',
        })
        const { isWebPushEnabled } = await loadModule()

        await expect(isWebPushEnabled()).resolves.toBe(false)
        expect(setVapidDetailsMock).not.toHaveBeenCalled()
    })

    it('enables web push and caches vapid configuration signature', async () => {
        const { isWebPushEnabled } = await loadModule()

        await expect(isWebPushEnabled()).resolves.toBe(true)
        await expect(isWebPushEnabled()).resolves.toBe(true)
        expect(setVapidDetailsMock).toHaveBeenCalledTimes(1)
    })

    it('returns null on upsert when data source is unavailable', async () => {
        dataSourceState.isInitialized = false
        const { upsertWebPushSubscription } = await loadModule()

        const result = await upsertWebPushSubscription({
            userId: 'user-1',
            subscription: { endpoint: 'https://push.example.com/1', keys: { auth: 'a', p256dh: 'b' } },
        })

        expect(result).toBeNull()
    })

    it('rejects upsert when user does not exist', async () => {
        const userRepo = { exists: vi.fn().mockResolvedValue(false) }
        const subscriptionRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() }
        getRepositoryMock.mockImplementation((entity: { name?: string }) => {
            if (entity?.name === 'User') {
                return userRepo
            }

            return subscriptionRepo
        })
        const { upsertWebPushSubscription } = await loadModule()

        await expect(upsertWebPushSubscription({
            userId: 'missing-user',
            subscription: { endpoint: 'https://push.example.com/2', keys: { auth: 'a', p256dh: 'b' } },
        })).rejects.toMatchObject({
            statusCode: 401,
            statusMessage: 'User session is invalid',
        })
    })

    it('creates and saves a new subscription entity', async () => {
        const userRepo = { exists: vi.fn().mockResolvedValue(true) }
        const entity = { permission: null, userAgent: null, locale: null }
        const subscriptionRepo = {
            findOne: vi.fn().mockResolvedValue(null),
            create: vi.fn(() => entity),
            save: vi.fn(async (input) => input),
        }
        getRepositoryMock.mockImplementation((entityType: { name?: string }) => {
            if (entityType?.name === 'User') {
                return userRepo
            }

            return subscriptionRepo
        })
        const { upsertWebPushSubscription } = await loadModule()

        const result = await upsertWebPushSubscription({
            userId: 'user-1',
            subscription: { endpoint: 'https://push.example.com/3', keys: { auth: 'a', p256dh: 'b' } },
            permission: 'granted',
            userAgent: 'agent',
            locale: 'zh-CN',
        })

        expect(subscriptionRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            endpoint: 'https://push.example.com/3',
            permission: 'granted',
            userAgent: 'agent',
            locale: 'zh-CN',
        }))
        expect(result).toEqual(expect.objectContaining({ endpoint: 'https://push.example.com/3' }))
    })

    it('returns zero when removing subscription without endpoint', async () => {
        const { removeWebPushSubscription } = await loadModule()

        await expect(removeWebPushSubscription({ userId: 'user-1', endpoint: null })).resolves.toBe(0)
    })

    it('returns skipped when there are no subscriptions to send', async () => {
        const repo = { find: vi.fn().mockResolvedValue([]) }
        getRepositoryMock.mockReturnValue(repo)
        const { sendWebPushToUser } = await loadModule()

        const result = await sendWebPushToUser('user-1', { title: 'Hello', body: 'World' })

        expect(result).toEqual({ attempted: 0, sent: 0, removed: 0, skipped: true })
    })

    it('sends notifications and removes expired subscriptions', async () => {
        const repo = {
            find: vi.fn().mockResolvedValue([
                { endpoint: 'https://push.example.com/ok', subscription: { endpoint: 'ok' } },
                { endpoint: 'https://push.example.com/expired', subscription: { endpoint: 'expired' } },
            ]),
            delete: vi.fn().mockResolvedValue({ affected: 1 }),
        }
        getRepositoryMock.mockReturnValue(repo)
        sendNotificationMock
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce({ statusCode: 410 })
        const { sendWebPushToUser } = await loadModule()

        const result = await sendWebPushToUser('user-1', {
            title: 'Notice',
            body: 'Payload',
            url: '/hello',
            data: { source: 'test' },
        })

        expect(sendNotificationMock).toHaveBeenCalledTimes(2)
        expect(repo.delete).toHaveBeenCalledWith({ endpoint: { $in: ['https://push.example.com/expired'] } })
        expect(result).toEqual({ attempted: 2, sent: 1, removed: 1 })
    })
})
