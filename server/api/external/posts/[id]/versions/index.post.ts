import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { recordPostVersionCommit } from '@/server/services/post-version'
import { PostVersionSource } from '@/types/post-version'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const postId = getRequiredRouterParam(event, 'id')

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({
        where: { id: postId },
        relations: { tags: true },
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Non-admins can only version their own posts
    if (!isAdmin(user.role) && post.authorId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const result = await recordPostVersionCommit(post, user.id, {
        source: PostVersionSource.EDIT,
        auditContext: {
            ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
            userAgent: getRequestHeader(event, 'user-agent') || null,
        },
    })

    return {
        code: 200,
        data: {
            created: result.created,
            version: result.version,
        },
    }
})
