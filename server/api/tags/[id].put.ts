import { auth } from '@/lib/auth'
import { tagUpdateSchema } from '@/utils/schemas/tag'
import { updateTag } from '@/server/utils/services/tag'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || session.user.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => tagUpdateSchema.parse(b))

    // 使用统一的标签更新服务逻辑
    const tag = await updateTag(id, body)

    return {
        code: 200,
        data: tag,
    }
})
