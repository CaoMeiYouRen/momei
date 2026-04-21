import { defineEventHandler, createError } from 'h3'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { scanAndCompensateTimedOutMediaTasks } from '@/server/services/ai/media-task-monitor'
import { TTSService } from '@/server/services/ai'
import { isServerlessEnvironment } from '@/server/utils/env'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { AI_HEAVY_TASK_TIMEOUT_MS } from '@/utils/shared/env'
import { isAdmin } from '@/utils/shared/roles'

const SERVERLESS_MEDIA_RECOVERY_GRACE_MS = 15000

function shouldAttemptAudioRecovery(task: Pick<AITask, 'type' | 'status' | 'updatedAt'>, now: Date) {
    if (task.type !== 'podcast' && task.type !== 'tts') {
        return false
    }

    if (task.status !== 'pending' && task.status !== 'processing') {
        return false
    }

    const updatedAtTimestamp = Date.parse(String(task.updatedAt || ''))

    if (!Number.isFinite(updatedAtTimestamp)) {
        return false
    }

    return now.getTime() - updatedAtTimestamp >= AI_HEAVY_TASK_TIMEOUT_MS + SERVERLESS_MEDIA_RECOVERY_GRACE_MS
}

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const user = session.user

    const taskId = event.context.params?.id
    if (!taskId) {
        throw createError({ statusCode: 400, statusMessage: 'Task ID is required' })
    }

    const taskRepo = dataSource.getRepository(AITask)
    let task = await taskRepo.findOneBy({ id: taskId })

    if (!task) {
        throw createError({ statusCode: 404, statusMessage: 'Task not found' })
    }

    // 权限检查：只有发起者或管理员可以查看任务状态
    if (task.userId !== user.id && !isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (isServerlessEnvironment() && shouldAttemptAudioRecovery(task, new Date())) {
        const summary = await scanAndCompensateTimedOutMediaTasks(new Date(), { taskId })

        if (summary.scanned > 0) {
            const refreshedTask = await taskRepo.findOneBy({ id: taskId })

            if (refreshedTask) {
                task = refreshedTask
            }
        }
    }

    return TTSService.serializeTaskStatus(task, {
        includeRaw: isAdmin(user.role),
    })
})
