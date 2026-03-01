import { createError } from 'h3'
import { AI_HEAVY_TASK_TIMEOUT_MS } from '@/utils/shared/env'

export async function withAITimeout<T>(
    operation: Promise<T>,
    taskLabel: string,
    timeoutMs = AI_HEAVY_TASK_TIMEOUT_MS,
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(createError({
                statusCode: 504,
                message: `${taskLabel} timeout (${timeoutMs}ms)`,
            }))
        }, timeoutMs)
    })

    try {
        return await Promise.race([operation, timeoutPromise])
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
    }
}
