import { categoryBodySchema } from '@/utils/schemas/category'
import { createCategory } from '@/server/services/category'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    if (!isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required' })
    }

    const body = await readValidatedBody(event, (b) => categoryBodySchema.parse(b))

    const category = await createCategory(body)

    return {
        code: 200,
        data: category,
    }
})
