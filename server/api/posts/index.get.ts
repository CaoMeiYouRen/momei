import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(['published', 'draft', 'pending']).optional(),
    authorId: z.string().optional(),
    categoryId: z.string().optional(),
    tagId: z.string().optional(),
    language: z.string().optional(),
    orderBy: z.enum(['createdAt', 'updatedAt', 'views', 'publishedAt']).default('createdAt'),
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

    // Permission check for status
    let allowedStatus = ['published']
    if (session?.user?.role === 'admin' || session?.user?.role === 'author') {
        allowedStatus = ['published', 'draft', 'pending']
    }

    if (query.status) {
        if (!allowedStatus.includes(query.status)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
            })
        }
        qb.andWhere('post.status = :status', { status: query.status })
    } else if (allowedStatus.length === 1) {
        // If no status specified
        qb.andWhere('post.status = :status', { status: 'published' })
    }
    // If admin/author, return all statuses if not specified

    if (query.authorId) {
        qb.andWhere('post.authorId = :authorId', { authorId: query.authorId })
    }

    if (query.categoryId) {
        qb.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId })
    }

    if (query.language) {
        qb.andWhere('post.language = :language', { language: query.language })
    }

    if (query.tagId) {
        qb.innerJoin('post.tags', 'tag', 'tag.id = :tagId', { tagId: query.tagId })
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
