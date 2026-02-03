import { isSystemInstalled, saveExtraConfig } from '~/server/services/installation'
import { extraConfigSchema } from '~/utils/schemas/install'

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
