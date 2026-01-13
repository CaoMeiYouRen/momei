import { auth } from '@/lib/auth'
import { categoryUpdateSchema } from '@/utils/schemas/category'
import { updateCategory } from '@/server/services/category'

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

    const body = await readValidatedBody(event, (b) => categoryUpdateSchema.parse(b))

    // 使用统一的分类更新服务逻辑
    const category = await updateCategory(id, body)

    return {
        code: 200,
        data: category,
    }
})
