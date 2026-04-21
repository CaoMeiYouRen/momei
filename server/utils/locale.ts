import { type H3Event, parseCookies, getHeader, setCookie, getQuery } from 'h3'
import type { AppLocaleCode } from '@/i18n/config/locale-registry'
import {
    AUTH_BOUNDARY_LOCALES,
    AUTH_DEFAULT_LOCALE,
    AUTH_FALLBACK_LOCALE,
    type AuthBoundaryLocale,
    type BetterAuthPluginLocale,
    AUTH_PLUGIN_DEFAULT_LOCALE,
    AUTH_PLUGIN_FALLBACK_LOCALE,
} from '@/utils/shared/locale'

export {
    AUTH_BOUNDARY_LOCALES,
    AUTH_DEFAULT_LOCALE,
    AUTH_FALLBACK_LOCALE,
    type AuthBoundaryLocale,
    type BetterAuthPluginLocale,
    AUTH_PLUGIN_DEFAULT_LOCALE,
    AUTH_PLUGIN_FALLBACK_LOCALE,
}

const AUTH_TO_APP_LOCALE_MAP: Partial<Record<AuthBoundaryLocale, AppLocaleCode>> = {
    'zh-Hans': 'zh-CN',
    'zh-Hant': 'zh-TW',
    'en-US': 'en-US',
    'ko-KR': 'ko-KR',
    // better-auth-localization 的 default 在项目内部统一折叠到英语默认 locale，
    // 避免 default 继续扩散到业务层、SEO 或 locale 目录事实源。
    default: 'en-US',
}

/**
 * 将认证本地化边界的语言代码映射为项目内部使用的 AppLocaleCode。
 * 例如：zh-Hans -> zh-CN, zh-Hant -> zh-TW, default -> en-US。
 */
export function mapAuthLocaleToAppLocale(locale: string): string {
    return AUTH_TO_APP_LOCALE_MAP[locale as AuthBoundaryLocale] || locale
}

// 认证边界只接受一小组 Better Auth locale，但浏览器、Cookie 和第三方回调
// 可能带来大量别名；这些映射统一在 normalizeLocale 入口收敛。
const LOCALE_MAPPING: Record<string, AuthBoundaryLocale> = {
    // 中文变体映射
    zh: 'zh-Hans',
    'zh-cn': 'zh-Hans',
    'zh-sg': 'zh-Hans',
    'zh-tw': 'zh-Hant',
    'zh-hk': 'zh-Hant',
    'zh-mo': 'zh-Hant',

    // 英语变体映射
    en: 'en-US',
    'en-us': 'en-US',
    'en-gb': 'en-US',
    'en-ca': 'en-US',
    'en-au': 'en-US',
    'en-nz': 'en-US',
    'en-za': 'en-US',

    // 葡萄牙语变体映射
    pt: 'pt-PT',
    'pt-pt': 'pt-PT',
    'pt-br': 'pt-BR',

    // 西班牙语变体映射
    es: 'es-ES',
    'es-es': 'es-ES',
    'es-mx': 'es-ES',
    'es-ar': 'es-ES',
    'es-co': 'es-ES',
    'es-cl': 'es-ES',

    // 法语变体映射
    fr: 'fr-FR',
    'fr-fr': 'fr-FR',
    'fr-ca': 'fr-FR',
    'fr-be': 'fr-FR',
    'fr-ch': 'fr-FR',

    // 德语变体映射
    de: 'de-DE',
    'de-de': 'de-DE',
    'de-at': 'de-DE',
    'de-ch': 'de-DE',

    // 其他语言映射
    ja: 'ja-JP',
    'ja-jp': 'ja-JP',
    ko: 'ko-KR',
    'ko-kr': 'ko-KR',
    ru: 'ru-RU',
    'ru-ru': 'ru-RU',
    it: 'it-IT',
    'it-it': 'it-IT',
    nl: 'nl-NL',
    'nl-nl': 'nl-NL',
    sv: 'sv-SE',
    'sv-se': 'sv-SE',
    da: 'da-DK',
    'da-dk': 'da-DK',
    pl: 'pl-PL',
    'pl-pl': 'pl-PL',
    tr: 'tr-TR',
    'tr-tr': 'tr-TR',
    ar: 'ar-SA',
    'ar-sa': 'ar-SA',
    hi: 'hi-HI',
    'hi-hi': 'hi-HI',

    // 不支持的语言映射到最接近的语言或默认语言
    no: 'da-DK', // 挪威语映射到丹麦语
    'no-no': 'da-DK',
    fi: 'sv-SE', // 芬兰语映射到瑞典语
    'fi-fi': 'sv-SE',
    th: 'en-US', // 泰语使用英语
    'th-TH': 'en-US',
    vi: 'en-US', // 越南语使用英语
    'vi-VN': 'en-US',
}

/**
 * 将浏览器、Cookie、Header 或第三方回调带来的 locale 别名归一化到认证边界支持集。
 * 未命中映射时会按语言前缀兜底，最终回退到认证默认语言。
 */
export function normalizeLocale(locale: string): AuthBoundaryLocale {
    const cleanLocale = locale.trim().toLowerCase()

    const directMatch = AUTH_BOUNDARY_LOCALES.find(
        (supportedLocale) => supportedLocale.toLowerCase() === cleanLocale,
    )
    if (directMatch) {
        return directMatch
    }

    // 先试原始值再试 cleanLocale，兼容历史映射表里的大小写遗留，
    // 也兼容浏览器 / 第三方请求头传来的非标准大小写变体。
    const mappedLocale = LOCALE_MAPPING[locale] || LOCALE_MAPPING[cleanLocale]
    if (mappedLocale) {
        return mappedLocale
    }

    const languagePrefix = cleanLocale.split('-')[0]
    const prefixMatch = AUTH_BOUNDARY_LOCALES.find(
        (supportedLocale) => supportedLocale.toLowerCase().startsWith(`${languagePrefix}-`)
            || supportedLocale.toLowerCase() === languagePrefix,
    )
    if (prefixMatch) {
        return prefixMatch
    }

    return AUTH_DEFAULT_LOCALE
}

/**
 * 从 Accept-Language 头部解析语言偏好
 * @param acceptLanguage Accept-Language 头部值
 * @returns 按优先级排序的语言列表
 */
export function parseAcceptLanguage(acceptLanguage: string): AuthBoundaryLocale[] {
    if (!acceptLanguage) {
        return [AUTH_DEFAULT_LOCALE]
    }

    // 解析 Accept-Language 头部
    const languages = acceptLanguage
        .split(',')
        .map((lang) => {
            const parts = lang.trim().split(';q=')
            const locale = parts[0]
            const qValue = parts[1]
            return {
                locale: locale ? locale.trim() : '',
                q: qValue ? parseFloat(qValue) : 1.0,
            }
        })
        .sort((a, b) => b.q - a.q) // 按质量值降序排序
        .map(({ locale }) => normalizeLocale(locale))

    // 去重并确保至少有默认语言
    const uniqueLanguages = [...new Set(languages)]
    if (!uniqueLanguages.includes(AUTH_DEFAULT_LOCALE)) {
        uniqueLanguages.push(AUTH_DEFAULT_LOCALE)
    }

    return uniqueLanguages
}

/**
 * 从 URL 查询参数获取语言
 * @param event H3Event 对象
 * @returns 用户设置的语言或 null
 */
export function getLocaleFromQuery(event: H3Event): AuthBoundaryLocale | null {
    try {
        const query = getQuery(event)
        const locale = (query.locale || query.lang || query.language) as string

        if (locale && AUTH_BOUNDARY_LOCALES.includes(locale as AuthBoundaryLocale)) {
            return locale as AuthBoundaryLocale
        }

        if (locale) {
            return normalizeLocale(locale)
        }

        return null
    } catch (error) {
        console.warn('Error parsing locale from query:', error)
        return null
    }
}

/**
 * 从 Cookie 获取用户设置的语言
 * @param event H3Event 对象
 * @returns 用户设置的语言或 null
 */
export function getLocaleFromCookie(event: H3Event): AuthBoundaryLocale | null {
    try {
        const cookies = parseCookies(event)
        const locale = cookies.locale || cookies.language || cookies.lang

        if (locale && AUTH_BOUNDARY_LOCALES.includes(locale as AuthBoundaryLocale)) {
            return locale as AuthBoundaryLocale
        }

        if (locale) {
            return normalizeLocale(locale)
        }

        return null
    } catch (error) {
        console.warn('Error parsing locale from cookie:', error)
        return null
    }
}

/**
 * 从请求头获取语言偏好
 * @param event H3Event 对象
 * @returns 首选语言
 */
export function getLocaleFromHeaders(event: H3Event): AuthBoundaryLocale {
    try {
        // 检查自定义头部
        const customLocale = getHeader(event, 'x-locale')
            || getHeader(event, 'x-language')
            || getHeader(event, 'x-lang')

        if (customLocale) {
            return normalizeLocale(customLocale)
        }

        // 解析 Accept-Language 头部
        const acceptLanguage = getHeader(event, 'accept-language')
        if (acceptLanguage) {
            const languages = parseAcceptLanguage(acceptLanguage)
            return languages[0] || AUTH_DEFAULT_LOCALE
        }

        return AUTH_DEFAULT_LOCALE
    } catch (error) {
        console.warn('Error getting locale from headers:', error)
        return AUTH_DEFAULT_LOCALE
    }
}

/**
 * 检测用户语言偏好
 * 优先级：查询参数 > Cookie > 自定义头部 > Accept-Language > 默认语言
 * @param event H3Event 对象
 * @param options 配置选项
 * @returns 检测到的语言
 */
export function detectRequestAuthLocale(
    event: H3Event,
    options: { includeQuery?: boolean } = { includeQuery: true },
): AuthBoundaryLocale {
    // 查询参数属于“显式覆盖”入口，默认只在需要支持 URL 临时覆写时启用。
    // 某些内部调用可以传 includeQuery=false，避免被 URL 参数劫持默认语言决策。
    if (options.includeQuery) {
        const queryLocale = getLocaleFromQuery(event)
        if (queryLocale) {
            return queryLocale
        }
    }

    // 1. 优先从 Cookie 获取用户明确设置的语言
    const cookieLocale = getLocaleFromCookie(event)
    if (cookieLocale) {
        return cookieLocale
    }

    // 2. 从请求头获取语言偏好
    return getLocaleFromHeaders(event)
}

/**
 * 设置用户语言偏好到 Cookie
 * @param event H3Event 对象
 * @param locale 要设置的语言
 * @param options Cookie 选项
 */
export function setLocaleCookie(
    event: H3Event,
    locale: AuthBoundaryLocale,
    options: {
        maxAge?: number
        domain?: string
        secure?: boolean
        sameSite?: 'strict' | 'lax' | 'none'
    } = {},
) {
    try {
        const cookieOptions = {
            httpOnly: false, // 允许客户端访问，用于前端语言切换
            secure: options.secure ?? process.env.NODE_ENV === 'production',
            sameSite: options.sameSite ?? 'lax',
            maxAge: options.maxAge ?? 365 * 24 * 60 * 60, // 默认1年
            ...options,
        }

        setCookie(event, 'locale', locale, cookieOptions)
    } catch (error) {
        console.warn('Error setting locale cookie:', error)
    }
}

/**
 * 获取认证层应使用的语言（供 better-auth localization 插件消费）
 * @param request Request 对象
 * @returns 用户语言
 */
export function getAuthLocaleFromRequest(request: Request): AuthBoundaryLocale {
    try {
        // better-auth 的 request 场景没有 H3Event，但认证插件与业务请求必须共享
        // 同一套 locale 优先级链，否则登录页与普通 API 会出现语言决策分叉。
        // 从 URL 查询参数获取语言
        const url = new URL(request.url)
        const urlLocale = url.searchParams.get('locale')
            || url.searchParams.get('lang')
            || url.searchParams.get('language')

        if (urlLocale && AUTH_BOUNDARY_LOCALES.includes(urlLocale as AuthBoundaryLocale)) {
            return urlLocale as AuthBoundaryLocale
        }

        if (urlLocale) {
            return normalizeLocale(urlLocale)
        }

        // 从 Cookie 获取语言偏好
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
            const cookies = cookieHeader
                .split(';')
                .map((cookie) => cookie.trim().split('='))
                .reduce((acc, [key, value]) => {
                    if (key && value) {
                        acc[key] = decodeURIComponent(value)
                    }
                    return acc
                }, {} as Record<string, string>)

            const cookieLocale = cookies.locale || cookies.language || cookies.lang
            if (cookieLocale && AUTH_BOUNDARY_LOCALES.includes(cookieLocale as AuthBoundaryLocale)) {
                return cookieLocale as AuthBoundaryLocale
            }

            if (cookieLocale) {
                return normalizeLocale(cookieLocale)
            }
        }

        // 从自定义头部获取语言
        const customLocale = request.headers.get('x-locale')
            || request.headers.get('x-language')
            || request.headers.get('x-lang')

        if (customLocale) {
            return normalizeLocale(customLocale)
        }

        // 从 Accept-Language 头部获取语言偏好
        const acceptLanguage = request.headers.get('accept-language')
        if (acceptLanguage) {
            const languages = parseAcceptLanguage(acceptLanguage)
            return languages[0] || AUTH_DEFAULT_LOCALE
        }

        return AUTH_DEFAULT_LOCALE
    } catch (error) {
        console.warn('Error getting user locale:', error)
        return AUTH_DEFAULT_LOCALE
    }
}
