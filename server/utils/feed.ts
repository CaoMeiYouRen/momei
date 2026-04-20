import { Feed } from 'feed'
import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import type { H3Event } from 'h3'
import { mapAuthLocaleToAppLocale } from './locale'
import { applyPostVisibilityFilter } from './post-access'
import { t, getLocale } from './i18n'
import { applyPostsReadModelFromMetadata } from './post-metadata'
import { getLocaleRoutePrefix } from '@/i18n/config/locale-registry'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { resolveCitableExcerpt } from '@/utils/shared/citable-content'
import { buildAbsoluteUrl } from '@/utils/shared/seo'

interface FeedOptions {
    categoryId?: string
    tagId?: string
    limit?: number
    titleSuffix?: string
    language?: string
    isPodcast?: boolean
}

interface LegacyAudioCarrier {
    audioUrl?: string | null
    audioSize?: number | null
    audioMimeType?: string | null
}

const DEFAULT_FEED_DESCRIPTION = 'Momei Blog - AI-driven, natively internationalized developer blog platform.'

function isUnresolvedI18nKey(value: string, key: string) {
    return value === key || value.trim().length === 0
}

function getLegacyAudio(post: Post): LegacyAudioCarrier {
    return post as unknown as LegacyAudioCarrier
}

export function getFeedLanguage(event: H3Event, explicitLanguage?: string): string {
    if (explicitLanguage) {
        return mapAuthLocaleToAppLocale(explicitLanguage)
    }
    return getLocale()
}

function buildFeedPostUrl(siteUrl: string, language: string, slug: string): string {
    return buildAbsoluteUrl(siteUrl, `${getLocaleRoutePrefix(language)}/posts/${slug}`)
}

export async function generateFeed(event: H3Event, options: FeedOptions = {}) {
    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl) || 'https://momei.app'
    const appName = (config.public.appName) || '墨梅博客'
    const siteDescription = typeof config.public.siteDescription === 'string'
        ? config.public.siteDescription.trim()
        : ''

    const language = getFeedLanguage(event, options.language)
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    })

    md.use(MarkdownItAnchor, {
        slugify: (s) => s.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
        permalink: MarkdownItAnchor.permalink.headerLink(),
    })

    const postRepo = dataSource.getRepository(Post)
    const queryBuilder = postRepo.createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    // 应用统一的文章可见性过滤逻辑 (Mode: feed)
    await applyPostVisibilityFilter(queryBuilder, event.context?.user, 'feed')

    queryBuilder.andWhere('post.language = :language', { language })

    if (options.categoryId) {
        queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: options.categoryId })
    }

    if (options.tagId) {
        // Tag is a many-to-many relationship
        queryBuilder.innerJoin('post.tags', 'filterTag', 'filterTag.id = :tagId', { tagId: options.tagId })
    }

    const fetchLimit = options.isPodcast
        ? Math.max((options.limit || 20) * 3, options.limit || 20)
        : (options.limit || 20)

    const posts = await queryBuilder
        .orderBy('post.publishedAt', 'DESC')
        .take(fetchLimit)
        .getMany()

    applyPostsReadModelFromMetadata(posts)

    const feedPosts = options.isPodcast
        ? posts
            .filter((post) => {
                const legacy = getLegacyAudio(post)
                return Boolean(post.metadata?.audio?.url || legacy.audioUrl)
            })
            .slice(0, options.limit || 20)
        : posts

    const title = options.titleSuffix ? `${appName} - ${options.titleSuffix}` : appName
    const path = event.path || '/'
    const basePath = (path.split('?')[0] || '').replace(/\.(xml|atom|json)$/, '')
    const translatedDescription = await t('feed.description')
    const feedDescription = isUnresolvedI18nKey(translatedDescription, 'feed.description')
        ? (siteDescription || DEFAULT_FEED_DESCRIPTION)
        : translatedDescription

    const translatedCopyright = await t('feed.copyright', { year: new Date().getFullYear(), appName })
    const feedCopyright = isUnresolvedI18nKey(translatedCopyright, 'feed.copyright')
        ? `© ${new Date().getFullYear()} ${appName}. All rights reserved.`
        : translatedCopyright

    const feed = new Feed({
        title,
        description: feedDescription,
        id: siteUrl,
        link: siteUrl,
        language,
        image: `${siteUrl}/logo.png`,
        favicon: `${siteUrl}/favicon.ico`,
        copyright: feedCopyright,
        updated: feedPosts[0] ? new Date(feedPosts[0].publishedAt || feedPosts[0].createdAt) : new Date(),
        generator: 'Momei Blog',
        feedLinks: {
            rss: `${siteUrl}${basePath}.xml`,
            atom: `${siteUrl}${basePath}.atom`,
            json: `${siteUrl}${basePath}.json`,
        },
        author: {
            name: appName,
        },
    })

    feedPosts.forEach((post: Post) => {
        const itemDate = post.publishedAt || post.createdAt || new Date()
        let content = md.render(post.content)

        const legacy = getLegacyAudio(post)
        const audioUrl = post.metadata?.audio?.url || legacy.audioUrl
        const audioSize = post.metadata?.audio?.size ?? legacy.audioSize ?? 0
        const audioMimeType = post.metadata?.audio?.mimeType || legacy.audioMimeType || 'audio/mpeg'

        const enclosure = audioUrl
            ? {
                url: audioUrl,
                length: audioSize,
                type: audioMimeType,
            }
            : undefined

        // 对于带有附件（如音频）的文章，如果存在封面图，将其添加到内容开头
        // 因为在 RSS 2.0 等格式中，为了避免与 enclosure 标签冲突，metadata 中的 image 会被设为 undefined
        if (enclosure && post.coverImage) {
            content = `<p><img src="${post.coverImage}" alt="${post.title}" /></p>${content}`
        }

        feed.addItem({
            title: post.title,
            id: buildFeedPostUrl(siteUrl, post.language, post.slug),
            link: buildFeedPostUrl(siteUrl, post.language, post.slug),
            description: resolveCitableExcerpt({
                summary: post.summary,
                content: post.content,
                maxLength: 280,
            }),
            content,
            author: [
                {
                    name: post.author?.name || appName,
                },
            ],
            category: post.category ? [{ name: post.category.name }] : [],
            date: new Date(itemDate),
            // 如果存在音频 enclosure，则不设置 image 属性，以免覆盖 enclosure
            image: enclosure ? undefined : (post.coverImage || undefined),
            enclosure,
        })
    })

    return feed
}
