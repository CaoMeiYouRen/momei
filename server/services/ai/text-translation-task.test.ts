import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TextTranslationTaskService } from './text-translation-task'
import { requestTranslation } from './text-translation'
import { dataSource } from '@/server/database'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/entities/ai-task', () => ({
    AITask: class MockAITask {},
}))

vi.mock('@/server/services/ai/quota-governance', () => ({
    assertAIQuotaAllowance: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('@/server/utils/env', () => ({
    isServerlessEnvironment: vi.fn(() => true),
}))

vi.mock('./text-translation', () => ({
    requestTranslation: vi.fn((content: string) => Promise.resolve({
        provider: { name: 'openai' },
        response: {
            model: 'gpt-4o',
            usage: {
                promptTokens: 10,
                completionTokens: 5,
                totalTokens: 15,
            },
        },
        translatedContent: `translated:${content.slice(0, 8)}`,
    })),
}))

describe('TextTranslationTaskService', () => {
    const save = vi.fn((task) => Promise.resolve(task))
    const update = vi.fn(() => Promise.resolve({ affected: 1 }))
    const findOneBy = vi.fn()
    const create = vi.fn((value) => ({ id: 'task-1', ...value }))

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue({
            save,
            update,
            findOneBy,
            create,
        } as never)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should persist partial translate progress and keep task processing on serverless', async () => {
        const content = `${'a'.repeat(2100)}\n\n${'b'.repeat(2100)}`
        const task = {
            id: 'task-1',
            userId: 'user-1',
            type: 'translate',
            status: 'pending',
            payload: JSON.stringify({
                content,
                to: 'en-US',
                chunkSize: 2000,
                concurrency: 3,
                sourceLanguage: 'zh-CN',
                field: 'content',
            }),
            result: JSON.stringify({
                mode: 'task',
                content: '',
                translatedChunks: ['', ''],
                completedChunks: 0,
                totalChunks: 2,
                nextChunkIndex: 0,
                activeChunkIndex: null,
                leaseExpiresAt: null,
                chunkSize: 2000,
                concurrency: 3,
                targetLanguage: 'en-US',
                sourceLanguage: 'zh-CN',
                field: 'content',
                lastError: null,
                failureCount: 0,
            }),
            provider: null,
            model: null,
            error: null,
            progress: 0,
            startedAt: null,
            completedAt: null,
        }

        findOneBy.mockResolvedValue(task)

        const result = await TextTranslationTaskService.continueTranslateTask('task-1', 'user-1') as {
            status: string
            progress: number
            result: string
        }

        const persisted = JSON.parse(result.result) as {
            completedChunks: number
            totalChunks: number
            content: string
        }

        expect(result.status).toBe('processing')
        expect(result.progress).toBe(25)
        expect(persisted.completedChunks).toBe(1)
        expect(persisted.totalChunks).toBe(4)
        expect(persisted.content).toContain('translated:')
    })

    it('should keep task processing after a transient chunk failure and preserve completed chunks', async () => {
        const content = `${'a'.repeat(2100)}\n\n${'b'.repeat(2100)}`
        const task = {
            id: 'task-1',
            userId: 'user-1',
            type: 'translate',
            status: 'processing',
            payload: JSON.stringify({
                content,
                to: 'en-US',
                chunkSize: 2000,
                concurrency: 3,
                sourceLanguage: 'zh-CN',
                field: 'content',
            }),
            result: JSON.stringify({
                mode: 'task',
                content: 'translated:first',
                translatedChunks: ['translated:first', ''],
                completedChunks: 1,
                totalChunks: 2,
                nextChunkIndex: 1,
                activeChunkIndex: null,
                leaseExpiresAt: null,
                chunkSize: 2000,
                concurrency: 3,
                targetLanguage: 'en-US',
                sourceLanguage: 'zh-CN',
                field: 'content',
                lastError: null,
                failureCount: 0,
            }),
            provider: 'openai',
            model: 'gpt-4o',
            error: null,
            progress: 50,
            startedAt: null,
            completedAt: null,
        }

        findOneBy.mockResolvedValue(task)
        vi.mocked(requestTranslation).mockRejectedValueOnce(new Error('chunk failed'))

        const result = await TextTranslationTaskService.continueTranslateTask('task-1', 'user-1') as {
            status: string
            error: string
            result: string
        }
        const persisted = JSON.parse(result.result) as {
            completedChunks: number
            failureCount: number
            lastError: string | null
        }

        expect(result.status).toBe('processing')
        expect(result.error).toBe('chunk failed')
        expect(persisted.completedChunks).toBe(1)
        expect(persisted.failureCount).toBe(1)
        expect(persisted.lastError).toBe('chunk failed')
    })

    it('should abort a slow serverless chunk before the platform timeout window', async () => {
        vi.useFakeTimers()

        const task = {
            id: 'task-1',
            userId: 'user-1',
            type: 'translate',
            status: 'pending',
            payload: JSON.stringify({
                content: 'body',
                to: 'en-US',
                chunkSize: 1000,
                concurrency: 1,
                sourceLanguage: 'zh-CN',
                field: 'content',
            }),
            result: JSON.stringify({
                mode: 'task',
                content: '',
                translatedChunks: [''],
                completedChunks: 0,
                totalChunks: 1,
                nextChunkIndex: 0,
                activeChunkIndex: null,
                leaseExpiresAt: null,
                chunkSize: 1000,
                concurrency: 1,
                targetLanguage: 'en-US',
                sourceLanguage: 'zh-CN',
                field: 'content',
                lastError: null,
                failureCount: 0,
            }),
            provider: null,
            model: null,
            error: null,
            progress: 0,
            startedAt: null,
            completedAt: null,
        }

        findOneBy.mockResolvedValue(task)
        vi.mocked(requestTranslation).mockImplementationOnce((_, __, ___, options) => new Promise((resolvePromise, reject) => {
            void resolvePromise
            options?.signal?.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'))
            }, { once: true })
        }))

        const pendingResult = TextTranslationTaskService.continueTranslateTask('task-1', 'user-1') as Promise<{
            status: string
            error: string
            result: string
        }>

        await vi.advanceTimersByTimeAsync(45_000)
        const result = await pendingResult
        const persisted = JSON.parse(result.result) as {
            failureCount: number
            lastError: string | null
        }

        expect(result.status).toBe('processing')
        expect(result.error).toContain('Translation chunk timeout')
        expect(persisted.failureCount).toBe(1)
        expect(persisted.lastError).toContain('Translation chunk timeout')
    })

    it('should not resume a failed task unless explicitly requested', async () => {
        const task = {
            id: 'task-1',
            userId: 'user-1',
            type: 'translate',
            status: 'failed',
            payload: JSON.stringify({ content: 'body', to: 'en-US', chunkSize: 2000, concurrency: 1 }),
            result: JSON.stringify({
                mode: 'task',
                content: '',
                translatedChunks: [''],
                completedChunks: 0,
                totalChunks: 1,
                nextChunkIndex: 0,
                activeChunkIndex: null,
                leaseExpiresAt: null,
                chunkSize: 2000,
                concurrency: 1,
                targetLanguage: 'en-US',
                lastError: 'chunk failed',
                failureCount: 3,
            }),
            provider: null,
            model: null,
            error: 'chunk failed',
            progress: 0,
            startedAt: null,
            completedAt: null,
        }

        findOneBy.mockResolvedValue(task)

        const result = await TextTranslationTaskService.continueTranslateTask('task-1', 'user-1')

        expect(result).toBe(task)
        expect(requestTranslation).not.toHaveBeenCalled()
    })

    it('should skip duplicate chunk execution while another poller holds the lease', async () => {
        const task = {
            id: 'task-1',
            userId: 'user-1',
            type: 'translate',
            status: 'processing',
            payload: JSON.stringify({ content: 'body', to: 'en-US', chunkSize: 2000, concurrency: 1 }),
            result: JSON.stringify({
                mode: 'task',
                content: '',
                translatedChunks: [''],
                completedChunks: 0,
                totalChunks: 1,
                nextChunkIndex: 0,
                activeChunkIndex: 0,
                leaseExpiresAt: new Date(Date.now() + 30_000).toISOString(),
                chunkSize: 2000,
                concurrency: 1,
                targetLanguage: 'en-US',
                lastError: null,
                failureCount: 0,
            }),
            provider: null,
            model: null,
            error: null,
            progress: 0,
            startedAt: null,
            completedAt: null,
        }

        findOneBy.mockResolvedValue(task)

        const result = await TextTranslationTaskService.continueTranslateTask('task-1', 'user-1')

        expect(result).toBe(task)
        expect(requestTranslation).not.toHaveBeenCalled()
        expect(update).not.toHaveBeenCalled()
    })
})
