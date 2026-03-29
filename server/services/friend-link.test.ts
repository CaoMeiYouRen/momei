import { beforeEach, describe, expect, it, vi } from 'vitest'
import { friendLinkService } from './friend-link'
import { dataSource } from '@/server/database'
import { FriendLink } from '@/server/entities/friend-link'
import { FriendLinkCategory } from '@/server/entities/friend-link-category'
import { getLocalizedSetting, getSetting } from '@/server/services/setting'
import { FriendLinkHealthStatus, FriendLinkStatus } from '@/types/friend-link'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/setting', () => ({
    getLocalizedSetting: vi.fn(),
    getSetting: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

describe('friendLinkService.runHealthCheck', () => {
    const queryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn(),
    }

    const friendLinkRepo = {
        createQueryBuilder: vi.fn(() => queryBuilder),
        save: vi.fn((entity: FriendLink) => entity),
    }

    const categoryRepo = {
        save: vi.fn((entity: FriendLinkCategory) => entity),
        findOne: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-11T00:00:00.000Z'))

        delete process.env.FRIEND_LINKS_CHECK_BATCH_SIZE
        delete process.env.FRIEND_LINKS_CHECK_TIMEOUT_MS
        delete process.env.FRIEND_LINKS_FAILURE_BACKOFF_MAX_MINUTES
        delete process.env.FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD

        vi.mocked(getSetting).mockImplementation((key: string, defaultValue?: unknown) => {
            const settingKey = String(key)

            if (settingKey === String(SettingKey.FRIEND_LINKS_ENABLED)) {
                return Promise.resolve('true')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_APPLICATION_ENABLED)) {
                return Promise.resolve('true')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES)) {
                return Promise.resolve('')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_FOOTER_ENABLED)) {
                return Promise.resolve('true')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_FOOTER_LIMIT)) {
                return Promise.resolve('6')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_CHECK_INTERVAL_MINUTES)) {
                return Promise.resolve('5')
            }

            return Promise.resolve(typeof defaultValue === 'string' ? defaultValue : '')
        })

        vi.mocked(getLocalizedSetting).mockImplementation((key: string) => {
            if (String(key) === String(SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES)) {
                return Promise.resolve({
                    key,
                    value: '',
                    requestedLocale: 'zh-CN',
                    resolvedLocale: 'zh-CN',
                    fallbackChain: ['zh-CN', 'en-US'],
                    usedFallback: false,
                    usedLegacyValue: false,
                })
            }

            return Promise.resolve({
                key,
                value: null,
                requestedLocale: 'zh-CN',
                resolvedLocale: null,
                fallbackChain: ['zh-CN', 'en-US'],
                usedFallback: false,
                usedLegacyValue: false,
            })
        })

        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === FriendLink) {
                return friendLinkRepo as never
            }

            if (entity === FriendLinkCategory) {
                return categoryRepo as never
            }

            throw new Error('Unknown repository')
        })
    })

    it('创建分类时应将空白 slug 归一化后回退为自动生成值，并把空白描述写为 null', async () => {
        const category = await friendLinkService.createCategory({
            name: '  Friendly Links  ',
            slug: '   ',
            description: '   ',
        })

        expect(categoryRepo.save).toHaveBeenCalledTimes(1)
        expect(category.name).toBe('Friendly Links')
        expect(category.slug).toBe('friendly-links')
        expect(category.description).toBeNull()
    })

    it('将巡检最小间隔钳制到 60 分钟', async () => {
        const meta = await friendLinkService.getMeta()

        expect(meta.checkIntervalMinutes).toBe(60)
    })

    it('健康站点应重置失败计数并按最小间隔写入下次巡检时间', async () => {
        queryBuilder.getMany.mockResolvedValue([
            {
                id: 'friend-link-1',
                url: 'https://example.com',
                status: FriendLinkStatus.ACTIVE,
                healthStatus: FriendLinkHealthStatus.UNKNOWN,
                consecutiveFailures: 2,
                healthCheckCooldownUntil: null,
                lastCheckedAt: null,
                lastHttpStatus: null,
                lastErrorMessage: null,
                createdAt: new Date('2026-03-01T00:00:00.000Z'),
            },
        ])

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
        }))

        const checked = await friendLinkService.runHealthCheck()

        expect(checked).toBe(1)
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            '(friendLink.healthCheckCooldownUntil IS NULL OR friendLink.healthCheckCooldownUntil <= :now)',
            { now: new Date('2026-03-11T00:00:00.000Z') },
        )

        const savedLinkCall = friendLinkRepo.save.mock.calls[0]

        expect(savedLinkCall).toBeDefined()

        if (!savedLinkCall) {
            throw new Error('Expected friend link save call')
        }

        const savedLink = savedLinkCall[0]
        expect(savedLink.healthStatus).toBe(FriendLinkHealthStatus.HEALTHY)
        expect(savedLink.consecutiveFailures).toBe(0)
        expect(savedLink.lastHttpStatus).toBe(200)
        expect(savedLink.lastErrorMessage).toBeNull()
        expect(savedLink.healthCheckCooldownUntil?.toISOString()).toBe('2026-03-11T01:00:00.000Z')
    })

    it('失效站点应进入退避冷却窗口，避免连续重复探测', async () => {
        queryBuilder.getMany.mockResolvedValue([
            {
                id: 'friend-link-2',
                url: 'https://offline.example.com',
                status: FriendLinkStatus.ACTIVE,
                healthStatus: FriendLinkHealthStatus.UNKNOWN,
                consecutiveFailures: 0,
                healthCheckCooldownUntil: null,
                lastCheckedAt: null,
                lastHttpStatus: null,
                lastErrorMessage: null,
                createdAt: new Date('2026-03-01T00:00:00.000Z'),
            },
        ])

        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))

        const checked = await friendLinkService.runHealthCheck()

        expect(checked).toBe(1)

        const savedLinkCall = friendLinkRepo.save.mock.calls[0]

        expect(savedLinkCall).toBeDefined()

        if (!savedLinkCall) {
            throw new Error('Expected friend link save call')
        }

        const savedLink = savedLinkCall[0]
        expect(savedLink.healthStatus).toBe(FriendLinkHealthStatus.UNREACHABLE)
        expect(savedLink.consecutiveFailures).toBe(1)
        expect(savedLink.lastErrorMessage).toBe('timeout')
        expect(savedLink.healthCheckCooldownUntil?.toISOString()).toBe('2026-03-11T06:00:00.000Z')
    })
})
