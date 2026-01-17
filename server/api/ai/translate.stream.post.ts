import { z } from 'zod'
import { auth } from '@/lib/auth'
import { AIService } from '@/server/services/ai'
import { isAdmin, isAuthor } from '@/utils/shared/roles'

const translateSchema = z.object({
    content: z.string().min(1),
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
    const result = translateSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: z.treeifyError(result.error),
        })
    }

    const { content, targetLanguage } = result.data

    // 设置响应头以支持 SSE
    setResponseHeader(event, 'Content-Type', 'text/event-stream')
    setResponseHeader(event, 'Cache-Control', 'no-cache')
    setResponseHeader(event, 'Connection', 'keep-alive')

    const response = event.node.res

    try {
        const stream = AIService.translateStream(
            content,
            targetLanguage,
            session.user.id,
        )

        for await (const chunk of stream) {
            response.write(`data: ${JSON.stringify(chunk)}\n\n`)
            // 确保数据发送到客户端
            if ((response as any).flush) {
                (response as any).flush()
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
