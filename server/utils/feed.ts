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
}

export async function generateFeed(event: H3Event, options: FeedOptions = {}) {
    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl as string) || 'https://momei.app'
    const appName = (config.public.appName as string) || '墨梅博客'

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
        description: '墨梅博客 - 轻量跨语言博客创作平台',
        id: siteUrl,
        link: siteUrl,
        language: 'zh-CN',
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
