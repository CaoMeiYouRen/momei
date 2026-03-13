import { describe, it, expect, beforeEach, vi } from 'vitest'
import { executePublishEffects } from './post-publish'
import { createCampaignFromPost, sendMarketingCampaign } from './notification'
import { PostStatus, PostVisibility, type Post } from '@/types/post'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

vi.mock('./notification', () => ({
    createCampaignFromPost: vi.fn(),
    sendMarketingCampaign: vi.fn(),
}))

describe('post-publish service', () => {
    let mockPost: Post

    beforeEach(() => {
        vi.clearAllMocks()
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
        it('should create draft campaign when pushOption is draft', async () => {
            const intent = {
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
                pushOption: 'none' as const,
            }

            await executePublishEffects(mockPost, intent)

            expect(createCampaignFromPost).not.toHaveBeenCalled()
            expect(sendMarketingCampaign).not.toHaveBeenCalled()
        })

        it('should handle errors gracefully', async () => {
            const intent = {
                pushOption: 'now' as const,
            }

            vi.mocked(createCampaignFromPost).mockRejectedValue(new Error('Campaign creation failed'))

            // Should not throw
            await expect(executePublishEffects(mockPost, intent)).resolves.not.toThrow()
        })

        it('should skip effects if post has no id', async () => {
            const postWithoutId = { ...mockPost, id: undefined }
            const intent = {
                pushOption: 'now' as const,
            }

            await executePublishEffects(postWithoutId as any, intent)

            expect(createCampaignFromPost).not.toHaveBeenCalled()
            expect(sendMarketingCampaign).not.toHaveBeenCalled()
        })

        it('should use system id when authorId is missing', async () => {
            const postWithoutAuthor = { ...mockPost, authorId: undefined }
            const intent = {
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

        it('should ignore deprecated syncToMemos flag and only handle push options', async () => {
            const intent = {
                syncToMemos: true,
                pushOption: 'none' as const,
            }

            await executePublishEffects(mockPost, intent)

            expect(createCampaignFromPost).not.toHaveBeenCalled()
            expect(sendMarketingCampaign).not.toHaveBeenCalled()
        })
    })
})
