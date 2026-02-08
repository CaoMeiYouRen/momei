import { z } from 'zod'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { createPostService } from '@/server/services/post'
import { PostStatus, PostVisibility } from '@/types/post'
import { isAdmin as checkIsAdmin } from '@/utils/shared/roles'

const scaffoldToPostSchema = z.object({
    scaffold: z.string().min(1),
    title: z.string().optional(),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const body = await readBody(event)
    const { scaffold, title, language } = scaffoldToPostSchema.parse(body)

    // 默认标题提取内容的前 50 个字符
    const postTitle = title || (scaffold.split('\n')[0] || '').replace(/[#*`]/g, '').substring(0, 50).trim() || '从大纲生成的灵感文章'

    const post = await createPostService({
        title: postTitle,
        content: scaffold,
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        language,
        tags: [],
        pushOption: 'none',
        syncToMemos: false,
    }, session.user.id, {
        isAdmin: checkIsAdmin(session.user.role),
    })

    return {
        code: 200,
        message: 'Post created from scaffold successfully',
        data: {
            post,
        },
    }
})
