import { COPYRIGHT_LICENSES, type CopyrightType } from '@/types/copyright'

type SupportedLocale = 'zh-CN' | 'en-US'
type NoticeFormat = 'text' | 'markdown'

interface CopyrightMessages {
    author: string
    link: string
    license_title: string
    license_pre: string
    license_post: string
    default_license: string
    licenses: Record<CopyrightType, string>
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

const COPYRIGHT_MESSAGES: Record<SupportedLocale, CopyrightMessages> = {
    'zh-CN': {
        author: '本文作者',
        link: '本文链接',
        license_title: '版权声明',
        license_pre: '本博客所有文章除特别声明外，均采用 ',
        license_post: ' 许可协议。转载请注明出处！',
        default_license: 'all-rights-reserved',
        licenses: {
            'all-rights-reserved': '所有权利保留（禁止转载）',
            'cc-by': 'CC BY 4.0（署名）',
            'cc-by-sa': 'CC BY-SA 4.0（署名-相同方式共享）',
            'cc-by-nd': 'CC BY-ND 4.0（署名-禁止演绎）',
            'cc-by-nc': 'CC BY-NC 4.0（署名-非商业性使用）',
            'cc-by-nc-sa': 'CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）',
            'cc-by-nc-nd': 'CC BY-NC-ND 4.0（署名-非商业性使用-禁止演绎）',
            'cc-zero': 'CC0 1.0（取消版权 / 进入公共领域）',
        },
    },
    'en-US': {
        author: 'Author',
        link: 'Link',
        license_title: 'Copyright Notice',
        license_pre: 'Except where otherwise noted, all articles in this blog are licensed under ',
        license_post: '. Please credit the source when reposting!',
        default_license: 'all-rights-reserved',
        licenses: {
            'all-rights-reserved': 'All Rights Reserved (No Reposting)',
            'cc-by': 'CC BY 4.0 (Attribution)',
            'cc-by-sa': 'CC BY-SA 4.0 (Attribution-ShareAlike)',
            'cc-by-nd': 'CC BY-ND 4.0 (Attribution-NoDerivs)',
            'cc-by-nc': 'CC BY-NC 4.0 (Attribution-NonCommercial)',
            'cc-by-nc-sa': 'CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike)',
            'cc-by-nc-nd': 'CC BY-NC-ND 4.0 (Attribution-NonCommercial-NoDerivs)',
            'cc-zero': 'CC0 1.0 (Public Domain)',
        },
    },
}

function resolveLocale(locale?: string | null): SupportedLocale {
    return locale === 'en-US' ? 'en-US' : FALLBACK_LOCALE
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

    return locale === 'en-US' ? 'Unknown Author' : '佚名'
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

    const text = `${separator}\n${lines.join('\n')}`

    return {
        locale,
        licenseKey,
        licenseName,
        licenseUrl,
        licenseStatement,
        text,
        markdown: text,
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
