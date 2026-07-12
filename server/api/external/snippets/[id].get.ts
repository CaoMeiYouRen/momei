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
    const snippet = ensureFound(await snippetRepo.findOne({
        where: { id },
        relations: { author: true, post: true },
    }), 'Snippet')

    // Non-admins can only view their own snippets
    if (!isAdmin(user.role) && snippet.authorId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    return {
        code: 200,
        data: snippet,
    }
})
