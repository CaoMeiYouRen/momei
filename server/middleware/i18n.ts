import { defineEventHandler } from 'h3'
import { detectRequestAuthLocale, mapAuthLocaleToAppLocale } from '../utils/locale'
import { i18nStorage } from '../utils/i18n'
import { resolveAppLocaleCode } from '@/i18n/config/locale-registry'

/**
 * 请求级 i18n 上下文注入。
 * 同时写入 event.context 与 AsyncLocalStorage，确保显式传参链路和深层工具链
 * 对“当前语言”读取的是同一份事实。
 */
export default defineEventHandler((event) => {
    // 这里只跳过内部构建产物与 favicon；其余请求仍维持统一 locale 上下文，
    // 避免把局部白名单分支误扩成整站多套解析口径。
    if (event.path?.startsWith('/_') || event.path?.includes('favicon.ico')) {
        return
    }

    const rawLocale = detectRequestAuthLocale(event)
    // 认证边界先映射到 AppLocaleCode，再交给 locale registry 做最终收敛，
    // 避免 zh-Hans / default 这类 auth locale 直接泄露到业务层。
    const appLocale = resolveAppLocaleCode(mapAuthLocaleToAppLocale(rawLocale))

    event.context.locale = appLocale

    // AsyncLocalStorage 让不显式接收 locale 参数的深层 helper 也能读取本次请求语境，
    // 并且不同请求间不会互相污染。
    return i18nStorage.run(appLocale, () => {
        // 继续执行后续 Handler
    })
})
