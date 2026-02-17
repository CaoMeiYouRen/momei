import { readMultipartFormData } from 'h3'
import { getASRProvider, ASRService } from '~/server/services/asr'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const formData = await readMultipartFormData(event)
    if (!formData) {
        throw createError({
            statusCode: 400,
            message: 'No form data provided',
        })
    }

    const audioFile = formData.find((f) => f.name === 'audioFile')
    if (!audioFile?.data) {
        throw createError({
            statusCode: 400,
            message: 'Audio file is required',
        })
    }

    const language = formData.find((f) => f.name === 'language')?.data.toString()
    const providerName = formData.find((f) => f.name === 'provider')?.data.toString() as 'siliconflow' | 'volcengine' | undefined
    const model = formData.find((f) => f.name === 'model')?.data.toString()

    // Default model if not provided
    const finalModel = model || (providerName === 'volcengine' ? '' : 'FunAudioLLM/SenseVoiceSmall')

    const provider = await getASRProvider(providerName)

    // Check quota (Pre-check)
    await ASRService.checkQuota(session.user.id, provider.name, 0)

    const result = await provider.transcribe({
        audioBuffer: audioFile.data,
        fileName: audioFile.filename || 'recording.webm',
        mimeType: audioFile.type || 'audio/webm',
        language,
        model: finalModel,
    })

    // Update quota and log
    await ASRService.updateQuotaAndLog({
        userId: session.user.id,
        provider: providerName || provider.name,
        mode: 'batch',
        duration: result.usage.audioSeconds,
        size: audioFile.data.length,
        textLength: result.text.length,
        language: result.language,
    })

    return result
})
