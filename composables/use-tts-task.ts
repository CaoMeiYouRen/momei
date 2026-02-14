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

    const { pause, resume } = useIntervalFn(async () => {
        const taskId = unref(taskIdRef)
        if (!taskId) return

        try {
            const data = await $fetch<any>(`/api/tasks/tts/${taskId}`)
            status.value = data.status
            progress.value = data.progress

            if (data.status === 'completed') {
                // 如果后端存入了 audioUrl，直接取（在 processor 中更新了 Post 记录，但 Task 中可能有结果缓存）
                // 也可以通过刷新文章数据来获取最新的 audioUrl
                status.value = 'completed'
                pause()
            } else if (data.status === 'failed') {
                error.value = data.errorMessage
                pause()
            }
        } catch (e: any) {
            error.value = e.data?.message || e.message || '获取任务状态失败'
            status.value = 'failed'
            pause()
        }
    }, 2000, { immediate: false })

    const startPolling = () => {
        if (!unref(taskIdRef)) return
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
