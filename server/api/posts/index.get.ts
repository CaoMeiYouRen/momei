import { Brackets, type WhereExpressionBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'
import { postQuerySchema } from '@/utils/schemas/post'
import { success, paginate } from '@/server/utils/response'
import { applyPagination } from '@/server/utils/pagination'
import { isAdmin, isAdminOrAuthor } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => postQuerySchema.parse(q))
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

        if (!isAdminOrAuthor(session.user.role)) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }

        if (isAdmin(session.user.role)) {
            // Admins can filter by authorId or see all
            if (query.authorId) {
                qb.andWhere('post.authorId = :authorId', { authorId: query.authorId })
            }
        } else {
            // Authors only see their own posts
            qb.andWhere('post.authorId = :currentUserId', { currentUserId: session.user.id })
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
    } else if (query.category) {
        qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
            sub.where('category.slug = :cat', { cat: query.category })
                .orWhere('category.id = :cat', { cat: query.category })
        }))
    }

    if (query.language) {
        qb.andWhere('post.language = :language', { language: query.language })
    }

    if (query.tagId) {
        qb.innerJoin('post.tags', 'tag', 'tag.id = :tagId', { tagId: query.tagId })
    } else if (query.tag) {
        qb.innerJoin('post.tags', 'tagBySlug', 'tagBySlug.slug = :tagSlug', { tagSlug: query.tag })
    }

    if (query.search) {
        qb.andWhere(new Brackets((subQb: WhereExpressionBuilder) => {
            subQb.where('post.title LIKE :search', { search: `%${query.search}%` })
                .orWhere('post.summary LIKE :search', { search: `%${query.search}%` })
        }))
    }

    // Sorting
    qb.orderBy(`post.${query.orderBy}`, query.order)

    // Pagination
    applyPagination(qb, query)

    const [items, total] = await qb.getManyAndCount()

    return success(paginate(items, total, query.page, query.limit))
})
