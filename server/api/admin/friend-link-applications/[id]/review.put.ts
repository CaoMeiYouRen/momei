import { friendLinkApplicationReviewSchema } from '@/utils/schemas/friend-link'
import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const id = getRequiredRouterParam(event, 'id')
    const result = await readValidatedBody(event, (body) => friendLinkApplicationReviewSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const reviewed = await friendLinkService.reviewApplication(id, result.data, session.user.id)
    return success(reviewed)
})
