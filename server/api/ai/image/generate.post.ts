import { z } from 'zod'
import { ImageService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { aiGenerateImageSchema } from '@/utils/schemas/ai'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const result = aiGenerateImageSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: z.treeifyError(result.error),
        })
    }

    try {
        const task = await ImageService.generateImage(
            result.data,
            session.user.id,
        )
        return {
            code: 200,
            data: {
                taskId: task.id,
                status: task.status,
            },
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
