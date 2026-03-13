import { dispatchPostDistributionSchema } from '@/utils/schemas/post-distribution'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { dispatchPostDistributionService } from '@/server/services/post-distribution'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    const body = await readValidatedBody(event, (value) => dispatchPostDistributionSchema.parse(value))
    const session = await requireAdminOrAuthor(event)

    const result = await dispatchPostDistributionService(id, body, {
        currentUserId: session.user.id,
        isAdmin: isAdmin(session.user.role),
    })

    return success(result)
})
