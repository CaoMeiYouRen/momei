import { Feed } from 'feed'
import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import type { H3Event } from 'h3'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostStatus } from '@/types/post'

interface FeedOptions {
    categoryId?: string
    tagId?: string
    limit?: number
    titleSuffix?: string
    language?: string
}

export function getFeedLanguage(event: H3Event, explicitLanguage?: string): string {
    // 优先级解析语言:
    // 1. URL 查询参数: ?lang=... 或 ?language=...
    // 2. 显式传递的 explicitLanguage (通常来自数据库路由)
    // 3. Accept-Language 请求头
    // 4. 兜底默认值: zh-CN
    const query = getQuery(event)
    const langQuery = (query.lang || query.language) as string

    if (langQuery) { return langQuery }
    if (explicitLanguage) { return explicitLanguage }

    let headerLang = 'zh-CN'
    const acceptLanguage = getRequestHeader(event, 'accept-language')
    if (acceptLanguage) {
        // 解析第一个首选语言，例如 "zh-CN,zh;q=0.9,en;q=0.8" -> "zh-CN"
        const parts = acceptLanguage.split(',')
        const firstPart = parts[0]
        if (firstPart) {
            const firstLang = firstPart.trim()
            if (firstLang.toLowerCase().startsWith('en')) {
                headerLang = 'en-US'
            } else if (firstLang.toLowerCase().startsWith('ja')) {
                headerLang = 'ja-JP'
            } else {
                headerLang = 'zh-CN'
            }
        }
    }
    return headerLang
}

export async function generateFeed(event: H3Event, options: FeedOptions = {}) {
    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl as string) || 'https://momei.app'
    const appName = (config.public.appName as string) || '墨梅博客'

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
        .where('post.status = :status', { status: PostStatus.PUBLISHED })
        .andWhere('post.language = :language', { language })

    if (options.categoryId) {
        queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId: options.categoryId })
    }

    if (options.tagId) {
        // Tag is a many-to-many relationship
        queryBuilder.innerJoin('post.tags', 'filterTag', 'filterTag.id = :tagId', { tagId: options.tagId })
    }

    const posts = await queryBuilder
        .orderBy('post.publishedAt', 'DESC')
        .take(options.limit || 20)
        .getMany()

    const title = options.titleSuffix ? `${appName} - ${options.titleSuffix}` : appName

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
            rss2: `${siteUrl}${event.path}`,
        },
        author: {
            name: appName,
        },
    })

    posts.forEach((post) => {
        const itemDate = post.publishedAt || post.createdAt || new Date()
        feed.addItem({
            title: post.title,
            id: `${siteUrl}/posts/${post.slug}`,
            link: `${siteUrl}/posts/${post.slug}`,
            description: post.summary || '',
            content: md.render(post.content),
            author: [
                {
                    name: post.author?.name || appName,
                },
            ],
            category: post.category ? [{ name: post.category.name }] : [],
            date: new Date(itemDate),
            image: post.coverImage || undefined,
        })
    })

    return feed
}
