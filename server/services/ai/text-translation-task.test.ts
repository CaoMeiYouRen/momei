import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TextTranslationTaskService } from './text-translation-task'
import { requestTranslation } from './text-translation'
import { assertAIQuotaAllowance } from '@/server/services/ai/quota-governance'
import { dataSource } from '@/server/database'
import { isServerlessEnvironment } from '@/server/utils/env'
import { AI_MAX_CONTENT_LENGTH } from '@/utils/shared/env'

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
    // 实体层由数据库生成自增 id；recordTask 在新建时会把 `id: undefined` 传进来，
    // 因此这里显式 id 优先、缺省回退到固定 id，避免把 `id` 覆盖成 undefined。
    const create = vi.fn((value: { id?: string }) => ({ ...value, id: value.id ?? 'task-1' }))

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
        vi.mocked(isServerlessEnvironment).mockReturnValue(true)
        save.mockImplementation((task) => Promise.resolve(task))
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

    describe('continueTranslateTask guards', () => {
        const buildTask = (overrides: Record<string, unknown> = {}) => ({
            id: 'task-guard',
            userId: 'user-1',
            type: 'translate',
            status: 'pending',
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
                lastError: null,
                failureCount: 0,
            }),
            provider: null,
            model: null,
            error: null,
            progress: 0,
            startedAt: null,
            completedAt: null,
            ...overrides,
        })

        it('should return null when the task does not exist', async () => {
            findOneBy.mockResolvedValue(null)

            await expect(TextTranslationTaskService.continueTranslateTask('missing', 'user-1')).resolves.toBeNull()
            expect(requestTranslation).not.toHaveBeenCalled()
        })

        it('should return non-translate tasks without processing', async () => {
            const task = buildTask({ type: 'image' })
            findOneBy.mockResolvedValue(task)

            await expect(TextTranslationTaskService.continueTranslateTask('task-guard', 'user-1')).resolves.toBe(task)
            expect(requestTranslation).not.toHaveBeenCalled()
        })

        it('should return completed tasks without processing', async () => {
            const task = buildTask({ status: 'completed' })
            findOneBy.mockResolvedValue(task)

            await expect(TextTranslationTaskService.continueTranslateTask('task-guard', 'user-1')).resolves.toBe(task)
            expect(requestTranslation).not.toHaveBeenCalled()
        })

        it('should resume failed tasks only when explicitly allowed', async () => {
            const task = buildTask({ status: 'failed' })
            findOneBy.mockResolvedValue(task)

            const result = await TextTranslationTaskService.continueTranslateTask('task-guard', 'user-1', {
                allowFailedResume: true,
            }) as { status: string }

            expect(requestTranslation).toHaveBeenCalled()
            expect(result.status).toBe('completed')
        })

        it('should mark the task completed when all chunks are already persisted', async () => {
            const task = buildTask({
                result: JSON.stringify({
                    mode: 'task',
                    content: 'translated',
                    translatedChunks: ['translated'],
                    completedChunks: 1,
                    totalChunks: 1,
                    nextChunkIndex: 1,
                    activeChunkIndex: null,
                    leaseExpiresAt: null,
                    chunkSize: 2000,
                    concurrency: 1,
                    targetLanguage: 'en-US',
                    lastError: null,
                    failureCount: 0,
                }),
            })
            findOneBy.mockResolvedValue(task)

            const result = await TextTranslationTaskService.continueTranslateTask('task-guard', 'user-1') as {
                status: string
                progress: number
            }

            expect(result.status).toBe('completed')
            expect(result.progress).toBe(100)
            expect(requestTranslation).not.toHaveBeenCalled()
        })

        it('should return the latest task when the chunk lease cannot be claimed', async () => {
            const task = buildTask()
            update.mockResolvedValueOnce({ affected: 0 })
            findOneBy.mockResolvedValue(task)

            const result = await TextTranslationTaskService.continueTranslateTask('task-guard', 'user-1')

            expect(result).toBe(task)
            // 初次读取 + 抢占失败后的回读，证明返回的是重新查询到的任务。
            expect(findOneBy).toHaveBeenCalledTimes(2)
            expect(requestTranslation).not.toHaveBeenCalled()
        })

        it('should record a failed task after three consecutive chunk failures', async () => {
            const snapshots: Record<string, unknown>[] = []
            save.mockImplementation((value: Record<string, unknown>) => {
                snapshots.push({ ...value })
                return Promise.resolve(value)
            })
            const task = buildTask({
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
                    lastError: 'previous failure',
                    failureCount: 2,
                }),
            })
            findOneBy.mockResolvedValue(task)
            vi.mocked(requestTranslation).mockRejectedValueOnce(new Error('provider down'))

            await TextTranslationTaskService.continueTranslateTask('task-guard', 'user-1')

            // 断言落库快照而不是对象引用：同一 task 对象会被后续步骤原地改写。
            const failed = snapshots.find((snapshot) => snapshot.status === 'failed')
            expect(failed).toBeDefined()
            expect(String(failed?.error)).toContain('provider down')
            expect(failed?.progress).toBe(0)
        })

        it('should process multiple chunks in one step outside serverless environments', async () => {
            vi.mocked(isServerlessEnvironment).mockReturnValue(false)
            const content = `${'a'.repeat(2100)}\n\n${'b'.repeat(2100)}`
            const task = buildTask({
                payload: JSON.stringify({ content, to: 'en-US', chunkSize: 2000, concurrency: 3 }),
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
                    lastError: null,
                    failureCount: 0,
                }),
            })
            findOneBy.mockResolvedValue(task)

            const result = await TextTranslationTaskService.continueTranslateTask('task-guard', 'user-1') as {
                status: string
                progress: number
            }

            expect(requestTranslation.mock.calls.length).toBeGreaterThan(1)
            // concurrency=3 但内容切成 4 块：本步处理 3 块后仍有剩余，保持 processing。
            expect(result.status).toBe('processing')
            expect(result.progress).toBeGreaterThan(0)
        })
    })

    describe('createTranslateTask', () => {
        it('should persist a pending task with estimated quota and serialized state', async () => {
            const task = await TextTranslationTaskService.createTranslateTask(
                'hello world',
                'en-US',
                'user-1',
                { sourceLanguage: 'zh-CN', field: 'content' },
            ) as { id: string, status: string, progress: number, payload: string, result: string }

            // 新建任务不带 id（由数据库生成），mock 不应把这个事实掩盖成 undefined 覆盖。
            expect(create.mock.calls[0]?.[0]).toMatchObject({ id: undefined })
            expect(task.id).toBe('task-1')
            expect(task.status).toBe('pending')
            expect(task.progress).toBe(0)

            const payload = JSON.parse(task.payload) as {
                content: string
                to: string
                sourceLanguage?: string
                field?: string
                chunkSize: number
                concurrency: number
            }

            expect(payload).toMatchObject({
                content: 'hello world',
                to: 'en-US',
                sourceLanguage: 'zh-CN',
                field: 'content',
            })
            expect(payload.chunkSize).toBeGreaterThan(0)

            const state = JSON.parse(task.result) as { mode: string, totalChunks: number, translatedChunks: string[] }
            expect(state.mode).toBe('task')
            expect(state.totalChunks).toBe(1)
            expect(state.translatedChunks).toEqual([''])

            const saved = save.mock.calls.at(-1)?.[0] as {
                estimatedQuotaUnits?: number
                chargeStatus?: string
                textLength?: number
                progress?: number
            }
            expect(saved.estimatedQuotaUnits).toBeGreaterThan(0)
            expect(saved.chargeStatus).toBe('none')
            expect(saved.textLength).toBe('hello world'.length)
            expect(saved.progress).toBe(0)
        })

        it('should reject oversized content before touching quota or persistence', async () => {
            await expect(TextTranslationTaskService.createTranslateTask(
                'a'.repeat(AI_MAX_CONTENT_LENGTH + 1),
                'en-US',
                'user-1',
            )).rejects.toMatchObject({ statusCode: 413 })

            expect(assertAIQuotaAllowance).not.toHaveBeenCalled()
            expect(save).not.toHaveBeenCalled()
        })

        it('should propagate quota rejection without creating a task', async () => {
            vi.mocked(assertAIQuotaAllowance).mockRejectedValueOnce(
                Object.assign(new Error('Quota exceeded'), { statusCode: 402 }),
            )

            await expect(TextTranslationTaskService.createTranslateTask('hello', 'en-US', 'user-1'))
                .rejects.toThrow('Quota exceeded')

            expect(save).not.toHaveBeenCalled()
        })

        it('should fail loudly when the task record cannot be persisted', async () => {
            save.mockResolvedValueOnce(undefined as never)

            await expect(TextTranslationTaskService.createTranslateTask('hello', 'en-US', 'user-1'))
                .rejects.toThrow('Failed to create AI task')
        })
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
