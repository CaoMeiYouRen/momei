import { buildPostCopyrightNotice } from './post-copyright'
import { createMarkdownRenderer } from './markdown'
import { buildAbsoluteUrl } from './seo'
import {
    normalizeDistributionTags,
    renderDistributionTags,
    type DistributionTagRenderMode,
    type NormalizedDistributionTag,
} from './distribution-tags'
import type { Post } from '@/types/post'

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

const DEFAULT_MEMOS_SUMMARY_MAX_LENGTH = 280

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

function resolvePostUrl(post: Pick<Post, 'language' | 'slug' | 'id'>, siteUrl: string) {
    const langPrefix = post.language === 'zh-CN' ? '' : `/${post.language}`
    return buildAbsoluteUrl(siteUrl, `${langPrefix}/posts/${post.slug || post.id}`)
}

export function buildDistributionMaterialBundle(
    post: Pick<Post, 'id' | 'title' | 'content' | 'summary' | 'coverImage' | 'author' | 'copyright' | 'language' | 'slug' | 'tags'>,
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
    renderMode: DistributionTagRenderMode,
) {
    const tagLine = renderDistributionTags(materialBundle.canonical.tags, renderMode)
    const markdown = joinSections([
        materialBundle.channels.wechatsync.basePost.markdown,
        tagLine,
        materialBundle.canonical.copyrightMarkdown,
    ])
    const renderer = createMarkdownRenderer({
        html: true,
        withAnchor: true,
    })

    return {
        title: materialBundle.channels.wechatsync.basePost.title,
        markdown,
        content: renderer.render(markdown),
        desc: materialBundle.channels.wechatsync.basePost.desc,
        thumb: materialBundle.channels.wechatsync.basePost.thumb,
    }
}
