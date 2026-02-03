import { isSystemInstalled, saveSiteConfig } from '~/server/services/installation'
import { siteConfigSchema } from '~/utils/schemas/install'

/**
 * 设置站点配置
 * POST /api/install/setup-site
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
    const result = siteConfigSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid site configuration',
            data: result.error.issues,
        })
    }

    try {
        // 保存站点配置
        await saveSiteConfig(result.data)

        return {
            code: 200,
            message: 'Site configuration saved successfully',
            data: {
                success: true,
            },
        }
    } catch (error: any) {
        logger.error('Failed to save site configuration:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to save site configuration',
        })
    }
})
