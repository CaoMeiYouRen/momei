import { z } from 'zod'
import { Brackets } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(['published', 'draft', 'pending']).optional(),
    scope: z.enum(['public', 'manage']).default('public'),
    authorId: z.string().optional(),
    categoryId: z.string().optional(),
    tagId: z.string().optional(),
    language: z.string().optional(),
    search: z.string().optional(),
    orderBy: z.enum(['createdAt', 'updatedAt', 'views', 'publishedAt']).default('publishedAt'),
    order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => querySchema.parse(q))
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    if (query.scope === 'manage') {
        // Management Mode
        if (!session || !session.user) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
        }
        const role = session.user.role
        if (role !== 'admin' && role !== 'author') {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }

        if (role === 'author') {
            // Authors can only see their own posts in manage mode
            qb.andWhere('post.authorId = :currentUserId', { currentUserId: session.user.id })
        } else if (role === 'admin') {
            // Admins can filter by authorId
            if (query.authorId) {
                qb.andWhere('post.authorId = :authorId', { authorId: query.authorId })
            }
        }

        // Status filtering
        if (query.status) {
            qb.andWhere('post.status = :status', { status: query.status })
        }
    } else {
        // Public Mode
        qb.andWhere('post.status = :status', { status: 'published' })

        if (query.authorId) {
            qb.andWhere('post.authorId = :authorId', { authorId: query.authorId })
        }
    }

    // Common filters
    if (query.categoryId) {
        qb.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId })
    }

    if (query.language) {
        qb.andWhere('post.language = :language', { language: query.language })
    }

    if (query.tagId) {
        qb.innerJoin('post.tags', 'tag', 'tag.id = :tagId', { tagId: query.tagId })
    }

    if (query.search) {
        qb.andWhere(new Brackets((subQb) => {
            subQb.where('post.title LIKE :search', { search: `%${query.search}%` })
                .orWhere('post.summary LIKE :search', { search: `%${query.search}%` })
        }))
    }

    // Sorting
    qb.orderBy(`post.${query.orderBy}`, query.order)

    // Pagination
    qb.skip((query.page - 1) * query.limit)
    qb.take(query.limit)

    const [items, total] = await qb.getManyAndCount()

    return {
        code: 200,
        data: {
            items,
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(total / query.limit),
        },
    }
})
