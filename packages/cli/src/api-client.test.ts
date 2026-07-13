import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CliImportPostRequest } from './types'

const { mockFetch } = vi.hoisted(() => ({
    mockFetch: vi.fn(),
}))

vi.stubGlobal('fetch', mockFetch)

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
    })

    it('should report sequential progress across concurrent batches', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ code: 200, data: { id: 1 } }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ code: 200, data: { id: 2 } }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ code: 200, data: { id: 3 } }),
            })

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
        const mockJsonResponse = (data: unknown) => ({
            ok: true,
            json: () => Promise.resolve({ code: 200, data }),
        })

        mockFetch
            // suggestTitles POST
            .mockResolvedValueOnce(mockJsonResponse(['Title A', 'Title B']))
            // translatePost POST
            .mockResolvedValueOnce(mockJsonResponse({ taskId: 'task_translate_1', status: 'pending' }))
            // recommendCategories POST
            .mockResolvedValueOnce(mockJsonResponse({
                matchedCategoryId: 'cat_en',
                candidates: [{ id: 'cat_en', name: 'Engineering', slug: 'engineering', language: 'en-US', reason: 'ai-recommended' }],
                proposedCategory: { name: 'Engineering', slug: 'engineering', reason: 'translated-source-name' },
                sourceCategory: { id: 'cat_zh', name: '工程实践', slug: 'gong-cheng-shi-jian', language: 'zh-CN' },
            }))
            // getAITask GET
            .mockResolvedValueOnce(mockJsonResponse({
                taskId: 'task_translate_1',
                status: 'completed',
                type: 'translate-post',
                result: { targetPostId: 'post_en_1' },
            }))

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

        expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/external/ai/suggest-titles', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: 'example content', language: 'zh-CN' }),
        }))
        expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/external/ai/translate-post', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
                sourcePostId: 'post_1',
                targetLanguage: 'en-US',
                scopes: ['title', 'content'],
                slugStrategy: 'ai',
                categoryStrategy: 'suggest',
                confirmationMode: 'require',
            }),
        }))
        expect(mockFetch).toHaveBeenNthCalledWith(3, 'http://localhost:3000/api/external/ai/recommend-categories', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ postId: 'post_1', targetLanguage: 'en-US', limit: 3 }),
        }))
        expect(mockFetch).toHaveBeenNthCalledWith(4, 'http://localhost:3000/api/external/ai/tasks/task_translate_1', expect.objectContaining({
            headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
        }))
        expect(titles.data).toEqual(['Title A', 'Title B'])
        expect(categories.data.matchedCategoryId).toBe('cat_en')
        expect(task.data.taskId).toBe('task_translate_1')
        expect(taskStatus.data.status).toBe('completed')
    })

    it('should call the import validation endpoint before import execution when requested', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
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
            }),
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.validateImportPost({
            title: 'Validated Post',
            content: 'Validated Post content',
            sourceFile: 'validated-post.md',
        })

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/external/posts/validate', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
                title: 'Validated Post',
                content: 'Validated Post content',
                sourceFile: 'validated-post.md',
            }),
        }))
        expect(response.data.canonicalSlug).toBe('validated-post')
    })

    it('should call listPosts with query parameters', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
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
            }),
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.listPosts({
            status: 'published',
            language: 'zh-CN',
            page: 1,
            limit: 10,
        })

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3000/api/external/posts?status=published&language=zh-CN&page=1&limit=10',
            expect.objectContaining({ headers: expect.objectContaining({ 'X-API-Key': 'test-key' }) }),
        )
        expect(response.data.items).toHaveLength(2)
        expect(response.data.total).toBe(2)
    })

    it('should call listPosts without query parameters', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                code: 200,
                data: { items: [], total: 0, page: 1, limit: 10 },
            }),
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.listPosts()

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3000/api/external/posts',
            expect.objectContaining({ headers: expect.objectContaining({ 'X-API-Key': 'test-key' }) }),
        )
        expect(response.data.items).toHaveLength(0)
    })

    it('should call updatePost with correct payload', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                code: 200,
                data: {
                    id: 'post_1',
                    title: 'Updated Title',
                    content: 'Updated content',
                    status: 'draft',
                },
            }),
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.updatePost('post_1', {
            title: 'Updated Title',
            content: 'Updated content',
        })

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3000/api/external/posts/post_1',
            expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({ title: 'Updated Title', content: 'Updated content' }),
            }),
        )
        expect((response.data as Record<string, unknown>).id).toBe('post_1')
        expect((response.data as Record<string, unknown>).title).toBe('Updated Title')
    })

    it('should call deletePost with correct post ID', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ code: 200, data: { message: 'Post deleted successfully' } }),
        })

        const client = new MomeiApiClient('http://localhost:3000', 'test-key')
        const response = await client.deletePost('post_1')

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3000/api/external/posts/post_1',
            expect.objectContaining({ method: 'DELETE' }),
        )
        expect(response.code).toBe(200)
    })

    it('should call link governance endpoints with expected payloads', async () => {
        const dryRunData = {
            reportId: 'report_1',
            mode: 'dry-run' as const,
            summary: { total: 10, resolved: 8, rewritten: 2, unchanged: 0, skipped: 0, failed: 0, needsConfirmation: 0 },
            items: [],
            redirectSeeds: [],
        }

        const applyData = {
            reportId: 'report_2',
            mode: 'apply' as const,
            summary: { total: 10, resolved: 10, rewritten: 0, unchanged: 0, skipped: 0, failed: 0, needsConfirmation: 0 },
            items: [],
            redirectSeeds: [],
        }

        const mockOk = (data: unknown) => ({
            ok: true,
            json: () => Promise.resolve({ code: 200, data }),
        })

        mockFetch
            .mockResolvedValueOnce(mockOk(dryRunData))
            .mockResolvedValueOnce(mockOk(applyData))
            .mockResolvedValueOnce(mockOk(dryRunData))

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

        expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/external/migrations/link-governance/dry-run', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ scopes: ['post-link', 'asset-url'], options: { validationMode: 'static' } }),
        }))
        expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/external/migrations/link-governance/apply', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ scopes: ['post-link'], options: { skipConfirmation: true } }),
        }))
        expect(mockFetch).toHaveBeenNthCalledWith(3, 'http://localhost:3000/api/external/migrations/link-governance/reports/report_1', expect.objectContaining({
            headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
        }))
        expect(dryRunResult.data.reportId).toBe('report_1')
        expect(applyResult.data.mode).toBe('apply')
        expect(reportResult.data.reportId).toBe('report_1')
    })
})
