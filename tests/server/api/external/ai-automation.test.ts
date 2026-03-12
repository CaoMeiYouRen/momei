import { beforeEach, describe, expect, it, vi } from 'vitest'

const validateApiKeyRequest = vi.fn()
const createTranslatePostTask = vi.fn()
const recommendCategoriesForPost = vi.fn()
const recommendTags = vi.fn()

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')
    return {
        ...actual,
        readValidatedBody: vi.fn((event: { body?: unknown }, parser: (value: unknown) => unknown) => parser(event.body || {})),
    }
})

vi.mock('@/server/utils/validate-api-key', () => ({
    validateApiKeyRequest,
}))

vi.mock('@/server/services/ai', () => ({
    PostAutomationService: {
        createTranslatePostTask,
        recommendCategoriesForPost,
    },
    TextService: {
        recommendTags,
    },
}))

describe('external ai automation api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        validateApiKeyRequest.mockResolvedValue({
            user: {
                id: 'user-1',
                role: 'admin',
            },
        })
    })

    it('should execute recommend-categories handler', async () => {
        recommendCategoriesForPost.mockResolvedValue({
            matchedCategoryId: 'cat-en',
            candidates: [{ id: 'cat-en', name: 'Engineering', slug: 'engineering', language: 'en-US', reason: 'ai-recommended' }],
            proposedCategory: { name: 'Engineering', slug: 'engineering', reason: 'translated-source-name' },
            sourceCategory: { id: 'cat-zh', name: '工程实践', slug: 'gong-cheng-shi-jian', language: 'zh-CN' },
        })

        const handler = (await import('@/server/api/external/ai/recommend-categories.post')).default

        const result = await handler({
            body: {
                postId: 'post-1',
                targetLanguage: 'en-US',
                limit: 3,
            },
        } as never)

        expect(recommendCategoriesForPost).toHaveBeenCalledWith({
            postId: 'post-1',
            targetLanguage: 'en-US',
            sourceLanguage: undefined,
            limit: 3,
        }, {
            userId: 'user-1',
            isAdmin: true,
        })
        expect(result.code).toBe(200)
        expect(result.data?.matchedCategoryId).toBe('cat-en')
    })

    it('should execute translate-post handler with preview confirmation fields', async () => {
        createTranslatePostTask.mockResolvedValue({
            id: 'task-translate-1',
            status: 'pending',
            estimatedCost: 0.2,
            estimatedQuotaUnits: 4,
        })

        const handler = (await import('@/server/api/external/ai/translate-post.post')).default

        const result = await handler({
            body: {
                sourcePostId: 'post-1',
                targetLanguage: 'en-US',
                scopes: ['title', 'content'],
                slugStrategy: 'ai',
                categoryStrategy: 'suggest',
                confirmationMode: 'require',
            },
        } as never)

        expect(createTranslatePostTask).toHaveBeenCalledWith(expect.objectContaining({
            sourcePostId: 'post-1',
            targetLanguage: 'en-US',
            scopes: ['title', 'content'],
            slugStrategy: 'ai',
            categoryStrategy: 'suggest',
            confirmationMode: 'require',
        }), {
            userId: 'user-1',
            isAdmin: true,
        })
        expect(result.code).toBe(200)
        expect(result.data).toEqual({
            taskId: 'task-translate-1',
            status: 'pending',
            estimatedCost: 0.2,
            estimatedQuotaUnits: 4,
        })
    })

    it('should execute recommend-tags handler', async () => {
        recommendTags.mockResolvedValue(['nuxt', 'automation'])
        const handler = (await import('@/server/api/external/ai/recommend-tags.post')).default

        const result = await handler({
            body: {
                content: 'example content',
                existingTags: ['nuxt'],
                language: 'en-US',
            },
        } as never)

        expect(recommendTags).toHaveBeenCalledWith('example content', ['nuxt'], 'en-US', 'user-1')
        expect(result.code).toBe(200)
        expect(result.data).toEqual(['nuxt', 'automation'])
    })
})
