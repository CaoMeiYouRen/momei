import { auth } from '@/lib/auth'
import { checkUploadLimits, handleFileUploads } from '@/server/services/upload'
import { requireAuth } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const { user } = session

    // 1. 检查上传限制
    await checkUploadLimits(user.id)

    // 2. 执行上传 (仅允许 1 个文件，且必须是图片)
    const uploadedFiles = await handleFileUploads(event, {
        prefix: `avatars/${user.id}/`,
        maxFiles: 1,
        mustBeImage: true,
    })

    const url = uploadedFiles[0]!.url

    // 3. 更新用户头像
    await auth.api.updateUser({
        headers: event.headers,
        body: {
            image: url,
        },
    })

    return {
        code: 200,
        data: {
            url,
        },
    }
})
