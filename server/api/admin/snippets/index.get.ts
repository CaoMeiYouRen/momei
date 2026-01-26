import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { success, paginate } from '@/server/utils/response'

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const { page, limit, status } = await getValidatedQuery(event, (q) => querySchema.parse(q))

    const repo = dataSource.getRepository(Snippet)
    const [items, total] = await repo.findAndCount({
        where: {
            author: { id: session.user.id },
            ...(status ? { status: status as any } : {}),
        },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
    })

    return success(paginate(items, total, page, limit))
})
