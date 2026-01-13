import { auth } from '@/lib/auth'
import { tagBodySchema } from '@/utils/schemas/tag'
import { isAdminOrAuthor } from '@/utils/shared/roles'
import { createTag } from '@/server/utils/services/tag'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Admin and Author can create tags
    if (!isAdminOrAuthor(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => tagBodySchema.parse(b))

    // 使用统一的标签创建服务逻辑
    const tag = await createTag(body)

    return {
        code: 200,
        data: tag,
    }
})
