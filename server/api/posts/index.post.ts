import { createPostSchema } from '@/utils/schemas/post'
import { createPostService } from '@/server/services/post'
import { isAdmin } from '@/utils/shared/roles'
import { requireAdminOrAuthor } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, (b) => createPostSchema.parse(b))
    const session = await requireAdminOrAuthor(event)
    const { user } = session

    const post = await createPostService(body, user.id, {
        isAdmin: isAdmin(user.role),
    })

    return {
        code: 200,
        data: post,
    }
})
