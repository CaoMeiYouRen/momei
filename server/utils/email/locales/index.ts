/**
 * 邮件国际化配置导出
 */
import { emailLocalesZhCN } from './zh-CN'
import { emailLocalesEnUS } from './en-US'

export type EmailLocaleType = keyof typeof emailLocalesZhCN

export const EMAIL_SUPPORTED_LOCALES = {
    'zh-CN': emailLocalesZhCN,
    'en-US': emailLocalesEnUS,
} as const

export const DEFAULT_EMAIL_LOCALE = 'zh-CN'

export type SupportedEmailLocale = keyof typeof EMAIL_SUPPORTED_LOCALES

export function isValidEmailLocale(locale: unknown): locale is SupportedEmailLocale {
    return typeof locale === 'string' && locale in EMAIL_SUPPORTED_LOCALES
}

export function resolveEmailLocale(locale?: string): SupportedEmailLocale {
    if (!locale || !isValidEmailLocale(locale)) {
        return DEFAULT_EMAIL_LOCALE
    }
    return locale
}
