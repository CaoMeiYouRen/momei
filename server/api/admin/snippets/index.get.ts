import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { success, paginate } from '@/server/utils/response'
import { isAdmin } from '@/utils/shared/roles'

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.string().optional(),
    scope: z.string().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const { page, limit, status, scope, sortBy, sortDirection } = await getValidatedQuery(event, (q) => querySchema.parse(q))

    const repo = dataSource.getRepository(Snippet)
    const qb = repo.createQueryBuilder('snippet')
        .leftJoinAndSelect('snippet.author', 'author')
        .leftJoinAndSelect('snippet.post', 'post')

    if (scope === 'manage' && isAdmin(session.user.role)) {
        // 管理模式下的管理员可以查看所有灵感
    } else {
        // 否则只能查看自己的灵感
        qb.andWhere('snippet.authorId = :authorId', { authorId: session.user.id })
    }

    if (status) {
        qb.andWhere('snippet.status = :status', { status })
    }

    // 允许的排序字段
    const allowedSortFields = ['createdAt', 'updatedAt']
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'

    qb.orderBy(`snippet.${finalSortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
    qb.skip((page - 1) * limit)
    qb.take(limit)

    const [items, total] = await qb.getManyAndCount()

    return success(paginate(items, total, page, limit))
})
