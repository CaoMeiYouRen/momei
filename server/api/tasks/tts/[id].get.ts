import { defineEventHandler, createError } from 'h3'
import { dataSource } from '../../../database'
import { TTSTask } from '../../../entities/tts-task'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const taskId = event.context.params?.id
    if (!taskId) {
        throw createError({ statusCode: 400, statusMessage: 'Task ID is required' })
    }

    const taskRepo = dataSource.getRepository(TTSTask)
    const task = await taskRepo.findOneBy({ id: taskId })

    if (!task) {
        throw createError({ statusCode: 404, statusMessage: 'Task not found' })
    }

    // 权限检查：只有发起者或管理员可以查看任务状态
    if (task.userId !== user.id && !isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    return task
})
