import { parseTranslateBody, TextService } from './_translate-shared'
import { AI_TEXT_DIRECT_RETURN_MAX_CHARS } from '@/utils/shared/env'

export default defineEventHandler(async (event) => {
    const { content, session, targetLanguage, translationOptions } = await parseTranslateBody(event)

    try {
        if (TextService.shouldUseAsyncTranslateTask(content)) {
            const task = translationOptions
                ? await TextService.createTranslateTask(
                    content,
                    targetLanguage,
                    session.user.id,
                    translationOptions,
                )
                : await TextService.createTranslateTask(
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

        const translatedContent = translationOptions
            ? await TextService.translate(
                content,
                targetLanguage,
                session.user.id,
                translationOptions,
            )
            : await TextService.translate(
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
