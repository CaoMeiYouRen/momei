import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { pvCache } from '@/server/utils/pv-cache'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: '缺少文章 ID',
        })
    }

    // Rate Limit: 同一 IP 10 分钟内限制 3 次请求
    // 注意：这将基于 event.path (包含 ID) 进行限制
    await rateLimit(event, {
        window: 60 * 10,
        max: 3,
    })

    const postRepo = dataSource.getRepository(Post)

    // 检查文章是否存在
    // 为了性能，如果使用了内存缓存，这里其实可以优化为不查询 DB，
    // 但为了返回一个“大概”准确的视图数展示给用户看，我们可以查询一次，或者由前端自行处理累加。
    // 这里保持查询一次，因为这是详情页，相对于直接写入 DB，读一次 DB 的开销是可以接受的。
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

    // 使用内存缓存增加阅读量，而不是直接操作数据库
    pvCache.record(id)

    // 返回增加后的值 (数据库中的值 + 内存中待入库的值)
    // 注意：这里的 post.views 是数据库当前的值，pvCache.getPending(id) 包含刚才记录的那次。
    return {
        code: 200,
        message: 'Success',
        data: {
            views: post.views + pvCache.getPending(id),
        },
    }
})
