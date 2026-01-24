import { tagBodySchema } from '@/utils/schemas/tag'
import { isAdminOrAuthor } from '@/utils/shared/roles'
import { createTag } from '@/server/services/tag'

export default defineEventHandler(async (event) => {
    const user = event.context.user

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Admin and Author can create tags
    if (!isAdminOrAuthor(user.role)) {
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
