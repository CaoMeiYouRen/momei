import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { requireAdminOrAuthor } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const id = getRouterParam(event, 'id')

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

    await repo.remove(snippet)

    return {
        code: 200,
        message: 'Snippet deleted successfully',
    }
})
