import type { BuiltInLocales } from 'better-auth-localization'

/**
 * better-auth 内置支持的语言代码类型。
 * 注意：该类型只用于认证本地化边界，不代表项目内部 locale 主规范。
 */
export type BetterAuthLocale = BuiltInLocales | 'en-US'
export type BetterAuthPluginLocale = Exclude<BetterAuthLocale, 'en-US'>

/**
 * 认证本地化边界可识别的语言列表。
 * 项目内部业务逻辑、路由、翻译目录与 SEO 仍以 Locale Registry 中的 AppLocaleCode 为准。
 */
export const AUTH_BOUNDARY_LOCALES: readonly BetterAuthLocale[] = [
    'zh-Hans', // 简体中文
    'zh-Hant', // 繁体中文
    'en-US', // 英语
    'default', // 默认语言
    'pt-BR', // 巴西葡萄牙语
    'pt-PT', // 葡萄牙语
    'es-ES', // 西班牙语
    'fr-FR', // 法语
    'de-DE', // 德语
    'ja-JP', // 日语
    'ko-KR', // 韩语
    'ru-RU', // 俄语
    'ar-SA', // 阿拉伯语
    'hi-HI', // 印地语
    'it-IT', // 意大利语
    'nl-NL', // 荷兰语
    'sv-SE', // 瑞典语
    'da-DK', // 丹麦语
    'pl-PL', // 波兰语
    'tr-TR', // 土耳其语
] as const

export type AuthBoundaryLocale = typeof AUTH_BOUNDARY_LOCALES[number]

/**
 * better-auth 本地化边界的默认语言设置（简体中文脚本标识）。
 */
export const AUTH_DEFAULT_LOCALE: AuthBoundaryLocale = 'zh-Hans'
export const AUTH_FALLBACK_LOCALE: AuthBoundaryLocale = 'default'

/**
 * better-auth-localization 插件实际接受的 locale 值。
 * `en-US` 仅用于请求边界探测，传递给插件时需要折叠到 `default`。
 */
export const AUTH_PLUGIN_DEFAULT_LOCALE: BetterAuthPluginLocale = 'zh-Hans'
export const AUTH_PLUGIN_FALLBACK_LOCALE: BetterAuthPluginLocale = 'default'
