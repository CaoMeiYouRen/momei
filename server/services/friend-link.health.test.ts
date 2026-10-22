import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { friendLinkService } from './friend-link'
import { dataSource } from '@/server/database'
import { FriendLink } from '@/server/entities/friend-link'
import { getLocalizedSetting, getSetting } from '@/server/services/setting'
import logger from '@/server/utils/logger'
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

describe('friendLinkService.runHealthCheck 分支', () => {
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
        save: vi.fn((entity: FriendLink) => Promise.resolve(entity)),
    }

    function enableFriendLinks(overrides: Record<string, string> = {}) {
        vi.mocked(getSetting).mockImplementation((key: string, defaultValue?: unknown) => {
            const settingKey = String(key)
            const overridden = overrides[settingKey]

            if (overridden !== undefined) {
                return Promise.resolve(overridden)
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_ENABLED)) {
                return Promise.resolve('true')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_APPLICATION_ENABLED)) {
                return Promise.resolve('true')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_FOOTER_ENABLED)) {
                return Promise.resolve('true')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_FOOTER_LIMIT)) {
                return Promise.resolve('6')
            }

            if (settingKey === String(SettingKey.FRIEND_LINKS_CHECK_INTERVAL_MINUTES)) {
                return Promise.resolve('1440')
            }

            return Promise.resolve(typeof defaultValue === 'string' ? defaultValue : '')
        })

        vi.mocked(getLocalizedSetting).mockResolvedValue({
            key: SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES,
            value: '',
            requestedLocale: 'zh-CN',
            resolvedLocale: 'zh-CN',
            fallbackChain: ['zh-CN', 'en-US'],
            usedFallback: false,
            usedLegacyValue: false,
        } as never)
    }

    function createCandidate(overrides: Partial<FriendLink> = {}) {
        return Object.assign(new FriendLink(), {
            id: 'friend-link-1',
            url: 'https://candidate.example.com',
            status: FriendLinkStatus.ACTIVE,
            healthStatus: FriendLinkHealthStatus.UNKNOWN,
            consecutiveFailures: 0,
            healthCheckCooldownUntil: null,
            lastCheckedAt: null,
            lastHttpStatus: null,
            lastErrorMessage: null,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            ...overrides,
        })
    }

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-11T00:00:00.000Z'))
        queryBuilder.take.mockClear().mockReturnThis()
        queryBuilder.getMany.mockReset()
        friendLinkRepo.save.mockClear()

        delete process.env.FRIEND_LINKS_CHECK_BATCH_SIZE
        delete process.env.FRIEND_LINKS_CHECK_TIMEOUT_MS
        delete process.env.FRIEND_LINKS_FAILURE_BACKOFF_MAX_MINUTES
        delete process.env.FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD

        enableFriendLinks()

        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === FriendLink) {
                return friendLinkRepo as never
            }

            throw new Error('Unexpected entity')
        })
    })

    it('友链功能关闭时直接返回 0 且不查询候选', async () => {
        enableFriendLinks({ [SettingKey.FRIEND_LINKS_ENABLED]: 'false' })

        const checked = await friendLinkService.runHealthCheck()

        expect(checked).toBe(0)
        expect(friendLinkRepo.createQueryBuilder).not.toHaveBeenCalled()
        expect(friendLinkRepo.save).not.toHaveBeenCalled()
    })

    it('没有候选友链时返回 0 且不写完成日志', async () => {
        queryBuilder.getMany.mockResolvedValue([])

        const checked = await friendLinkService.runHealthCheck()

        expect(checked).toBe(0)
        expect(friendLinkRepo.save).not.toHaveBeenCalled()
        expect(logger.info).not.toHaveBeenCalled()
    })

    it('HEAD 返回 403 时回退 GET 并记录最终状态', async () => {
        queryBuilder.getMany.mockResolvedValue([createCandidate()])

        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(null, { status: 403 }))
            .mockResolvedValueOnce(new Response('ok', { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        const checked = await friendLinkService.runHealthCheck()

        expect(checked).toBe(1)
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'HEAD' })
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'GET' })

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.healthStatus).toBe(FriendLinkHealthStatus.HEALTHY)
        expect(saved.lastHttpStatus).toBe(200)
        expect(saved.lastErrorMessage).toBeNull()
    })

    it('HEAD 返回 405 时回退 GET，GET 仍失败则记录 HTTP 错误信息', async () => {
        queryBuilder.getMany.mockResolvedValue([createCandidate()])

        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(null, { status: 405 }))
            .mockResolvedValueOnce(new Response(null, { status: 500 }))
        vi.stubGlobal('fetch', fetchMock)

        await friendLinkService.runHealthCheck()

        expect(fetchMock).toHaveBeenCalledTimes(2)

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.healthStatus).toBe(FriendLinkHealthStatus.UNREACHABLE)
        expect(saved.lastHttpStatus).toBe(500)
        expect(saved.lastErrorMessage).toBe('HTTP 500')
        expect(saved.consecutiveFailures).toBe(1)
    })

    it('GET 回退遇到 Brotli 响应时记录为不可达', async () => {
        queryBuilder.getMany.mockResolvedValue([createCandidate()])

        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(null, { status: 403 }))
            .mockResolvedValueOnce(new Response('feed', { headers: { 'content-encoding': 'br' } }))
        vi.stubGlobal('fetch', fetchMock)

        await friendLinkService.runHealthCheck()

        expect(fetchMock).toHaveBeenCalledTimes(2)

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.healthStatus).toBe(FriendLinkHealthStatus.UNREACHABLE)
        expect(saved.lastHttpStatus).toBeNull()
        expect(saved.lastErrorMessage).toContain('Brotli')
    })

    it('非 403/405 的失败响应不触发 GET 重试', async () => {
        queryBuilder.getMany.mockResolvedValue([createCandidate()])

        const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 })
        vi.stubGlobal('fetch', fetchMock)

        await friendLinkService.runHealthCheck()

        expect(fetchMock).toHaveBeenCalledTimes(1)

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.lastHttpStatus).toBe(404)
        expect(saved.lastErrorMessage).toBe('HTTP 404')
    })

    it('连续失败次数按指数退避放大冷却窗口', async () => {
        queryBuilder.getMany.mockResolvedValue([createCandidate({ consecutiveFailures: 2 })])
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('dns failure')))

        await friendLinkService.runHealthCheck()

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.consecutiveFailures).toBe(3)
        // 1440 分钟基础间隔 * 2^(3-1) = 5760 分钟 = 4 天
        expect(saved.healthCheckCooldownUntil?.toISOString()).toBe('2026-03-15T00:00:00.000Z')
    })

    it('冷却窗口受 FRIEND_LINKS_FAILURE_BACKOFF_MAX_MINUTES 上限约束', async () => {
        process.env.FRIEND_LINKS_FAILURE_BACKOFF_MAX_MINUTES = '700'
        queryBuilder.getMany.mockResolvedValue([createCandidate({ consecutiveFailures: 5 })])
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))

        await friendLinkService.runHealthCheck()

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.healthCheckCooldownUntil?.toISOString()).toBe('2026-03-11T11:40:00.000Z')
    })

    it('达到自动停用阈值时把友链置为 INACTIVE', async () => {
        process.env.FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD = '2'
        queryBuilder.getMany.mockResolvedValue([createCandidate({ consecutiveFailures: 1 })])
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

        await friendLinkService.runHealthCheck()

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.consecutiveFailures).toBe(2)
        expect(saved.status).toBe(FriendLinkStatus.INACTIVE)
    })

    it('自动停用阈值为 0 时保留 ACTIVE 状态', async () => {
        process.env.FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD = '0'
        queryBuilder.getMany.mockResolvedValue([createCandidate({ consecutiveFailures: 42 })])
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

        await friendLinkService.runHealthCheck()

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.status).toBe(FriendLinkStatus.ACTIVE)
    })

    it('自动停用阈值配置非法时按关闭处理', async () => {
        process.env.FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD = 'not-a-number'
        queryBuilder.getMany.mockResolvedValue([createCandidate({ consecutiveFailures: 42 })])
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

        await friendLinkService.runHealthCheck()

        const saved = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink
        expect(saved.status).toBe(FriendLinkStatus.ACTIVE)
    })

    it('批量大小参数钳制到上限 200', async () => {
        queryBuilder.getMany.mockResolvedValue([])

        await friendLinkService.runHealthCheck(500)

        expect(queryBuilder.take).toHaveBeenCalledWith(200)
    })

    it('批量大小环境变量非法时回退默认值 20', async () => {
        process.env.FRIEND_LINKS_CHECK_BATCH_SIZE = 'not-a-number'
        queryBuilder.getMany.mockResolvedValue([])

        await friendLinkService.runHealthCheck()

        expect(queryBuilder.take).toHaveBeenCalledWith(20)
    })

    it('批量大小环境变量为 0 时钳制到最小值 1', async () => {
        process.env.FRIEND_LINKS_CHECK_BATCH_SIZE = '0'
        queryBuilder.getMany.mockResolvedValue([])

        await friendLinkService.runHealthCheck()

        expect(queryBuilder.take).toHaveBeenCalledWith(1)
    })
})
