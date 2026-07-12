import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { applyPagination } from '@/server/utils/pagination'
import { paginationSchema } from '@/utils/schemas/pagination'
import { SnippetStatus } from '@/types/snippet'
import { paginate } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const query = await getValidatedQuery(event, (q) =>
        paginationSchema.extend({
            status: z.enum([SnippetStatus.INBOX, SnippetStatus.CONVERTED, SnippetStatus.ARCHIVED] as const).optional(),
            source: z.string().optional(),
            search: z.string().optional(),
        }).parse(q),
    )

    const snippetRepo = dataSource.getRepository(Snippet)
    const qb = snippetRepo.createQueryBuilder('snippet')
        .leftJoinAndSelect('snippet.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image'])
        .leftJoin('snippet.post', 'post')
        .addSelect(['post.id', 'post.title'])

    // Non-admins can only see their own snippets
    if (!isAdmin(user.role)) {
        qb.andWhere('snippet.authorId = :userId', { userId: user.id })
    }

    if (query.status) {
        qb.andWhere('snippet.status = :status', { status: query.status })
    }

    if (query.source) {
        qb.andWhere('snippet.source = :source', { source: query.source })
    }

    if (query.search) {
        qb.andWhere('snippet.content LIKE :search', { search: `%${query.search}%` })
    }

    qb.orderBy('snippet.createdAt', 'DESC')

    applyPagination(qb, query)
    const [items, total] = await qb.getManyAndCount()

    return {
        code: 200,
        data: paginate(items, total, query.page, query.limit),
    }
})
