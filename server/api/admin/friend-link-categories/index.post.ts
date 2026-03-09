import { friendLinkCategorySchema } from '@/utils/schemas/friend-link'
import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const result = await readValidatedBody(event, (body) => friendLinkCategorySchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const item = await friendLinkService.createCategory(result.data)
    return success(item, 201)
})
