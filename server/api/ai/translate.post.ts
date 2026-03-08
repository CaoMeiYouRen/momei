import { z } from 'zod'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { AI_TEXT_DIRECT_RETURN_MAX_CHARS } from '@/utils/shared/env'
import { aiTranslateSchema } from '@/utils/schemas/ai'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const result = aiTranslateSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: z.treeifyError(result.error),
        })
    }

    const { content, targetLanguage } = result.data

    try {
        if (TextService.shouldUseAsyncTranslateTask(content)) {
            const task = await TextService.createTranslateTask(
                content,
                targetLanguage,
                session.user.id,
            )

            return {
                code: 200,
                data: {
                    mode: 'task',
                    taskId: task.id,
                    status: task.status,
                    directReturnMaxChars: AI_TEXT_DIRECT_RETURN_MAX_CHARS,
                },
            }
        }

        const translatedContent = await TextService.translate(
            content,
            targetLanguage,
            session.user.id,
        )
        return {
            code: 200,
            data: {
                mode: 'direct',
                content: translatedContent,
                directReturnMaxChars: AI_TEXT_DIRECT_RETURN_MAX_CHARS,
            },
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
