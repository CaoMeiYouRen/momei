import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { checkPostAccess } from '@/server/utils/post-access'
import { sha256 } from '@/utils/shared/hash'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID required' })
    }

    const session = event.context.auth

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image', 'author.email'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    qb.where('post.id = :id', { id })

    const post = await qb.getOne()

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // 处理作者哈希并保护隐私
    if (post.author?.email) {
        (post.author as any).emailHash = await sha256(post.author.email)
        const isUserAdmin = session?.user && isAdmin(session.user.role)
        if (!isUserAdmin) {
            delete (post.author as any).email
        }
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
