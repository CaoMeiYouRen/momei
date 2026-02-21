import { AsyncLocalStorage } from 'node:async_hooks'
import { toProjectLocale, DEFAULT_LOCALE } from './locale'

// 定义全局存储，保存当前请求转换后的标准区域代码 (如 zh-CN)
export const i18nStorage = new AsyncLocalStorage<string>()

// 缓存加载的翻译消息，避免重复读取（对于静态 JSON 也可以直接用 import）
const localeCache = new Map<string, Record<string, any>>()

/**
 * 加载并获取指定语言的消息集
 */
export async function loadLocaleMessages(locale: string): Promise<Record<string, any>> {
    const projectLocale = toProjectLocale(locale)
    if (localeCache.has(projectLocale)) {
        return localeCache.get(projectLocale)!
    }

    try {
        // 在 Nitro 中可以直接 import JSON
        const messages = await import(`../../i18n/locales/${projectLocale}.json`)
        const data = messages.default || messages
        localeCache.set(projectLocale, data)
        return data
    } catch (error) {
        console.warn(`Failed to load locale messages for: ${projectLocale}`, error)
        // 回退加载默认语言
        if (projectLocale !== toProjectLocale(DEFAULT_LOCALE)) {
            return loadLocaleMessages(DEFAULT_LOCALE)
        }
        return {}
    }
}

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: any, path: string): string | null {
    if (!obj || !path) { return null }
    return path.split('.').reduce((current, key) => {
        return current?.[key]
    }, obj)
}

/**
 * 后端翻译函数 (t)
 * 支持异步获取当前请求上下文中的 locale，并根据嵌套路径获取映射值
 */
export async function t(key: string, params?: Record<string, any>): Promise<string> {
    const locale = i18nStorage.getStore() || toProjectLocale(DEFAULT_LOCALE)
    const messages = await loadLocaleMessages(locale)

    let message = getNestedValue(messages, key) || key

    // 格式化参数，例如 "Hello {{name}}" 用 { name: 'World' } 替换为 "Hello World"
    if (params && typeof message === 'string') {
        Object.entries(params).forEach(([param, value]) => {
            message = (message).replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), String(value))
        })
    }

    return message
}

/**
 * 获取当前 locale
 */
export function getLocale(): string {
    return i18nStorage.getStore() || toProjectLocale(DEFAULT_LOCALE)
}
