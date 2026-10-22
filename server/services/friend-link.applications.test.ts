import { beforeEach, describe, expect, it, vi } from 'vitest'
import { friendLinkService } from './friend-link'
import { dataSource } from '@/server/database'
import { FriendLink } from '@/server/entities/friend-link'
import { FriendLinkApplication } from '@/server/entities/friend-link-application'
import { getLocalizedSetting, getSetting } from '@/server/services/setting'
import { getUploadStorageContext } from '@/server/services/upload'
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

vi.mock('@/server/services/upload', () => ({
    getUploadStorageContext: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

function installDefaultSettings() {
    vi.mocked(getSetting).mockImplementation((key: string, defaultValue?: unknown) => {
        const settingKey = String(key)

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

describe('friendLinkService.getFriendLinks', () => {
    const queryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn(),
    }

    const friendLinkRepo = {
        createQueryBuilder: vi.fn(() => queryBuilder),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        queryBuilder.andWhere.mockClear().mockReturnThis()
        queryBuilder.getManyAndCount.mockReset()
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === FriendLink) {
                return friendLinkRepo as never
            }

            throw new Error('Unexpected entity')
        })
    })

    it('按默认分页查询友链，并在未指定筛选条件时不追加 andWhere', async () => {
        const items = [{ id: 'fl-1', name: 'Alpha' }]
        queryBuilder.getManyAndCount.mockResolvedValue([items, 1])

        const result = await friendLinkService.getFriendLinks()

        expect(queryBuilder.skip).toHaveBeenCalledWith(0)
        expect(queryBuilder.take).toHaveBeenCalledWith(20)
        expect(queryBuilder.andWhere).not.toHaveBeenCalled()
        expect(result).toEqual({
            items,
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
        })
    })

    it('同时应用状态 / 分类 / 精选 / 关键词筛选并按页偏移', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([[], 31])

        const result = await friendLinkService.getFriendLinks({
            page: 3,
            limit: 10,
            status: FriendLinkStatus.ACTIVE,
            categoryId: 'cat-1',
            featured: false,
            keyword: 'momei',
        })

        expect(queryBuilder.skip).toHaveBeenCalledWith(20)
        expect(queryBuilder.take).toHaveBeenCalledWith(10)
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('friendLink.status = :status', { status: FriendLinkStatus.ACTIVE })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('friendLink.categoryId = :categoryId', { categoryId: 'cat-1' })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('friendLink.isFeatured = :featured', { featured: false })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            '(friendLink.name LIKE :keyword OR friendLink.description LIKE :keyword OR friendLink.url LIKE :keyword)',
            { keyword: '%momei%' },
        )
        expect(result.totalPages).toBe(4)
    })

    it('featured 传 false 与省略时的查询条件不同', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([[], 0])

        await friendLinkService.getFriendLinks({ featured: false })

        expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1)
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('friendLink.isFeatured = :featured', { featured: false })
    })
})

describe('friendLinkService.getApplications', () => {
    const queryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn(),
    }

    const applicationRepo = {
        createQueryBuilder: vi.fn(() => queryBuilder),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        queryBuilder.andWhere.mockClear().mockReturnThis()
        queryBuilder.getManyAndCount.mockReset()
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === FriendLinkApplication) {
                return applicationRepo as never
            }

            throw new Error('Unexpected entity')
        })
    })

    it('默认按创建时间倒序分页查询全部申请', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([[], 0])

        const result = await friendLinkService.getApplications()

        expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('application.applicant', 'applicant')
        expect(queryBuilder.orderBy).toHaveBeenCalledWith('application.createdAt', 'DESC')
        expect(queryBuilder.skip).toHaveBeenCalledWith(0)
        expect(queryBuilder.take).toHaveBeenCalledWith(20)
        expect(queryBuilder.andWhere).not.toHaveBeenCalled()
        expect(result.total).toBe(0)
    })

    it('按状态筛选并按页偏移', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([[{ id: 'app-1' }], 21])

        const result = await friendLinkService.getApplications({
            page: 2,
            limit: 5,
            status: FriendLinkApplicationStatus.PENDING,
        })

        expect(queryBuilder.skip).toHaveBeenCalledWith(5)
        expect(queryBuilder.take).toHaveBeenCalledWith(5)
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('application.status = :status', {
            status: FriendLinkApplicationStatus.PENDING,
        })
        expect(result.items).toHaveLength(1)
        expect(result.totalPages).toBe(5)
    })
})

describe('friendLinkService.createApplication logo 校验', () => {
    const applicationRepo = {
        findOne: vi.fn(),
        save: vi.fn((entity: FriendLinkApplication) => Promise.resolve(entity)),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        installDefaultSettings()
        applicationRepo.findOne.mockReset()
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === FriendLinkApplication) {
                return applicationRepo as never
            }

            throw new Error('Unexpected entity')
        })
    })

    it('允许白名单域名的 logo 并归一化可选字段', async () => {
        applicationRepo.findOne.mockResolvedValue(null)

        const result = await friendLinkService.createApplication({
            name: '  My Blog  ',
            url: '  https://myblog.example.com  ',
            logo: '  https://github.com/avatar.png  ',
            description: '   ',
            contactEmail: '  blog@example.com  ',
            submittedIp: '   ',
            submittedUserAgent: '  vitest  ',
            applicantId: null,
        })

        expect(result.name).toBe('My Blog')
        expect(result.url).toBe('https://myblog.example.com')
        expect(result.logo).toBe('https://github.com/avatar.png')
        expect(result.description).toBeNull()
        expect(result.contactEmail).toBe('blog@example.com')
        expect(result.submittedIp).toBeNull()
        expect(result.submittedUserAgent).toBe('vitest')
        expect(result.status).toBe(FriendLinkApplicationStatus.PENDING)
    })

    it('登录申请人可复用上传存储域名下的 logo', async () => {
        applicationRepo.findOne.mockResolvedValue(null)
        vi.mocked(getUploadStorageContext).mockResolvedValue({
            assetPublicBaseUrl: 'https://cdn.example.com/uploads',
            driverBaseUrl: 'https://bucket.example.com',
        } as never)

        const result = await friendLinkService.createApplication({
            name: 'Uploaded Logo',
            url: 'https://uploaded.example.com',
            logo: 'https://cdn.example.com/uploads/logo.png',
            contactEmail: 'owner@example.com',
            applicantId: 'user-1',
        })

        expect(result.logo).toBe('https://cdn.example.com/uploads/logo.png')
        expect(getUploadStorageContext).toHaveBeenCalledOnce()
    })

    it('匿名申请人使用非白名单外链 logo 时拒绝并保持未落库', async () => {
        applicationRepo.findOne.mockResolvedValue(null)

        await expect(friendLinkService.createApplication({
            name: 'Malicious',
            url: 'https://malicious.example.com',
            logo: 'https://evil.example.com/logo.png',
            contactEmail: 'evil@example.com',
            applicantId: null,
        })).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Invalid friend link logo URL',
        })

        expect(applicationRepo.save).not.toHaveBeenCalled()
        expect(getUploadStorageContext).not.toHaveBeenCalled()
    })

    it('申请人提供上传域名但存储上下文缺失时应回退到 400', async () => {
        applicationRepo.findOne.mockResolvedValue(null)
        vi.mocked(getUploadStorageContext).mockResolvedValue({
            assetPublicBaseUrl: '',
            driverBaseUrl: '',
        } as never)

        await expect(friendLinkService.createApplication({
            name: 'No Storage Context',
            url: 'https://nostorage.example.com',
            logo: 'https://cdn.example.com/uploads/logo.png',
            contactEmail: 'owner@example.com',
            applicantId: 'user-1',
        })).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Invalid friend link logo URL',
        })
    })
})

describe('friendLinkService.reviewApplication', () => {
    const applicationRepo = {
        findOne: vi.fn(),
        save: vi.fn((entity: FriendLinkApplication) => Promise.resolve(entity)),
    }

    const friendLinkRepo = {
        findOne: vi.fn(),
        save: vi.fn((entity: FriendLink) => {
            if (!entity.id) {
                entity.id = 'generated-link-id'
            }

            return Promise.resolve(entity)
        }),
    }

    function createPendingApplication() {
        return Object.assign(new FriendLinkApplication(), {
            id: 'app-1',
            name: 'Application Blog',
            url: 'https://app.example.com',
            logo: '/uploads/app.png',
            description: 'From application',
            rssUrl: 'https://app.example.com/rss.xml',
            contactEmail: 'app@example.com',
            categoryId: null,
            status: FriendLinkApplicationStatus.PENDING,
            friendLinkId: null,
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        installDefaultSettings()
        applicationRepo.findOne.mockReset()
        friendLinkRepo.findOne.mockReset()
        delete process.env.FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === FriendLinkApplication) {
                return applicationRepo as never
            }
            if (entity === FriendLink) {
                return friendLinkRepo as never
            }

            throw new Error('Unexpected entity')
        })
    })

    it('批准申请且 URL 已存在时更新既有友链并回写申请关联', async () => {
        const application = createPendingApplication()
        applicationRepo.findOne.mockResolvedValue(application)

        const existingLink = Object.assign(new FriendLink(), {
            id: 'fl-existing',
            name: 'Old Name',
            url: 'https://app.example.com',
            logo: '/uploads/old.png',
            description: 'Old description',
            rssUrl: null,
            contactEmail: null,
            categoryId: null,
            status: FriendLinkStatus.DRAFT,
            healthStatus: FriendLinkHealthStatus.HEALTHY,
            consecutiveFailures: 4,
            healthCheckCooldownUntil: new Date('2026-03-11T00:00:00.000Z'),
            isPinned: false,
            isFeatured: false,
            sortOrder: 7,
        })

        friendLinkRepo.findOne
            .mockResolvedValueOnce(existingLink)
            .mockResolvedValueOnce(existingLink)

        const result = await friendLinkService.reviewApplication('app-1', {
            status: FriendLinkApplicationStatus.APPROVED,
            reviewNote: '  looks good  ',
            linkData: {
                name: '  Approved Blog  ',
                description: '  ',
                isFeatured: true,
            },
        }, 'reviewer-1')

        expect(friendLinkRepo.save).toHaveBeenCalledOnce()
        const savedLink = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink

        expect(savedLink.id).toBe('fl-existing')
        expect(savedLink.name).toBe('Approved Blog')
        // 空白 linkData 描述回退到申请单描述，而不是直接清空
        expect(savedLink.description).toBe('From application')
        expect(savedLink.status).toBe(FriendLinkStatus.ACTIVE)
        expect(savedLink.source).toBe('application')
        expect(savedLink.applicationId).toBe('app-1')
        expect(savedLink.updatedById).toBe('reviewer-1')
        expect(savedLink.isFeatured).toBe(true)
        expect(savedLink.isPinned).toBe(false)
        expect(savedLink.sortOrder).toBe(7)
        expect(savedLink.healthStatus).toBe(FriendLinkHealthStatus.UNKNOWN)
        expect(savedLink.consecutiveFailures).toBe(0)
        expect(savedLink.healthCheckCooldownUntil).toBeNull()

        expect(result.application.friendLinkId).toBe('fl-existing')
        expect(result.application.reviewNote).toBe('looks good')
        expect(result.application.reviewedById).toBe('reviewer-1')
        expect(result.application.status).toBe(FriendLinkApplicationStatus.APPROVED)
        expect(applicationRepo.save).toHaveBeenCalledOnce()
    })

    it('批准申请且不存在同名友链时创建新友链并继承申请信息', async () => {
        applicationRepo.findOne.mockResolvedValue(createPendingApplication())

        // 第一次：按 url 查既有友链（无）；第二次：ensureUniqueFriendLinkUrl（无）
        friendLinkRepo.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)

        const result = await friendLinkService.reviewApplication('app-1', {
            status: FriendLinkApplicationStatus.APPROVED,
        }, 'reviewer-1')

        expect(friendLinkRepo.save).toHaveBeenCalledOnce()
        const savedLink = friendLinkRepo.save.mock.calls[0]?.[0] as FriendLink

        expect(savedLink.id).toBe('generated-link-id')
        expect(savedLink.name).toBe('Application Blog')
        expect(savedLink.url).toBe('https://app.example.com')
        expect(savedLink.logo).toBe('/uploads/app.png')
        expect(savedLink.description).toBe('From application')
        expect(savedLink.rssUrl).toBe('https://app.example.com/rss.xml')
        expect(savedLink.contactEmail).toBe('app@example.com')
        expect(savedLink.status).toBe(FriendLinkStatus.ACTIVE)
        expect(savedLink.source).toBe('application')
        expect(savedLink.applicationId).toBe('app-1')
        expect(savedLink.isPinned).toBe(false)
        expect(savedLink.isFeatured).toBe(false)
        expect(savedLink.sortOrder).toBe(0)
        expect(savedLink.createdById).toBe('reviewer-1')
        expect(result.application.friendLinkId).toBe('generated-link-id')
    })

    it('拒绝申请时不创建或更新友链，只记录审核结论', async () => {
        const application = createPendingApplication()
        applicationRepo.findOne.mockResolvedValue(application)

        const result = await friendLinkService.reviewApplication('app-1', {
            status: FriendLinkApplicationStatus.REJECTED,
            reviewNote: '   ',
        }, 'reviewer-2')

        expect(friendLinkRepo.findOne).not.toHaveBeenCalled()
        expect(friendLinkRepo.save).not.toHaveBeenCalled()
        expect(result.friendLink).toBeNull()
        expect(result.application.status).toBe(FriendLinkApplicationStatus.REJECTED)
        expect(result.application.reviewNote).toBeNull()
        expect(result.application.friendLinkId).toBeNull()
        expect(application.reviewedAt).toBeInstanceOf(Date)
    })
})
