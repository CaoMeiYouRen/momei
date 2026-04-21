import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPostUploadPrefix, buildUploadStoredFilename, uploadFromBuffer } from '../upload'
import { TTSService } from './tts'
import { dataSource } from '@/server/database'
import { getAIProvider } from '@/server/utils/ai'
import { applyPostMetadataPatch } from '@/server/utils/post-metadata'
import { sendInAppNotification } from '@/server/services/notification'

vi.mock('../upload', () => ({
    buildPostUploadPrefix: vi.fn(),
    buildUploadStoredFilename: vi.fn(),
    uploadFromBuffer: vi.fn(),
    UploadType: {},
}))
vi.mock('../setting', () => ({
    getSettings: vi.fn(),
}))
vi.mock('@/server/utils/ai', () => ({
    getAIProvider: vi.fn(),
}))
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))
vi.mock('@/server/entities/post', () => ({
    Post: class Post {},
}))
vi.mock('@/server/entities/ai-task', () => ({
    AITask: class AITask {},
}))
vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}))
vi.mock('@/server/utils/post-metadata', () => ({
    applyPostMetadataPatch: vi.fn(),
}))
vi.mock('@/server/services/notification', () => ({
    sendInAppNotification: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/server/utils/ai/timeout', () => ({
    withAITimeout: vi.fn((promise: Promise<unknown>) => promise),
}))
vi.mock('./cost-display', () => ({
    estimateAICostBreakdown: vi.fn().mockResolvedValue({
        providerCost: 0,
        providerCurrency: 'USD',
        displayCost: 0,
        costDisplay: {
            currencyCode: 'CNY',
            currencySymbol: '¥',
            quotaUnitPrice: 0,
        },
    }),
    estimateAIDisplayCost: vi.fn().mockResolvedValue(0),
}))

describe('TTSService estimateProviderCost', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should use canonical estimateTTSCost when available', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            estimateTTSCost: vi.fn().mockResolvedValue(0.15),
        } as any)

        await expect(TTSService.estimateProviderCost('hello', 'alloy', 'openai')).resolves.toBe(0.15)
    })

    it('should fall back to legacy estimateCost for compatibility', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'siliconflow',
            estimateCost: vi.fn().mockResolvedValue(0.08),
        } as any)

        await expect(TTSService.estimateProviderCost('hello', 'alex', 'siliconflow')).resolves.toBe(0.08)
    })

    it('should use configured default voice when voice is omitted or set to default', async () => {
        const estimateTTSCost = vi.fn().mockResolvedValue(0.15)
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            estimateTTSCost,
        } as any)

        await TTSService.estimateProviderCost('hello', undefined as any, 'openai')
        await TTSService.estimateProviderCost('hello', 'default', 'openai')

        expect(estimateTTSCost).toHaveBeenNthCalledWith(1, 'hello', 'alloy')
        expect(estimateTTSCost).toHaveBeenNthCalledWith(2, 'hello', 'alloy')
    })

    it('should bind locale and translation metadata when processing a post task', async () => {
        const taskRepo = {
            findOneBy: vi.fn().mockResolvedValue({
                id: 'task-1',
                userId: 'user-1',
                provider: 'openai',
                model: 'tts-model',
                category: 'podcast',
                type: 'podcast',
                mode: 'podcast',
                voice: 'alloy',
                payload: JSON.stringify({
                    postId: 'post-1',
                    text: 'Hello from Momei',
                    voice: 'alloy',
                    mode: 'podcast',
                    language: 'en-US',
                    translationId: 'cluster-1',
                    options: {},
                }),
                status: 'pending',
                progress: 0,
                startedAt: new Date('2026-03-16T00:00:00.000Z'),
            }),
            save: vi.fn((value) => Promise.resolve(value)),
        }
        const post = {
            id: 'post-1',
            language: 'en-US',
            translationId: 'cluster-1',
            content: 'Hello from Momei',
            metadata: null,
        }
        const postRepo = {
            findOneBy: vi.fn().mockResolvedValue(post),
            save: vi.fn((value) => Promise.resolve(value)),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            if ((entity as { name?: string })?.name === 'Post') {
                return postRepo as any
            }

            return taskRepo as any
        })

        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            generateSpeech: vi.fn().mockResolvedValue(new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3, 4]))
                    controller.close()
                },
            })),
        } as any)
        vi.mocked(buildPostUploadPrefix).mockReturnValue('posts/post-1/audio/tts/')
        vi.mocked(buildUploadStoredFilename).mockReturnValue('generated.mp3')
        vi.mocked(uploadFromBuffer).mockResolvedValue({
            url: '/uploads/audio/generated.mp3',
            filename: 'generated.mp3',
        } as any)

        await TTSService.processTask('task-1')

        expect(applyPostMetadataPatch).toHaveBeenCalledWith(post, expect.objectContaining({
            metadata: expect.objectContaining({
                audio: expect.objectContaining({
                    url: '/uploads/audio/generated.mp3',
                    language: 'en-US',
                    translationId: 'cluster-1',
                    postId: 'post-1',
                    mode: 'podcast',
                }),
                tts: expect.objectContaining({
                    provider: 'openai',
                    voice: 'alloy',
                    language: 'en-US',
                    translationId: 'cluster-1',
                    postId: 'post-1',
                    mode: 'podcast',
                }),
            }),
        }))
        expect(postRepo.save).toHaveBeenCalledWith(post)
        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            status: 'completed',
        }))
    })

    it('should finalize stale podcast task from uploaded checkpoint without regenerating', async () => {
        const taskRepo = {
            findOneBy: vi.fn()
                .mockResolvedValueOnce({
                    id: 'task-1',
                    userId: 'user-1',
                    provider: 'openai',
                    model: 'tts-model',
                    category: 'podcast',
                    type: 'podcast',
                    mode: 'podcast',
                    voice: 'alloy',
                    payload: JSON.stringify({
                        postId: 'post-1',
                        text: 'Hello from Momei',
                        voice: 'alloy',
                        mode: 'podcast',
                        language: 'en-US',
                        translationId: 'cluster-1',
                        options: {},
                    }),
                    result: JSON.stringify({
                        phase: 'asset_uploaded',
                        uploadedAsset: {
                            url: '/uploads/audio/recovered.mp3',
                            filename: 'recovered.mp3',
                            mimeType: 'audio/mpeg',
                            size: 2048,
                        },
                    }),
                    status: 'processing',
                    progress: 98,
                    startedAt: new Date('2026-03-16T00:00:00.000Z'),
                })
                .mockResolvedValueOnce({
                    id: 'task-1',
                    status: 'completed',
                }),
            save: vi.fn((value) => Promise.resolve(value)),
        }
        const post = {
            id: 'post-1',
            language: 'en-US',
            translationId: 'cluster-1',
            content: 'Hello from Momei',
            metadata: null,
        }
        const postRepo = {
            findOneBy: vi.fn().mockResolvedValue(post),
            save: vi.fn((value) => Promise.resolve(value)),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            if ((entity as { name?: string })?.name === 'Post') {
                return postRepo as any
            }

            return taskRepo as any
        })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('completed')
        expect(getAIProvider).not.toHaveBeenCalled()
        expect(applyPostMetadataPatch).toHaveBeenCalledWith(post, expect.objectContaining({
            metadata: expect.objectContaining({
                audio: expect.objectContaining({
                    url: '/uploads/audio/recovered.mp3',
                    postId: 'post-1',
                    mode: 'podcast',
                }),
            }),
        }))
        expect(sendInAppNotification).toHaveBeenCalled()
    })

    it('should resume stale tts task by regenerating audio once', async () => {
        const taskRepo = {
            findOneBy: vi.fn().mockResolvedValue({
                id: 'task-1',
                userId: 'user-1',
                provider: 'openai',
                model: 'tts-model',
                category: 'tts',
                type: 'tts',
                mode: 'speech',
                voice: 'alloy',
                payload: JSON.stringify({
                    text: 'Hello from Momei',
                    voice: 'alloy',
                    mode: 'speech',
                    options: {},
                }),
                result: JSON.stringify({
                    resumeAttempts: 1,
                }),
                status: 'processing',
                progress: 10,
                startedAt: new Date('2026-03-16T00:00:00.000Z'),
            }),
            save: vi.fn((value) => Promise.resolve(value)),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as any)
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            generateSpeech: vi.fn().mockResolvedValue(new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3, 4]))
                    controller.close()
                },
            })),
        } as any)
        vi.mocked(buildUploadStoredFilename).mockReturnValue('generated.mp3')
        vi.mocked(uploadFromBuffer).mockResolvedValue({
            url: '/uploads/audio/generated.mp3',
            filename: 'generated.mp3',
        } as any)

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('completed')
        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            status: 'completed',
        }))
        expect(sendInAppNotification).toHaveBeenCalled()
    })

    it('should fail stale tts task after compensation attempts are exhausted', async () => {
        const taskRepo = {
            findOneBy: vi.fn().mockResolvedValue({
                id: 'task-1',
                userId: 'user-1',
                provider: 'openai',
                model: 'tts-model',
                category: 'tts',
                type: 'tts',
                payload: JSON.stringify({ text: 'Hello from Momei', voice: 'alloy', mode: 'speech', options: {} }),
                result: JSON.stringify({
                    resumeAttempts: 2,
                }),
                status: 'processing',
                progress: 10,
                startedAt: new Date('2026-03-16T00:00:00.000Z'),
            }),
            save: vi.fn((value) => Promise.resolve(value)),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as any)

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('failed')
        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            status: 'failed',
            error: 'TTS generation task timed out and exceeded compensation attempts',
        }))
    })

    it('should fail stale podcast task after compensation attempts are exhausted', async () => {
        const taskRepo = {
            findOneBy: vi.fn().mockResolvedValue({
                id: 'task-1',
                userId: 'user-1',
                provider: 'openai',
                model: 'tts-model',
                category: 'podcast',
                type: 'podcast',
                payload: JSON.stringify({ text: 'Hello from Momei', voice: 'alloy', mode: 'podcast', options: {} }),
                result: JSON.stringify({
                    phase: 'queued',
                    resumeAttempts: 2,
                }),
                status: 'processing',
                progress: 10,
                startedAt: new Date('2026-03-16T00:00:00.000Z'),
            }),
            save: vi.fn((value) => Promise.resolve(value)),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as any)

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('failed')
        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            status: 'failed',
            error: 'Podcast generation task timed out and exceeded compensation attempts',
        }))
    })
})
