import { APP_ENABLED_LOCALES, getLocaleRoutePrefix, isSeoReadyLocale } from '@/i18n/config/locale-registry'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostStatus, PostVisibility } from '@/types/post'
import { resolveCitableExcerpt } from '@/utils/shared/citable-content'
import { buildAbsoluteUrl } from '@/utils/shared/seo'

export interface LlmsPostSummary {
    title: string
    slug: string
    language: string
    summary?: string | null
    content?: string | null
    publishedAt?: string | Date | null
    updatedAt?: string | Date | null
    category?: {
        name: string
        slug: string
    } | null
    tags?: {
        name: string
        slug: string
    }[] | null
}

export interface BuildLlmsDocumentOptions {
    siteUrl: string
    appName: string
    description: string
    posts: LlmsPostSummary[]
    full?: boolean
    generatedAt?: Date
}

const DEFAULT_LLMS_DESCRIPTION = 'AI-driven, natively internationalized developer blog platform with public multilingual articles, feeds, and structured data.'

function getIndexableLocaleCodes(): string[] {
    return APP_ENABLED_LOCALES
        .filter((locale) => isSeoReadyLocale(locale.code))
        .map((locale) => locale.code)
}

export function buildLocalizedPostUrl(siteUrl: string, language: string, slug: string): string {
    return buildAbsoluteUrl(siteUrl, `${getLocaleRoutePrefix(language)}/posts/${slug}`)
}

function formatIsoDate(value?: string | Date | null): string | null {
    if (!value) {
        return null
    }

    const parsed = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        return null
    }

    return parsed.toISOString()
}

function buildResourceLinks(siteUrl: string): string[] {
    return [
        `- Home: ${buildAbsoluteUrl(siteUrl, '/')}`,
        `- Posts: ${buildAbsoluteUrl(siteUrl, '/posts')}`,
        `- Categories: ${buildAbsoluteUrl(siteUrl, '/categories')}`,
        `- Tags: ${buildAbsoluteUrl(siteUrl, '/tags')}`,
        `- Archives: ${buildAbsoluteUrl(siteUrl, '/archives')}`,
        `- About: ${buildAbsoluteUrl(siteUrl, '/about')}`,
        `- Sitemap: ${buildAbsoluteUrl(siteUrl, '/sitemap.xml')}`,
        `- RSS Feed: ${buildAbsoluteUrl(siteUrl, '/feed.xml')}`,
        `- Atom Feed: ${buildAbsoluteUrl(siteUrl, '/feed.atom')}`,
        `- JSON Feed: ${buildAbsoluteUrl(siteUrl, '/feed.json')}`,
        `- Full Index: ${buildAbsoluteUrl(siteUrl, '/llms-full.txt')}`,
    ]
}

function renderPostEntry(siteUrl: string, post: LlmsPostSummary, full: boolean): string {
    const url = buildLocalizedPostUrl(siteUrl, post.language, post.slug)
    const summary = resolveCitableExcerpt({
        summary: post.summary,
        content: post.content,
        maxLength: full ? 420 : 260,
    })
    const lines = [
        `### [${post.language}] ${post.title}`,
        `- URL: ${url}`,
        `- Summary: ${summary || 'No summary available.'}`,
    ]

    const publishedAt = formatIsoDate(post.publishedAt)
    const updatedAt = formatIsoDate(post.updatedAt)
    if (publishedAt) {
        lines.push(`- Published: ${publishedAt}`)
    }
    if (updatedAt) {
        lines.push(`- Updated: ${updatedAt}`)
    }

    if (post.category?.name) {
        lines.push(`- Category: ${post.category.name}`)
    }

    const tagNames = post.tags?.map((tag) => tag.name).filter(Boolean) || []
    if (tagNames.length > 0) {
        lines.push(`- Tags: ${tagNames.join(', ')}`)
    }

    return lines.join('\n')
}

export function buildLlmsDocument(options: BuildLlmsDocumentOptions): string {
    const description = options.description.trim() || DEFAULT_LLMS_DESCRIPTION
    const generatedAt = (options.generatedAt || new Date()).toISOString()
    const localeCodes = getIndexableLocaleCodes()
    const full = Boolean(options.full)
    const posts = options.posts.slice(0, full ? options.posts.length : 12)

    return [
        `# ${options.appName}`,
        '',
        `> ${description}`,
        '',
        `- Site: ${options.siteUrl}`,
        `- Generated: ${generatedAt}`,
        `- Indexable locales: ${localeCodes.join(', ')}`,
        '',
        '## Guidance',
        '- Prefer canonical localized article URLs when citing content.',
        '- Public published posts, feeds, sitemap, and policy pages are safe to crawl.',
        '- Prefer the post summary when present; otherwise use the leading article excerpt.',
        full ? '- This is the expanded content index for public published posts.' : `- Use ${buildAbsoluteUrl(options.siteUrl, '/llms-full.txt')} for the expanded content index.`,
        '',
        '## Public Resources',
        ...buildResourceLinks(options.siteUrl),
        '',
        full ? '## Published Posts' : '## Recent Posts',
        ...posts.flatMap((post) => [renderPostEntry(options.siteUrl, post, full), '']),
    ].join('\n').trim()
}

export async function fetchPublishedLlmsPosts(limit: number): Promise<LlmsPostSummary[]> {
    const locales = getIndexableLocaleCodes()
    const postRepo = dataSource.getRepository(Post)

    return postRepo.createQueryBuilder('post')
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('post.status = :status', { status: PostStatus.PUBLISHED })
        .andWhere('post.visibility = :visibility', { visibility: PostVisibility.PUBLIC })
        .andWhere('post.language IN (:...locales)', { locales })
        .orderBy('post.publishedAt', 'DESC', 'NULLS LAST')
        .addOrderBy('post.createdAt', 'DESC')
        .take(limit)
        .getMany()
}
