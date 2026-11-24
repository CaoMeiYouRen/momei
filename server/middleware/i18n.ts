import { defineEventHandler } from 'h3'
import { detectRequestAuthLocale, mapAuthLocaleToAppLocale } from '../utils/locale'
import { resolveAppLocaleCode } from '@/i18n/config/locale-registry'

/**
 * 请求级 i18n 上下文注入：把请求语言写入 `event.context.locale`。
 *
 * 当前仓库没有读取 `event.context.locale` 的调用方，页面语言由 `@nuxtjs/i18n`
 * 的请求侧检测驱动；这里的写入保留给显式读取该字段的中间件 / 路由。
 *
 * 注意：不要在这里用 `i18nStorage.run(locale, () => {})` 期望后续 handler 继承
 * AsyncLocalStorage 上下文——`run()` 只在回调作用域内生效，空回调返回即销毁，
 * 深层 helper 会回退默认语言。该限制与后续处置见
 * docs/design/governance/2026-11-24-i18n-als-locale-resolution.md。
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
})
