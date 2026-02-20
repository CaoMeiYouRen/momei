import { ref, unref, type Ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'

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
                const data = await $fetch<any>(`/api/tasks/tts/${taskId}`)
                status.value = data.status
                progress.value = data.progress

                if (data.status === 'completed') {
                    // 如果后端存入了 result，解析出 audioUrl
                    if (data.result) {
                        try {
                            const result = typeof data.result === 'string' ? JSON.parse(data.result) : data.result
                            audioUrl.value = result.audioUrl || result.url
                        } catch (e) {
                            console.error('Failed to parse task result:', e)
                        }
                    }
                    status.value = 'completed'
                    pause()
                } else if (data.status === 'failed') {
                    error.value = data.error || data.errorMessage || '任务执行失败'
                    pause()
                }
            } catch (e: any) {
                error.value = e.data?.message || e.message || '获取任务状态失败'
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
