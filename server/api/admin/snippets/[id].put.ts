import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { assignDefined } from '@/server/utils/object'
import { snippetUpdateSchema } from '@/utils/schemas/snippet'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const id = getRouterParam(event, 'id') || ''
    const body = await readBody(event)
    const data = snippetUpdateSchema.parse(body)

    const repo = dataSource.getRepository(Snippet)
    const snippet = await repo.findOne({
        where: { id, author: { id: session.user.id } },
    })

    if (!snippet) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Snippet not found',
        })
    }

    assignDefined(snippet, data, ['content', 'status', 'media', 'metadata'])

    await repo.save(snippet)

    return {
        code: 200,
        message: 'Snippet updated successfully',
        data: snippet,
    }
})
