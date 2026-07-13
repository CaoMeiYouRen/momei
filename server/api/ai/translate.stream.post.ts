import { isServerlessEnvironment } from '@/server/utils/env'
import { AI_TEXT_DIRECT_RETURN_MAX_CHARS } from '@/utils/shared/env'
import { parseTranslateBody, TextService } from './_translate-shared'

interface SseWritableResponse {
    write: (chunk: string) => unknown
    end: () => void
    flush?: () => void
}

export default defineEventHandler(async (event) => {
    const { content, session, targetLanguage, translationOptions } = await parseTranslateBody(event)

    if (isServerlessEnvironment() && content.length >= AI_TEXT_DIRECT_RETURN_MAX_CHARS) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Long text streaming is unavailable in serverless deployment',
            data: {
                code: 'TRANSLATION_STREAM_TASK_FALLBACK',
                fallbackMode: 'task',
                directReturnMaxChars: AI_TEXT_DIRECT_RETURN_MAX_CHARS,
            },
        })
    }

    // 设置响应头以支持 SSE
    setResponseHeader(event, 'Content-Type', 'text/event-stream')
    setResponseHeader(event, 'Cache-Control', 'no-cache')
    setResponseHeader(event, 'Connection', 'keep-alive')

    const response = event.node?.res as SseWritableResponse | undefined
    if (!response) {
        throw createError({
            statusCode: 500,
            statusMessage: 'SSE response is unavailable',
        })
    }

    try {
        const stream = translationOptions
            ? TextService.translateStream(
                content,
                targetLanguage,
                session.user.id,
                translationOptions,
            )
            : TextService.translateStream(
                content,
                targetLanguage,
                session.user.id,
            )

        for await (const chunk of stream) {
            response.write(`data: ${JSON.stringify(chunk)}\n\n`)
            // 确保数据发送到客户端
            if (response.flush) {
                response.flush()
            }
        }

        response.write('event: end\ndata: {}\n\n')
    } catch (error: any) {
        const errorData = {
            statusCode: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
        }
        response.write(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`)
    } finally {
        response.end()
    }
})
