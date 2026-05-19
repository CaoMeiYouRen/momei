import sanitizeHtml from 'sanitize-html'

import { buildPostCopyrightNotice } from './post-copyright'
import { createMarkdownRenderer } from './markdown'
import { buildAbsoluteUrl } from './seo'
import {
    normalizeDistributionTags,
    renderDistributionTags,
    type DistributionTagSource,
    type DistributionTagRenderMode,
    type NormalizedDistributionTag,
    type WechatSyncContentProfile,
} from './distribution-tags'
import { isAbsoluteHttpUrl } from './url'
import type { Post } from '@/types/post'

type DistributionMaterialSourcePost = Pick<Post, 'id' | 'title' | 'content' | 'summary' | 'coverImage' | 'author' | 'copyright' | 'language' | 'slug'> & {
    tags?: DistributionTagSource[] | null
}

export interface WechatSyncCompatibilityCheck {
    adjustments: string[]
    blockers: string[]
}

export interface DistributionMaterialBundle {
    canonical: {
        title: string
        url: string
        summaryPlain: string
        coverUrl: string | null
        bodyMarkdown: string
        bodyHtml: string
        bodyPlain: string
        copyrightMarkdown: string
        tags: NormalizedDistributionTag[]
    }
    channels: {
        memos: {
            content: string
        }
        wechatsync: {
            basePost: {
                title: string
                markdown: string
                content: string
                desc: string
                thumb: string
            }
            tagPlacement: 'before-copyright'
        }
    }
}

export interface DistributionMaterialBuildOptions {
    siteUrl: string
    defaultLicense?: string | null
    memosSummaryMaxLength?: number
}

export interface WechatSyncDispatchPost {
    title: string
    content: string
    desc: string
    thumb: string
    markdown?: string
}

const DEFAULT_MEMOS_SUMMARY_MAX_LENGTH = 280
const WEIBO_MARKDOWN_ADJUSTMENT_RULES: [RegExp, string][] = [
    [/^#{1,6}\s+/mu, 'heading'],
    [/<blockquote\b/iu, 'blockquote'],
    [/^>\s?/mu, 'blockquote'],
    [/<figure\b/iu, 'figure'],
    [/```[\s\S]*?```/u, 'code'],
    [/`[^`\n]+`/u, 'code'],
    [/^\s*[-*_]{3,}\s*$/mu, 'divider'],
]
const WEIBO_HTML_ADJUSTMENT_RULES: [RegExp, string][] = [
    [/<h[1-6]\b/iu, 'heading'],
    [/header-anchor/iu, 'heading-anchor'],
]
const WEIBO_BLOCKER_RULES: [RegExp, string][] = [
    [/<(?:table|iframe|video|audio)\b/iu, 'embedded-media'],
    [/class=(['"])[^'"]*\b(?:custom-block|code-group)\b[^'"]*\1/iu, 'custom-block'],
]
const XIAOHONGSHU_MARKDOWN_ADJUSTMENT_RULES: [RegExp, string][] = [
    [/^:::\s*(?:tip|warning|danger|info)\b/mu, 'custom-block'],
    [/^:::\s*code-group\b/mu, 'code-group'],
    [/^\s*>\s*\[![A-Z]+\]/mu, 'github-alert'],
]
const XIAOHONGSHU_HTML_ADJUSTMENT_RULES: [RegExp, string][] = [
    [/header-anchor/iu, 'heading-anchor'],
    [/copy-code-button/iu, 'copy-code-button'],
    [/class=(['"])[^'"]*\bcustom-block\b[^'"]*\1/iu, 'custom-block'],
    [/class=(['"])[^'"]*\bcode-group\b[^'"]*\1/iu, 'code-group'],
    [/class=(['"])[^'"]*\bmarkdown-alert\b[^'"]*\1/iu, 'github-alert'],
]
const XIAOHONGSHU_BLOCKER_RULES: [RegExp, string][] = [
    [/<(?:table|iframe|video|audio)\b/iu, 'embedded-media'],
]
const WECHAT_MP_MARKDOWN_ADJUSTMENT_RULES: [RegExp, string][] = [
    [/^:::\s*(?:tip|warning|danger|info)\b/mu, 'custom-block'],
    [/^:::\s*code-group\b/mu, 'code-group'],
    [/^\s*>\s*\[![A-Z]+\]/mu, 'github-alert'],
]
const WECHAT_MP_HTML_ADJUSTMENT_RULES: [RegExp, string][] = [
    [/header-anchor/iu, 'heading-anchor'],
    [/copy-code-button/iu, 'copy-code-button'],
    [/class=(['"])[^'"]*\bcustom-block\b[^'"]*\1/iu, 'custom-block'],
    [/class=(['"])[^'"]*\bcode-group\b[^'"]*\1/iu, 'code-group'],
    [/class=(['"])[^'"]*\bmarkdown-alert\b[^'"]*\1/iu, 'github-alert'],
]
const WECHAT_MP_BLOCKER_RULES: [RegExp, string][] = [
    [/<(?:table|iframe|video|audio)\b/iu, 'embedded-media'],
]

function collapseWhitespace(text: string) {
    return text.replace(/\s+/gu, ' ').trim()
}

function stripMarkdownToPlainText(markdown: string) {
    if (!markdown) {
        return ''
    }

    const plainText = markdown
        .replace(/```[\s\S]*?```/gu, ' ')
        .replace(/`[^`]*`/gu, ' ')
        .replace(/!\[([^\]]*)\]\([^)]*\)/gu, ' $1 ')
        .replace(/\[([^\]]+)\]\([^)]*\)/gu, ' $1 ')
        .replace(/^#{1,6}\s+/gmu, '')
        .replace(/^>+\s?/gmu, '')
        .replace(/[*_~|-]+/gu, ' ')
        .replace(/<[^>]+>/gu, ' ')

    return collapseWhitespace(plainText)
}

function truncatePlainText(text: string, maxLength: number) {
    if (text.length <= maxLength) {
        return text
    }

    return `${text.slice(0, maxLength).trimEnd()}...`
}

function resolveReadMoreLabel(locale: string | null | undefined) {
    return locale === 'en-US' ? 'Read more' : '阅读全文'
}

function joinSections(sections: (string | null | undefined)[]) {
    return sections
        .map((section) => section?.trim() || '')
        .filter(Boolean)
        .join('\n\n')
}

function collectWechatSyncCompatibilityMatches(source: string, rules: [RegExp, string][]) {
    return rules
        .filter(([pattern]) => pattern.test(source))
        .map(([, issue]) => issue)
}

function uniqueIssues(issues: string[]) {
    return Array.from(new Set(issues))
}

const plainTextSanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
}

const xiaohongshuContentSanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: Array.from(new Set([
        ...(Array.isArray(sanitizeHtml.defaults.allowedTags) ? sanitizeHtml.defaults.allowedTags : []),
        'img',
    ])),
    allowedAttributes: {
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'loading', 'decoding'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
        img: ['http', 'https', 'data'],
    },
}

function stripResidualHtml(value: string) {
    return sanitizeHtml(value, plainTextSanitizeOptions)
}

function stripHtmlToPlainText(html: string) {
    return stripResidualHtml(html
        .replace(/<br\s*\/?>/giu, '\n')
        .replace(/<\/p>/giu, '\n\n')
        .replace(/<p\b[^>]*>/giu, '')
        .replace(/<a\b[^>]*href=(['"])(.*?)\1[^>]*>(.*?)<\/a>/giu, '$3 ($2)')
        .replace(/<code\b[^>]*>(.*?)<\/code>/giu, '$1')
        .replace(/\n{3,}/gu, '\n\n'))
        .trim()
}

function renderWeiboHeadingMarkdown(value: string) {
    const headingText = stripHtmlToPlainText(value).trim()
    return headingText ? `\n\n**${headingText}**\n\n` : '\n\n'
}

function sanitizeWechatSyncMarkdownForWeibo(markdown: string) {
    return stripResidualHtml(markdown
        .replace(/```([\s\S]*?)```/gu, '$1')
        .replace(/`([^`\n]+)`/gu, '$1')
        .replace(/^\s{0,4}#{1,6}\s+(.+?)\s*#*\s*$/gmu, (_match, text) => renderWeiboHeadingMarkdown(text))
        .replace(/^>\s?/gmu, '')
        .replace(/^\s*[-*_]{3,}\s*$/gmu, '')
        .replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/giu, (_match, inner) => renderWeiboHeadingMarkdown(inner))
        .replace(/<a\b[^>]*class=(['"])[^'"]*header-anchor[^'"]*\1[^>]*>[\s\S]*?<\/a>/giu, '')
        .replace(/<figure\b[^>]*>[\s\S]*?<img\b[^>]*src=(['"])(.*?)\1[^>]*>[\s\S]*?<\/figure>/giu, '\n\n![]($2)\n\n')
        .replace(/<img\b[^>]*src=(['"])(.*?)\1[^>]*\/?>/giu, '![]($2)')
        .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/giu, (_match, inner) => `\n\n${stripHtmlToPlainText(inner)}\n\n`)
        .replace(/<br\s*\/?>/giu, '\n')
        .replace(/<\/?(?:p|div|section|article|span|strong|em|b|i|u|code)\b[^>]*>/giu, '\n')
        .replace(/\n{3,}/gu, '\n\n')
        // 微博中 # 字符被系统保留用于话题，移除正文中残余的 # 避免被误解析
        .replace(/#/gu, ''))
        .trim()
}

function sanitizeWechatSyncMarkdownForXiaohongshu(markdown: string) {
    return markdown
        .replace(/^:::\s*code-group\s*$/gmu, '')
        .replace(/^:::\s*(tip|warning|danger|info)(?:\s+(.+))?\s*$/gmu, (_match, type, title) => title || type.toUpperCase())
        .replace(/^:::\s*$/gmu, '')
        .replace(/^\s*>\s*\[!([A-Z]+)\]\s*$/gmu, (_match, title) => `> ${title}`)
        .replace(/<a\b[^>]*class=(['"])[^'"]*header-anchor[^'"]*\1[^>]*>[\s\S]*?<\/a>/giu, '')
        .replace(/\n{3,}/gu, '\n\n')
        .trim()
}

function sanitizeWechatSyncMarkdownForWechatMp(markdown: string) {
    return markdown
        .replace(/^:::\s*code-group\s*$/gmu, '')
        .replace(/^:::\s*(tip|warning|danger|info)(?:\s+(.+))?\s*$/gmu, (_match, type, title) => `> [${String(title || type).toUpperCase()}]`)
        .replace(/^:::\s*$/gmu, '')
        .replace(/^\s*>\s*\[!([A-Z]+)\]\s*$/gmu, (_match, title) => `> [${title}]`)
        .replace(/<a\b[^>]*class=(['"])[^'"]*header-anchor[^'"]*\1[^>]*>[\s\S]*?<\/a>/giu, '')
        .replace(/\n{3,}/gu, '\n\n')
        .trim()
}

function normalizeHostname(hostname: string) {
    return hostname.trim().toLowerCase().replace(/^www\./u, '')
}

function isWechatMpInternalLink(url: string) {
    if (!isAbsoluteHttpUrl(url)) {
        return false
    }

    try {
        const parsed = new URL(url)
        const hostname = normalizeHostname(parsed.hostname)
        if (!hostname) {
            return false
        }

        return hostname === 'mp.weixin.qq.com' || hostname.endsWith('.mp.weixin.qq.com')
    } catch {
        return false
    }
}

function normalizeReferenceLabel(label: string) {
    const normalized = collapseWhitespace(stripResidualHtml(label))
    return normalized || '链接'
}

function formatReferenceUrl(url: string) {
    return `\`${url}\``
}

function addWechatMpReference(
    references: { index: number, label: string, url: string }[],
    indexByUrl: Map<string, number>,
    url: string,
    label: string,
) {
    const normalizedUrl = url.trim()
    const normalizedLabel = normalizeReferenceLabel(label)
    let referenceIndex = indexByUrl.get(normalizedUrl)
    if (!referenceIndex) {
        referenceIndex = references.length + 1
        indexByUrl.set(normalizedUrl, referenceIndex)
        references.push({
            index: referenceIndex,
            label: normalizedLabel === normalizedUrl ? '链接' : normalizedLabel,
            url: normalizedUrl,
        })
    }

    return referenceIndex
}

function transformWechatMpExternalLinksToReferences(markdown: string) {
    const references: { index: number, label: string, url: string }[] = []
    const indexByUrl = new Map<string, number>()

    const segments = markdown.split(/(```[\s\S]*?```)/gu)
    const transformedMarkdown = segments.map((segment, segmentIndex) => {
        if (segmentIndex % 2 === 1) {
            return segment
        }

        const inlineCodePlaceholders: string[] = []
        const segmentWithoutInlineCode = segment.replace(/`[^`\n]*`/gu, (inlineCode) => {
            const placeholder = `__MOMEI_INLINE_CODE_${inlineCodePlaceholders.length}__`
            inlineCodePlaceholders.push(inlineCode)
            return placeholder
        })

        const rewrittenSegment = segmentWithoutInlineCode.replace(/(!)?\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gu, (match, imageMarker, label, url) => {
            if (imageMarker) {
                return match
            }

            const normalizedUrl = url.trim()
            if (isWechatMpInternalLink(normalizedUrl)) {
                return match
            }

            const referenceIndex = addWechatMpReference(references, indexByUrl, normalizedUrl, label)

            if (isAbsoluteHttpUrl(label)) {
                return `${label} [${referenceIndex}]`
            }

            return `${label}[${referenceIndex}]`
        })

        const rewrittenWithBareUrls = rewrittenSegment.replace(/https?:\/\/[^\s<>)\]]+/gu, (match, ...args: unknown[]) => {
            const sourceArg = args[args.length - 1]
            const offsetArg = args[args.length - 2]
            const source = typeof sourceArg === 'string' ? sourceArg : ''
            const offset = typeof offsetArg === 'number' ? offsetArg : 0
            const previousTwoChars = source.slice(Math.max(0, offset - 2), offset)
            if (previousTwoChars === '](') {
                return match
            }

            const normalizedUrl = match.trim().replace(/[.,;:!?]+$/gu, '')
            if (!isWechatMpInternalLink(normalizedUrl)) {
                const referenceIndex = addWechatMpReference(references, indexByUrl, normalizedUrl, '链接')
                return `链接[${referenceIndex}]`
            }

            return match
        })

        return rewrittenWithBareUrls.replace(/__MOMEI_INLINE_CODE_(\d+)__/gu, (_match, rawIndex) => {
            const index = Number.parseInt(rawIndex, 10)
            return inlineCodePlaceholders[index] || ''
        })
    }).join('')

    if (!references.length) {
        return transformedMarkdown
    }

    const hasReferenceHeading = /(^|\n)##\s+引用链接\s*(\n|$)/u.test(transformedMarkdown)
    const referenceHeading = hasReferenceHeading ? '## 外链引用' : '## 引用链接'
    const referenceLines = references.map((reference) => `${reference.index}. ${reference.label}: ${formatReferenceUrl(reference.url)}`)

    return joinSections([
        transformedMarkdown,
        [referenceHeading, '', ...referenceLines].join('\n'),
    ])
}

function sanitizeWechatSyncHtmlForXiaohongshu(html: string) {
    if (!html) {
        return ''
    }

    return sanitizeHtml(html
        .replace(/<a\b[^>]*class=(['"])[^'"]*header-anchor[^'"]*\1[^>]*>[\s\S]*?<\/a>/giu, '')
        .replace(/<div\b[^>]*class=(['"])[^'"]*copy-code-wrapper[^'"]*\1[^>]*>[\s\S]*?<\/div>/giu, ''), xiaohongshuContentSanitizeOptions)
}

export function inspectWechatSyncMaterialCompatibility(
    materialBundle: DistributionMaterialBundle,
    contentProfile: WechatSyncContentProfile,
): WechatSyncCompatibilityCheck {
    const markdownSource = joinSections([
        materialBundle.canonical.bodyMarkdown,
        materialBundle.canonical.copyrightMarkdown,
    ])
    const htmlSource = materialBundle.canonical.bodyHtml

    if (contentProfile === 'weibo') {
        const adjustments = uniqueIssues([
            ...collectWechatSyncCompatibilityMatches(markdownSource, WEIBO_MARKDOWN_ADJUSTMENT_RULES),
            ...collectWechatSyncCompatibilityMatches(htmlSource, WEIBO_HTML_ADJUSTMENT_RULES),
        ])
        const blockers = uniqueIssues(collectWechatSyncCompatibilityMatches(
            `${markdownSource}\n\n${htmlSource}`,
            WEIBO_BLOCKER_RULES,
        ))

        return {
            adjustments,
            blockers,
        }
    }

    if (contentProfile === 'xiaohongshu') {
        const adjustments = uniqueIssues([
            ...collectWechatSyncCompatibilityMatches(markdownSource, XIAOHONGSHU_MARKDOWN_ADJUSTMENT_RULES),
            ...collectWechatSyncCompatibilityMatches(htmlSource, XIAOHONGSHU_HTML_ADJUSTMENT_RULES),
        ])
        const blockers = uniqueIssues(collectWechatSyncCompatibilityMatches(
            `${markdownSource}\n\n${htmlSource}`,
            XIAOHONGSHU_BLOCKER_RULES,
        ))

        return {
            adjustments,
            blockers,
        }
    }

    if (contentProfile === 'wechat_mp') {
        const adjustments = uniqueIssues([
            ...collectWechatSyncCompatibilityMatches(markdownSource, WECHAT_MP_MARKDOWN_ADJUSTMENT_RULES),
            ...collectWechatSyncCompatibilityMatches(htmlSource, WECHAT_MP_HTML_ADJUSTMENT_RULES),
        ])
        const blockers = uniqueIssues(collectWechatSyncCompatibilityMatches(
            `${markdownSource}\n\n${htmlSource}`,
            WECHAT_MP_BLOCKER_RULES,
        ))

        return {
            adjustments,
            blockers,
        }
    }

    return {
        adjustments: [],
        blockers: [],
    }
}

function resolvePostUrl(post: Pick<Post, 'language' | 'slug' | 'id'>, siteUrl: string) {
    const langPrefix = post.language === 'zh-CN' ? '' : `/${post.language}`
    return buildAbsoluteUrl(siteUrl, `${langPrefix}/posts/${post.slug || post.id}`)
}

export function buildDistributionMaterialBundle(
    post: DistributionMaterialSourcePost,
    options: DistributionMaterialBuildOptions,
): DistributionMaterialBundle {
    const summaryPlain = collapseWhitespace(post.summary?.trim() || stripMarkdownToPlainText(post.content || ''))
    const postUrl = resolvePostUrl(post, options.siteUrl)
    const normalizedTags = normalizeDistributionTags(post.tags)
    const renderer = createMarkdownRenderer({
        html: true,
        withAnchor: true,
    })
    const bodyMarkdown = post.content?.trim() || ''
    const bodyHtml = renderer.render(bodyMarkdown)
    const bodyPlain = stripMarkdownToPlainText(bodyMarkdown)
    const copyrightMarkdown = buildPostCopyrightNotice({
        authorName: post.author?.name || null,
        url: postUrl,
        license: post.copyright,
        defaultLicense: options.defaultLicense,
        locale: post.language,
    }).markdown

    const canonical = {
        title: post.title?.trim() || '',
        url: postUrl,
        summaryPlain,
        coverUrl: post.coverImage?.trim() || null,
        bodyMarkdown,
        bodyHtml,
        bodyPlain,
        copyrightMarkdown,
        tags: normalizedTags,
    }

    const memosTagLine = renderDistributionTags(normalizedTags, 'leading')
    const memosSummary = truncatePlainText(summaryPlain, options.memosSummaryMaxLength ?? DEFAULT_MEMOS_SUMMARY_MAX_LENGTH)
    const memosContent = joinSections([
        canonical.title ? `# ${canonical.title}` : '',
        canonical.coverUrl ? `![](${canonical.coverUrl})` : '',
        memosSummary,
        `[${resolveReadMoreLabel(post.language)}](${canonical.url})`,
        memosTagLine,
        canonical.copyrightMarkdown,
    ])

    return {
        canonical,
        channels: {
            memos: {
                content: memosContent,
            },
            wechatsync: {
                basePost: {
                    title: canonical.title,
                    markdown: canonical.bodyMarkdown,
                    content: canonical.bodyHtml,
                    desc: canonical.summaryPlain,
                    thumb: canonical.coverUrl || '',
                },
                tagPlacement: 'before-copyright',
            },
        },
    }
}

export function buildWechatSyncPostFromMaterialBundle(
    materialBundle: DistributionMaterialBundle,
    options: {
        renderMode: DistributionTagRenderMode
        contentProfile?: WechatSyncContentProfile
    },
) {
    const tagLine = renderDistributionTags(materialBundle.canonical.tags, options.renderMode)
    const contentProfile = options.contentProfile || 'default'
    const usesWeiboCompatibility = contentProfile === 'weibo'
    const usesXiaohongshuCompatibility = contentProfile === 'xiaohongshu'
    const usesWechatMpCompatibility = contentProfile === 'wechat_mp'
    const copyrightMarkdown = contentProfile === 'weibo'
        ? materialBundle.canonical.copyrightMarkdown.replace(/^\s*[-*_]{3,}\s*\n?/u, '').trim()
        : materialBundle.canonical.copyrightMarkdown
    const rawMarkdown = joinSections([
        materialBundle.channels.wechatsync.basePost.markdown,
        tagLine,
        copyrightMarkdown,
    ])
    let markdown = rawMarkdown

    if (usesWeiboCompatibility) {
        markdown = sanitizeWechatSyncMarkdownForWeibo(rawMarkdown)
    } else if (usesXiaohongshuCompatibility) {
        markdown = sanitizeWechatSyncMarkdownForXiaohongshu(rawMarkdown)
    } else if (usesWechatMpCompatibility) {
        markdown = transformWechatMpExternalLinksToReferences(
            sanitizeWechatSyncMarkdownForWechatMp(rawMarkdown),
        )
    }

    const renderer = createMarkdownRenderer({
        html: !usesWeiboCompatibility,
        withAnchor: !usesWeiboCompatibility && !usesXiaohongshuCompatibility && !usesWechatMpCompatibility,
    })
    const content = renderer.render(markdown)

    return {
        title: materialBundle.channels.wechatsync.basePost.title,
        markdown,
        content: usesXiaohongshuCompatibility ? sanitizeWechatSyncHtmlForXiaohongshu(content) : content,
        desc: materialBundle.channels.wechatsync.basePost.desc,
        thumb: materialBundle.channels.wechatsync.basePost.thumb,
    }
}

export function buildWechatSyncDispatchPostFromMaterialBundle(
    materialBundle: DistributionMaterialBundle,
    options: {
        renderMode: DistributionTagRenderMode
        contentProfile?: WechatSyncContentProfile
    },
): WechatSyncDispatchPost {
    const payload = buildWechatSyncPostFromMaterialBundle(materialBundle, options)

    if (options.contentProfile === 'weibo') {
        return {
            title: payload.title,
            content: payload.content,
            desc: payload.desc,
            thumb: payload.thumb,
        }
    }

    return payload
}
