import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadFromBuffer } from '../upload'
import { TTSService } from './tts'
import { dataSource } from '@/server/database'
import { getAIProvider } from '@/server/utils/ai'
import { sendInAppNotification } from '@/server/services/notification'
import { AI_HEAVY_TASK_TIMEOUT_MS } from '@/utils/shared/env'
import logger from '@/server/utils/logger'
import type { AIProvider } from '@/types/ai'

vi.mock('../upload', () => ({
    buildPostUploadPrefix: vi.fn(() => 'posts/post-1/audio/tts/'),
    buildUploadStoredFilename: vi.fn(() => 'generated.mp3'),
    uploadFromBuffer: vi.fn(),
    UploadType: { AUDIO: 'audio' },
}))
vi.mock('../setting', () => ({
    getSettings: vi.fn().mockResolvedValue({}),
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
        warn: vi.fn(),
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

const taskRepo = {
    create: vi.fn(),
    save: vi.fn(),
    findOneBy: vi.fn(),
}

const postRepo = {
    findOneBy: vi.fn(),
    save: vi.fn(),
}

function createTask(overrides: Record<string, unknown> = {}) {
    return {
        id: 'task-1',
        userId: 'user-1',
        type: 'tts',
        category: 'tts',
        provider: 'openai',
        payload: JSON.stringify({ text: 'Hello world', voice: 'alloy', mode: 'speech', options: {} }),
        progress: 0,
        startedAt: new Date('2026-01-01T00:00:00.000Z'),
        ...overrides,
    } as any
}

function mockRepositories() {
    vi.mocked(dataSource.getRepository).mockImplementation((entity) => (
        (entity as { name?: string })?.name === 'Post' ? postRepo : taskRepo
    ) as never)
}

function createStream(chunks: Uint8Array[]) {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            chunks.forEach((chunk) => controller.enqueue(chunk))
            controller.close()
        },
    })
}

describe('TTSService processTask', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockRepositories()
        taskRepo.create.mockImplementation((data: Record<string, unknown>) => ({ ...data, id: data.id || 'task-x' }))
        taskRepo.save.mockImplementation((task: unknown) => Promise.resolve(task))
        taskRepo.findOneBy.mockReset()
        taskRepo.findOneBy.mockResolvedValue(null)
        postRepo.findOneBy.mockResolvedValue(null)
        postRepo.save.mockImplementation((post: unknown) => Promise.resolve(post))
        vi.mocked(sendInAppNotification).mockReset()
        vi.mocked(sendInAppNotification).mockResolvedValue(undefined)
        vi.mocked(uploadFromBuffer).mockReset()
        vi.mocked(uploadFromBuffer).mockResolvedValue({
            url: '/uploads/audio/generated.mp3',
            filename: 'generated.mp3',
        } as never)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('should skip processing when the task has no owner', async () => {
        const task = createTask({ userId: undefined })

        await expect(TTSService.processTask('task-1', task)).resolves.toBeUndefined()

        expect(taskRepo.save).not.toHaveBeenCalled()
        expect(getAIProvider).not.toHaveBeenCalled()
    })

    it('should backfill the model, stream progress and survive a progress save failure', async () => {
        const task = createTask({
            model: undefined,
            payload: JSON.stringify({ text: 'Hello world', voice: 'alloy', mode: 'other', options: {} }),
        })
        const generateSpeech = vi.fn().mockResolvedValue(createStream([
            new Uint8Array(1024),
            new Uint8Array(60_000),
        ]))
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            model: 'tts-model',
            generateSpeech,
        } as unknown as AIProvider)
        taskRepo.save.mockImplementation((value: any) => (
            value?.progress === 5 || value?.progress === 6
                ? Promise.reject(new Error('progress save failed'))
                : Promise.resolve(value)
        ))
        vi.mocked(sendInAppNotification).mockRejectedValueOnce(new Error('notify failed'))

        await TTSService.processTask('task-1', task)

        expect(task.model).toBe('tts-model')
        expect(task.status).toBe('completed')
        expect(task.progress).toBe(100)
        expect(generateSpeech).toHaveBeenCalledWith('Hello world', 'alloy', expect.objectContaining({ skipRecording: true }))
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Task progress save failed'), expect.any(Error))
        expect(logger.error).toHaveBeenCalledWith('[TTSService] Failed to send completion notification:', expect.any(Error))
    })

    it('should fail when stream reading exceeds the total processing deadline', async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
        const base = Date.now()
        let pulls = 0
        const stream = new ReadableStream<Uint8Array>({
            pull(controller) {
                pulls += 1
                if (pulls === 1) {
                    controller.enqueue(new Uint8Array([1]))
                    return
                }
                if (pulls === 2) {
                    vi.setSystemTime(base + AI_HEAVY_TASK_TIMEOUT_MS + 1)
                    controller.enqueue(new Uint8Array([2]))
                    return
                }
                controller.close()
            },
        })
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            model: 'tts-model',
            generateSpeech: vi.fn().mockResolvedValue(stream),
        } as unknown as AIProvider)
        const task = createTask()

        const pending = TTSService.processTask('task-1', task)
        await vi.advanceTimersByTimeAsync(0)
        await pending

        expect(task.status).toBe('failed')
        expect(task.error).toContain('timed out total execution time exceeded')
        expect(logger.error).toHaveBeenCalledWith('[TTSService] Stream reading failed for task task-1:', expect.any(Error))
    })

    it('should keep partial audio when the stream read times out after receiving data', async () => {
        vi.useFakeTimers()
        let sent = false
        const stream = new ReadableStream<Uint8Array>({
            pull(controller) {
                if (!sent) {
                    sent = true
                    controller.enqueue(new Uint8Array(2048))
                }
            },
        })
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            model: 'tts-model',
            generateSpeech: vi.fn().mockResolvedValue(stream),
        } as unknown as AIProvider)
        const task = createTask()

        const pending = TTSService.processTask('task-1', task)
        await vi.advanceTimersByTimeAsync(0)
        await vi.advanceTimersByTimeAsync(AI_HEAVY_TASK_TIMEOUT_MS)
        await pending

        expect(task.status).toBe('completed')
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Stream timeout after receiving data'))
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Continue post-processing after timeout'))
    })

    it('should mark the task failed and log notification errors when the stream breaks', async () => {
        const stream = new ReadableStream<Uint8Array>({
            pull() {
                throw new Error('stream broken')
            },
        })
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            model: 'tts-model',
            generateSpeech: vi.fn().mockResolvedValue(stream),
        } as unknown as AIProvider)
        vi.mocked(sendInAppNotification).mockRejectedValueOnce(new Error('notify failed'))
        const task = createTask()

        await TTSService.processTask('task-1', task)

        expect(task.status).toBe('failed')
        expect(task.error).toBe('stream broken')
        expect(logger.error).toHaveBeenCalledWith('[TTSService] Stream reading failed for task task-1:', expect.any(Error))
        expect(logger.error).toHaveBeenCalledWith('[TTSService] Failed to send failure notification:', expect.any(Error))
    })

    it('should log background upload failures without breaking the returned stream', async () => {
        vi.mocked(getAIProvider).mockResolvedValue({
            name: 'openai',
            model: 'tts-model',
            generateSpeech: vi.fn().mockResolvedValue(createStream([new Uint8Array([1, 2, 3])])),
        } as unknown as AIProvider)
        vi.mocked(uploadFromBuffer).mockRejectedValueOnce(new Error('oss down'))

        const stream = await TTSService.generateAndUploadSpeech('Hello', 'alloy', {}, 'user-1')

        expect(stream).toBeInstanceOf(ReadableStream)
        await vi.waitFor(() => {
            expect(logger.error).toHaveBeenCalledWith('[TTSService] Background TTS upload failed:', expect.any(Error))
        })
    })

    it('should report failed when a resumed podcast task fails after continuation', async () => {
        const processSpy = vi.spyOn(TTSService, 'processTask').mockResolvedValue(undefined)
        taskRepo.findOneBy
            .mockResolvedValueOnce(createTask({
                type: 'podcast',
                category: 'podcast',
                result: JSON.stringify({
                    phase: 'asset_uploaded',
                    uploadedAsset: {
                        url: '/uploads/audio/partial.mp3',
                        filename: 'partial.mp3',
                        mimeType: 'audio/mpeg',
                        size: 512,
                    },
                }),
            }))
            .mockResolvedValueOnce({ id: 'task-1', status: 'failed' })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('failed')
        expect(processSpy).toHaveBeenCalledTimes(1)
    })

    it('should report failed when a resumed tts task fails after regeneration', async () => {
        const processSpy = vi.spyOn(TTSService, 'processTask').mockResolvedValue(undefined)
        taskRepo.findOneBy
            .mockResolvedValueOnce(createTask({ result: JSON.stringify({ resumeAttempts: 0 }) }))
            .mockResolvedValueOnce({ id: 'task-1', status: 'failed' })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('failed')
        expect(processSpy).toHaveBeenCalledTimes(1)
    })

    it('should ignore unparsable podcast checkpoints and resume normally', async () => {
        vi.spyOn(TTSService, 'processTask').mockResolvedValue(undefined)
        taskRepo.findOneBy
            .mockResolvedValueOnce(createTask({ type: 'podcast', category: 'podcast', result: 'not-json' }))
            .mockResolvedValueOnce({ id: 'task-1', status: 'completed' })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('completed')
    })

    it('should ignore podcast checkpoints without a valid phase', async () => {
        vi.spyOn(TTSService, 'processTask').mockResolvedValue(undefined)
        taskRepo.findOneBy
            .mockResolvedValueOnce(createTask({ type: 'podcast', category: 'podcast', result: JSON.stringify({ phase: 123 }) }))
            .mockResolvedValueOnce({ id: 'task-1', status: 'completed' })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('completed')
        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            result: expect.stringContaining('"phase":"queued"'),
        }))
    })

    it('should ignore podcast checkpoints with an unsupported phase', async () => {
        vi.spyOn(TTSService, 'processTask').mockResolvedValue(undefined)
        taskRepo.findOneBy
            .mockResolvedValueOnce(createTask({ type: 'podcast', category: 'podcast', result: JSON.stringify({ phase: 'completed' }) }))
            .mockResolvedValueOnce({ id: 'task-1', status: 'completed' })

        const outcome = await TTSService.compensateStaleTask('task-1')

        expect(outcome).toBe('completed')
        expect(taskRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            result: expect.stringContaining('"phase":"queued"'),
        }))
    })
})
