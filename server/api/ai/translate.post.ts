import { z } from 'zod'
import { AIService } from '@/server/services/ai'

const translateSchema = z.object({
    content: z.string().min(1),
    targetLanguage: z.string().min(2).max(10),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const result = translateSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: z.treeifyError(result.error),
        })
    }

    const { content, targetLanguage } = result.data

    try {
        const translatedContent = await AIService.translate(
            content,
            targetLanguage,
            session.user.id,
        )
        return {
            code: 200,
            data: translatedContent,
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
