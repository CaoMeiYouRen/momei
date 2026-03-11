import { getAICostDisplayConfig } from '@/server/services/ai/cost-display'
import { getAITaskDetail } from '@/server/services/ai/task-detail'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const taskId = getRouterParam(event, 'id')

    if (!taskId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Task ID is required',
        })
    }

    const item = await getAITaskDetail(taskId, session.user.id, { isAdmin: true })
    const costDisplay = await getAICostDisplayConfig()

    return success({
        item,
        costDisplay,
    })
})
