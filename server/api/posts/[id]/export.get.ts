import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { ensureFound } from '@/server/utils/response'
import { formatPostToMarkdown, createPostsZip } from '@/server/services/post-export'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    const exportAllTranslations = query.all === 'true'

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

    if (exportAllTranslations) {
        // 导出全组翻译
        const tid = post!.translationId || post!.id
        const posts = await postRepo.find({
            where: [
                { translationId: tid },
                { id: tid },
            ],
            relations: ['category', 'tags', 'author'],
        })

        if (posts.length > 1) {
            const zipBuffer = await createPostsZip(posts)
            const filename = `momei-translations-${post!.slug || post!.id}.zip`
            setHeaders(event, {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            })
            return zipBuffer
        }
    }

    // 单篇导出
    const markdown = formatPostToMarkdown(post!)
    const filename = `${post!.slug || post!.id}.${post!.language}.md`

    // 设置响应头触发下载
    setHeaders(event, {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    })

    return markdown
})
