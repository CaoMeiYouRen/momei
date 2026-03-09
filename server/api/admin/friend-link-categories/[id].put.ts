import { friendLinkCategorySchema } from '@/utils/schemas/friend-link'
import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const id = getRequiredRouterParam(event, 'id')
    const result = await readValidatedBody(event, (body) => friendLinkCategorySchema.partial().safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const item = await friendLinkService.updateCategory(id, result.data)
    return success(item)
})
