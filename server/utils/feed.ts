import { Feed } from 'feed'
import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import type { H3Event } from 'h3'
import { detectUserLocale, toProjectLocale } from './locale'
import { applyPostVisibilityFilter } from './post-access'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'

interface FeedOptions {
    categoryId?: string
    tagId?: string
    limit?: number
    titleSuffix?: string
    language?: string
    isPodcast?: boolean
}

export function getFeedLanguage(event: H3Event, explicitLanguage?: string): string {
    if (explicitLanguage) {
        return explicitLanguage
    }
    return toProjectLocale(detectUserLocale(event))
}

export async function generateFeed(event: H3Event, options: FeedOptions = {}) {
    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl) || 'https://momei.app'
    const appName = (config.public.appName) || '墨梅博客'

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

    if (options.isPodcast) {
        queryBuilder.andWhere('post.audioUrl IS NOT NULL')
    }

    const posts = await queryBuilder
        .orderBy('post.publishedAt', 'DESC')
        .take(options.limit || 20)
        .getMany()

    const title = options.titleSuffix ? `${appName} - ${options.titleSuffix}` : appName
    const path = event.path || '/'
    const basePath = (path.split('?')[0] || '').replace(/\.(xml|atom|json)$/, '')

    const feed = new Feed({
        title,
        description: language === 'zh-CN' ? '墨梅博客 - 轻量跨语言博客创作平台' : 'Momei Blog - A lightweight cross-language blog platform',
        id: siteUrl,
        link: siteUrl,
        language,
        image: `${siteUrl}/logo.png`,
        favicon: `${siteUrl}/favicon.ico`,
        copyright: `All rights reserved ${new Date().getFullYear()}, ${appName}`,
        updated: posts[0] ? new Date(posts[0].publishedAt || posts[0].createdAt) : new Date(),
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

    posts.forEach((post: Post) => {
        const itemDate = post.publishedAt || post.createdAt || new Date()
        let content = md.render(post.content)

        const enclosure = post.audioUrl
            ? {
                url: post.audioUrl,
                length: post.audioSize || 0,
                type: post.audioMimeType || 'audio/mpeg',
            }
            : undefined

        // 对于带有附件（如音频）的文章，如果存在封面图，将其添加到内容开头
        // 因为在 RSS 2.0 等格式中，为了避免与 enclosure 标签冲突，metadata 中的 image 会被设为 undefined
        if (enclosure && post.coverImage) {
            content = `<p><img src="${post.coverImage}" alt="${post.title}" /></p>${content}`
        }

        feed.addItem({
            title: post.title,
            id: `${siteUrl}/posts/${post.slug}`,
            link: `${siteUrl}/posts/${post.slug}`,
            description: post.summary || '',
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
