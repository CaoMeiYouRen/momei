import { checkUploadLimits, handleFileUploads, resolveUploadPrefix, UploadType } from '@/server/services/upload'
import { requireAuth } from '@/server/utils/permission'
import { uploadQuerySchema } from '@/utils/schemas/upload'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const { user } = session
    const { type, prefix: customPrefix } = await getValidatedQuery(event, (query) => uploadQuerySchema.parse(query))
    let resolvedPrefix = resolveUploadPrefix(type as UploadType)

    if (customPrefix) {
        resolvedPrefix = resolveUploadPrefix(type as UploadType, customPrefix)
    }

    // 1. 检查上传限制
    await checkUploadLimits(user.id)

    // 2. 执行上传
    const uploadedFiles = await handleFileUploads(event, {
        prefix: resolvedPrefix,
        maxFiles: 10,
        type: type as UploadType,
    })

    return {
        code: 200,
        data: uploadedFiles,
    }
})
