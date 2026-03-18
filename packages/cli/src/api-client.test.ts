import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CliImportPostRequest } from './types'

const { mockCreate, mockGet, mockPost } = vi.hoisted(() => ({
    mockCreate: vi.fn(),
    mockGet: vi.fn(),
    mockPost: vi.fn(),
}))

vi.mock('axios', () => ({
    default: {
        create: mockCreate,
    },
}))

import { MomeiApiClient } from './api-client'

function createPostPayload(title: string): CliImportPostRequest {
    return {
        title,
        content: `${title} content`,
        status: 'draft',
        visibility: 'public',
    }
}

describe('MomeiApiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCreate.mockReturnValue({
            post: mockPost,
            get: mockGet,
        })
    })

    it('should report sequential progress across concurrent batches', async () => {
        mockPost
            .mockResolvedValueOnce({ data: { code: 200, data: { id: 1 } } })
            .mockResolvedValueOnce({ data: { code: 200, data: { id: 2 } } })
            .mockResolvedValueOnce({ data: { code: 200, data: { id: 3 } } })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const onProgress = vi.fn()

        const results = await client.importPosts([
            { file: 'a.md', post: createPostPayload('A') },
            { file: 'b.md', post: createPostPayload('B') },
            { file: 'c.md', post: createPostPayload('C') },
        ], {
            concurrency: 2,
            onProgress,
        })

        expect(results).toHaveLength(3)
        expect(onProgress.mock.calls.map((call) => call[0])).toEqual([1, 2, 3])
        expect(onProgress.mock.calls.map((call) => call[1])).toEqual([3, 3, 3])
    })

    it('should call automation endpoints with expected payloads', async () => {
        mockPost
            .mockResolvedValueOnce({ data: { code: 200, data: ['Title A', 'Title B'] } })
            .mockResolvedValueOnce({ data: { code: 200, data: { taskId: 'task_translate_1', status: 'pending', type: 'translate-post' } } })
            .mockResolvedValueOnce({
                data: {
                    code: 200,
                    data: {
                        matchedCategoryId: 'cat_en',
                        candidates: [{ id: 'cat_en', name: 'Engineering', slug: 'engineering', language: 'en-US', reason: 'ai-recommended' }],
                        proposedCategory: { name: 'Engineering', slug: 'engineering', reason: 'translated-source-name' },
                        sourceCategory: { id: 'cat_zh', name: '工程实践', slug: 'gong-cheng-shi-jian', language: 'zh-CN' },
                    },
                },
            })

        mockGet.mockResolvedValueOnce({
            data: {
                code: 200,
                data: {
                    taskId: 'task_translate_1',
                    status: 'completed',
                    type: 'translate-post',
                    result: { targetPostId: 'post_en_1' },
                },
            },
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')

        const titles = await client.suggestTitles({
            content: 'example content',
            language: 'zh-CN',
        })

        const task = await client.translatePost({
            sourcePostId: 'post_1',
            targetLanguage: 'en-US',
            scopes: ['title', 'content'],
            slugStrategy: 'ai',
            categoryStrategy: 'suggest',
            confirmationMode: 'require',
        })

        const categories = await client.recommendCategories({
            postId: 'post_1',
            targetLanguage: 'en-US',
            limit: 3,
        })

        const taskStatus = await client.getAITask('task_translate_1')

        expect(mockPost).toHaveBeenNthCalledWith(1, '/api/external/ai/suggest-titles', {
            content: 'example content',
            language: 'zh-CN',
        })
        expect(mockPost).toHaveBeenNthCalledWith(2, '/api/external/ai/translate-post', {
            sourcePostId: 'post_1',
            targetLanguage: 'en-US',
            scopes: ['title', 'content'],
            slugStrategy: 'ai',
            categoryStrategy: 'suggest',
            confirmationMode: 'require',
        })
        expect(mockPost).toHaveBeenNthCalledWith(3, '/api/external/ai/recommend-categories', {
            postId: 'post_1',
            targetLanguage: 'en-US',
            limit: 3,
        })
        expect(mockGet).toHaveBeenCalledWith('/api/external/ai/tasks/task_translate_1')
        expect(titles.data).toEqual(['Title A', 'Title B'])
        expect(categories.data.matchedCategoryId).toBe('cat_en')
        expect(task.data.taskId).toBe('task_translate_1')
        expect(taskStatus.data.status).toBe('completed')
    })

    it('should call the import validation endpoint before import execution when requested', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                code: 200,
                data: {
                    language: 'zh-CN',
                    canonicalSlug: 'validated-post',
                    canonicalSource: 'slug',
                    canImport: true,
                    requiresConfirmation: false,
                    hasBlockingIssues: false,
                    summary: {
                        accepted: 2,
                        fallback: 0,
                        repaired: 0,
                        invalid: 0,
                        conflict: 0,
                        'needs-confirmation': 0,
                        skipped: 0,
                    },
                    items: [],
                },
            },
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.validateImportPost({
            title: 'Validated Post',
            content: 'Validated Post content',
            sourceFile: 'validated-post.md',
        })

        expect(mockPost).toHaveBeenCalledWith('/api/external/posts/validate', {
            title: 'Validated Post',
            content: 'Validated Post content',
            sourceFile: 'validated-post.md',
        })
        expect(response.data.canonicalSlug).toBe('validated-post')
    })
})
