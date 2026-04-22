import { resolveAppLocaleCode, type AppLocaleCode } from '../../i18n/config/locale-registry'
import zhCnComponents from '../../i18n/locales/zh-CN/components.json'
import enUsComponents from '../../i18n/locales/en-US/components.json'
import zhTwComponents from '../../i18n/locales/zh-TW/components.json'
import koKrComponents from '../../i18n/locales/ko-KR/components.json'
import jaJpComponents from '../../i18n/locales/ja-JP/components.json'
import { COPYRIGHT_LICENSES, type CopyrightType } from '@/types/copyright'

type SupportedLocale = AppLocaleCode
type NoticeFormat = 'text' | 'markdown'

interface CopyrightMessages {
    author: string
    unknown_author: string
    link: string
    license_title: string
    license_pre: string
    license_post: string
    default_license: string
    licenses: Record<CopyrightType, string>
}

interface ComponentsLocaleSchema {
    components: {
        post: {
            copyright: unknown
        }
    }
}

export interface PostCopyrightNoticeOptions {
    authorName?: string | null
    url: string
    license?: string | null
    defaultLicense?: string | null
    locale?: string | null
    separator?: string
}

export interface PostCopyrightNotice {
    locale: SupportedLocale
    licenseKey: CopyrightType
    licenseName: string
    licenseUrl: string | null
    licenseStatement: string
    text: string
    markdown: string
}

const FALLBACK_LOCALE: SupportedLocale = 'zh-CN'
const DEFAULT_SEPARATOR = '----------'

function unwrapLocaleObject(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
        if ('default' in value) {
            return unwrapLocaleObject((value).default)
        }

        if ('value' in value && typeof (value as { value?: unknown }).value === 'object') {
            return unwrapLocaleObject((value).value)
        }

        return value as Record<string, unknown>
    }

    return {}
}

function extractNestedString(value: unknown, seen = new Set<unknown>()): string | null {
    if (typeof value === 'string') {
        return value
    }

    if (!value || typeof value !== 'object') {
        return null
    }

    if (seen.has(value)) {
        return null
    }

    seen.add(value)

    if ('default' in value) {
        const nested = extractNestedString((value).default, seen)
        if (nested) {
            return nested
        }
    }

    if ('value' in value) {
        const nested = extractNestedString((value).value, seen)
        if (nested) {
            return nested
        }
    }

    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
        const nested = extractNestedString(nestedValue, seen)
        if (nested) {
            return nested
        }
    }

    return null
}

function unwrapLocaleString(value: unknown): string {
    const nested = extractNestedString(value)
    if (nested !== null) {
        return nested
    }

    return String(value)
}

function resolveCopyrightMessages(localeMessages: ComponentsLocaleSchema): CopyrightMessages {
    const rawMessages = unwrapLocaleObject(localeMessages.components.post.copyright)
    const rawLicenses = unwrapLocaleObject(rawMessages.licenses)

    return {
        author: unwrapLocaleString(rawMessages.author),
        unknown_author: unwrapLocaleString(rawMessages.unknown_author),
        link: unwrapLocaleString(rawMessages.link),
        license_title: unwrapLocaleString(rawMessages.license_title),
        license_pre: unwrapLocaleString(rawMessages.license_pre),
        license_post: unwrapLocaleString(rawMessages.license_post),
        default_license: unwrapLocaleString(rawMessages.default_license),
        licenses: Object.fromEntries(
            Object.entries(rawLicenses).map(([key, value]) => [key, unwrapLocaleString(value)]),
        ) as Record<CopyrightType, string>,
    }
}

const COPYRIGHT_MESSAGES: Record<SupportedLocale, CopyrightMessages> = {
    'zh-CN': resolveCopyrightMessages(zhCnComponents),
    'en-US': resolveCopyrightMessages(enUsComponents),
    'zh-TW': resolveCopyrightMessages(zhTwComponents),
    'ko-KR': resolveCopyrightMessages(koKrComponents),
    'ja-JP': resolveCopyrightMessages(jaJpComponents),
}

function resolveLocale(locale?: string | null): SupportedLocale {
    return resolveAppLocaleCode(locale)
}

function resolveLicenseKey(
    locale: SupportedLocale,
    license?: string | null,
    defaultLicense?: string | null,
): CopyrightType {
    const candidate = license || defaultLicense || COPYRIGHT_MESSAGES[locale].default_license

    if (candidate in COPYRIGHT_LICENSES) {
        return candidate as CopyrightType
    }

    return COPYRIGHT_MESSAGES[locale].default_license as CopyrightType
}

function resolveAuthorName(authorName: string | null | undefined, locale: SupportedLocale) {
    const normalized = authorName?.trim()
    if (normalized) {
        return normalized
    }

    return COPYRIGHT_MESSAGES[locale].unknown_author
}

function renderMarkdownLink(label: string, url: string | null | undefined) {
    const normalizedUrl = url?.trim()
    if (!normalizedUrl) {
        return label
    }

    return `[${label}](${normalizedUrl})`
}

function joinMarkdownLines(lines: string[]) {
    return lines.join('  \n')
}

export function buildPostCopyrightNotice(options: PostCopyrightNoticeOptions): PostCopyrightNotice {
    const locale = resolveLocale(options.locale)
    const messages = COPYRIGHT_MESSAGES[locale]
    const separator = options.separator || DEFAULT_SEPARATOR
    const licenseKey = resolveLicenseKey(locale, options.license, options.defaultLicense)
    const licenseName = messages.licenses[licenseKey] || COPYRIGHT_MESSAGES[FALLBACK_LOCALE].licenses[licenseKey]
    const licenseUrl = COPYRIGHT_LICENSES[licenseKey]?.url || null
    const authorName = resolveAuthorName(options.authorName, locale)
    const articleUrl = options.url.trim()
    const licenseStatement = licenseKey === 'all-rights-reserved'
        ? licenseName
        : `${messages.license_pre}${licenseName}${messages.license_post}`

    const lines = [
        `${messages.author}: ${authorName}`,
        `${messages.link}: ${articleUrl}`,
        `${messages.license_title}: ${licenseStatement}`,
    ]
    const markdownLicenseStatement = licenseKey === 'all-rights-reserved'
        ? licenseName
        : `${messages.license_pre}${renderMarkdownLink(licenseName, licenseUrl)}${messages.license_post}`
    const markdownLines = [
        `${messages.author}: ${authorName}`,
        `${messages.link}: ${renderMarkdownLink(articleUrl, articleUrl)}`,
        `${messages.license_title}: ${markdownLicenseStatement}`,
    ]

    const text = `${separator}\n${lines.join('\n')}`
    const markdown = `${separator}\n${joinMarkdownLines(markdownLines)}`

    return {
        locale,
        licenseKey,
        licenseName,
        licenseUrl,
        licenseStatement,
        text,
        markdown,
    }
}

export function appendPostCopyrightNotice(
    content: string | null | undefined,
    options: PostCopyrightNoticeOptions,
    format: NoticeFormat = 'text',
) {
    const notice = buildPostCopyrightNotice(options)
    const trimmedContent = content?.trim() || ''
    let suffix = notice.text

    if (format === 'markdown') {
        suffix = notice.markdown
    }

    if (!trimmedContent) {
        return suffix
    }

    return `${trimmedContent}\n\n${suffix}`
}
