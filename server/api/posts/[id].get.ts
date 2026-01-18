import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'
import { checkPostAccess } from '@/server/utils/post-access'

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

    // Handle Access Control
    const unlockedIds = (getCookie(event, 'momei_unlocked_posts') || '').split(',')
    const access = await checkPostAccess(post, session, unlockedIds)

    if (!access.allowed && access.shouldNotFound) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    if (!access.allowed) {
        return {
            code: 200,
            data: {
                ...(access.data || {}),
                locked: true,
                reason: access.reason,
            },
        }
    }

    return {
        code: 200,
        data: {
            ...post,
            locked: false,
        },
    }
})
