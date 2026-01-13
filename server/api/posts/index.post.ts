import { auth } from '@/lib/auth'
import { createPostSchema } from '@/utils/schemas/post'
import { createPostService } from '@/server/services/post'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, (b) => createPostSchema.parse(b))
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const post = await createPostService(body, session.user.id, {
        isAdmin: isAdmin(session.user.role),
    })

    return {
        code: 200,
        data: post,
    }
})
