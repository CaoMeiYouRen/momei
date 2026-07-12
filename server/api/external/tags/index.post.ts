import { tagBodySchema } from '@/utils/schemas/tag'
import { createTag } from '@/server/services/tag'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdminOrAuthor } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    if (!isAdminOrAuthor(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin or Author access required' })
    }

    const body = await readValidatedBody(event, (b) => tagBodySchema.parse(b))

    const tag = await createTag(body)

    return {
        code: 200,
        data: tag,
    }
})
