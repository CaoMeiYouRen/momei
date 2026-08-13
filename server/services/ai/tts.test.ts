import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPostUploadPrefix, buildUploadStoredFilename, uploadFromBuffer } from '../upload'
import { TTSService } from './tts'
import { dataSource } from '@/server/database'
import { getAIProvider } from '@/server/utils/ai'
import { applyPostMetadataPatch } from '@/server/utils/post-metadata'
import { sendInAppNotification } from '@/server/services/notification'
import { SettingKey } from '@/types/setting'
import type { AIProvider } from '@/types/ai'

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
        })

        await expect(TTSService.estimateProviderCost('hello', 'alloy', 'openai')).resolves.toBe(0.15)
    })

    it('should fall back to legacy estimateCost for compatibility', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'siliconflow',
            estimateCost: vi.fn().mockResolvedValue(0.08),
        })

        await expect(TTSService.estimateProviderCost('hello', 'alex', 'siliconflow')).resolves.toBe(0.08)
    })

    it('should use configured default voice when voice is omitted or set to default', async () => {
        const estimateTTSCost = vi.fn().mockResolvedValue(0.15)
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            estimateTTSCost,
        })

        await TTSService.estimateProviderCost('hello', undefined, 'openai')
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
        })
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
        })
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

    it('should skip compensation for unrelated task types', async () => {
        const taskRepo = {
            findOneBy: vi.fn().mockResolvedValue({
                id: 'task-1',
                userId: 'user-1',
                type: 'image',
                status: 'processing',
            }),
            save: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as any)

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('skipped')
    })

    it('should return completed for already completed tasks', async () => {
        const taskRepo = {
            findOneBy: vi.fn().mockResolvedValue({
                id: 'task-1',
                userId: 'user-1',
                type: 'tts',
                status: 'completed',
            }),
            save: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as any)

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('completed')
    })

    it('should return failed for already failed tasks', async () => {
        const taskRepo = {
            findOneBy: vi.fn().mockResolvedValue({
                id: 'task-1',
                userId: 'user-1',
                type: 'tts',
                status: 'failed',
            }),
            save: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as any)

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('failed')
    })

    it('should report resumed for podcast checkpoint that stays processing', async () => {
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
                    payload: JSON.stringify({ text: 'Hello', voice: 'alloy', mode: 'podcast', options: {} }),
                    result: JSON.stringify({
                        phase: 'asset_uploaded',
                        uploadedAsset: {
                            url: '/uploads/audio/partial.mp3',
                            filename: 'partial.mp3',
                            mimeType: 'audio/mpeg',
                            size: 512,
                        },
                    }),
                    status: 'processing',
                    progress: 98,
                    startedAt: new Date('2026-03-16T00:00:00.000Z'),
                })
                .mockResolvedValueOnce({
                    id: 'task-1',
                    userId: 'user-1',
                    status: 'processing',
                }),
            save: vi.fn((value) => Promise.resolve(value)),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            if ((entity as { name?: string })?.name === 'Post') {
                return { findOneBy: vi.fn().mockResolvedValue(null), save: vi.fn() } as any
            }

            return taskRepo as any
        })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('resumed')
    })

    it('should report resumed for tts task that stays processing after retry', async () => {
        const taskRepo = {
            findOneBy: vi.fn()
                .mockResolvedValueOnce({
                    id: 'task-1',
                    userId: 'user-1',
                    provider: 'openai',
                    model: 'tts-model',
                    category: 'tts',
                    type: 'tts',
                    payload: JSON.stringify({ text: 'Hello', voice: 'alloy', mode: 'speech', options: {} }),
                    result: JSON.stringify({ resumeAttempts: 0 }),
                    status: 'processing',
                    progress: 10,
                    startedAt: new Date('2026-03-16T00:00:00.000Z'),
                })
                .mockResolvedValueOnce({
                    id: 'task-1',
                    userId: 'user-1',
                    status: 'processing',
                }),
            save: vi.fn((value) => Promise.resolve(value)),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            if ((entity as { name?: string })?.name === 'Post') {
                return { findOneBy: vi.fn().mockResolvedValue(null), save: vi.fn() } as any
            }

            return taskRepo as any
        })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('resumed')
    })

    it('should resume stale podcast task with uploaded checkpoint and complete it', async () => {
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
                    payload: JSON.stringify({ text: 'Hello', voice: 'alloy', mode: 'podcast', options: {} }),
                    result: JSON.stringify({
                        phase: 'asset_uploaded',
                        uploadedAsset: {
                            url: '/uploads/audio/resumed.mp3',
                            filename: 'resumed.mp3',
                            mimeType: 'audio/mpeg',
                            size: 1024,
                        },
                    }),
                    status: 'processing',
                    progress: 98,
                    startedAt: new Date('2026-03-16T00:00:00.000Z'),
                })
                .mockResolvedValueOnce({
                    id: 'task-1',
                    userId: 'user-1',
                    status: 'completed',
                }),
            save: vi.fn((value) => Promise.resolve(value)),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            if ((entity as { name?: string })?.name === 'Post') {
                return { findOneBy: vi.fn().mockResolvedValue(null), save: vi.fn() } as any
            }

            return taskRepo as any
        })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('completed')
    })

    it('should generate speech and record task when provider supports it', async () => {
        const generateSpeech = vi.fn().mockResolvedValue(new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]))
                controller.close()
            },
        }))
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            generateSpeech,
        } as unknown as AIProvider)
        vi.mocked(dataSource.getRepository).mockReturnValue({
            create: vi.fn((data) => ({ ...data, id: 'task-x' })),
            save: vi.fn((task) => Promise.resolve(task)),
            findOneBy: vi.fn(),
        } as any)

        const stream = await TTSService.generateSpeech('Hello world', 'alloy', {}, 'user-1', 'openai')

        expect(generateSpeech).toHaveBeenCalledWith('Hello world', 'alloy', {})
        expect(stream).toBeInstanceOf(ReadableStream)
    })

    it('should throw when provider does not support generateSpeech', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'mock',
            chat: vi.fn(),
        } as unknown as AIProvider)

        vi.mocked(dataSource.getRepository).mockReturnValue({
            create: vi.fn(),
            save: vi.fn(),
            findOneBy: vi.fn(),
        } as any)

        await expect(TTSService.generateSpeech('Hello', 'alloy', {}, 'user-1', 'mock'))
            .rejects.toThrow('does not support text-to-speech')
    })

    it('should record failure task when generation throws', async () => {
        const taskRepo = {
            create: vi.fn((data) => ({ ...data, id: 'task-fail' })),
            save: vi.fn((task) => Promise.resolve(task)),
            findOneBy: vi.fn(),
        }
        vi.mocked(dataSource.getRepository).mockReturnValue(taskRepo as any)
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            generateSpeech: vi.fn().mockRejectedValue(new Error('upstream down')),
        })

        await expect(TTSService.generateSpeech('Hello', 'alloy', {}, 'user-1', 'openai'))
            .rejects.toThrow('upstream down')

        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            category: 'tts',
            error: expect.stringContaining('upstream down'),
        }))
    })

    it('should resolve default voice via resolveVoice helper', async () => {
        const estimateTTSCost = vi.fn().mockResolvedValue(0.01)
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            estimateTTSCost,
        })

        await TTSService.estimateProviderCost('hi', 'default', 'openai')
        await TTSService.estimateProviderCost('hi', null as unknown as string, 'openai')

        expect(estimateTTSCost).toHaveBeenNthCalledWith(1, 'hi', 'alloy')
        expect(estimateTTSCost).toHaveBeenNthCalledWith(2, 'hi', 'alloy')
    })

    it('should return 0 when provider has no cost estimation', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'mock',
        })

        await expect(TTSService.estimateProviderCost('hi', 'alloy', 'mock')).resolves.toBe(0)
    })

    it('should return empty voices when provider lacks getVoices', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'mock',
        })

        await expect(TTSService.getVoices('mock')).resolves.toEqual([])
    })

    it('should list voices from provider when supported', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            getVoices: vi.fn().mockResolvedValue([{ id: 'alloy', name: 'Alloy' }]),
        })

        await expect(TTSService.getVoices('openai', { mode: 'speech' })).resolves.toEqual([
            { id: 'alloy', name: 'Alloy' },
        ])
    })

    it('should estimate cost breakdown with podcast mode and quota units', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            estimateTTSCost: vi.fn().mockResolvedValue(0.2),
        })

        const breakdown = await TTSService.estimateCostBreakdown('Hello', 'alloy', 'openai', {
            mode: 'podcast',
            quotaUnits: 5,
        })

        expect(breakdown).toMatchObject({
            quotaUnits: 5,
            displayCost: 0,
        })
    })

    it('should estimate cost via display cost', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            estimateTTSCost: vi.fn().mockResolvedValue(0.3),
        })

        const cost = await TTSService.estimateCost('Hello', 'alloy', 'openai', { mode: 'speech' })

        expect(typeof cost).toBe('number')
    })

    it('should collect available providers from settings and env', async () => {
        const { getSettings } = await import('../setting')

        vi.mocked(getSettings).mockResolvedValue({
            [SettingKey.TTS_API_KEY]: 'sk-123',
            [SettingKey.VOLCENGINE_APP_ID]: 'volc-app',
        } as Record<string, string | null>)

        const providers = await TTSService.getAvailableProviders()

        expect(providers).toEqual(expect.arrayContaining(['openai', 'siliconflow', 'volcengine']))
    })

    it('should list no providers when nothing configured', async () => {
        const { getSettings } = await import('../setting')

        vi.mocked(getSettings).mockResolvedValue({})

        const providers = await TTSService.getAvailableProviders()

        expect(providers).toEqual([])
    })

    it('should fetch provider by name via getProvider', async () => {
        const provider = { name: 'siliconflow', estimateCost: vi.fn() }
        vi.mocked(getAIProvider).mockResolvedValue(provider)

        const result = await TTSService.getProvider('siliconflow')

        expect(result).toBe(provider)
    })

    it('should generate and upload speech in the background', async () => {
        const generateSpeech = vi.fn().mockResolvedValue(new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array([9, 9]))
                controller.close()
            },
        }))
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            generateSpeech,
        })
        vi.mocked(buildUploadStoredFilename).mockReturnValue('bg.mp3')
        vi.mocked(uploadFromBuffer).mockResolvedValue({
            url: '/uploads/audio/bg.mp3',
            filename: 'bg.mp3',
        } as any)
        vi.mocked(dataSource.getRepository).mockReturnValue({
            create: vi.fn((data) => ({ ...data, id: 'task-bg' })),
            save: vi.fn((task) => Promise.resolve(task)),
            findOneBy: vi.fn(),
        } as any)

        const stream = await TTSService.generateAndUploadSpeech('Hello', 'alloy', { skipRecording: true }, 'user-1')

        expect(stream).toBeInstanceOf(ReadableStream)
        // 后台上传异步执行，等待微任务冲刷
        await vi.waitFor(() => {
            expect(uploadFromBuffer).toHaveBeenCalled()
        })
    })

    it('should mark task failed when processTask hits an error', async () => {
        const taskRepo = {
            findOneBy: vi.fn().mockResolvedValue({
                id: 'task-1',
                userId: 'user-1',
                provider: 'openai',
                model: 'tts-model',
                category: 'tts',
                type: 'tts',
                payload: JSON.stringify({ text: '', voice: 'alloy', mode: 'speech', options: {} }),
                status: 'processing',
                progress: 0,
                startedAt: new Date('2026-03-16T00:00:00.000Z'),
            }),
            save: vi.fn((value) => Promise.resolve(value)),
        }
        const postRepo = {
            findOneBy: vi.fn().mockResolvedValue(null),
            save: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            if ((entity as { name?: string })?.name === 'Post') {
                return postRepo as any
            }

            return taskRepo as any
        })

        // payload.text 为空且无 post → 抛 No content
        await TTSService.processTask('task-1')

        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            status: 'failed',
            failureStage: 'provider_processing',
        }))
        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            error: 'No content to generate speech from',
        }))
    })
})
