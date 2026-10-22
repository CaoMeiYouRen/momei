import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createCampaignFromPost,
    pushRealtimeEvent,
    registerNotificationConnection,
    sendMarketingCampaign,
    startMarketingCampaignDispatch,
    unregisterNotificationConnection,
} from '@/server/services/notification'
import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { MarketingCampaignStatus, MarketingCampaignType, NotificationDeliveryChannel, NotificationDeliveryStatus, NotificationType } from '@/utils/shared/notification'
import { dispatchListmonkCampaign, getListmonkDispatchConfig, ListmonkDispatchError } from '@/server/services/listmonk'
import { recordNotificationDeliveryLog } from '@/server/services/notification-delivery'
import { Post } from '@/server/entities/post'
import { emailService } from '@/server/utils/email/service'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/email', () => ({
    sendEmail: vi.fn(),
}))

vi.mock('@/server/utils/email/service', () => ({
    emailService: {
        sendMarketingEmail: vi.fn(),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}))

import logger from '@/server/utils/logger'

const loggerMock = vi.mocked(logger)

vi.mock('@/server/services/web-push', () => ({
    sendWebPushToUser: vi.fn(),
}))

vi.mock('@/server/services/notification-delivery', () => ({
    recordNotificationDeliveryLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/services/listmonk', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/services/listmonk')>()
    return {
        ...actual,
        getListmonkDispatchConfig: vi.fn(),
        dispatchListmonkCampaign: vi.fn(),
    }
})

const enableListmonk = {
    enabled: true,
    baseUrl: 'https://listmonk.example.com',
    username: 'admin',
    accessToken: 'token',
    defaultListIds: [1],
    categoryListMap: {},
    tagListMap: {},
    templateId: null,
    missingFields: [],
}

const disableListmonk = {
    ...enableListmonk,
    enabled: false,
    baseUrl: '',
    username: '',
    accessToken: '',
    defaultListIds: [],
}

function createCampaign(overrides: Partial<MarketingCampaign> = {}) {
    return Object.assign(new MarketingCampaign(), {
        id: 'campaign-1',
        title: 'Campaign Title',
        content: 'Campaign content',
        type: MarketingCampaignType.BLOG_POST,
        status: MarketingCampaignStatus.DRAFT,
        targetCriteria: {
            articleLink: 'https://momei.app/posts/campaign',
        },
        ...overrides,
    })
}

function createCampaignRepo(campaign: MarketingCampaign | null) {
    return {
        findOne: vi.fn().mockResolvedValue(campaign),
        save: vi.fn((entity: MarketingCampaign) => Promise.resolve(entity)),
    }
}

function installCampaignRepo(repo: ReturnType<typeof createCampaignRepo>) {
    vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
        if (entity === MarketingCampaign) {
            return repo as never
        }
        throw new Error('Unexpected entity')
    })
}

describe('sendMarketingCampaign（Listmonk 分发）', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(recordNotificationDeliveryLog).mockResolvedValue(null)
        vi.mocked(getListmonkDispatchConfig).mockResolvedValue(enableListmonk)
    })

    it('Listmonk 即时投递成功后标记 COMPLETED 并写入外部投递状态', async () => {
        const campaign = createCampaign()
        const repo = createCampaignRepo(campaign)
        installCampaignRepo(repo)
        vi.mocked(dispatchListmonkCampaign).mockResolvedValue({
            remoteCampaignId: 42,
            action: 'created',
            listIds: [1, 2],
            scheduledAt: null,
        })

        await sendMarketingCampaign('campaign-1')

        expect(dispatchListmonkCampaign).toHaveBeenCalledOnce()
        expect(campaign.status).toBe(MarketingCampaignStatus.COMPLETED)
        expect(campaign.sentAt).toBeInstanceOf(Date)
        expect(campaign.targetCriteria?.externalDistribution?.listmonk).toMatchObject({
            provider: 'listmonk',
            remoteCampaignId: 42,
            action: 'created',
            listIds: [1, 2],
            lastError: null,
        })
        expect(emailService.sendMarketingEmail).not.toHaveBeenCalled()

        const marketingLogs = vi.mocked(recordNotificationDeliveryLog).mock.calls
            .map(([entry]) => entry)
            .filter((entry) => entry.notificationType === NotificationType.MARKETING)
        expect(marketingLogs).toHaveLength(1)
        expect(marketingLogs[0]).toMatchObject({
            channel: NotificationDeliveryChannel.LISTMONK,
            status: NotificationDeliveryStatus.SUCCESS,
            recipient: 'listmonk:42',
            targetUrl: 'https://momei.app/posts/campaign',
        })
        expect(repo.save).toHaveBeenCalledTimes(2)
    })

    it('Listmonk 返回排期时间时保持 SCHEDULED 状态', async () => {
        const campaign = createCampaign()
        const repo = createCampaignRepo(campaign)
        installCampaignRepo(repo)
        vi.mocked(dispatchListmonkCampaign).mockResolvedValue({
            remoteCampaignId: 43,
            action: 'updated',
            listIds: [1],
            scheduledAt: '2026-05-01T00:00:00.000Z',
        })

        await sendMarketingCampaign('campaign-1')

        expect(campaign.status).toBe(MarketingCampaignStatus.SCHEDULED)
        expect(campaign.sentAt).toBeUndefined()
        expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('scheduled by listmonk'))
    })

    it('Listmonk 已成功投递过的 COMPLETED 活动不再重复发送', async () => {
        const campaign = createCampaign({
            status: MarketingCampaignStatus.COMPLETED,
            targetCriteria: {
                externalDistribution: {
                    listmonk: {
                        lastSuccessfulAt: '2026-04-01T00:00:00.000Z',
                    },
                },
            },
        })
        const repo = createCampaignRepo(campaign)
        installCampaignRepo(repo)

        await sendMarketingCampaign('campaign-1')

        expect(dispatchListmonkCampaign).not.toHaveBeenCalled()
        expect(repo.save).not.toHaveBeenCalled()
    })

    it('Listmonk 模式下的 COMPLETED 活动缺少成功记录时允许补发', async () => {
        const campaign = createCampaign({
            status: MarketingCampaignStatus.COMPLETED,
            targetCriteria: {},
        })
        const repo = createCampaignRepo(campaign)
        installCampaignRepo(repo)
        vi.mocked(dispatchListmonkCampaign).mockResolvedValue({
            remoteCampaignId: 44,
            action: 'created',
            listIds: [],
            scheduledAt: null,
        })

        await sendMarketingCampaign('campaign-1')

        expect(dispatchListmonkCampaign).toHaveBeenCalledOnce()
        expect(campaign.status).toBe(MarketingCampaignStatus.COMPLETED)
    })

    it('邮件模式下的 COMPLETED 活动直接跳过', async () => {
        const campaign = createCampaign({ status: MarketingCampaignStatus.COMPLETED })
        const repo = createCampaignRepo(campaign)
        installCampaignRepo(repo)
        vi.mocked(getListmonkDispatchConfig).mockResolvedValue(disableListmonk)

        await sendMarketingCampaign('campaign-1')

        expect(emailService.sendMarketingEmail).not.toHaveBeenCalled()
        expect(repo.save).not.toHaveBeenCalled()
    })

    it('Listmonk 分发异常时记录失败状态与人工处置提示', async () => {
        const campaign = createCampaign()
        const repo = createCampaignRepo(campaign)
        installCampaignRepo(repo)
        vi.mocked(dispatchListmonkCampaign).mockRejectedValue(new ListmonkDispatchError('remote failed', {
            code: 'REMOTE_REQUEST_FAILED',
            manualAction: 'retry in listmonk',
            remoteCampaignId: 7,
            listIds: [3],
            action: 'created',
        }))

        await sendMarketingCampaign('campaign-1')

        expect(campaign.status).toBe(MarketingCampaignStatus.FAILED)
        expect(campaign.targetCriteria?.externalDistribution?.listmonk).toMatchObject({
            provider: 'listmonk',
            remoteCampaignId: 7,
            lastError: 'remote failed',
            manualAction: 'retry in listmonk',
            failureCode: 'REMOTE_REQUEST_FAILED',
        })

        const marketingLogs = vi.mocked(recordNotificationDeliveryLog).mock.calls
            .map(([entry]) => entry)
            .filter((entry) => entry.notificationType === NotificationType.MARKETING)
        expect(marketingLogs[0]).toMatchObject({
            channel: NotificationDeliveryChannel.LISTMONK,
            status: NotificationDeliveryStatus.FAILED,
            recipient: 'listmonk:7',
            errorMessage: 'remote failed retry in listmonk',
        })
        expect(loggerMock.error).toHaveBeenCalled()
    })

    it('Listmonk 异常缺少远端 ID 时回落为通用接收方', async () => {
        const campaign = createCampaign()
        installCampaignRepo(createCampaignRepo(campaign))
        vi.mocked(dispatchListmonkCampaign).mockRejectedValue(new ListmonkDispatchError('no remote id', {
            code: 'REMOTE_REQUEST_FAILED',
        }))

        await sendMarketingCampaign('campaign-1')

        const marketingLogs = vi.mocked(recordNotificationDeliveryLog).mock.calls
            .map(([entry]) => entry)
            .filter((entry) => entry.notificationType === NotificationType.MARKETING)
        expect(marketingLogs[0]).toMatchObject({
            recipient: 'listmonk',
            errorMessage: 'no remote id',
        })
    })

    it('正在发送中的活动不会被再次触发', async () => {
        const campaign = createCampaign({ status: MarketingCampaignStatus.SENDING })
        const repo = createCampaignRepo(campaign)
        installCampaignRepo(repo)

        await sendMarketingCampaign('campaign-1')

        expect(dispatchListmonkCampaign).not.toHaveBeenCalled()
        expect(repo.save).not.toHaveBeenCalled()
    })
})

describe('startMarketingCampaignDispatch 状态机', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(recordNotificationDeliveryLog).mockResolvedValue(null)
        vi.mocked(getListmonkDispatchConfig).mockResolvedValue(disableListmonk)
    })

    it('活动不存在时返回 not_found 与当前投递模式', async () => {
        installCampaignRepo(createCampaignRepo(null))

        await expect(startMarketingCampaignDispatch('missing')).resolves.toEqual({
            state: 'not_found',
            mode: 'email',
        })
    })

    it('活动正在发送时返回 already_sending', async () => {
        vi.mocked(getListmonkDispatchConfig).mockResolvedValue(enableListmonk)
        installCampaignRepo(createCampaignRepo(createCampaign({
            status: MarketingCampaignStatus.SENDING,
        })))

        await expect(startMarketingCampaignDispatch('campaign-1')).resolves.toEqual({
            state: 'already_sending',
            mode: 'listmonk',
        })
    })

    it('邮件模式下已完成活动返回 already_completed', async () => {
        installCampaignRepo(createCampaignRepo(createCampaign({
            status: MarketingCampaignStatus.COMPLETED,
        })))

        await expect(startMarketingCampaignDispatch('campaign-1')).resolves.toEqual({
            state: 'already_completed',
            mode: 'email',
        })
    })

    it('Listmonk 模式已成功投递的完成活动返回 already_completed', async () => {
        vi.mocked(getListmonkDispatchConfig).mockResolvedValue(enableListmonk)
        installCampaignRepo(createCampaignRepo(createCampaign({
            status: MarketingCampaignStatus.COMPLETED,
            targetCriteria: {
                externalDistribution: {
                    listmonk: {
                        lastSuccessfulAt: '2026-04-01T00:00:00.000Z',
                    },
                },
            },
        })))

        await expect(startMarketingCampaignDispatch('campaign-1')).resolves.toEqual({
            state: 'already_completed',
            mode: 'listmonk',
        })
    })

    it('Listmonk 模式完成但未成功投递时允许重新开始', async () => {
        vi.mocked(getListmonkDispatchConfig).mockResolvedValue(enableListmonk)
        const campaign = createCampaign({
            status: MarketingCampaignStatus.COMPLETED,
            targetCriteria: {},
        })
        installCampaignRepo(createCampaignRepo(campaign))
        vi.mocked(dispatchListmonkCampaign).mockResolvedValue({
            remoteCampaignId: 99,
            action: 'created',
            listIds: [],
            scheduledAt: null,
        })

        await expect(startMarketingCampaignDispatch('campaign-1')).resolves.toEqual({
            state: 'started',
            mode: 'listmonk',
        })

        await vi.waitFor(() => {
            expect(campaign.status).toBe(MarketingCampaignStatus.COMPLETED)
        })
    })

    it('邮件模式草稿活动启动后转入完成流程', async () => {
        const campaign = createCampaign({
            targetCriteria: { categoryIds: [], tagIds: [] },
        })
        const repo = createCampaignRepo(campaign)
        installCampaignRepo(repo)
        vi.mocked(emailService.sendMarketingEmail).mockResolvedValue(undefined)

        await expect(startMarketingCampaignDispatch('campaign-1')).resolves.toEqual({
            state: 'started',
            mode: 'email',
        })

        await vi.waitFor(() => {
            expect(repo.save).toHaveBeenCalled()
        })
    })
})

describe('createCampaignFromPost 元数据构建', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    function installPost(post: Post | null) {
        const postRepo = { findOne: vi.fn().mockResolvedValue(post) }
        const campaignRepo = createCampaignRepo(null)
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === Post) {
                return postRepo as never
            }
            if (entity === MarketingCampaign) {
                return campaignRepo as never
            }
            throw new Error('Unexpected entity')
        })
        return campaignRepo
    }

    function createPost(overrides: Record<string, unknown> = {}) {
        return Object.assign(new Post(), {
            id: 'post-1',
            title: 'Post Title',
            slug: 'post-slug',
            summary: 'Post summary',
            content: '<p>Post content with <strong>html</strong></p>',
            language: 'zh-CN',
            categoryId: 'cat-1',
            category: { id: 'cat-1', name: 'Tech' },
            author: { id: 'author-1', name: 'Author Name', email: 'author@example.com' },
            tags: [{ id: 'tag-1' }, { id: 'tag-2' }],
            publishedAt: new Date('2026-04-01T08:00:00.000Z'),
            copyright: 'cc-by-nc-sa',
            ...overrides,
        }) as Post
    }

    it('中文文章生成站内链接并继承分类 / 标签条件', async () => {
        const campaignRepo = installPost(createPost())

        const campaign = await createCampaignFromPost('post-1', 'sender-1')

        expect(campaignRepo.save).toHaveBeenCalledOnce()
        expect(campaign.title).toBe('Post Title')
        expect(campaign.status).toBe(MarketingCampaignStatus.DRAFT)
        expect(campaign.type).toBe(MarketingCampaignType.BLOG_POST)
        expect(campaign.senderId).toBe('sender-1')
        expect(campaign.scheduledAt).toBeNull()
        expect(campaign.content).toContain('Post summary')
        expect(campaign.content).toContain('https://momei.app/posts/post-slug')
        expect(campaign.targetCriteria).toMatchObject({
            categoryIds: ['cat-1'],
            tagIds: ['tag-1', 'tag-2'],
            articleLocale: 'zh-CN',
            articleId: 'post-1',
            articleTitle: 'Post Title',
            authorName: 'Author Name',
            categoryName: 'Tech',
            articleLink: 'https://momei.app/posts/post-slug',
        })
        expect(campaign.targetCriteria?.publishDate).toBeTruthy()
    })

    it('非中文文章使用语言前缀并按英文格式生成日期', async () => {
        const campaignRepo = installPost(createPost({
            language: 'en-US',
            category: undefined,
            author: { id: 'author-2', name: '', email: 'fallback@example.com' },
            tags: [],
        }))

        const campaign = await createCampaignFromPost('post-1', 'sender-1')

        expect(campaign.targetCriteria).toMatchObject({
            articleLink: 'https://momei.app/en-US/posts/post-slug',
            articleLocale: 'en-US',
            authorName: 'Admin',
            categoryName: '未分类',
            tagIds: [],
        })
        expect(campaign.targetCriteria?.publishDate).toMatch(/2026/u)
        expect(campaignRepo.save).toHaveBeenCalledOnce()
    })

    it('缺少摘要时截取正文纯文本前 200 字符', async () => {
        installPost(createPost({
            summary: '',
            content: `<p>${'A'.repeat(260)}</p>`,
        }))

        const campaign = await createCampaignFromPost('post-1', 'sender-1')

        expect(campaign.content.startsWith('A'.repeat(200))).toBe(true)
        expect(campaign.content).not.toContain('<p>')
    })

    it('显式传入筛选条件时覆盖文章默认分类 / 标签', async () => {
        installPost(createPost())

        const campaign = await createCampaignFromPost('post-1', 'sender-1', MarketingCampaignStatus.DRAFT, {
            categoryIds: ['override-cat'],
            tagIds: ['override-tag'],
        })

        expect(campaign.targetCriteria).toMatchObject({
            categoryIds: ['override-cat'],
            tagIds: ['override-tag'],
        })
    })

    it('排期状态写入显式排期时间，非排期状态清空排期', async () => {
        installPost(createPost())
        const scheduled = await createCampaignFromPost(
            'post-1',
            'sender-1',
            MarketingCampaignStatus.SCHEDULED,
            undefined,
            new Date('2026-06-01T00:00:00.000Z'),
        )

        expect(scheduled.status).toBe(MarketingCampaignStatus.SCHEDULED)
        expect(scheduled.scheduledAt).toEqual(new Date('2026-06-01T00:00:00.000Z'))

        installPost(createPost())
        const draft = await createCampaignFromPost('post-1', 'sender-1', MarketingCampaignStatus.DRAFT, undefined, new Date())

        expect(draft.scheduledAt).toBeNull()
    })
})

describe('SSE 连接注册与实时事件', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('注销连接后不再向该连接推送实时事件', () => {
        const stream = { push: vi.fn() }
        registerNotificationConnection('stream-user', stream)
        unregisterNotificationConnection('stream-user', stream)
        pushRealtimeEvent('stream-user', { type: 'test' })

        expect(stream.push).not.toHaveBeenCalled()
    })

    it('实时事件序列化为 JSON 并推送给所有连接', async () => {
        const first = { push: vi.fn().mockResolvedValue(undefined) }
        const second = { push: vi.fn().mockResolvedValue(undefined) }
        registerNotificationConnection('multi-user', first)
        registerNotificationConnection('multi-user', second)

        pushRealtimeEvent('multi-user', { type: 'ping', count: 2 })
        await vi.waitFor(() => {
            expect(first.push).toHaveBeenCalledWith('{"type":"ping","count":2}')
        })
        expect(second.push).toHaveBeenCalledWith('{"type":"ping","count":2}')

        unregisterNotificationConnection('multi-user', first)
        unregisterNotificationConnection('multi-user', second)
    })

    it('无连接用户的事件被静默丢弃', () => {
        expect(() => pushRealtimeEvent('nobody', { type: 'ping' })).not.toThrow()
    })
})
