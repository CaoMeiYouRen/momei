import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { SnippetStatus } from '@/types/snippet'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { snippetUpdateSchema } from '@/utils/schemas/snippet'
import { getRequiredRouterParam } from '@/server/utils/router'
import { ensureFound } from '@/server/utils/response'
import { assignDefined } from '@/server/utils/object'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const id = getRequiredRouterParam(event, 'id')

    const snippetRepo = dataSource.getRepository(Snippet)
    const snippet = ensureFound(await snippetRepo.findOneBy({ id }), 'Snippet')

    // Non-admins can only update their own snippets
    if (!isAdmin(user.role) && snippet.authorId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Prevent reverting converted/archived snippets back to inbox
    const body = await readValidatedBody(event, (b) => snippetUpdateSchema.parse(b))
    if (snippet.status !== SnippetStatus.INBOX && body.status === SnippetStatus.INBOX) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot revert converted or archived snippet to inbox' })
    }

    assignDefined(snippet, body, [
        'content',
        'media',
        'audioUrl',
        'source',
        'status',
        'metadata',
    ])

    await snippetRepo.save(snippet)

    return {
        code: 200,
        data: snippet,
    }
})
