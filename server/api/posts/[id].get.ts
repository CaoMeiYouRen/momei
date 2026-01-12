import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID required' })
    }

    const session = await auth.api.getSession({
        headers: event.headers,
    })

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    qb.where('post.id = :id', { id })

    const post = await qb.getOne()

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Visibility check
    if (post.status !== 'published') {
        if (!session || !session.user) {
            throw createError({ statusCode: 404, statusMessage: 'Post not found' })
        }
        const isAuthor = session.user.id === post.authorId
        const isUserAdmin = isAdmin(session.user.role)
        if (!isAuthor && !isUserAdmin) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }
    }

    return {
        code: 200,
        data: post,
    }
})
