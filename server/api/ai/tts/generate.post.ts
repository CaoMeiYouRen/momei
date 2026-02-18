import { TTSService } from '~/server/services/ai/tts'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const body = await readBody(event)
    const { text, voice, options } = body

    if (!text) {
        throw createError({ statusCode: 400, message: 'Text is required' })
    }

    try {
        // 使用 generateAndUploadSpeech 自动保存到 OSS
        const stream = await TTSService.generateAndUploadSpeech(text, voice, options, session.user.id)

        // 豆包 2.0 返回的是 mp3，其他提供者可能不同，通常为 mp3/opus
        // 这里尝试从选项或提供者中获取 format，默认为 mp3
        const format = options?.format || 'mp3'
        setResponseHeader(event, 'Content-Type', `audio/${format}`)

        // 如果是流式返回，确保禁用缓存
        setResponseHeader(event, 'Cache-Control', 'no-cache')
        setResponseHeader(event, 'Connection', 'keep-alive')

        return sendStream(event, stream)
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'TTS generation failed',
        })
    }
})
