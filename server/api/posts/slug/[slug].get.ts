import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Slug required' })
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

    qb.where('post.slug = :slug', { slug })

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
        const isAdmin = session.user.role === 'admin'
        if (!isAuthor && !isAdmin) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }
    }

    // Increment views
    // TODO: Implement PV calculation logic in Post-MVP phase
    // Requirements:
    // 1. Only increment for logged-in users
    // 2. Check if request is from browser (User-Agent)
    // 3. Implement rate limiting/anti-abuse

    return {
        code: 200,
        data: post,
    }
})
