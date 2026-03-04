import { z } from 'zod'
import { ASRService } from '~/server/services/ai/asr'
import { requireAdminOrAuthor } from '~/server/utils/permission'
import type { ASRProvider } from '~/types/asr'

const RequestSchema = z.object({
    provider: z.enum(['siliconflow', 'volcengine']).optional(),
    language: z.string().optional(),
})

/**
 * 异步 ASR 转录 API
 *
 * 用于大文件或长时间转录场景
 * 返回任务 ID，前端可通过轮询或 SSE 追踪状态
 */
export default defineEventHandler(async (event) => {
    // 权限验证
    const session = await requireAdminOrAuthor(event)

    // 读取 multipart/form-data
    const formData = await readMultipartFormData(event)
    if (!formData) {
        throw createError({
            statusCode: 400,
            message: 'No form data provided',
        })
    }

    // 提取文件
    const fileField = formData.find((field) => field.name === 'file')
    if (!fileField?.data) {
        throw createError({
            statusCode: 400,
            message: 'No audio file provided',
        })
    }

    // 提取选项
    const providerField = formData.find((field) => field.name === 'provider')
    const languageField = formData.find((field) => field.name === 'language')

    // 验证选项
    const body = RequestSchema.parse({
        provider: providerField?.data?.toString(),
        language: languageField?.data?.toString(),
    })

    // 获取文件名和 MIME 类型
    const fileName = fileField.filename || 'recording.webm'
    const mimeType = fileField.type || 'audio/webm'

    // 创建异步任务
    const { taskId } = await ASRService.createAsyncTask({
        userId: session.user.id,
        audioBuffer: Buffer.from(fileField.data),
        fileName,
        mimeType,
        language: body.language,
        provider: body.provider as ASRProvider | undefined,
    })

    return {
        code: 200,
        data: {
            taskId,
            status: 'pending',
            message: 'ASR task created. Use taskId to check status.',
        },
    }
})
