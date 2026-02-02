/**
 * 邮件国际化管理器
 * 负责加载、管理和提供邮件的多语言支持
 */
import logger from '../logger'
import {
    EMAIL_SUPPORTED_LOCALES,
    DEFAULT_EMAIL_LOCALE,
    isValidEmailLocale,
    resolveEmailLocale,
    type SupportedEmailLocale,
    type EmailLocaleType,
} from './locales'
import type { emailLocalesZhCN } from './locales/zh-CN'

type EmailLocaleConfig = typeof emailLocalesZhCN

interface EmailI18nOptions {
    defaultLocale?: SupportedEmailLocale
}

/**
 * 邮件国际化管理器类
 */
export class EmailI18nManager {
    private defaultLocale: SupportedEmailLocale
    private localeCache: Map<SupportedEmailLocale, EmailLocaleConfig>

    constructor(options?: EmailI18nOptions) {
        this.defaultLocale = options?.defaultLocale || DEFAULT_EMAIL_LOCALE
        this.localeCache = new Map()
    }

    /**
     * 加载指定语言的邮件配置
     */
    private loadLocale(locale: SupportedEmailLocale): EmailLocaleConfig {
        if (!this.localeCache.has(locale)) {
            const config = EMAIL_SUPPORTED_LOCALES[locale]
            if (!config) {
                logger.warn(`Email locale '${locale}' not found, using default '${this.defaultLocale}'`)
                return EMAIL_SUPPORTED_LOCALES[this.defaultLocale]
            }
            this.localeCache.set(locale, config)
        }
        return this.localeCache.get(locale)!
    }

    /**
     * 获取指定邮件类型的文本配置
     * @param emailType - 邮件类型
     * @param locale - 语言代码，如果不支持则降级到默认语言
     */
    getText<T extends EmailLocaleType>(
        emailType: T,
        locale?: string,
    ): EmailLocaleConfig[T] | null {
        const resolvedLocale = resolveEmailLocale(locale)
        const config = this.loadLocale(resolvedLocale)
        const result = config[emailType]
        return result ? (result as EmailLocaleConfig[T]) : null
    }

    /**
     * 获取支持的语言列表
     */
    getSupportedLocales(): SupportedEmailLocale[] {
        return Object.keys(EMAIL_SUPPORTED_LOCALES) as SupportedEmailLocale[]
    }

    /**
     * 检查是否支持某个语言
     */
    isLocaleSupported(locale: unknown): locale is SupportedEmailLocale {
        return isValidEmailLocale(locale)
    }

    /**
     * 替换文本中的参数
     * @param text - 包含 {paramName} 占位符的文本
     * @param params - 参数对象
     */
    replaceParameters(text: string, params: Record<string, string | number>): string {
        let result = text
        for (const [key, value] of Object.entries(params)) {
            const placeholder = new RegExp(`\\{${key}\\}`, 'g')
            result = result.replace(placeholder, String(value))
        }
        return result
    }

    /**
     * 获取指定邮件类型的所有多语言文本
     */
    getMultiLocaleText<T extends EmailLocaleType>(emailType: T): Record<SupportedEmailLocale, EmailLocaleConfig[T]> {
        const result: Record<SupportedEmailLocale, EmailLocaleConfig[T]> = {} as any
        for (const locale of this.getSupportedLocales()) {
            const config = this.loadLocale(locale)
            result[locale] = config[emailType] as EmailLocaleConfig[T]
        }
        return result
    }
}

// 创建全局邮件国际化管理器实例
export const emailI18n = new EmailI18nManager()

// 重新导出必需的类型和常量，供 index.ts 使用
export { DEFAULT_EMAIL_LOCALE, EMAIL_SUPPORTED_LOCALES } from './locales'
export type { SupportedEmailLocale } from './locales'

