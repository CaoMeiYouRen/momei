import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: '缺少文章 ID',
        })
    }

    // Rate Limit: 同一 IP 10 分钟内限制 1 次请求
    // 注意：这将基于 event.path (包含 ID) 进行限制
    await rateLimit(event, {
        window: 60 * 10 * 1000,
        max: 1,
    })

    const postRepo = dataSource.getRepository(Post)

    // 检查文章是否存在
    // 为了性能，可以先 update 再 check affected?
    // 但 typeorm increment 不返回 affected rows 容易。
    // 这里先查询是否存在，虽然多一次查询，但对于详情页来说可以接受。
    // 或者直接 increment，如果不报错就默认成功。
    // 但我们需要返回最新的 views 数量。

    const post = await postRepo.findOne({
        where: { id },
        select: ['id', 'views'], // 仅查询需要的字段
    })

    if (!post) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: '文章未找到',
        })
    }

    // 使用原子操作增加阅读量
    await postRepo.increment({ id }, 'views', 1)

    // 返回增加后的值 (post.views + 1)
    // 注意：高并发下这个值可能不完全准确（落后于数据库），
    // 但作为前端展示的反馈已经足够。如果要精确，需再次查询。
    // 考虑到用户体验，直接返回 +1 后的值即可，避免再次 DB 查询。

    return {
        code: 200,
        message: 'Success',
        data: {
            views: post.views + 1,
        },
    }
})
