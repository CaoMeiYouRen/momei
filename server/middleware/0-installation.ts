import { isSystemInstalled } from '~/server/services/installation'
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

    try {
        // 检查系统是否已安装
        const installed = await isSystemInstalled()

        // 检查当前是否在访问安装页面或安装 API
        const isInstallationPage = !!pathname.match(/^(\/(zh-CN|en-US))?\/installation(\/|$)/)
        const isInstallationApi = pathname.startsWith('/api/install')

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
            return
        }

        // 如果未安装，但当前就在访问安装页面或 API，直接放行
        if (isInstallationPage || isInstallationApi) {
            return
        }

        // 如果未安装且访问其他路径
        // 如果是 API 请求，返回 503 错误
        // 注意：排除 auth 和 theme 相关的 API，允许它们返回 401/404 而不是 503，防止前端挂掉
        if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth') && pathname !== '/api/settings/theme') {
            throw createError({
                statusCode: 503,
                statusMessage: 'System not installed. Please complete the installation first.',
            })
        }

        // 如果是页面请求，重定向到安装页面
        if (!pathname.startsWith('/api')) {
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
            // 同样排除一些基础 API，允许它们报错或返回空，而不是直接 503
            if (pathname.startsWith('/api/auth') || pathname === '/api/settings/theme') {
                return
            }

            throw createError({
                statusCode: 503,
                statusMessage: 'System initialization failed. Please check your configuration.',
            })
        }

        return sendRedirect(event, '/installation', 302)
    }
})
