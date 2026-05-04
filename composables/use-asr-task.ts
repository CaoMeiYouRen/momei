import { ref, unref, onUnmounted, type Ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { ASRTaskStatus } from '~/types/asr'

const MIN_TASK_POLLING_INTERVAL = 10000

interface ASRTaskResult {
    text: string
    duration?: number
    language?: string
}

interface ASRTaskResponseData {
    status: ASRTaskStatus
    progress: number
    result?: ASRTaskResult
    error?: string
}

interface ASRTaskWrappedResponse {
    code: number
    data: ASRTaskResponseData
}

type ASRTaskApiResponse = ASRTaskResponseData | ASRTaskWrappedResponse

function normalizeTaskResponse(response: ASRTaskApiResponse): ASRTaskResponseData {
    if ('data' in response) {
        return response.data
    }
    return response
}

function resolveTaskPollingError(error: unknown) {
    if (typeof error === 'object' && error !== null) {
        const taskError = error as {
            data?: {
                message?: unknown
            }
        }

        if (typeof taskError.data?.message === 'string' && taskError.data.message) {
            return taskError.data.message
        }
    }

    return '获取任务状态失败'
}

export interface ASRTaskOptions {
    /** 轮询间隔 (毫秒) */
    pollingInterval?: number
    /** 是否启用 SSE */
    enableSSE?: boolean
}

export interface ASRTaskState {
    status: ASRTaskStatus | null
    progress: number
    transcript: string | null
    error: string | null
}

/**
 * ASR 任务状态追踪 Composable
 *
 * 支持两种模式:
 * 1. SSE 实时推送 (优先)
 * 2. 轮询降级 (SSE 不可用时)
 */
export function useASRTask(
    taskIdRef: Ref<string | null>,
    options: ASRTaskOptions = {},
) {
    const {
        pollingInterval = MIN_TASK_POLLING_INTERVAL,
        enableSSE = true,
    } = options
    const normalizedPollingInterval = Math.max(pollingInterval, MIN_TASK_POLLING_INTERVAL)

    const status = ref<ASRTaskStatus | null>(null)
    const progress = ref(0)
    const transcript = ref<string | null>(null)
    const error = ref<string | null>(null)
    const isTracking = ref(false)

    // SSE 连接引用
    let eventSource: EventSource | null = null

    /**
     * 轮询模式
     */
    const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
        () => {
            const taskId = unref(taskIdRef)
            if (!taskId) {
                return
            }

            void (async () => {
                try {
                    const response = await $fetch<ASRTaskApiResponse>(`/api/ai/task/status/${taskId}`)
                    const data = normalizeTaskResponse(response)

                    status.value = data.status
                    progress.value = data.progress || 0

                    if (data.status === 'completed') {
                        if (data.result?.text) {
                            transcript.value = data.result.text
                        }
                        pausePolling()
                        isTracking.value = false
                    } else if (data.status === 'failed') {
                        error.value = data.error || '任务执行失败'
                        pausePolling()
                        isTracking.value = false
                    }
                } catch (caughtError: unknown) {
                    error.value = resolveTaskPollingError(caughtError)
                    status.value = 'failed'
                    pausePolling()
                    isTracking.value = false
                }
            })()
        },
        normalizedPollingInterval,
        { immediate: false },
    )

    /**
     * SSE 模式 (实时推送)
     */
    const startSSE = (): boolean => {
        if (!enableSSE || typeof EventSource === 'undefined') {
            return false
        }

        const taskId = unref(taskIdRef)
        if (!taskId) {
            return false
        }

        try {
            // 使用现有通知 SSE 端点
            eventSource = new EventSource('/api/notifications/stream')

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    // 处理 ASR 任务更新通知
                    if (data.type === 'ASR_TASK_UPDATE' && data.taskId === taskId) {
                        status.value = data.status
                        progress.value = data.progress || 0

                        if (data.status === 'completed') {
                            transcript.value = data.result?.text || null
                            stopSSE()
                            isTracking.value = false
                        } else if (data.status === 'failed') {
                            error.value = data.error || '任务执行失败'
                            stopSSE()
                            isTracking.value = false
                        }
                    }
                } catch {
                    // 忽略解析错误 (如心跳消息)
                }
            }

            eventSource.onerror = () => {
                // SSE 失败时降级到轮询
                console.warn('[ASR Task] SSE failed, falling back to polling')
                stopSSE()
                resumePolling()
            }

            return true
        } catch {
            return false
        }
    }

    const stopSSE = () => {
        if (eventSource) {
            eventSource.close()
            eventSource = null
        }
    }

    /**
     * 开始追踪任务
     */
    const startTracking = () => {
        if (!unref(taskIdRef)) {
            return
        }

        // 重置状态
        error.value = null
        status.value = 'pending'
        progress.value = 0
        transcript.value = null
        isTracking.value = true

        // 优先尝试 SSE
        // 无论 SSE 是否可用，都启用轮询兜底，避免 SSE 事件契约变化导致卡死
        resumePolling()
        startSSE()
    }

    /**
     * 停止追踪
     */
    const stopTracking = () => {
        isTracking.value = false
        pausePolling()
        stopSSE()
    }

    /**
     * 重置状态
     */
    const reset = () => {
        status.value = null
        progress.value = 0
        transcript.value = null
        error.value = null
        isTracking.value = false
    }

    // 清理资源
    onUnmounted(() => {
        stopTracking()
    })

    return {
        // 状态
        status,
        progress,
        transcript,
        error,
        isTracking,

        // 方法
        startTracking,
        stopTracking,
        reset,
    }
}

/**
 * 创建 ASR 异步任务
 */
export async function createASRTask(options: {
    audioBlob: Blob
    language?: string
    provider?: 'siliconflow' | 'volcengine'
}): Promise<string> {
    const formData = new FormData()
    formData.append('file', options.audioBlob, 'recording.webm')

    if (options.language) {
        formData.append('language', options.language)
    }

    if (options.provider) {
        formData.append('provider', options.provider)
    }

    const response = await $fetch<{
        code: number
        data: { taskId: string }
    }>('/api/ai/asr/transcribe/async', {
        method: 'POST',
        body: formData,
    })

    return response.data.taskId
}

/**
 * 获取 ASR 任务状态
 */
export function getASRTaskStatus(taskId: string): Promise<{
    status: ASRTaskStatus
    progress: number
    result?: { text: string, duration?: number, language?: string }
    error?: string
}> {
    return $fetch<ASRTaskApiResponse>(`/api/ai/task/status/${taskId}`)
        .then((response) => normalizeTaskResponse(response))
}
