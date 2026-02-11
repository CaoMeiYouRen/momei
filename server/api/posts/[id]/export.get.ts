import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { ensureFound } from '@/server/utils/response'
import { formatPostToMarkdown } from '@/server/services/post-export'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    // 鉴权：管理员或作者
    await requireAdminOrAuthor(event)

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({
        where: { id },
        relations: ['category', 'tags', 'author'],
    })

    ensureFound(post, 'Post')

    const markdown = formatPostToMarkdown(post!)
    const filename = `${post!.slug || post!.id}.md`

    // 设置响应头触发下载
    setHeaders(event, {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    })

    return markdown
})
