import { z } from 'zod'
import { isSystemInstalled, saveExtraConfig } from '~/server/services/installation'

/**
 * 可选配置 Schema
 */
const extraConfigSchema = z.object({
    // AI
    aiProvider: z.string().optional(),
    aiApiKey: z.string().optional(),
    aiModel: z.string().optional(),
    aiEndpoint: z.string().optional(),
    // Email
    emailHost: z.string().optional(),
    emailPort: z.number().optional(),
    emailUser: z.string().optional(),
    emailPass: z.string().optional(),
    emailFrom: z.string().optional(),
    // Storage
    storageType: z.string().optional(),
    localStorageDir: z.string().optional(),
    localStorageBaseUrl: z.string().optional(),
    s3Endpoint: z.string().optional(),
    s3Bucket: z.string().optional(),
    s3Region: z.string().optional(),
    s3AccessKey: z.string().optional(),
    s3SecretKey: z.string().optional(),
    s3BaseUrl: z.string().optional(),
    s3BucketPrefix: z.string().optional(),
    // Analytics
    baiduAnalytics: z.string().optional(),
    googleAnalytics: z.string().optional(),
    clarityAnalytics: z.string().optional(),
})

/**
 * 设置可选功能配置
 * POST /api/install/setup-extra
 */
export default defineEventHandler(async (event) => {
    // 检查是否已安装
    const installed = await isSystemInstalled()
    if (installed) {
        throw createError({
            statusCode: 403,
            statusMessage: 'System already installed',
        })
    }

    // 读取并验证请求体
    const body = await readBody(event)
    const result = extraConfigSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid extra configuration',
            data: result.error.issues,
        })
    }

    try {
        // 保存配置
        await saveExtraConfig(result.data)

        return {
            code: 200,
            message: 'Extra configuration saved successfully',
            data: {
                success: true,
            },
        }
    } catch (error: any) {
        logger.error('Failed to save extra configuration:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to save extra configuration',
        })
    }
})
