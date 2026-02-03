import { getInstallationStatus } from '~/server/services/installation'
import logger from '~/server/utils/logger'

/**
 * 安装检查中间件
 * 如果系统未安装，则重定向到安装页面
 * 如果系统已安装，禁止进入安装页面
 * 优先级: 0 (最高优先级，在其他中间件之前执行)
 */
export default defineEventHandler(async (event) => {
    // 提取路径名
    const pathname = (event.path || '').split('?')[0] ?? ''

    // 跳过静态资源
    if (
        pathname.startsWith('/_nuxt')
        || pathname.startsWith('/uploads')
        || pathname.startsWith('/favicon')
        || pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp|avif)$/)
    ) {
        return
    }

    const isInstallationPage = !!pathname.match(/^(\/(zh-CN|en-US))?\/installation(\/|$)/)
    const isInstallationApi = pathname.startsWith('/api/install')

    try {
        // 检查系统安装状态
        const status = await getInstallationStatus()
        const installed = status.installed

        if (installed) {
            // 如果系统已安装，却访问安装页面，重定向到首页
            if (isInstallationPage) {
                return sendRedirect(event, '/', 302)
            }
            // 如果系统已安装，且试图调用安装 API（状态查询除外），返回已经安装的提示
            if (isInstallationApi && pathname !== '/api/install/status') {
                throw createError({
                    statusCode: 403,
                    statusMessage: 'System already installed.',
                })
            }

            // 特殊情况：系统已标记安装，但数据库连接失败
            // 对于非必要的 API 请求，我们可以放行（由各个 Handler 降级处理）
            // 但对于某些关键 API，我们可能需要在这里截断
            if (!status.databaseConnected && pathname.startsWith('/api')) {
                // 排除基础 API 和已通过降级处理的 API
                const bypassApis = [
                    '/api/auth',
                    '/api/settings/theme',
                    '/api/settings/public',
                ]
                const isBypass = bypassApis.some((api) => pathname.startsWith(api))

                if (!isBypass) {
                    throw createError({
                        statusCode: 503,
                        statusMessage: 'Database connection failed. Please check your database settings.',
                    })
                }
            }

            return
        }

        // 如果未安装，但当前就在访问安装页面或 API，直接放行
        if (isInstallationPage || isInstallationApi) {
            return
        }

        // 如果未安装且访问其他路径
        // 如果是 API 请求，返回 503 错误
        if (pathname.startsWith('/api')) {
            // 排除基础 API
            if (pathname.startsWith('/api/auth') || pathname === '/api/settings/theme') {
                return
            }

            throw createError({
                statusCode: 503,
                statusMessage: 'System not installed. Please complete the installation first.',
            })
        }

        // 页面请求重定向到安装页面
        return sendRedirect(event, '/installation', 302)
    } catch (error: any) {
        // 抛出已知的控制流错误
        if (error.statusCode === 403 || error.statusCode === 503) {
            throw error
        }

        // 记录未知错误
        logger.error('Installation check middleware error:', error)

        // 关键点：如果我们在安装页面或 API 发生了未知错误（如数据库连接失败），
        // 绝对不要进行重定向，否则可能导致死循环
        if (isInstallationPage || isInstallationApi) {
            return
        }

        // 其他页面请求在错误时尝试重定向到安装页
        if (!pathname.startsWith('/api')) {
            return sendRedirect(event, '/installation', 302)
        }
    }
})
