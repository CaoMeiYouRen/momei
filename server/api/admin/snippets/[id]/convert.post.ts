import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { SnippetStatus } from '@/types/snippet'
import { PostStatus, PostVisibility } from '@/types/post'
import { createPostService } from '@/server/services/post'
import { isAdmin as checkIsAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const id = getRouterParam(event, 'id') || ''

    const snippetRepo = dataSource.getRepository(Snippet)
    const snippet = await snippetRepo.findOne({
        where: { id, author: { id: session.user.id } },
    })

    if (!snippet) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Snippet not found',
        })
    }

    if (snippet.status === SnippetStatus.CONVERTED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Snippet already converted',
        })
    }

    // 转换为文章草稿
    // 默认标题提取内容的前 20 个字符，或使用 "灵感采集"
    const content = snippet.content || ''
    const title = (content.split('\n')[0] || '').substring(0, 50).trim() || '未命名的灵感'

    const post = await createPostService({
        title,
        content,
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        language: 'zh-CN', // 默认语言，后续可从全局设置或 Snippet 元数据获取
        tags: [],
    }, session.user.id, {
        isAdmin: checkIsAdmin(session.user.role),
    })

    // 更新灵感状态并关联文章
    snippet.status = SnippetStatus.CONVERTED
    snippet.post = post
    await snippetRepo.save(snippet)

    return {
        code: 200,
        message: 'Converted to post successfully',
        data: {
            post,
            snippet,
        },
    }
})
