import { z } from 'zod'
import { AIService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const translateNameSchema = z.object({
    name: z.string().min(1).max(100),
    targetLanguage: z.string().min(2).max(10),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const result = translateNameSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: z.treeifyError(result.error),
        })
    }

    const { name, targetLanguage } = result.data

    try {
        const translatedName = await AIService.translateName(
            name,
            targetLanguage,
            session.user.id,
        )
        return {
            code: 200,
            data: translatedName,
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
