import { checkUploadLimits, handleFileUploads } from '@/server/services/upload'
import { requireAuth } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const { user } = session

    // 1. 检查上传限制
    await checkUploadLimits(user.id)

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
