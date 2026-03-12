import { z } from 'zod'
import { ImageService } from '@/server/services/ai'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { aiGenerateImageSchema } from '@/utils/schemas/ai'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const body = await readBody(event)
    const result = aiGenerateImageSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: z.treeifyError(result.error),
        })
    }

    const task = await ImageService.generateImage(result.data, user.id)

    return {
        code: 200,
        data: {
            taskId: task.id,
            status: task.status,
        },
    }
})
