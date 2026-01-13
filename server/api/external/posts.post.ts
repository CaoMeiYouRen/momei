import { createPostSchema } from '@/utils/schemas/post'
import { createPostService } from '@/server/utils/services/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const body = await readValidatedBody(event, (b) => createPostSchema.parse(b))

    const post = await createPostService(body, user.id, {
        isAdmin: user.role === 'admin',
    })

    const host = getRequestHost(event)
    const protocol = getRequestProtocol(event)

    return {
        code: 200,
        data: {
            id: post.id,
            url: `${protocol}://${host}/posts/${post.slug}`,
        },
    }
})
