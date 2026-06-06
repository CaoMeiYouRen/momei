import { z } from 'zod'
import { SocialPostService, type SocialPlatform } from '@/server/services/ai/social-post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'
import { isAdmin } from '@/utils/shared/roles'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'

const bodySchema = z.object({
    platform: z.enum(['twitter', 'linkedin']),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const id = getRequiredRouterParam(event, 'id')
    const body = await readValidatedBody(event, (b) => bodySchema.parse(b))

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({
        where: { id },
        relations: { author: true },
    })
    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Row-level permission
    if (!isAdmin(session.user.role) && post.authorId !== session.user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const result = await SocialPostService.generate(
        post.title,
        post.content,
        body.platform as SocialPlatform,
        post.language,
        session.user.id,
    )

    return success(result)
})
