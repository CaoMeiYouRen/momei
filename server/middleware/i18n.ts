import { defineEventHandler } from 'h3'
import { detectUserLocale, toProjectLocale } from '../utils/locale'
import { i18nStorage } from '../utils/i18n'

/**
 * 国际化中间件 (Request-level i18n Recognition)
 * 在请求处理周期内利用 AsyncLocalStorage 存储当前语言，便于深度追踪调用
 */
export default defineEventHandler((event) => {
    // 0. 特殊排除：非 API/Page 请求 (如静态资源) 一般不需要注入 (此处可选，也可全域监控)
    if (event.path?.startsWith('/_') || event.path?.includes('favicon.ico')) {
        return
    }

    // 1. 设置请求上下文中的语言标识
    const rawLocale = detectUserLocale(event)
    const projectLocale = toProjectLocale(rawLocale)

    // 保存到 H3 Event 上下文，供不需要 AsyncLocalStorage 的逻辑使用
    event.context.locale = projectLocale

    // 2. 利用 AsyncLocalStorage.run() 实现异步生命周期隔离
    // 该方法能让所有在此期间运行的子任务、工具方法等感知当前的 projectLocale
    return i18nStorage.run(projectLocale, () => {
        // 继续执行后续 Handler
    })
})
