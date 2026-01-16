import { z } from 'zod'
import { AIService } from '@/server/services/ai'

const suggestSlugFromNameSchema = z.object({
    name: z.string().min(1).max(100),
})

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const result = suggestSlugFromNameSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: result.error.format(),
        })
    }

    const { name } = result.data

    try {
        const slug = await AIService.suggestSlugFromName(name)
        return {
            code: 200,
            data: slug,
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
