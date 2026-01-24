import { createPostSchema } from '@/utils/schemas/post'
import { createPostService } from '@/server/services/post'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, (b) => createPostSchema.parse(b))
    const user = event.context.user

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const post = await createPostService(body, user.id, {
        isAdmin: isAdmin(user.role),
    })

    return {
        code: 200,
        data: post,
    }
})
