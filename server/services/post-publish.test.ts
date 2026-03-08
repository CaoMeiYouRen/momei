import { describe, it, expect, beforeEach, vi } from 'vitest'
import { executePublishEffects } from './post-publish'
import { createCampaignFromPost, sendMarketingCampaign } from './notification'
import { PostStatus, PostVisibility, type Post } from '@/types/post'
import { getSetting } from '@/server/services/setting'
import { createMemo } from '@/server/utils/memos'
import { SettingKey } from '@/types/setting'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

const { saveMock, findOneMock, getRepositoryMock } = vi.hoisted(() => ({
    saveMock: vi.fn(),
    findOneMock: vi.fn(),
    getRepositoryMock: vi.fn(),
}))

vi.mock('./notification', () => ({
    createCampaignFromPost: vi.fn(),
    sendMarketingCampaign: vi.fn(),
}))

vi.mock('@/server/utils/memos', () => ({
    createMemo: vi.fn(),
}))

vi.mock('@/server/services/setting', () => ({
    getSetting: vi.fn(),
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: getRepositoryMock,
    },
}))

describe('post-publish service', () => {
    let mockPost: Post

    beforeEach(() => {
        vi.clearAllMocks()
        getRepositoryMock.mockReturnValue({
            findOne: findOneMock,
            save: saveMock,
        })
        findOneMock.mockResolvedValue({ id: 'post-1', metadata: null, metaVersion: 0 })
        vi.mocked(getSetting).mockImplementation((key: string) => {
            if (key === 'site_url') {
                return Promise.resolve('https://momei.app')
            }
            return Promise.resolve(null)
        })
        mockPost = createMockPost()
    })

    const createMockPost = (): Post => ({
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        summary: 'Test summary',
        slug: 'test-post',
        language: 'zh-CN',
        authorId: 'author-1',
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    describe('executePublishEffects', () => {
        it('should handle syncToMemos when enabled', async () => {
            vi.mocked(createMemo).mockResolvedValue({ name: 'memos/42' })

            const intent = {
                syncToMemos: true,
                pushOption: 'none' as const,
            }

            await executePublishEffects(mockPost, intent)

            expect(createMemo).toHaveBeenCalledTimes(1)
            expect(vi.mocked(createMemo).mock.calls[0]?.[0]?.content).toContain('# Test Post')
            expect(vi.mocked(createMemo).mock.calls[0]?.[0]?.content).toContain('Test summary')
            expect(vi.mocked(createMemo).mock.calls[0]?.[0]?.content).toContain('[阅读全文](https://momei.app/posts/test-post)')
            expect(findOneMock).toHaveBeenCalledWith({ where: { id: 'post-1' } })
            expect(saveMock).toHaveBeenCalledWith({
                id: 'post-1',
                metadata: {
                    integration: {
                        memosId: '42',
                    },
                },
                metaVersion: 1,
            })
        })

        it('should create draft campaign when pushOption is draft', async () => {
            const intent = {
                syncToMemos: false,
                pushOption: 'draft' as const,
                pushCriteria: { categoryIds: ['cat-1'] },
            }

            const mockCampaign = { id: 'campaign-1' }
            vi.mocked(createCampaignFromPost).mockResolvedValue(mockCampaign as any)

            await executePublishEffects(mockPost, intent)

            expect(createCampaignFromPost).toHaveBeenCalledWith(
                'post-1',
                'author-1',
                MarketingCampaignStatus.DRAFT,
                { categoryIds: ['cat-1'] },
            )
            expect(sendMarketingCampaign).not.toHaveBeenCalled()
        })

        it('should create and send campaign when pushOption is now', async () => {
            const intent = {
                syncToMemos: false,
                pushOption: 'now' as const,
                pushCriteria: { tagIds: ['tag-1'] },
            }

            const mockCampaign = { id: 'campaign-1' }
            vi.mocked(createCampaignFromPost).mockResolvedValue(mockCampaign as any)

            await executePublishEffects(mockPost, intent)

            expect(createCampaignFromPost).toHaveBeenCalledWith(
                'post-1',
                'author-1',
                MarketingCampaignStatus.SENDING,
                { tagIds: ['tag-1'] },
            )
            expect(sendMarketingCampaign).toHaveBeenCalledWith('campaign-1')
        })

        it('should not create campaign when pushOption is none', async () => {
            const intent = {
                syncToMemos: false,
                pushOption: 'none' as const,
            }

            await executePublishEffects(mockPost, intent)

            expect(createMemo).not.toHaveBeenCalled()
            expect(createCampaignFromPost).not.toHaveBeenCalled()
            expect(sendMarketingCampaign).not.toHaveBeenCalled()
        })

        it('should handle errors gracefully', async () => {
            const intent = {
                syncToMemos: false,
                pushOption: 'now' as const,
            }

            vi.mocked(createCampaignFromPost).mockRejectedValue(new Error('Campaign creation failed'))

            // Should not throw
            await expect(executePublishEffects(mockPost, intent)).resolves.not.toThrow()
        })

        it('should swallow memos sync errors and continue', async () => {
            vi.mocked(createMemo).mockRejectedValue(new Error('Memos sync failed'))

            const intent = {
                syncToMemos: true,
                pushOption: 'none' as const,
            }

            await expect(executePublishEffects(mockPost, intent)).resolves.not.toThrow()
            expect(saveMock).not.toHaveBeenCalled()
        })

        it('should skip effects if post has no id', async () => {
            const postWithoutId = { ...mockPost, id: undefined }
            const intent = {
                syncToMemos: true,
                pushOption: 'now' as const,
            }

            await executePublishEffects(postWithoutId as any, intent)

            expect(createMemo).not.toHaveBeenCalled()
            expect(createCampaignFromPost).not.toHaveBeenCalled()
        })

        it('should use system id when authorId is missing', async () => {
            const postWithoutAuthor = { ...mockPost, authorId: undefined }
            const intent = {
                syncToMemos: false,
                pushOption: 'now' as const,
            }

            const mockCampaign = { id: 'campaign-1' }
            vi.mocked(createCampaignFromPost).mockResolvedValue(mockCampaign as any)

            await executePublishEffects(postWithoutAuthor as any, intent)

            expect(createCampaignFromPost).toHaveBeenCalledWith(
                'post-1',
                '0',
                expect.any(String),
                undefined,
            )
        })

        it('should skip memos sync when integration metadata already exists', async () => {
            const syncedPost: Post = {
                ...mockPost,
                metadata: {
                    integration: {
                        memosId: 'memo-100',
                    },
                },
            }

            const intent = {
                syncToMemos: true,
                pushOption: 'none' as const,
            }

            await executePublishEffects(syncedPost, intent)

            expect(createMemo).not.toHaveBeenCalled()
            expect(saveMock).not.toHaveBeenCalled()
        })
    })
})
