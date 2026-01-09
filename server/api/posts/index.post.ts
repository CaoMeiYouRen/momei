import { auth } from '@/lib/auth'
import { createPostSchema } from '@/utils/schemas/post'
import { createPostService } from '@/server/utils/post-service'

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, (b) => createPostSchema.parse(b))
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const post = await createPostService(body, session.user.id, {
        isAdmin: session.user.role === 'admin',
    })

    return {
        code: 200,
        data: post,
    }
})
