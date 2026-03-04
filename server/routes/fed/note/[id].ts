import { defineEventHandler, getRouterParam, createError, setHeader, getHeader } from 'h3'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostStatus, PostVisibility } from '@/types/post'
import { postToNote } from '@/server/utils/fed/mapper'

/**
 * ActivityPub Note 端点
 * 返回文章的 Note 对象
 *
 * @route GET /fed/note/:id
 * @header Accept: application/activity+json
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Note ID is required',
        })
    }

    // 查找文章
    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({
        where: { id },
        relations: ['author', 'tags', 'category'],
    })

    if (!post) {
        throw createError({
            statusCode: 404,
            message: 'Note not found',
        })
    }

    // 关键: 只返回公开状态的文章
    // 遵循可见性控制策略
    if (post.status !== PostStatus.PUBLISHED || post.visibility !== PostVisibility.PUBLIC) {
        // 对于非公开文章，返回 404 以保护隐私
        throw createError({
            statusCode: 404,
            message: 'Note not found',
        })
    }

    // 获取站点 URL
    const config = useRuntimeConfig()
    const siteUrl = config.public.siteUrl

    // 转换为 Note (postToNote 是同步函数)
    const note = postToNote(post, siteUrl)

    // 设置正确的 Content-Type
    setHeader(event, 'Content-Type', 'application/activity+json')
    // ActivityPub 跨域访问控制
    const origin = getHeader(event, 'origin')
    if (origin) {
        const allowedOrigins = [siteUrl]
        if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
            setHeader(event, 'Access-Control-Allow-Origin', origin)
        }
    }

    return note
})
