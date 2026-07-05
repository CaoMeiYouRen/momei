import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CliImportPostRequest } from './types'

const { mockCreate, mockDelete, mockGet, mockPatch, mockPost } = vi.hoisted(() => ({
    mockCreate: vi.fn(),
    mockDelete: vi.fn(),
    mockGet: vi.fn(),
    mockPatch: vi.fn(),
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
            patch: mockPatch,
            delete: mockDelete,
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

    it('should call listPosts with query parameters', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                code: 200,
                data: {
                    items: [
                        { id: '1', title: 'Post 1', status: 'published' },
                        { id: '2', title: 'Post 2', status: 'draft' },
                    ],
                    total: 2,
                    page: 1,
                    limit: 10,
                },
            },
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.listPosts({
            status: 'published',
            language: 'zh-CN',
            page: 1,
            limit: 10,
        })

        expect(mockGet).toHaveBeenCalledWith('/api/external/posts', {
            params: {
                status: 'published',
                language: 'zh-CN',
                page: 1,
                limit: 10,
            },
        })
        expect(response.data.items).toHaveLength(2)
        expect(response.data.total).toBe(2)
    })

    it('should call listPosts without query parameters', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                code: 200,
                data: {
                    items: [],
                    total: 0,
                    page: 1,
                    limit: 10,
                },
            },
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.listPosts()

        expect(mockGet).toHaveBeenCalledWith('/api/external/posts', { params: undefined })
        expect(response.data.items).toHaveLength(0)
    })

    it('should call updatePost with correct payload', async () => {
        mockPatch.mockResolvedValueOnce({
            data: {
                code: 200,
                data: {
                    id: 'post_1',
                    title: 'Updated Title',
                    content: 'Updated content',
                    status: 'draft',
                },
            },
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.updatePost('post_1', {
            title: 'Updated Title',
            content: 'Updated content',
        })

        expect(mockPatch).toHaveBeenCalledWith('/api/external/posts/post_1', {
            title: 'Updated Title',
            content: 'Updated content',
        })
        expect((response.data as unknown as Record<string, unknown>).id).toBe('post_1')
        expect(response.data.title).toBe('Updated Title')
    })

    it('should call deletePost with correct post ID', async () => {
        mockDelete.mockResolvedValueOnce({
            data: {
                code: 200,
                message: 'Post deleted successfully',
            },
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.deletePost('post_1')

        expect(mockDelete).toHaveBeenCalledWith('/api/external/posts/post_1')
        expect(response.code).toBe(200)
        expect(response.message).toBe('Post deleted successfully')
    })

    it('should call link governance endpoints with expected payloads', async () => {
        const dryRunResponse = {
            data: {
                code: 200,
                data: {
                    reportId: 'report_1',
                    mode: 'dry-run',
                    summary: {
                        total: 10,
                        resolved: 8,
                        rewritten: 2,
                        unchanged: 0,
                        skipped: 0,
                        failed: 0,
                        needsConfirmation: 0,
                    },
                    items: [],
                    redirectSeeds: [],
                },
            },
        }

        const applyResponse = {
            data: {
                code: 200,
                data: {
                    reportId: 'report_2',
                    mode: 'apply',
                    summary: {
                        total: 10,
                        resolved: 10,
                        rewritten: 0,
                        unchanged: 0,
                        skipped: 0,
                        failed: 0,
                        needsConfirmation: 0,
                    },
                    items: [],
                    redirectSeeds: [],
                },
            },
        }

        const reportResponse = {
            data: {
                code: 200,
                data: {
                    reportId: 'report_1',
                    mode: 'dry-run',
                    summary: {
                        total: 10,
                        resolved: 8,
                        rewritten: 2,
                        unchanged: 0,
                        skipped: 0,
                        failed: 0,
                        needsConfirmation: 0,
                    },
                    items: [],
                    redirectSeeds: [],
                },
            },
        }

        mockPost
            .mockResolvedValueOnce(dryRunResponse)
            .mockResolvedValueOnce(applyResponse)

        mockGet.mockResolvedValueOnce(reportResponse)

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')

        const dryRunResult = await client.dryRunLinkGovernance({
            scopes: ['post-link', 'asset-url'],
            options: { validationMode: 'static' },
        })

        const applyResult = await client.applyLinkGovernance({
            scopes: ['post-link'],
            options: { skipConfirmation: true },
        })

        const reportResult = await client.getLinkGovernanceReport('report_1')

        expect(mockPost).toHaveBeenNthCalledWith(1, '/api/external/migrations/link-governance/dry-run', {
            scopes: ['post-link', 'asset-url'],
            options: { validationMode: 'static' },
        })
        expect(mockPost).toHaveBeenNthCalledWith(2, '/api/external/migrations/link-governance/apply', {
            scopes: ['post-link'],
            options: { skipConfirmation: true },
        })
        expect(mockGet).toHaveBeenCalledWith('/api/external/migrations/link-governance/reports/report_1')
        expect(dryRunResult.data.reportId).toBe('report_1')
        expect(applyResult.data.mode).toBe('apply')
        expect(reportResult.data.reportId).toBe('report_1')
    })
})
