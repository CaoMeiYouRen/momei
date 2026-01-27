import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { assignDefined } from '@/server/utils/object'

import { SnippetStatus } from '@/types/snippet'

const updateSnippetSchema = z.object({
    content: z.string().min(1).optional(),
    status: z.enum(SnippetStatus).optional(),
    media: z.array(z.string()).nullable().optional(),
    metadata: z.any().optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const id = getRouterParam(event, 'id') || ''
    const body = await readBody(event)
    const data = updateSnippetSchema.parse(body)

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
