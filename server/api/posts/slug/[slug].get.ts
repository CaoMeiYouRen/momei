import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostStatus } from '@/types/post'
import { processAuthorPrivacy } from '@/server/utils/author'
import { checkPostAccess } from '@/server/utils/post-access'
import { isAdmin } from '@/utils/shared/roles'
import { applyPostReadModelFromMetadata } from '@/server/utils/post-metadata'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const query = getQuery(event)
    const language = query.language as string

    if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Slug required' })
    }

    const session = event.context?.auth
    const isUserAdmin = session?.user && isAdmin(session.user.role)

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image', 'author.email', 'author.socialLinks', 'author.donationLinks'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    qb.where('post.slug = :slug', { slug })

    if (language) {
        qb.andWhere('post.language = :language', { language })
    }

    const post = await qb.getOne()

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    applyPostReadModelFromMetadata(post)

    // 处理作者哈希并保护隐私
    await processAuthorPrivacy(post.author, !!isUserAdmin)

    // Handle Access Control
    const unlockedIds = (getCookie(event, 'momei_unlocked_posts') || '').split(',')
    const access = await checkPostAccess(post, session, unlockedIds)

    if (!access.allowed && access.shouldNotFound) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Fetch translations
    let translations: any[] = []
    if (post.translationId) {
        translations = await postRepo.find({
            where: {
                translationId: post.translationId,
                status: PostStatus.PUBLISHED,
            },
            select: ['language', 'slug'],
        })
    }

    if (!access.allowed) {
        return {
            code: 200,
            data: {
                ...(access.data || {}),
                translations,
                locked: true,
                reason: access.reason,
            },
        }
    }

    return {
        code: 200,
        data: {
            ...post,
            translations,
            locked: false,
        },
    }
})
