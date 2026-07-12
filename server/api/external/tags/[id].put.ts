import { tagUpdateSchema } from '@/utils/schemas/tag'
import { updateTag } from '@/server/services/tag'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    if (!isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required' })
    }

    const id = getRequiredRouterParam(event, 'id')
    const body = await readValidatedBody(event, (b) => tagUpdateSchema.parse(b))

    const tag = await updateTag(id, body)

    return {
        code: 200,
        data: tag,
    }
})
