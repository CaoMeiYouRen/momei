import { tagQuerySchema } from '@/utils/schemas/tag'
import { paginate } from '@/server/utils/response'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { queryTagPublicList } from '@/server/utils/tag-public-list'

export default defineEventHandler(async (event) => {
    // Authenticate API key — user is not needed for read-only public data access
    const { user } = await validateApiKeyRequest(event)
    void user

    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))
    const result = await queryTagPublicList(query)

    return {
        code: 200,
        data: paginate(result.items, result.total, result.page, result.limit),
    }
})
