import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { processAuthorPrivacy } from '@/server/utils/author'
import { checkPostAccess } from '@/server/utils/post-access'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success, ensureFound } from '@/server/utils/response'
import { applyPostReadModelFromMetadata } from '@/server/utils/post-metadata'
import { getAdjacentPublicPosts, getPostTranslations } from '@/server/utils/post-detail'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    const session = event.context?.auth
    const isUserAdmin = session?.user && isAdmin(session.user.role)

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image', 'author.email', 'author.socialLinks', 'author.donationLinks'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    qb.where('post.id = :id', { id })

    const post = ensureFound(await qb.getOne(), 'Post')
    applyPostReadModelFromMetadata(post)

    // 处理作者哈希并保护隐私
    await processAuthorPrivacy(post.author, !!isUserAdmin)

    // Handle Access Control
    const unlockedIds = (getCookie(event, 'momei_unlocked_posts') || '').split(',')
    const access = await checkPostAccess(post, session, unlockedIds)

    if (!access.allowed && access.shouldNotFound) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    const translations = await getPostTranslations(postRepo, post)

    if (!access.allowed) {
        return success({
            ...(access.data || {}),
            translations,
            previousPost: null,
            nextPost: null,
            locked: true,
            reason: access.reason,
        })
    }

    const { previousPost, nextPost } = await getAdjacentPublicPosts(postRepo, post)

    return success({
        ...post,
        translations,
        previousPost,
        nextPost,
        locked: false,
    })
})
