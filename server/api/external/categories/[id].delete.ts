import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { safeDeleteCategory } from '@/server/utils/category-delete'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    if (!isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required' })
    }

    const id = getRequiredRouterParam(event, 'id')

    await safeDeleteCategory(id)

    return {
        code: 200,
        message: 'Category deleted successfully',
    }
})
