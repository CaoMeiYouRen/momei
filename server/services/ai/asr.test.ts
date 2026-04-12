import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getAIProviderMock,
    inferFailureStageMock,
    withAITimeoutMock,
    sendInAppNotificationMock,
    pushRealtimeEventMock,
    loggerMock,
    buildAITaskDetailPathMock,
} = vi.hoisted(() => ({
    getAIProviderMock: vi.fn(),
    inferFailureStageMock: vi.fn(() => 'provider'),
    withAITimeoutMock: vi.fn(async (promise: Promise<unknown>) => await promise),
    sendInAppNotificationMock: vi.fn(),
    pushRealtimeEventMock: vi.fn(),
    loggerMock: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
    buildAITaskDetailPathMock: vi.fn((taskId: string) => `/admin/ai/tasks/${taskId}`),
}))

vi.mock('@/server/utils/ai', () => ({
    getAIProvider: getAIProviderMock,
}))

vi.mock('@/server/utils/ai/cost-governance', () => ({
    inferFailureStage: inferFailureStageMock,
}))

vi.mock('@/server/utils/ai/timeout', () => ({
    withAITimeout: withAITimeoutMock,
}))

vi.mock('@/server/services/notification', () => ({
    sendInAppNotification: sendInAppNotificationMock,
    pushRealtimeEvent: pushRealtimeEventMock,
}))

vi.mock('@/server/utils/logger', () => ({
    default: loggerMock,
}))

vi.mock('@/utils/shared/notification', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/utils/shared/notification')>()
    return {
        ...actual,
        buildAITaskDetailPath: buildAITaskDetailPathMock,
    }
})

import { ASRService } from './asr'

const originalExecuteAsyncTranscription = (ASRService as any).executeAsyncTranscription

describe('ASRService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sendInAppNotificationMock.mockResolvedValue(undefined)
        ;(ASRService as any).assertQuotaAllowance = vi.fn().mockResolvedValue(undefined)
        ;(ASRService as any).recordTask = vi.fn().mockResolvedValue({ id: 'task-1' })
        ;(ASRService as any).executeAsyncTranscription = originalExecuteAsyncTranscription
    })

    it('transcribes audio and records success task', async () => {
        getAIProviderMock.mockResolvedValue({
            name: 'mock-asr',
            model: 'asr-model',
            transcribe: vi.fn().mockResolvedValue({ text: 'hello', duration: 12, language: 'zh-CN' }),
        })

        const result = await ASRService.transcribe(Buffer.from('audio'), { language: 'zh-CN' }, 'user-1')

        expect(result).toEqual({ text: 'hello', duration: 12, language: 'zh-CN' })
        expect((ASRService as any).assertQuotaAllowance).toHaveBeenCalledOnce()
        expect((ASRService as any).recordTask).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            category: 'asr',
            type: 'transcription',
            provider: 'mock-asr',
            textLength: 5,
            audioSize: Buffer.from('audio').length,
        }))
    })

    it('records failure task and rethrows transcription errors', async () => {
        const error = new Error('provider failed')
        getAIProviderMock.mockResolvedValue({
            name: 'mock-asr',
            model: 'asr-model',
            transcribe: vi.fn().mockRejectedValue(error),
        })

        await expect(ASRService.transcribe(Buffer.from('audio'), {}, 'user-1')).rejects.toThrow('provider failed')
        expect(inferFailureStageMock).toHaveBeenCalledWith(error)
        expect((ASRService as any).recordTask).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            category: 'asr',
            type: 'transcription',
            provider: 'mock-asr',
            error,
            failureStage: 'provider',
            settlementSource: 'actual',
        }))
    })

    it('creates async task and returns task id', async () => {
        getAIProviderMock.mockResolvedValue({ name: 'mock-asr', model: 'asr-model' })
        ;(ASRService as any).executeAsyncTranscription = vi.fn().mockResolvedValue(undefined)

        const result = await ASRService.createAsyncTask({
            userId: 'user-1',
            audioBuffer: Buffer.from('audio'),
            fileName: 'demo.webm',
            mimeType: 'audio/webm',
        })

        expect(result).toEqual({ taskId: 'task-1' })
        expect((ASRService as any).recordTask).toHaveBeenCalledWith(expect.objectContaining({
            status: 'pending',
            type: 'async_transcription',
            category: 'asr',
        }))
        expect((ASRService as any).executeAsyncTranscription).toHaveBeenCalledWith(expect.objectContaining({
            taskId: 'task-1',
            userId: 'user-1',
        }))
    })

    it('throws when async task creation does not return id', async () => {
        getAIProviderMock.mockResolvedValue({ name: 'mock-asr', model: 'asr-model' })
        ;(ASRService as any).recordTask = vi.fn().mockResolvedValue(null)

        await expect(ASRService.createAsyncTask({
            userId: 'user-1',
            audioBuffer: Buffer.from('audio'),
            fileName: 'demo.webm',
            mimeType: 'audio/webm',
        })).rejects.toMatchObject({
            statusCode: 500,
            message: 'Failed to create ASR task',
        })
    })

    it('executes async transcription and publishes completion state', async () => {
        getAIProviderMock.mockResolvedValue({
            name: 'mock-asr',
            transcribe: vi.fn().mockResolvedValue({ text: 'hello world', duration: 18, language: 'en-US' }),
        })

        await (ASRService as any).executeAsyncTranscription({
            taskId: 'task-1',
            userId: 'user-1',
            audioBuffer: Buffer.from('audio'),
            fileName: 'demo.webm',
            mimeType: 'audio/webm',
            language: 'en-US',
            provider: 'mock-asr',
        })

        expect(pushRealtimeEventMock).toHaveBeenCalledWith('user-1', expect.objectContaining({
            type: 'ASR_TASK_UPDATE',
            taskId: 'task-1',
            status: 'processing',
        }))
        expect(pushRealtimeEventMock).toHaveBeenCalledWith('user-1', expect.objectContaining({
            status: 'completed',
            result: expect.objectContaining({ text: 'hello world' }),
        }))
        expect(sendInAppNotificationMock).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            title: '语音转写完成',
            link: '/admin/ai/tasks/task-1',
        }))
    })

    it('records async execution failure and rethrows', async () => {
        const error = new Error('timeout')
        getAIProviderMock.mockResolvedValue({
            name: 'mock-asr',
            transcribe: vi.fn().mockRejectedValue(error),
        })

        await expect((ASRService as any).executeAsyncTranscription({
            taskId: 'task-1',
            userId: 'user-1',
            audioBuffer: Buffer.from('audio'),
            fileName: 'demo.webm',
            mimeType: 'audio/webm',
            provider: 'mock-asr',
        })).rejects.toThrow('timeout')

        expect((ASRService as any).recordTask).toHaveBeenCalledWith(expect.objectContaining({
            id: 'task-1',
            status: 'failed',
            failureStage: 'provider',
        }))
        expect(pushRealtimeEventMock).toHaveBeenCalledWith('user-1', expect.objectContaining({
            status: 'failed',
            error: 'timeout',
        }))
    })

})
