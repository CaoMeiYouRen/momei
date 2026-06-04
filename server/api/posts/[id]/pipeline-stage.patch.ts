import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { isAdmin } from '@/utils/shared/roles'
import { success } from '@/server/utils/response'
import { PostStatus } from '@/types/post'

const bodySchema = z.object({
    pipelineStage: z.enum(['ideation', 'writing', 'ready']),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const { user } = session
    const id = getRequiredRouterParam(event, 'id')
    const body = await readValidatedBody(event, (b) => bodySchema.parse(b))

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({ where: { id }, relations: ['author'] })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }
    if (post.status !== PostStatus.DRAFT) {
        throw createError({ statusCode: 400, statusMessage: 'Only draft posts can change pipeline stage' })
    }

    const isAuthor = user.id === post.authorId
    if (!isAuthor && !isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const metadata = { ...(post.metadata || {}) }
    metadata.pipelineStage = body.pipelineStage
    post.metadata = metadata
    await postRepo.save(post)

    return success({ id: post.id, pipelineStage: body.pipelineStage })
})
