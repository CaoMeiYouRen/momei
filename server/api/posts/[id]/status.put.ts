import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'
import { updatePostStatusSchema } from '@/utils/schemas/post'
import { isAdmin as checkIsAdmin } from '@/utils/shared/roles'
import { POST_STATUS_TRANSITIONS, PostStatus } from '@/types/post'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readValidatedBody(event, (b) => updatePostStatusSchema.parse(b))
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({ where: { id } })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Permission check
    const isAuthor = session.user.id === post.authorId
    const isAdmin = checkIsAdmin(session.user.role)

    if (!isAuthor && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const currentStatus = post.status as PostStatus
    const targetStatus = body.status as PostStatus

    // 仅在状态发生改变时校验转换逻辑
    if (currentStatus !== targetStatus) {
        const allowedTransitions = POST_STATUS_TRANSITIONS[currentStatus] || []
        if (!allowedTransitions.includes(targetStatus)) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid status transition from ${currentStatus} to ${targetStatus}`,
            })
        }
    }

    // Role-based restrictions
    if (!isAdmin) {
        // Non-admins can only move to pending or draft
        if (targetStatus === PostStatus.PUBLISHED || targetStatus === PostStatus.REJECTED) {
            // If they try to publish, move to pending for review
            if (targetStatus === PostStatus.PUBLISHED) {
                post.status = PostStatus.PENDING
            } else {
                throw createError({ statusCode: 403, statusMessage: 'Only admins can reject posts' })
            }
        } else {
            post.status = targetStatus
        }
    } else {
        // Admin can do anything allowed by the state machine
        post.status = targetStatus
    }

    // Update publishedAt
    if (post.status === PostStatus.PUBLISHED && !post.publishedAt) {
        post.publishedAt = new Date()
    }

    await postRepo.save(post)

    return {
        code: 200,
        data: post,
    }
})
