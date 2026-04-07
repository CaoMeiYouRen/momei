import type { H3Event } from 'h3'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { processAuthorPrivacy } from '@/server/utils/author'
import { toPlainObject } from '@/server/utils/object'
import { applyPostReadModelFromMetadata } from '@/server/utils/post-metadata'
import { checkPostAccess, rethrowPostAccessError } from '@/server/utils/post-access'
import { getAdjacentPublicPosts, getPostTranslations, getRelatedPublicPosts } from '@/server/utils/post-detail'
import { getUnlockedPostIds } from '@/server/utils/post-unlock'
import { ensureFound, success } from '@/server/utils/response'
import { isAdmin } from '@/utils/shared/roles'

type PostDetailLookup =
    | { id: string }
    | { slug: string, language?: string }

function createPostDetailQuery() {
    const postRepo = dataSource.getRepository(Post)
    const queryBuilder = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image', 'author.email', 'author.socialLinks', 'author.donationLinks'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    return { postRepo, queryBuilder }
}

function applyLookup(queryBuilder: ReturnType<typeof createPostDetailQuery>['queryBuilder'], lookup: PostDetailLookup) {
    if ('id' in lookup) {
        queryBuilder.where('post.id = :id', { id: lookup.id })
        return
    }

    queryBuilder.where('post.slug = :slug', { slug: lookup.slug })

    if (lookup.language) {
        queryBuilder.andWhere('post.language = :language', { language: lookup.language })
    }
}

export async function readPostDetail(event: H3Event, lookup: PostDetailLookup) {
    const session = event.context?.auth
    const isUserAdmin = session?.user && isAdmin(session.user.role)
    const { postRepo, queryBuilder } = createPostDetailQuery()

    applyLookup(queryBuilder, lookup)

    const post = ensureFound(await queryBuilder.getOne(), 'Post')
    applyPostReadModelFromMetadata(post)

    await processAuthorPrivacy(post.author, !!isUserAdmin)

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
}
