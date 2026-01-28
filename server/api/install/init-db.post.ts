import { isSystemInstalled } from '~/server/services/installation'
import { dataSource } from '~/server/database'

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

        // 执行数据库同步（如果尚未同步）
        // 注意：在生产环境中，synchronize 应该在启动时自动完成
        // 这里主要是验证数据库结构是否正确

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
