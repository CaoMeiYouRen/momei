import { AsyncLocalStorage } from 'node:async_hooks'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mapAuthLocaleToAppLocale, AUTH_DEFAULT_LOCALE } from './locale'
import { APP_DEFAULT_LOCALE, resolveAppLocaleCode } from '@/i18n/config/locale-registry'
import { getLocaleMessageFilePaths } from '@/i18n/config/locale-modules'

// 定义全局存储，保存当前请求解析后的 AppLocaleCode (如 zh-CN)
export const i18nStorage = new AsyncLocalStorage<string>()

// 缓存加载的翻译消息，避免重复读取
const localeCache = new Map<string, Record<string, any>>()

export function deepMergeMessages(
    target: Record<string, any>,
    source: Record<string, any>,
): Record<string, any> {
    Object.entries(source).forEach(([key, value]) => {
        if (key === '__proto__' || key === 'constructor') {
            return
        }

        const current = target[key]
        if (
            value
            && typeof value === 'object'
            && !Array.isArray(value)
            && current
            && typeof current === 'object'
            && !Array.isArray(current)
        ) {
            target[key] = deepMergeMessages(current, value as Record<string, any>)
            return
        }

        target[key] = value
    })

    return target
}

function cloneMessages(messages: Record<string, any>): Record<string, any> {
    return JSON.parse(JSON.stringify(messages)) as Record<string, any>
}

/**
 * 加载并获取指定语言的消息集
 */
export async function loadLocaleMessages(locale: string): Promise<Record<string, any>> {
    const resolvedLocale = resolveAppLocaleCode(mapAuthLocaleToAppLocale(locale))
    if (localeCache.has(resolvedLocale)) {
        return localeCache.get(resolvedLocale)!
    }

    try {
        const mergedMessages = resolvedLocale === APP_DEFAULT_LOCALE
            ? {}
            : cloneMessages(await loadLocaleMessages(APP_DEFAULT_LOCALE))

        for (const filePath of getLocaleMessageFilePaths(resolvedLocale)) {
            const absolutePath = join(process.cwd(), 'i18n', 'locales', filePath)
            if (!existsSync(absolutePath)) {
                continue
            }

            const moduleMessages = JSON.parse(readFileSync(absolutePath, 'utf8')) as Record<string, any>
            deepMergeMessages(mergedMessages, moduleMessages)
        }

        localeCache.set(resolvedLocale, mergedMessages)
        return mergedMessages
    } catch (error) {
        console.warn(`Failed to load locale messages for: ${resolvedLocale}`, error)
        // 回退加载默认语言
        if (resolvedLocale !== APP_DEFAULT_LOCALE) {
            return loadLocaleMessages(APP_DEFAULT_LOCALE)
        }
        return {}
    }
}

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: any, path: string): string | null {
    if (!obj || !path) {
        return null
    }
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * 后端翻译函数 (t)
 * 支持异步获取当前请求上下文中的 locale，并根据嵌套路径获取映射值
 */
export async function t(key: string, params?: Record<string, any>): Promise<string> {
    const locale = getLocale()
    const messages = await loadLocaleMessages(locale)

    let message = getNestedValue(messages, key) || key

    // 格式化参数，例如 "Hello {name}" 或 "Hello {{name}}" 用 { name: 'World' } 替换为 "Hello World"
    if (params && typeof message === 'string') {
        Object.entries(params).forEach(([param, value]) => {
            // 同时支持 {param} 和 {{param}} 形式
            const val = String(value)
            message = message
                .replace(new RegExp(`\\{${param}\\}`, 'g'), val)
                .replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), val)
        })
    }

    return message
}

/**
 * 获取当前 locale
 */
export function getLocale(): string {
    const locale = i18nStorage.getStore() || mapAuthLocaleToAppLocale(AUTH_DEFAULT_LOCALE)
    return resolveAppLocaleCode(locale)
}
