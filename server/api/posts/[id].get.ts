import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { processAuthorPrivacy } from '@/server/utils/author'
import { checkPostAccess } from '@/server/utils/post-access'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success, ensureFound } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    const session = event.context?.auth
    const isUserAdmin = session?.user && isAdmin(session.user.role)

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image', 'author.email'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    qb.where('post.id = :id', { id })

    const post = await qb.getOne()

    ensureFound(post, 'Post')

    // 处理作者哈希并保护隐私
    await processAuthorPrivacy(post.author, !!isUserAdmin)

    // Handle Access Control
    const unlockedIds = (getCookie(event, 'momei_unlocked_posts') || '').split(',')
    const access = await checkPostAccess(post, session, unlockedIds)

    if (!access.allowed && access.shouldNotFound) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    if (!access.allowed) {
        return success({
            ...(access.data || {}),
            locked: true,
            reason: access.reason,
        })
    }

    return success({
        ...post,
        locked: false,
    })
})
