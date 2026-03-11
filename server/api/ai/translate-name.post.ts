import { z } from 'zod'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const translateNameSchema = z.union([
    z.object({
        name: z.string().min(1).max(100),
        targetLanguage: z.string().min(2).max(10),
    }),
    z.object({
        names: z.array(z.string().min(1).max(100)).min(1).max(50),
        targetLanguage: z.string().min(2).max(10),
    }),
])

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

    const { targetLanguage } = result.data

    try {
        const translatedName = 'names' in result.data
            ? await TextService.translateNames(
                result.data.names,
                targetLanguage,
                session.user.id,
            )
            : await TextService.translateName(
                result.data.name,
                targetLanguage,
                session.user.id,
            )
        return {
            code: 200,
            data: translatedName,
        }
    } catch (error: any) {
        if (error?.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
