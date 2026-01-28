import { isSystemInstalled, markSystemInstalled } from '~/server/services/installation'

/**
 * 完成安装
 * POST /api/install/finalize
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

    try {
        // 标记系统已安装
        await markSystemInstalled()

        logger.info('Installation completed successfully')

        return {
            code: 200,
            message: 'Installation completed successfully',
            data: {
                success: true,
                message: 'Please set MOMEI_INSTALLED=true in your environment variables to prevent reinstallation',
            },
        }
    } catch (error: any) {
        logger.error('Failed to finalize installation:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to finalize installation',
        })
    }
})
