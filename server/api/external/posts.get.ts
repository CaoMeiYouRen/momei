import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { getSettings } from '@/server/services/setting'
import { postQuerySchema } from '@/utils/schemas/post'
import { applyDefaultPaginationLimit, applyPagination } from '@/server/utils/pagination'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { applyPostListSelect } from '@/server/utils/post-list-query'
import { SettingKey } from '@/types/setting'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const settings = await getSettings([SettingKey.POSTS_PER_PAGE])
    const postsPerPage = settings[SettingKey.POSTS_PER_PAGE] ?? '10'
    const query = await getValidatedQuery(event, (q) => postQuerySchema.parse(applyDefaultPaginationLimit(q as Record<string, unknown>, postsPerPage)))

    const postRepo = dataSource.getRepository(Post)
    // 外部列表接口只返回精简列表字段，避免把正文等重字段暴露给批量查询。
    const qb = applyPostListSelect(postRepo.createQueryBuilder('post'), {
        includeAuthor: false,
    })

    // 管理员可按 authorId 查询；非管理员强制绑定到自身 userId，
    // 防止 API Key 在外部集成场景越权读取他人文章列表。
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
