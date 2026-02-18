import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const taskId = getRouterParam(event, 'id')

    if (!taskId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Task ID is required',
        })
    }

    try {
        const task = await TextService.getTaskStatus(taskId, session.user.id)
        return {
            code: 200,
            data: task,
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
