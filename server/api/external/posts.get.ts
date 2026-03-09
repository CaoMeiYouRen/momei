import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { getSetting } from '@/server/services/setting'
import { postQuerySchema } from '@/utils/schemas/post'
import { applyDefaultPaginationLimit, applyPagination } from '@/server/utils/pagination'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { SettingKey } from '@/types/setting'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const postsPerPage = await getSetting(SettingKey.POSTS_PER_PAGE, '10')
    const query = await getValidatedQuery(event, (q) => postQuerySchema.parse(applyDefaultPaginationLimit(q as Record<string, unknown>, postsPerPage)))

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    // 默认强制管理模式
    if (isAdmin(user.role)) {
        if (query.authorId) {
            qb.andWhere('post.authorId = :authorId', { authorId: query.authorId })
        }
    } else {
        qb.andWhere('post.authorId = :userId', { userId: user.id })
    }

    if (query.status) {
        qb.andWhere('post.status = :status', { status: query.status })
    }

    if (query.language) {
        qb.andWhere('post.language = :language', { language: query.language })
    }

    if (query.search) {
        qb.andWhere('post.title LIKE :search', { search: `%${query.search}%` })
    }

    qb.orderBy(`post.${query.orderBy}`, query.order)

    applyPagination(qb, query)
    const [items, total] = await qb.getManyAndCount()

    return {
        code: 200,
        data: {
            items,
            total,
            page: query.page,
            limit: query.limit,
        },
    }
})
