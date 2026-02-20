import { z } from 'zod'
import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { TextService } from '@/server/services/ai'

const generateSchema = z.object({
    topic: z.string().optional(),
    snippetIds: z.array(z.string()).optional(),
    snippets: z.array(z.string()).optional(),
    template: z.enum(['blog', 'tutorial', 'note', 'report']).optional().default('blog'),
    sectionCount: z.number().min(3).max(8).optional().default(5),
    audience: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
    includeIntroConclusion: z.boolean().optional().default(true),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const body = await readBody(event)
    const {
        topic,
        snippetIds,
        snippets: rawSnippets,
        template,
        sectionCount,
        audience,
        includeIntroConclusion,
        language,
    } = generateSchema.parse(body)

    if (!topic && (!snippetIds || snippetIds.length === 0) && (!rawSnippets || rawSnippets.length === 0)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Topic, snippetIds or snippets must be provided',
        })
    }

    let contents: string[] = rawSnippets || []
    if (snippetIds && snippetIds.length > 0) {
        const repo = dataSource.getRepository(Snippet)
        const snippets = await repo.find({
            where: {
                id: In(snippetIds),
                author: { id: session.user.id },
            },
        })
        contents = snippets.map((s) => s.content)
    }

    const scaffold = await TextService.generateScaffold({
        topic,
        snippets: contents,
        template,
        sectionCount,
        audience,
        includeIntroConclusion,
        language,
    }, session.user.id)

    return {
        code: 200,
        message: 'Scaffold generated successfully',
        data: {
            scaffold,
            metadata: {
                topic,
                template,
                sectionCount,
                audience,
                includeIntroConclusion,
            },
        },
    }
})
