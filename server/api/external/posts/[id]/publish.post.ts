import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { updatePostService } from '@/server/services/post'
import { PostStatus } from '@/types/post'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    const post = await updatePostService(id, {
        status: PostStatus.PUBLISHED,
    }, {
        isAdmin: user.role === 'admin',
        currentUserId: user.id,
    })

    return {
        code: 200,
        data: {
            id: post.id,
            status: post.status,
            publishedAt: post.publishedAt,
        },
    }
})
