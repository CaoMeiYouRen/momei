import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'
import { PostStatus } from '@/types/post'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const query = getQuery(event)
    const language = query.language as string

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

    if (language) {
        qb.andWhere('post.language = :language', { language })
    }

    const post = await qb.getOne()

    if (!post) {
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

    // Visibility check
    if (post.status !== PostStatus.PUBLISHED) {
        if (!session || !session.user) {
            throw createError({ statusCode: 404, statusMessage: 'Post not found' })
        }
        const isAuthor = session.user.id === post.authorId
        const isAdmin = session.user.role === 'admin'
        if (!isAuthor && !isAdmin) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }
    }

    return {
        code: 200,
        data: {
            ...post,
            translations,
        },
    }
})
