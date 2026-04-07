import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { intervalState } = vi.hoisted(() => ({
    intervalState: {
        callback: null as null | (() => void),
        pause: vi.fn(),
        resume: vi.fn(),
    },
}))

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

import { useTTSTask } from './use-tts-task'

async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useTTSTask', () => {
    beforeEach(() => {
        intervalState.callback = null
        intervalState.pause.mockReset()
        intervalState.resume.mockReset()
        fetchMock.mockReset()
    })

    it('没有 taskId 时不应启动轮询', () => {
        const taskId = ref<string | null>(null)
        const { startPolling, status } = useTTSTask(taskId)

        startPolling()

        expect(status.value).toBeNull()
        expect(intervalState.resume).not.toHaveBeenCalled()
    })

    it('startPolling 应重置状态并恢复轮询', () => {
        const taskId = ref<string | null>('task-1')
        const { startPolling, status, progress, error } = useTTSTask(taskId)

        status.value = 'failed'
        progress.value = 99
        error.value = 'old-error'

        startPolling()

        expect(status.value).toBe('pending')
        expect(progress.value).toBe(0)
        expect(error.value).toBeNull()
        expect(intervalState.resume).toHaveBeenCalledTimes(1)
    })

    it('任务完成时应解析字符串结果并停止轮询', async () => {
        fetchMock.mockResolvedValueOnce({
            status: 'completed',
            progress: 100,
            result: JSON.stringify({ audioUrl: 'https://example.com/audio.mp3' }),
        })

        const taskId = ref<string | null>('task-1')
        const { startPolling, status, progress, audioUrl, error } = useTTSTask(taskId)

        startPolling()
        intervalState.callback?.()
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/tasks/tts/task-1')
        expect(status.value).toBe('completed')
        expect(progress.value).toBe(100)
        expect(audioUrl.value).toBe('https://example.com/audio.mp3')
        expect(error.value).toBeNull()
        expect(intervalState.pause).toHaveBeenCalledTimes(1)
    })

    it('任务失败时应记录后端错误并停止轮询', async () => {
        fetchMock.mockResolvedValueOnce({
            status: 'failed',
            progress: 42,
            errorMessage: 'tts_failed',
        })

        const taskId = ref<string | null>('task-2')
        const { startPolling, status, error } = useTTSTask(taskId)

        startPolling()
        intervalState.callback?.()
        await flushPromises()

        expect(status.value).toBe('failed')
        expect(error.value).toBe('tts_failed')
        expect(intervalState.pause).toHaveBeenCalledTimes(1)
    })

    it('请求异常时应回退到失败状态并停止轮询', async () => {
        fetchMock.mockRejectedValueOnce({
            data: {
                message: 'network_down',
            },
        })

        const taskId = ref<string | null>('task-3')
        const { startPolling, status, error } = useTTSTask(taskId)

        startPolling()
        intervalState.callback?.()
        await flushPromises()

        expect(status.value).toBe('failed')
        expect(error.value).toBe('network_down')
        expect(intervalState.pause).toHaveBeenCalledTimes(1)
    })
})
