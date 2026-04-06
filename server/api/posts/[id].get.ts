import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { processAuthorPrivacy } from '@/server/utils/author'
import { toPlainObject } from '@/server/utils/object'
import { checkPostAccess, rethrowPostAccessError } from '@/server/utils/post-access'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success, ensureFound } from '@/server/utils/response'
import { applyPostReadModelFromMetadata } from '@/server/utils/post-metadata'
import { getAdjacentPublicPosts, getPostTranslations, getRelatedPublicPosts } from '@/server/utils/post-detail'
import { getUnlockedPostIds } from '@/server/utils/post-unlock'

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
    const unlockedIds = getUnlockedPostIds(event)
    let access
    try {
        access = await checkPostAccess(post, session, unlockedIds)
    } catch (error) {
        rethrowPostAccessError(error)
    }

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
            relatedPosts: [],
            locked: true,
            reason: access.reason,
        })
    }

    const [{ previousPost, nextPost }, relatedPosts] = await Promise.all([
        getAdjacentPublicPosts(postRepo, post),
        getRelatedPublicPosts(postRepo, post),
    ])

    return success(Object.assign(toPlainObject(post), {
        translations,
        previousPost,
        nextPost,
        relatedPosts,
        locked: false,
    }))
})
