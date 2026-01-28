import { isSystemInstalled } from '~/server/services/installation'
import logger from '~/server/utils/logger'

/**
 * 安装检查中间件
 * 如果系统未安装，则重定向到安装页面
 * 优先级: 0 (最高优先级，在其他中间件之前执行)
 */
export default defineEventHandler(async (event) => {
    // 跳过安装相关路径
    // 匹配 /installation, /zh-CN/installation, /en-US/installation 等，忽略查询参数
    const pathname = (event.path || '').split('?')[0] ?? ''
    if (pathname.startsWith('/api/install') || pathname.match(/^(\/(zh-CN|en-US))?\/installation(\/|$)/)) {
        return
    }

    // 跳过静态资源
    if (
        pathname.startsWith('/_nuxt')
        || pathname.startsWith('/uploads')
        || pathname.startsWith('/favicon')
        || pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp|avif)$/)
    ) {
        return
    }

    try {
        // 检查系统是否已安装
        const installed = await isSystemInstalled()

        if (!installed) {
            // 如果是 API 请求，返回 503 错误
            if (pathname.startsWith('/api')) {
                throw createError({
                    statusCode: 503,
                    statusMessage: 'System not installed. Please complete the installation first.',
                })
            }

            // 如果是页面请求，重定向到安装页面
            return sendRedirect(event, '/installation', 302)
        }
    } catch (error: any) {
        // 如果已经是一个 503 错误，直接抛出
        if (error.statusCode === 503) {
            throw error
        }

        // 如果检查失败（例如数据库连接失败），也重定向到安装页面
        logger.error('Installation check failed:', error)

        if (pathname.startsWith('/api')) {
            throw createError({
                statusCode: 503,
                statusMessage: 'System initialization failed. Please check your configuration.',
            })
        }

        return sendRedirect(event, '/installation', 302)
    }
})
