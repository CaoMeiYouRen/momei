import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'

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
        const currentUserIsAdmin = isAdmin(session.user.role)
        const task = await TextService.getTaskStatus(taskId, session.user.id, {
            isAdmin: currentUserIsAdmin,
            includeRaw: currentUserIsAdmin,
        })
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
