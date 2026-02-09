import { updatePostSchema } from '@/utils/schemas/post'
import { updatePostService } from '@/server/services/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    const body = await readValidatedBody(event, (b) => updatePostSchema.parse(b))

    const post = await updatePostService(id, body, {
        isAdmin: user.role === 'admin',
        currentUserId: user.id,
    })

    return {
        code: 200,
        data: post,
    }
})
