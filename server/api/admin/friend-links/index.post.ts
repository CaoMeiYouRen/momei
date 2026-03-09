import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { friendLinkSchema } from '@/utils/schemas/friend-link'
import { friendLinkService } from '@/server/services/friend-link'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const result = await readValidatedBody(event, (body) => friendLinkSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const link = await friendLinkService.createFriendLink(result.data, session.user.id)
    return success(link, 201)
})
