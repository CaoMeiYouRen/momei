import { isSystemInstalled, syncSettingsFromEnv } from '~/server/services/installation'
import { dataSource } from '~/server/database'
import logger from '~/server/utils/logger'

/**
 * 初始化数据库
 * POST /api/install/init-db
 */
export default defineEventHandler(async () => {
    // 检查是否已安装
    const installed = await isSystemInstalled()
    if (installed) {
        throw createError({
            statusCode: 403,
            statusMessage: 'System already installed',
        })
    }

    try {
        // 检查数据库连接
        if (!dataSource || !dataSource.isInitialized) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Database not initialized',
            })
        }

        // 从环境变量同步配置
        await syncSettingsFromEnv()

        return {
            code: 200,
            message: 'Database initialized successfully',
            data: {
                success: true,
            },
        }
    } catch (error: any) {
        logger.error('Database initialization failed:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Database initialization failed',
        })
    }
})
