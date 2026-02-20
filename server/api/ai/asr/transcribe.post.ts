import { readMultipartFormData } from 'h3'
import { ASRService } from '~/server/services/ai/asr'
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
    const model = formData.find((f) => f.name === 'model')?.data.toString()

    return await ASRService.transcribe(audioFile.data, {
        language,
        model,
    }, session.user.id)
})
