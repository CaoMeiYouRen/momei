import { readMultipartFormData } from 'h3'
import { getASRProvider, ASRService } from '~/server/services/asr'
import { requireAuth } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)

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
    const providerName = (formData.find((f) => f.name === 'provider')?.data.toString() || 'siliconflow') as 'siliconflow' | 'volcengine'
    const model = formData.find((f) => f.name === 'model')?.data.toString()

    // Default model if not provided
    const finalModel = model || (providerName === 'siliconflow' ? 'funasr/paraformer-zh' : '')

    // Check quota (Pre-check)
    // For batch, we don't know the exact duration yet, but we can check if they have any remaining quota
    await ASRService.checkQuota(session.user.id, providerName, 0)

    const provider = await getASRProvider(providerName)
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
        provider: providerName,
        mode: 'batch',
        duration: result.usage.audioSeconds,
        size: audioFile.data.length,
        textLength: result.text.length,
        language: result.language,
    })

    return result
})
