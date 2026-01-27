import { z } from 'zod'
import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { AIService } from '@/server/services/ai'

const aggregateSchema = z.object({
    ids: z.array(z.string()).min(1),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const body = await readBody(event)
    const { ids, language } = aggregateSchema.parse(body)

    const repo = dataSource.getRepository(Snippet)
    const snippets = await repo.find({
        where: {
            id: In(ids),
            author: { id: session.user.id },
        },
    })

    if (snippets.length === 0) {
        throw createError({
            statusCode: 404,
            statusMessage: 'No snippets found',
        })
    }

    const contents = snippets.map((s) => s.content)
    const scaffold = await AIService.generateScaffold({
        snippets: contents,
        language,
    }, session.user.id)

    return {
        code: 200,
        message: 'Scaffold generated successfully',
        data: {
            scaffold,
            snippetIds: snippets.map((s) => s.id),
        },
    }
})
