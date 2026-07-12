import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { ensureFound } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const id = getRequiredRouterParam(event, 'id')

    const snippetRepo = dataSource.getRepository(Snippet)
    const snippet = ensureFound(await snippetRepo.findOneBy({ id }), 'Snippet')

    // Non-admins can only delete their own snippets
    if (!isAdmin(user.role) && snippet.authorId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    await snippetRepo.remove(snippet)

    return {
        code: 200,
        message: 'Snippet deleted successfully',
    }
})
