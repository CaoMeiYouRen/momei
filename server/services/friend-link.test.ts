import { beforeEach, describe, expect, it, vi } from 'vitest'
import { friendLinkService } from './friend-link'
import { dataSource } from '@/server/database'
import { FriendLink } from '@/server/entities/friend-link'
import { FriendLinkApplication } from '@/server/entities/friend-link-application'
import { FriendLinkCategory } from '@/server/entities/friend-link-category'
import { getLocalizedSetting, getSetting } from '@/server/services/setting'
import { FriendLinkApplicationStatus, FriendLinkHealthStatus, FriendLinkStatus } from '@/types/friend-link'
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

    it('支持使用可读时长作为巡检间隔配置', async () => {
        vi.mocked(getSetting).mockImplementation((key: string, defaultValue?: unknown) => {
            const settingKey = String(key)

            if (settingKey === String(SettingKey.FRIEND_LINKS_CHECK_INTERVAL_MINUTES)) {
                return Promise.resolve('1d')
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

            return Promise.resolve(typeof defaultValue === 'string' ? defaultValue : '')
        })

        const meta = await friendLinkService.getMeta()

        expect(meta.checkIntervalMinutes).toBe(1440)
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

describe('friendLinkService.getCategories', () => {
    const categoryRepo = {
        find: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(categoryRepo as never)
    })

    it('returns all categories when no option is provided', async () => {
        categoryRepo.find.mockResolvedValue([
            { id: 'cat-1', name: 'Tech', isEnabled: true },
            { id: 'cat-2', name: 'Art', isEnabled: false },
        ])

        const result = await friendLinkService.getCategories()

        expect(categoryRepo.find).toHaveBeenCalledWith({
            where: {},
            order: { sortOrder: 'ASC', createdAt: 'ASC' },
        })
        expect(result).toHaveLength(2)
    })

    it('filters enabled categories when enabledOnly is true', async () => {
        categoryRepo.find.mockResolvedValue([{ id: 'cat-1', name: 'Tech', isEnabled: true }])

        const result = await friendLinkService.getCategories({ enabledOnly: true })

        expect(categoryRepo.find).toHaveBeenCalledWith({
            where: { isEnabled: true },
            order: { sortOrder: 'ASC', createdAt: 'ASC' },
        })
        expect(result).toHaveLength(1)
    })
})

describe('friendLinkService.createCategory', () => {
    const categoryRepo = {
        save: vi.fn((entity: FriendLinkCategory) => Promise.resolve(entity)),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(categoryRepo as never)
    })

    it('creates category with trimmed name and defaults', async () => {
        const result = await friendLinkService.createCategory({
            name: '  Tech Blogs  ',
        })

        expect(categoryRepo.save).toHaveBeenCalledOnce()
        expect(result.name).toBe('Tech Blogs')
        expect(result.slug).toBe('tech-blogs')
        expect(result.isEnabled).toBe(true)
        expect(result.sortOrder).toBe(0)
        expect(result.description).toBeNull()
    })

    it('uses provided slug and description', async () => {
        const result = await friendLinkService.createCategory({
            name: 'My Category',
            slug: 'custom-slug',
            description: 'Test desc',
            sortOrder: 5,
            isEnabled: false,
        })

        expect(result.slug).toBe('custom-slug')
        expect(result.description).toBe('Test desc')
        expect(result.sortOrder).toBe(5)
        expect(result.isEnabled).toBe(false)
    })
})

describe('friendLinkService.updateCategory', () => {
    const categoryRepo = {
        findOne: vi.fn(),
        save: vi.fn((entity: FriendLinkCategory) => Promise.resolve(entity)),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(categoryRepo as never)
    })

    it('throws 404 when category not found', async () => {
        categoryRepo.findOne.mockResolvedValue(null)

        await expect(friendLinkService.updateCategory('missing', { name: 'New' })).rejects.toMatchObject({
            statusCode: 404,
        })
    })

    it('updates category name and other fields', async () => {
        categoryRepo.findOne.mockResolvedValue(
            Object.assign(new FriendLinkCategory(), {
                id: 'cat-1',
                name: 'Old Name',
                slug: 'old-slug',
                description: 'Old desc',
                sortOrder: 0,
                isEnabled: true,
            }),
        )

        const result = await friendLinkService.updateCategory('cat-1', {
            name: 'New Name',
            slug: 'new-slug',
            description: 'New desc',
            sortOrder: 10,
            isEnabled: false,
        })

        expect(result.name).toBe('New Name')
        expect(result.slug).toBe('new-slug')
        expect(result.description).toBe('New desc')
        expect(result.sortOrder).toBe(10)
        expect(result.isEnabled).toBe(false)
    })

    it('falls back to slug derived from name when slug is cleared', async () => {
        categoryRepo.findOne.mockResolvedValue(
            Object.assign(new FriendLinkCategory(), {
                id: 'cat-1',
                name: 'My Category',
                slug: 'my-category',
            }),
        )

        await friendLinkService.updateCategory('cat-1', { slug: '' })

        const saved = vi.mocked(categoryRepo.save).mock.calls[0]?.[0] as FriendLinkCategory | undefined
        expect(saved?.slug).toBe('my-category')
    })
})

describe('friendLinkService.deleteCategory', () => {
    const categoryRepo = {
        findOne: vi.fn(),
        remove: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(categoryRepo as never)
    })

    it('removes category successfully', async () => {
        const existing = { id: 'cat-1', name: 'Tech' }
        categoryRepo.findOne.mockResolvedValue(existing)
        categoryRepo.remove.mockResolvedValue(undefined)

        await friendLinkService.deleteCategory('cat-1')

        expect(categoryRepo.remove).toHaveBeenCalledWith(existing)
    })

    it('throws 404 when category not found', async () => {
        categoryRepo.findOne.mockResolvedValue(null)

        await expect(friendLinkService.deleteCategory('unknown')).rejects.toMatchObject({ statusCode: 404 })
    })
})

describe('friendLinkService.createFriendLink', () => {
    const friendLinkRepo = {
        findOne: vi.fn(),
        save: vi.fn((entity: FriendLink) => Promise.resolve(entity)),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(friendLinkRepo as never)
    })

    it('throws 400 for non-HTTP URL', async () => {
        await expect(
            friendLinkService.createFriendLink({ name: 'Test', url: 'ftp://bad.example.com' }, null),
        ).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Invalid friend link URL' })
    })

    it('creates link with default status and source', async () => {
        friendLinkRepo.findOne.mockResolvedValue(null)

        const result = await friendLinkService.createFriendLink({
            name: 'My Blog',
            url: 'https://myblog.example.com',
        }, null)

        expect(result.name).toBe('My Blog')
        expect(result.url).toBe('https://myblog.example.com')
        expect(result.status).toBe(FriendLinkStatus.DRAFT)
        expect(result.source).toBe('manual')
        expect(result.isPinned).toBe(false)
        expect(result.isFeatured).toBe(false)
    })

    it('throws 409 when URL already exists', async () => {
        friendLinkRepo.findOne.mockResolvedValue({ id: 'existing-id', url: 'https://dup.example.com' })

        await expect(
            friendLinkService.createFriendLink({ name: 'Dup', url: 'https://dup.example.com' }, null),
        ).rejects.toMatchObject({ statusCode: 409, statusMessage: 'Friend link already exists' })
    })

    it('creates link with provided status and source', async () => {
        friendLinkRepo.findOne.mockResolvedValue(null)

        const result = await friendLinkService.createFriendLink({
            name: 'Blog',
            url: 'https://blog.example.com',
            status: FriendLinkStatus.ACTIVE,
            source: 'application',
            isPinned: true,
            isFeatured: true,
            sortOrder: 5,
        }, 'user-1')

        expect(result.status).toBe(FriendLinkStatus.ACTIVE)
        expect(result.source).toBe('application')
        expect(result.isPinned).toBe(true)
        expect(result.isFeatured).toBe(true)
        expect(result.sortOrder).toBe(5)
    })
})

describe('friendLinkService.updateFriendLink', () => {
    const friendLinkRepo = {
        findOne: vi.fn(),
        save: vi.fn((entity: FriendLink) => Promise.resolve(entity)),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(friendLinkRepo as never)
    })

    it('throws 404 when friend link not found', async () => {
        friendLinkRepo.findOne.mockResolvedValue(null)

        await expect(friendLinkService.updateFriendLink('missing', {}, null)).rejects.toMatchObject({
            statusCode: 404,
        })
    })

    it('throws 400 for invalid URL', async () => {
        friendLinkRepo.findOne.mockResolvedValue(
            Object.assign(new FriendLink(), { id: 'fl-1', url: 'https://old.example.com' }),
        )

        await expect(
            friendLinkService.updateFriendLink('fl-1', { url: 'not-http://bad' }, null),
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('updates friend link name and status', async () => {
        const existing = Object.assign(new FriendLink(), {
            id: 'fl-1',
            name: 'Old',
            url: 'https://old.example.com',
            status: FriendLinkStatus.DRAFT,
        })
        friendLinkRepo.findOne
            .mockResolvedValueOnce(existing) // findOne for entity
            .mockResolvedValue(null) // ensureUniqueFriendLinkUrl - no conflict

        const result = await friendLinkService.updateFriendLink('fl-1', {
            name: 'Updated',
            status: FriendLinkStatus.ACTIVE,
        }, 'operator-1')

        expect(result.name).toBe('Updated')
        expect(result.status).toBe(FriendLinkStatus.ACTIVE)
    })
})

describe('friendLinkService.deleteFriendLink', () => {
    const friendLinkRepo = {
        findOne: vi.fn(),
        remove: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(friendLinkRepo as never)
    })

    it('removes friend link successfully', async () => {
        const existing = Object.assign(new FriendLink(), { id: 'fl-1' })
        friendLinkRepo.findOne.mockResolvedValue(existing)
        friendLinkRepo.remove.mockResolvedValue(undefined)

        await friendLinkService.deleteFriendLink('fl-1')

        expect(friendLinkRepo.remove).toHaveBeenCalledWith(existing)
    })

    it('throws 404 when link not found', async () => {
        friendLinkRepo.findOne.mockResolvedValue(null)

        await expect(friendLinkService.deleteFriendLink('unknown')).rejects.toMatchObject({ statusCode: 404 })
    })
})

describe('friendLinkService.createApplication', () => {
    const applicationRepo = {
        findOne: vi.fn(),
        save: vi.fn((entity: FriendLinkApplication) => Promise.resolve(entity)),
    }
    const categoryRepo = {
        findOne: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSetting).mockImplementation((key: string, defaultValue?: unknown) => {
            const k = String(key)
            if (k === String(SettingKey.FRIEND_LINKS_APPLICATION_ENABLED)) { return Promise.resolve('true') }
            return Promise.resolve(typeof defaultValue === 'string' ? defaultValue : '')
        })
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === FriendLinkApplication) { return applicationRepo as never }
            if (entity === FriendLinkCategory) { return categoryRepo as never }
            throw new Error('Unexpected entity')
        })
    })

    it('throws 403 when applications are disabled', async () => {
        vi.mocked(getSetting).mockResolvedValue('false')

        await expect(
            friendLinkService.createApplication({
                name: 'Test',
                url: 'https://test.example.com',
                contactEmail: 'test@example.com',
                applicantId: null,
            }),
        ).rejects.toMatchObject({ statusCode: 403 })
    })

    it('throws 409 when URL already applied', async () => {
        applicationRepo.findOne.mockResolvedValue({ id: 'existing-app' })

        await expect(
            friendLinkService.createApplication({
                name: 'Test',
                url: 'https://existing.example.com',
                contactEmail: 'test@example.com',
                applicantId: null,
            }),
        ).rejects.toMatchObject({ statusCode: 409 })
    })

    it('creates application with default status', async () => {
        applicationRepo.findOne.mockResolvedValue(null)
        applicationRepo.save.mockImplementation((e: FriendLinkApplication) => Promise.resolve(e))

        const result = await friendLinkService.createApplication({
            name: 'My Blog',
            url: 'https://newblog.example.com',
            contactEmail: 'blog@example.com',
            applicantId: null,
        })

        expect(applicationRepo.save).toHaveBeenCalledOnce()
        expect(result.name).toBe('My Blog')
        expect(result.url).toBe('https://newblog.example.com')
        expect(result.status).toBe(FriendLinkApplicationStatus.PENDING)
    })
})
