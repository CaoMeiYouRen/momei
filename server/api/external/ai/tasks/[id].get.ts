import { PostAutomationService } from '@/server/services/ai'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const taskId = getRouterParam(event, 'id')

    if (!taskId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Task ID is required',
        })
    }

    const task = await PostAutomationService.getTaskStatus(taskId, user.id, {
        isAdmin: isAdmin(user.role),
        includeRaw: isAdmin(user.role),
    })

    return {
        code: 200,
        data: task,
    }
})
