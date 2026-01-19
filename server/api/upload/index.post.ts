import { auth } from '@/lib/auth'
import { checkUploadLimits, handleFileUploads } from '@/server/services/upload'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // 1. 检查上传限制
    await checkUploadLimits(session.user.id)

    // 2. 执行上传
    const uploadedFiles = await handleFileUploads(event, {
        prefix: 'file/',
        maxFiles: 10,
        mustBeImage: true,
    })

    return {
        code: 200,
        data: uploadedFiles,
    }
})
