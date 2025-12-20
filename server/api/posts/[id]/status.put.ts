import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'

const updateStatusSchema = z.object({
    status: z.enum(['published', 'draft', 'pending']),
})

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readValidatedBody(event, (b) => updateStatusSchema.parse(b))
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
    const isAdmin = session.user.role === 'admin'

    if (!isAuthor && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Logic for status changes
    if (body.status === 'published') {
        if (!isAdmin) {
            // Authors cannot publish directly, it goes to pending
            post.status = 'pending'
        } else {
            post.status = 'published'
        }

        if (post.status === 'published' && !post.publishedAt) {
            post.publishedAt = new Date()
        }
    } else {
        post.status = body.status
    }

    await postRepo.save(post)

    return {
        code: 200,
        data: post,
    }
})
