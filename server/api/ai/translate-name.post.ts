import { z } from 'zod'
import { auth } from '@/lib/auth'
import { AIService } from '@/server/services/ai'
import { isAdmin, isAuthor } from '@/utils/shared/roles'

const translateNameSchema = z.object({
    name: z.string().min(1).max(100),
    targetLanguage: z.string().min(2).max(10),
})

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (
        !session
        || (!isAdmin(session.user.role) && !isAuthor(session.user.role))
    ) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

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
