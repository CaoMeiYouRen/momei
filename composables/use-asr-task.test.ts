import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { intervalState } = vi.hoisted(() => ({
    intervalState: {
        callback: null as null | (() => void),
        pause: vi.fn(),
        resume: vi.fn(),
    },
}))

vi.mock('vue', async () => {
    const actual = await vi.importActual<typeof import('vue')>('vue')

    return {
        ...actual,
        onUnmounted: vi.fn(),
    }
})

vi.mock('@vueuse/core', () => ({
    useIntervalFn: (callback: () => void) => {
        intervalState.callback = callback
        return {
            pause: intervalState.pause,
            resume: intervalState.resume,
        }
    },
}))

const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

class MockEventSource {
    static instances: MockEventSource[] = []

    readonly url: string
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    closed = false

    constructor(url: string) {
        this.url = url
        MockEventSource.instances.push(this)
    }

    close() {
        this.closed = true
    }
}

import { createASRTask, getASRTaskStatus, useASRTask } from './use-asr-task'

async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useASRTask', () => {
    beforeEach(() => {
        intervalState.callback = null
        intervalState.pause.mockReset()
        intervalState.resume.mockReset()
        fetchMock.mockReset()
        MockEventSource.instances = []
        vi.stubGlobal('$fetch', fetchMock)
        vi.stubGlobal('EventSource', MockEventSource)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('没有 taskId 时不应开始追踪', () => {
        const taskId = ref<string | null>(null)
        const { startTracking, isTracking } = useASRTask(taskId)

        startTracking()

        expect(isTracking.value).toBe(false)
        expect(intervalState.resume).not.toHaveBeenCalled()
    })

    it('开始追踪时应重置状态并同时启用轮询与 SSE', () => {
        const taskId = ref<string | null>('task-1')
        const { startTracking, status, progress, transcript, error, isTracking } = useASRTask(taskId)

        status.value = 'failed'
        progress.value = 90
        transcript.value = 'stale'
        error.value = 'old-error'

        startTracking()

        expect(status.value).toBe('pending')
        expect(progress.value).toBe(0)
        expect(transcript.value).toBeNull()
        expect(error.value).toBeNull()
        expect(isTracking.value).toBe(true)
        expect(intervalState.resume).toHaveBeenCalledTimes(1)
        expect(MockEventSource.instances[0]?.url).toBe('/api/notifications/stream')
    })

    it('收到 SSE 完成消息时应写入 transcript 并停止追踪', async () => {
        const taskId = ref<string | null>('task-2')
        const { startTracking, transcript, status, progress, isTracking } = useASRTask(taskId)

        startTracking()

        MockEventSource.instances[0]?.onmessage?.({
            data: JSON.stringify({
                type: 'ASR_TASK_UPDATE',
                taskId: 'task-2',
                status: 'completed',
                progress: 100,
                result: { text: 'final transcript' },
            }),
        })
        await flushPromises()

        expect(status.value).toBe('completed')
        expect(progress.value).toBe(100)
        expect(transcript.value).toBe('final transcript')
        expect(isTracking.value).toBe(false)
        expect(MockEventSource.instances[0]?.closed).toBe(true)
    })

    it('SSE 出错时应降级到轮询', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
            // mute expected warning
        })
        const taskId = ref<string | null>('task-3')
        const { startTracking } = useASRTask(taskId)

        startTracking()
        MockEventSource.instances[0]?.onerror?.()

        expect(warnSpy).toHaveBeenCalledWith('[ASR Task] SSE failed, falling back to polling')
        expect(intervalState.resume).toHaveBeenCalledTimes(2)
        expect(MockEventSource.instances[0]?.closed).toBe(true)
    })

    it('轮询应兼容 wrapped response 并在完成后停止', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: {
                status: 'completed',
                progress: 100,
                result: {
                    text: 'wrapped transcript',
                },
            },
        })

        const taskId = ref<string | null>('task-4')
        const { startTracking, transcript, status, isTracking } = useASRTask(taskId, {
            enableSSE: false,
        })

        startTracking()
        intervalState.callback?.()
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/ai/task/status/task-4')
        expect(status.value).toBe('completed')
        expect(transcript.value).toBe('wrapped transcript')
        expect(isTracking.value).toBe(false)
        expect(intervalState.pause).toHaveBeenCalledTimes(1)
    })

    it('轮询失败时应回退为 failed 状态', async () => {
        fetchMock.mockRejectedValueOnce({
            data: {
                message: 'poll_failed',
            },
        })

        const taskId = ref<string | null>('task-5')
        const { startTracking, status, error, isTracking } = useASRTask(taskId, {
            enableSSE: false,
        })

        startTracking()
        intervalState.callback?.()
        await flushPromises()

        expect(status.value).toBe('failed')
        expect(error.value).toBe('poll_failed')
        expect(isTracking.value).toBe(false)
        expect(intervalState.pause).toHaveBeenCalledTimes(1)
    })

    it('createASRTask 应提交表单并返回 taskId', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: {
                taskId: 'task-created',
            },
        })

        const taskId = await createASRTask({
            audioBlob: new Blob(['audio']),
            language: 'zh-CN',
            provider: 'siliconflow',
        })

        expect(taskId).toBe('task-created')
        const [, requestOptions] = fetchMock.mock.calls[0] as [string, { body: FormData }]
        expect(requestOptions.body.get('language')).toBe('zh-CN')
        expect(requestOptions.body.get('provider')).toBe('siliconflow')
    })

    it('getASRTaskStatus 应解包 wrapped response', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: {
                status: 'processing',
                progress: 45,
            },
        })

        await expect(getASRTaskStatus('task-6')).resolves.toEqual({
            status: 'processing',
            progress: 45,
        })
    })
})
