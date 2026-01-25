import { checkUploadLimits, handleFileUploads, UploadType } from '@/server/services/upload'
import { requireAuth } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const { user } = session
    const query = getQuery(event)
    const type = (query.type as UploadType) || UploadType.IMAGE

    // 1. 检查上传限制
    await checkUploadLimits(user.id)

    // 2. 执行上传
    const uploadedFiles = await handleFileUploads(event, {
        prefix: type === UploadType.AUDIO ? 'audios/' : 'file/',
        maxFiles: 10,
        type,
    })

    return {
        code: 200,
        data: uploadedFiles,
    }
})
