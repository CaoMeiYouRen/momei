import { auth } from '@/lib/auth'
import { categoryBodySchema } from '@/utils/schemas/category'
import { isAdmin } from '@/utils/shared/roles'
import { createCategory } from '@/server/services/category'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !isAdmin(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => categoryBodySchema.parse(b))

    // 使用统一的分类创建服务逻辑
    const category = await createCategory(body)

    return {
        code: 200,
        data: category,
    }
})
