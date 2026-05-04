import { ref, unref, type Ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { AITaskStatus } from '@/types/ai'

interface TTSTaskResultPayload {
    audioUrl?: string | null
    url?: string | null
}

interface TTSTaskStatusPayload {
    status: AITaskStatus
    progress: number
    audioUrl?: string | null
    result?: string | TTSTaskResultPayload | null
    error?: string | null
    errorMessage?: string | null
}

function resolveTaskAudioUrl(payload: TTSTaskStatusPayload) {
    if (payload.audioUrl) {
        return payload.audioUrl
    }

    if (!payload.result) {
        return null
    }

    if (typeof payload.result === 'string') {
        try {
            const parsed = JSON.parse(payload.result) as TTSTaskResultPayload
            return parsed.audioUrl || parsed.url || null
        } catch (error) {
            console.error('Failed to parse task result:', error)
            return null
        }
    }

    return payload.result.audioUrl || payload.result.url || null
}

function resolveTaskErrorMessage(error: unknown) {
    if (typeof error !== 'object' || !error) {
        return '获取任务状态失败'
    }

    const maybeError = error as {
        data?: {
            message?: unknown
        }
        message?: unknown
    }

    if (typeof maybeError.data?.message === 'string' && maybeError.data.message) {
        return maybeError.data.message
    }

    if (typeof maybeError.message === 'string' && maybeError.message) {
        return maybeError.message
    }

    return '获取任务状态失败'
}

/**
 * TTS 任务状态追踪 Composable
 */
export function useTTSTask(taskIdRef: Ref<string | null>) {
    const status = ref<'pending' | 'processing' | 'completed' | 'failed' | null>(null)
    const progress = ref(0)
    const audioUrl = ref<string | null>(null)
    const error = ref<string | null>(null)

    const { pause, resume } = useIntervalFn(() => {
        const taskId = unref(taskIdRef)
        if (!taskId) {
            return
        }

        void (async () => {
            try {
                const data = await $fetch<TTSTaskStatusPayload>(`/api/tasks/tts/${taskId}`)
                status.value = data.status
                progress.value = data.progress

                if (data.status === 'completed') {
                    const resolvedAudioUrl = resolveTaskAudioUrl(data)

                    if (resolvedAudioUrl) {
                        audioUrl.value = resolvedAudioUrl
                    }

                    status.value = 'completed'
                    pause()
                } else if (data.status === 'failed') {
                    error.value = data.error || data.errorMessage || '任务执行失败'
                    pause()
                }
            } catch (caughtError: unknown) {
                error.value = resolveTaskErrorMessage(caughtError)
                status.value = 'failed'
                pause()
            }
        })()
    }, 10000, { immediate: false })

    const startPolling = () => {
        if (!unref(taskIdRef)) {
            return
        }
        error.value = null
        status.value = 'pending'
        progress.value = 0
        resume()
    }

    return {
        status,
        progress,
        audioUrl,
        error,
        startPolling,
        stopPolling: pause,
    }
}
