import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { TTSService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const h3Mocks = vi.hoisted(() => ({
    getRouterParam: vi.fn(() => 'post-1'),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()

    return {
        ...actual,
        getRouterParam: h3Mocks.getRouterParam,
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/ai', () => ({
    TTSService: {
        estimateCost: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdminOrAuthor: vi.fn(),
}))

describe('PUT /api/posts/[id]/tts-metadata', () => {
    let handler: (event: any) => Promise<any>

    const post = {
        id: 'post-1',
        authorId: 'author-1',
        language: 'zh-CN',
        translationId: 'translation-1',
        metadata: {
            audio: {
                url: 'https://old.example.com/audio.mp3',
            },
            tts: {
                provider: 'volcengine',
                voice: 'old-voice',
            },
        },
        metaVersion: 1,
    }

    const postRepo = {
        findOneBy: vi.fn(() => Promise.resolve(post)),
        save: vi.fn((value) => Promise.resolve(value)),
    }

    const taskRepo = {
        create: vi.fn((payload) => ({
            id: 'task-direct-1',
            ...payload,
        })),
        save: vi.fn((value) => Promise.resolve(value)),
        findOneBy: vi.fn<() => Promise<any>>(async () => Promise.resolve(null)),
    }

    beforeEach(async () => {
        handler ||= (await import('./tts-metadata.put')).default
        vi.clearAllMocks()
        h3Mocks.getRouterParam.mockReturnValue('post-1')
        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: { id: 'author-1', role: 'author' },
        } as any)
        vi.mocked(TTSService.estimateCost).mockResolvedValue(0.42)
        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            let entityName: string | undefined

            if (typeof entity === 'function') {
                entityName = entity.name
            } else if (typeof entity === 'object' && entity !== null && 'name' in entity) {
                entityName = (entity as { name?: string }).name
            }

            if (entityName === 'Post') {
                return postRepo as any
            }

            return taskRepo as any
        })
    })

    it('should persist direct tts metadata with post scoped audio fields and completed task metrics', async () => {
        const result = await handler({
            body: {
                audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/voice.mp3',
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                mode: 'speech',
                duration: 66,
                audioSize: 2048,
                mimeType: 'audio/mpeg',
                textLength: 123,
                text: 'hello world',
                language: 'zh-CN',
                model: 'seed-tts-2.0-expressive',
            },
        } as any)

        expect(postRepo.save).toHaveBeenCalledTimes(1)
        expect(post.metadata).toMatchObject({
            audio: {
                url: 'https://cdn.example.com/posts/post-1/audio/tts/voice.mp3',
                size: 2048,
                duration: 66,
                mimeType: 'audio/mpeg',
                language: 'zh-CN',
                translationId: 'translation-1',
                postId: 'post-1',
                mode: 'speech',
            },
            tts: {
                provider: 'volcengine',
                voice: 'zh_female_vv_uranus_bigtts',
                duration: 66,
                language: 'zh-CN',
                translationId: 'translation-1',
                postId: 'post-1',
                mode: 'speech',
            },
        })

        expect(taskRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'tts_direct',
            audioDuration: 66,
            audioSize: 2048,
            language: 'zh-CN',
            actualCost: 0.42,
            chargeStatus: 'estimated',
        }))
        expect(result).toEqual({
            success: true,
            audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/voice.mp3',
        })
    })

    it('should settle an existing direct task with actual usage when provider usage is available', async () => {
        const createdAt = new Date(Date.now() - 5000)

        taskRepo.findOneBy.mockResolvedValueOnce({
            id: 'task-direct-existing',
            userId: 'author-1',
            postId: 'post-1',
            category: 'podcast',
            type: 'podcast_direct',
            provider: 'volcengine',
            model: 'seed-tts-2.0-expressive',
            mode: 'podcast',
            voice: 'zh_female_vv_uranus_bigtts',
            script: 'hello world',
            payload: JSON.stringify({
                postId: 'post-1',
                text: 'hello world',
                voice: 'zh_female_vv_uranus_bigtts',
                mode: 'podcast',
                language: 'zh-CN',
                translationId: 'translation-1',
                strategy: 'frontend-direct',
            }),
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
            progress: 0,
            audioDuration: 0,
            audioSize: 0,
            textLength: 0,
            language: 'zh-CN',
            quotaUnits: 0,
            chargeStatus: 'none',
            failureStage: null,
            usageSnapshot: null,
            createdAt,
            startedAt: null,
            completedAt: null,
            durationMs: 0,
        })

        const result = await handler({
            body: {
                taskId: 'task-direct-existing',
                status: 'completed',
                audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/podcast.mp3',
                providerUsage: {
                    tokens_total: 4200,
                },
                duration: 80,
                audioSize: 4096,
                mimeType: 'audio/mpeg',
            },
        } as any)

        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 'task-direct-existing',
            status: 'completed',
            chargeStatus: 'actual',
            quotaUnits: 45,
            actualCost: 0.42,
        }))
        expect(taskRepo.save.mock.calls[0]?.[0]?.durationMs).toBeGreaterThan(0)
        expect(result).toEqual({
            success: true,
            audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/podcast.mp3',
        })
    })

    it('should mark an existing direct task as failed with estimated fallback when provider usage is unavailable', async () => {
        taskRepo.findOneBy.mockResolvedValueOnce({
            id: 'task-direct-failed',
            userId: 'author-1',
            postId: 'post-1',
            category: 'tts',
            type: 'tts_direct',
            provider: 'volcengine',
            model: 'seed-tts-2.0-expressive',
            mode: 'speech',
            voice: 'zh_female_vv_uranus_bigtts',
            script: 'hello world',
            payload: JSON.stringify({
                postId: 'post-1',
                text: 'hello world',
                voice: 'zh_female_vv_uranus_bigtts',
                mode: 'speech',
                language: 'zh-CN',
                translationId: 'translation-1',
                strategy: 'frontend-direct',
            }),
            estimatedCost: 1.23,
            estimatedQuotaUnits: 8,
            progress: 35,
            audioDuration: 0,
            audioSize: 0,
            textLength: 0,
            language: 'zh-CN',
            quotaUnits: 0,
            chargeStatus: 'none',
            failureStage: null,
            usageSnapshot: null,
            startedAt: new Date('2026-05-05T10:00:00.000Z'),
            completedAt: null,
            durationMs: 0,
            result: null,
        })

        const result = await handler({
            body: {
                taskId: 'task-direct-failed',
                status: 'failed',
                error: 'provider timeout',
            },
        } as any)

        expect(postRepo.save).toHaveBeenCalledTimes(0)
        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 'task-direct-failed',
            status: 'failed',
            chargeStatus: 'estimated',
            quotaUnits: 8,
            actualCost: 1.23,
            error: 'provider timeout',
            failureStage: 'provider_processing',
        }))
        expect(result).toEqual({
            success: true,
            audioUrl: null,
        })
    })

    it('should reject settling a direct task for a different post', async () => {
        taskRepo.findOneBy.mockResolvedValueOnce({
            id: 'task-direct-other-post',
            userId: 'author-1',
            postId: 'post-2',
            type: 'tts_direct',
            payload: JSON.stringify({
                postId: 'post-2',
                strategy: 'frontend-direct',
            }),
        })

        await expect(handler({
            body: {
                taskId: 'task-direct-other-post',
                status: 'completed',
                audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/voice.mp3',
            },
        } as any)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Task does not belong to this post',
        })
    })

    it('should ignore a stale failed settlement after a direct task is already completed', async () => {
        taskRepo.findOneBy.mockResolvedValueOnce({
            id: 'task-direct-completed',
            userId: 'author-1',
            postId: 'post-1',
            type: 'tts_direct',
            status: 'completed',
            payload: JSON.stringify({
                postId: 'post-1',
                strategy: 'frontend-direct',
            }),
            result: JSON.stringify({
                audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/final.mp3',
                strategy: 'frontend-direct',
            }),
        })

        const result = await handler({
            body: {
                taskId: 'task-direct-completed',
                status: 'failed',
                error: 'metadata failed',
            },
        } as any)

        expect(postRepo.save).not.toHaveBeenCalled()
        expect(taskRepo.save).not.toHaveBeenCalled()
        expect(result).toEqual({
            success: true,
            audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/final.mp3',
        })
    })

    it('should reject settling a non-direct task through the direct metadata endpoint', async () => {
        taskRepo.findOneBy.mockResolvedValueOnce({
            id: 'task-async-1',
            userId: 'author-1',
            postId: 'post-1',
            type: 'tts',
            payload: JSON.stringify({
                postId: 'post-1',
            }),
        })

        await expect(handler({
            body: {
                taskId: 'task-async-1',
                status: 'completed',
                audioUrl: 'https://cdn.example.com/posts/post-1/audio/tts/voice.mp3',
            },
        } as any)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Only frontend-direct TTS tasks can be settled via this endpoint',
        })
    })
})
