import { updatePostSchema } from '@/utils/schemas/post'
import { updatePostService } from '@/server/services/post'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }
    const body = await readValidatedBody(event, (b) => updatePostSchema.parse(b))
    const session = await requireAdminOrAuthor(event)

    const post = await updatePostService(id, body, {
        isAdmin: isAdmin(session.user.role),
        currentUserId: session.user.id,
    })

    return success(post)
})
